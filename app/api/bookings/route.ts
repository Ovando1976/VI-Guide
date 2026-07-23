import { NextRequest, NextResponse } from "next/server";
import {
  assertMobilityPilotActive,
  MobilityPilotUnavailableError,
} from "@/lib/mobility-pilot-readiness";
import {
  OfficialTaxiRateUnavailableError,
  quoteOfficialTaxiFare,
} from "@/lib/usvi-taxi-tariffs";
import { normalizeEstateCollection } from "@/lib/usvi";
import type { EstateCollection } from "@/types/usvi";
import type { RideBookingDraft } from "@/types/mobility";
import { createServerBooking } from "@/lib/server-bookings";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import { authErrorResponse, requireSession } from "@/lib/auth-server";

const PASSENGER_CONSENT_VERSION = "pilot-2026-07-23";

type BookingRequestBody = RideBookingDraft & {
  acceptedOperatorDisclosure?: boolean;
  acceptedTerms?: boolean;
  acceptedPrivacy?: boolean;
  consentVersion?: string;
};

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

    const body = (await request.json()) as BookingRequestBody;

    if (
      body.acceptedOperatorDisclosure !== true ||
      body.acceptedTerms !== true ||
      body.acceptedPrivacy !== true
    ) {
      return NextResponse.json(
        {
          error:
            "Accept the passenger, operator, terms, and privacy disclosures before creating a ride booking.",
          code: "PASSENGER_CONSENT_REQUIRED",
        },
        { status: 400 },
      );
    }

    if (body.consentVersion !== PASSENGER_CONSENT_VERSION) {
      return NextResponse.json(
        {
          error:
            "The passenger disclosure has changed. Review and accept the current disclosure before continuing.",
          code: "PASSENGER_CONSENT_VERSION_MISMATCH",
          consentVersion: PASSENGER_CONSENT_VERSION,
        },
        { status: 409 },
      );
    }

    if (!body.originEstateGeoid || !body.destinationEstateGeoid) {
      return NextResponse.json(
        { error: "Origin and destination are required." },
        { status: 400 },
      );
    }

    if (!body.mode) {
      return NextResponse.json(
        { error: "Ride mode is required." },
        { status: 400 },
      );
    }

    const passengers = Math.max(1, Number(body.passengers || 1));
    const luggage = Math.max(0, Number(body.luggage || 0));

    const estatesResponse = await fetch(ESTATES_URL, { cache: "no-store" });

    if (!estatesResponse.ok) {
      return NextResponse.json(
        { error: "Unable to load estate data." },
        { status: 502 },
      );
    }

    const geojson = (await estatesResponse.json()) as EstateCollection;
    const estates = normalizeEstateCollection(geojson);

    const origin = estates.find((e) => e.geoid === body.originEstateGeoid);
    const destination = estates.find(
      (e) => e.geoid === body.destinationEstateGeoid,
    );

    if (!origin || !destination) {
      return NextResponse.json(
        { error: "Invalid estate selection." },
        { status: 400 },
      );
    }
    if (origin.island !== destination.island) {
      return NextResponse.json(
        { error: "Taxi bookings cannot cross islands." },
        { status: 400 },
      );
    }

    await assertMobilityPilotActive(origin.island);
    const fare = await quoteOfficialTaxiFare({
      origin,
      destination,
      passengers,
      luggage,
    });

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
        estateName: origin.baseName,
        pickupConfidence: 0.92,
        accessType: "roadside",
      },
      destination: {
        lat: destination.internalPoint.lat,
        lng: destination.internalPoint.lng,
        estateGeoid: destination.geoid,
        estateName: destination.baseName,
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

    const bookingRef = getAdminDb().collection("bookings").doc(bookingId);
    try {
      await bookingRef.update({
        passengerConsent: {
          version: PASSENGER_CONSENT_VERSION,
          acceptedAt: new Date().toISOString(),
          riderId: session.uid,
          operatorDisclosureAccepted: true,
          termsAccepted: true,
          privacyAccepted: true,
        },
      });
    } catch (consentError) {
      await bookingRef.delete().catch((cleanupError) => {
        console.error("booking consent cleanup error", cleanupError);
      });
      throw consentError;
    }

    return NextResponse.json({
      ok: true,
      bookingId,
      fare,
      island: origin.island,
      paymentStatus: "unpaid",
      consentVersion: PASSENGER_CONSENT_VERSION,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    if (error instanceof MobilityPilotUnavailableError) {
      return NextResponse.json(
        { error: error.message, code: error.code, pilotActive: false },
        { status: error.status },
      );
    }
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
      { status: 500 },
    );
  }
}
