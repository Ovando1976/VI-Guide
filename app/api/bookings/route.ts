import { NextRequest, NextResponse } from "next/server";
import { OfficialTaxiRateUnavailableError, quoteOfficialTaxiFare } from "@/lib/usvi-taxi-tariffs";
import { normalizeEstateCollection } from "@/lib/usvi";
import type { EstateCollection } from "@/types/usvi";
import type { RideBookingDraft } from "@/types/mobility";
import { createServerBooking } from "@/lib/server-bookings";
import { hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";
import { authErrorResponse, requireSession } from "@/lib/auth-server";

const ESTATES_URL =
  "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Places_CouSub_ConCity_SubMCD/MapServer/0/query?" +
  new URLSearchParams({
    where: "STATE='78'",
    outFields:
      "GEOID,STATE,COUNTY,BASENAME,NAME,CENTLAT,CENTLON,INTPTLAT,INTPTLON,ESTATE",
    returnGeometry: "true",
    outSR: "4326",
    f: "geojson",
  }).toString();

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        {
          error:
            "Booking is not configured yet. Add Firebase Admin credentials to the server environment.",
        },
        { status: 503 },
      );
    }

    const body = (await request.json()) as RideBookingDraft;

    if (!body.originEstateGeoid || !body.destinationEstateGeoid) {
      return NextResponse.json(
        { error: "Origin and destination are required." },
        { status: 400 }
      );
    }

    if (!body.mode) {
      return NextResponse.json(
        { error: "Ride mode is required." },
        { status: 400 }
      );
    }

    const passengers = Math.trunc(Number(body.passengers));
    const luggage = Math.trunc(Number(body.luggage));

    const estatesResponse = await fetch(ESTATES_URL, { cache: "no-store" });

    if (!estatesResponse.ok) {
      return NextResponse.json(
        { error: "Unable to load estate data." },
        { status: 502 }
      );
    }

    const geojson = (await estatesResponse.json()) as EstateCollection;
    const estates = normalizeEstateCollection(geojson);

    const origin = estates.find((e) => e.geoid === body.originEstateGeoid);
    const destination = estates.find(
      (e) => e.geoid === body.destinationEstateGeoid
    );

    if (!origin || !destination) {
      return NextResponse.json(
        { error: "Invalid estate selection." },
        { status: 400 }
      );
    }

    const fare = await quoteOfficialTaxiFare({
      origin,
      destination,
      passengers,
      luggage,
      requestedOriginLabel: body.pickupLabel,
      requestedDestinationLabel: body.destinationLabel,
    });

    if (fare.quoteStatus !== "official") {
      return NextResponse.json(
        {
          error: "This route currently has a provisional tariff transcription. Confirm the route and request official-rate review before booking.",
          code: "PROVISIONAL_TARIFF_REVIEW_REQUIRED",
          manualReviewRequired: true,
        },
        { status: 422 },
      );
    }

    const bookingId = await createServerBooking({
      riderId: session.uid,
      status: "requested",
      paymentStatus: "unpaid",
      paymentIntentId: null,
      amountAuthorized: null,
      amountCaptured: null,
      mode: body.mode,
      island: origin.island,
      origin: {
        lat: origin.internalPoint.lat,
        lng: origin.internalPoint.lng,
        estateGeoid: origin.geoid,
        estateName: body.pickupLabel?.trim() || origin.baseName,
        pickupConfidence: 0.92,
        accessType: "roadside",
      },
      destination: {
        lat: destination.internalPoint.lat,
        lng: destination.internalPoint.lng,
        estateGeoid: destination.geoid,
        estateName: body.destinationLabel?.trim() || destination.baseName,
        pickupConfidence: 0.92,
        accessType: "roadside",
      },
      passengers,
      luggage,
      quotedFare: fare,
      scheduledAt: body.scheduledAt ?? null,
      notes: body.notes ?? "",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      bookingId,
      fare,
      island: origin.island,
      paymentStatus: "unpaid",
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    if (error instanceof OfficialTaxiRateUnavailableError) {
      return NextResponse.json(
        { error: error.message, code: error.code, manualReviewRequired: true },
        { status: error.status },
      );
    }
    console.error("booking create error", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create booking.",
      },
      { status: 500 }
    );
  }
}
