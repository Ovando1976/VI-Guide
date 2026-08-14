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
import { calculateTaxiSettlement } from "@/lib/taxi-settlement";
import { randomInt } from "node:crypto";

const PASSENGER_CONSENT_VERSION = "pilot-2026-07-23";
const MAX_SCHEDULE_WINDOW_MS = 366 * 24 * 60 * 60 * 1000;
const CONNECTION_KINDS = new Set(["flight", "ferry", "cruise", "appointment"]);

class BookingValidationError extends Error {}

type BookingRequestBody = RideBookingDraft & {
  acceptedOperatorDisclosure?: boolean;
  acceptedTerms?: boolean;
  acceptedPrivacy?: boolean;
  consentVersion?: string;
};

function cleanInstructions(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, 280);
}

function optionalFutureDate(value: string | null | undefined, label: string) {
  if (!value) return null;
  const date = new Date(value);
  const timestamp = date.getTime();
  const now = Date.now();
  if (!Number.isFinite(timestamp) || timestamp <= now) {
    throw new BookingValidationError(`${label} must be a valid future date and time.`);
  }
  if (timestamp - now > MAX_SCHEDULE_WINDOW_MS) {
    throw new BookingValidationError(`${label} cannot be more than one year away.`);
  }
  return date.toISOString();
}

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
    const scheduledAt = optionalFutureDate(body.scheduledAt, "Pickup time");
    const connectionDeadline = optionalFutureDate(
      body.connectionDeadline,
      "Connection time",
    );
    if (
      connectionDeadline &&
      (!body.connectionKind || !CONNECTION_KINDS.has(body.connectionKind))
    ) {
      return NextResponse.json(
        { error: "Choose a valid connection type." },
        { status: 400 },
      );
    }
    if (
      scheduledAt &&
      connectionDeadline &&
      new Date(connectionDeadline).getTime() <= new Date(scheduledAt).getTime()
    ) {
      return NextResponse.json(
        { error: "Connection time must be after the requested pickup time." },
        { status: 400 },
      );
    }

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
    const estimatedSettlement = calculateTaxiSettlement(fare.total);
    const riderVerificationCode = String(randomInt(0, 10_000)).padStart(4, "0");
    const pickupInstructions = cleanInstructions(body.pickupInstructions);
    const destinationInstructions = cleanInstructions(
      body.destinationInstructions,
    );

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
        ...(pickupInstructions ? { notes: pickupInstructions } : {}),
      },
      destination: {
        lat: destination.internalPoint.lat,
        lng: destination.internalPoint.lng,
        estateGeoid: destination.geoid,
        estateName: destination.baseName,
        pickupConfidence: 0.92,
        accessType: "roadside",
        ...(destinationInstructions ? { notes: destinationInstructions } : {}),
      },
      passengers,
      luggage,
      quotedFare: fare,
      scheduledAt,
      connectionDeadline,
      connectionKind: connectionDeadline ? body.connectionKind ?? null : null,
      paymentMethod: "online_card",
      serviceExpectation:
        body.mode === "shared" || body.mode === "safari"
          ? "shared"
          : "direct_request",
      estimatedSettlement,
      riderVerification: { status: "required" },
      notes: body.notes ?? "",
      createdAt: new Date().toISOString(),
    });

    const bookingRef = getAdminDb().collection("bookings").doc(bookingId);
    try {
      await getAdminDb().collection("bookingRiderSecrets").doc(bookingId).set({
        riderId: session.uid,
        code: riderVerificationCode,
        createdAt: new Date().toISOString(),
      });
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
      await getAdminDb()
        .collection("bookingRiderSecrets")
        .doc(bookingId)
        .delete()
        .catch(() => undefined);
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
      riderVerificationCode,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    if (error instanceof BookingValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
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
