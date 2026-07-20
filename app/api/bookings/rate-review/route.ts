import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getAdminDb, hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";
import { normalizeEstateCollection } from "@/lib/usvi";
import { OfficialTaxiRateUnavailableError, quoteOfficialTaxiFare } from "@/lib/usvi-taxi-tariffs";
import type { FareBreakdown, RideBookingDraft } from "@/types/mobility";
import type { EstateCollection } from "@/types/usvi";

const ESTATES_URL =
  "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Places_CouSub_ConCity_SubMCD/MapServer/0/query?" +
  new URLSearchParams({
    where: "STATE='78'",
    outFields: "GEOID,STATE,COUNTY,BASENAME,NAME,CENTLAT,CENTLON,INTPTLAT,INTPTLON,ESTATE",
    returnGeometry: "true",
    outSR: "4326",
    f: "geojson",
  }).toString();

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json({ error: "Official-rate review is not configured." }, { status: 503 });
    }
    const body = (await request.json()) as RideBookingDraft & { requestKey?: string };
    const passengers = Math.trunc(Number(body.passengers));
    const luggage = Math.trunc(Number(body.luggage));
    if (!body.originEstateGeoid || !body.destinationEstateGeoid || body.originEstateGeoid === body.destinationEstateGeoid) {
      return NextResponse.json({ error: "Choose two different route endpoints." }, { status: 400 });
    }
    if (!Number.isInteger(passengers) || passengers < 1 || passengers > 12 || !Number.isInteger(luggage) || luggage < 0 || luggage > 12) {
      return NextResponse.json({ error: "Passenger or luggage count is invalid." }, { status: 400 });
    }
    if (!body.requestKey || !/^[a-zA-Z0-9-]{16,80}$/.test(body.requestKey)) {
      return NextResponse.json({ error: "A valid review request key is required." }, { status: 400 });
    }
    const estatesResponse = await fetch(ESTATES_URL, { cache: "no-store" });
    if (!estatesResponse.ok) return NextResponse.json({ error: "Unable to verify route endpoints." }, { status: 502 });
    const estates = normalizeEstateCollection((await estatesResponse.json()) as EstateCollection);
    const origin = estates.find((estate) => estate.geoid === body.originEstateGeoid);
    const destination = estates.find((estate) => estate.geoid === body.destinationEstateGeoid);
    if (!origin || !destination || origin.island !== destination.island) {
      return NextResponse.json({ error: "The route endpoints are invalid or cross islands." }, { status: 400 });
    }
    let reviewReason: string;
    let provisionalFare: FareBreakdown | null = null;
    try {
      const fare = await quoteOfficialTaxiFare({
        origin,
        destination,
        passengers,
        luggage,
        requestedOriginLabel: body.pickupLabel,
        requestedDestinationLabel: body.destinationLabel,
      });
      if (fare.quoteStatus === "official") {
        return NextResponse.json({ error: "An active official fare is available. Refresh the quote and use the official-fare confirmation." }, { status: 409 });
      }
      provisionalFare = fare;
      reviewReason = "A provisional tariff transcription matched this route and requires Commission verification before booking or payment.";
    } catch (error) {
      if (!(error instanceof OfficialTaxiRateUnavailableError)) throw error;
      reviewReason = error.message;
    }
    const reference = getAdminDb().collection("taxiRateReviews").doc(body.requestKey);
    await getAdminDb().runTransaction(async (transaction) => {
      const existing = await transaction.get(reference);
      if (existing.exists) {
        if (existing.data()?.riderId !== session.uid) throw new Error("Review request key collision.");
        return;
      }
      transaction.create(reference, {
        riderId: session.uid,
        status: "pending",
        island: origin.island,
        originEstateGeoid: origin.geoid,
        destinationEstateGeoid: destination.geoid,
        originEstateName: origin.baseName,
        destinationEstateName: destination.baseName,
        pickupLabel: body.pickupLabel?.slice(0, 120) ?? null,
        destinationLabel: body.destinationLabel?.slice(0, 120) ?? null,
        mode: body.mode,
        passengers,
        luggage,
        reason: reviewReason.slice(0, 500),
        quotedFare: provisionalFare,
        bookingId: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    return NextResponse.json({ ok: true, reviewId: reference.id, status: "pending", paymentCreated: false, bookingCreated: false });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("taxi rate review create error", error);
    return NextResponse.json({ error: "Unable to create the official-rate review request." }, { status: 500 });
  }
}
