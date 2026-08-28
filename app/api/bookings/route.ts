import { randomInt } from "node:crypto";
import { booleanPointInPolygon, point } from "@turf/turf";
import { NextRequest, NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import { resolveMobilityEndpoint } from "@/lib/mobility-hubs";
import { normalizeMobilityJourneyPlanId } from "@/lib/mobility-trip-continuity";
import {
  assertMobilityPilotActive,
  MobilityPilotUnavailableError,
} from "@/lib/mobility-pilot-readiness";
import { createServerBooking } from "@/lib/server-bookings";
import { calculateTaxiSettlement } from "@/lib/taxi-settlement";
import {
  OfficialTaxiRateUnavailableError,
  quoteOfficialTaxiFare,
} from "@/lib/usvi-taxi-tariffs";
import { normalizeEstateCollection } from "@/lib/usvi";
import type { PickupContext, RideBookingDraft } from "@/types/mobility";
import type { EstateCollection } from "@/types/usvi";

const PASSENGER_CONSENT_VERSION = "pilot-2026-07-23";
const MAX_SCHEDULE_WINDOW_MS = 366 * 24 * 60 * 60 * 1000;
const CONNECTION_KINDS = new Set(["flight", "ferry", "cruise", "appointment"]);
const PICKUP_CONTEXT_COOKIE = "vi_pickup_context";
const PICKUP_CONTEXT_MAX_AGE_MS = 2 * 60 * 60 * 1000;
const PICKUP_MEETING_POINTS = new Set([
  "Hotel lobby",
  "Resort entrance",
  "Airport arrivals",
  "Ferry dock",
  "Villa / gate",
  "Beach entrance",
  "Roadside pickup",
]);

class BookingValidationError extends Error {}

type BookingRequestBody = RideBookingDraft & {
  acceptedOperatorDisclosure?: boolean;
  acceptedTerms?: boolean;
  acceptedPrivacy?: boolean;
  consentVersion?: string;
};

type StoredPickupContext = {
  v: 1;
  estateGeoid: string;
  lat?: number;
  lng?: number;
  accuracy?: number;
  source?: "device" | "pin";
  meetingPoint?: string;
  updatedAt: number;
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
    throw new BookingValidationError(
      `${label} must be a valid future date and time.`,
    );
  }
  if (timestamp - now > MAX_SCHEDULE_WINDOW_MS) {
    throw new BookingValidationError(`${label} cannot be more than one year away.`);
  }
  return date.toISOString();
}

function readPickupContext(request: NextRequest): StoredPickupContext | null {
  const raw = request.cookies.get(PICKUP_CONTEXT_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as StoredPickupContext;
    if (parsed?.v !== 1 || typeof parsed.estateGeoid !== "string") return null;
    if (!Number.isFinite(parsed.updatedAt)) return null;
    const age = Date.now() - parsed.updatedAt;
    if (age < -5 * 60 * 1000 || age > PICKUP_CONTEXT_MAX_AGE_MS) return null;
    if (
      parsed.meetingPoint &&
      !PICKUP_MEETING_POINTS.has(parsed.meetingPoint)
    ) {
      return null;
    }
    const hasLat =
      typeof parsed.lat === "number" && Number.isFinite(parsed.lat);
    const hasLng =
      typeof parsed.lng === "number" && Number.isFinite(parsed.lng);
    if (hasLat !== hasLng) {
      throw new BookingValidationError(
        "Precise pickup coordinates are incomplete. Reset the pickup pin and try again.",
      );
    }
    if (
      hasLat &&
      (parsed.lat! < -90 ||
        parsed.lat! > 90 ||
        parsed.lng! < -180 ||
        parsed.lng! > 180)
    ) {
      throw new BookingValidationError(
        "Precise pickup coordinates are invalid. Reset the pickup pin and try again.",
      );
    }
    if (
      parsed.accuracy !== undefined &&
      (!Number.isFinite(parsed.accuracy) ||
        parsed.accuracy < 0 ||
        parsed.accuracy > 10000)
    ) {
      throw new BookingValidationError(
        "Pickup location accuracy is invalid. Reset the pickup pin and try again.",
      );
    }
    return parsed;
  } catch (error) {
    if (error instanceof BookingValidationError) throw error;
    return null;
  }
}

function pickupAccessType(
  meetingPoint?: string,
): PickupContext["accessType"] {
  if (meetingPoint === "Airport arrivals") return "airport";
  if (meetingPoint === "Ferry dock") return "ferry";
  if (
    meetingPoint === "Hotel lobby" ||
    meetingPoint === "Resort entrance"
  ) {
    return "resort";
  }
  if (meetingPoint === "Villa / gate") return "villa";
  if (meetingPoint === "Beach entrance") return "beach";
  return "roadside";
}

function pickupConfidence(context: StoredPickupContext | null) {
  if (
    !context ||
    typeof context.lat !== "number" ||
    typeof context.lng !== "number"
  ) {
    return 0.92;
  }
  if (context.source === "pin") return 0.98;
  const accuracy = context.accuracy ?? 9999;
  if (accuracy <= 50) return 0.99;
  if (accuracy <= 150) return 0.97;
  return 0.95;
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
    const journeyPlanId = normalizeMobilityJourneyPlanId(body.journeyPlanId);

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

    // Quote and booking creation must resolve the exact same governed endpoint.
    // This preserves reviewed terminal identities such as STT Airport and Red
    // Hook Ferry instead of allowing a quote to succeed and booking to fail.
    const origin = resolveMobilityEndpoint(body.originEstateGeoid, estates);
    const destination = resolveMobilityEndpoint(
      body.destinationEstateGeoid,
      estates,
    );

    if (!origin || !destination) {
      return NextResponse.json(
        { error: "Invalid mobility endpoint selection." },
        { status: 400 },
      );
    }
    if (origin.island !== destination.island) {
      return NextResponse.json(
        { error: "Taxi bookings cannot cross islands." },
        { status: 400 },
      );
    }

    const storedPickup = readPickupContext(request);
    const pickupContext =
      storedPickup?.estateGeoid === origin.geoid ? storedPickup : null;
    const hasPrecisePickup = Boolean(
      pickupContext &&
        typeof pickupContext.lat === "number" &&
        typeof pickupContext.lng === "number",
    );

    if (
      hasPrecisePickup &&
      !booleanPointInPolygon(
        point([pickupContext!.lng!, pickupContext!.lat!]),
        origin.geometry,
        { ignoreBoundary: false },
      )
    ) {
      return NextResponse.json(
        {
          error:
            "The precise pickup pin is outside the selected official fare area. Reset the pickup or choose the correct pickup area before continuing.",
          code: "PRECISE_PICKUP_OUTSIDE_FARE_AREA",
        },
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
    const riderVerificationCode = String(randomInt(0, 10_000)).padStart(
      4,
      "0",
    );
    const manualPickupInstructions = cleanInstructions(body.pickupInstructions);
    const pickupInstructions = cleanInstructions(
      [pickupContext?.meetingPoint, manualPickupInstructions]
        .filter(Boolean)
        .join(" · "),
    );
    const destinationInstructions = cleanInstructions(
      body.destinationInstructions,
    );
    const pickupLat = hasPrecisePickup
      ? pickupContext!.lat!
      : origin.internalPoint.lat;
    const pickupLng = hasPrecisePickup
      ? pickupContext!.lng!
      : origin.internalPoint.lng;

    const bookingId = await createServerBooking({
      riderId: session.uid,
      journeyPlanId: journeyPlanId || null,
      status: "requested",
      paymentStatus: "unpaid",
      paymentIntentId: null,
      amountAuthorized: null,
      amountCaptured: null,
      mode: body.mode,
      island: origin.island,
      origin: {
        lat: pickupLat,
        lng: pickupLng,
        estateGeoid: origin.geoid,
        estateName: origin.baseName,
        pickupConfidence: pickupConfidence(pickupContext),
        accessType: pickupAccessType(pickupContext?.meetingPoint),
        locationSource: hasPrecisePickup
          ? pickupContext?.source ?? "pin"
          : "estate_internal_point",
        locationAccuracyMeters: hasPrecisePickup
          ? pickupContext?.accuracy ?? null
          : null,
        locationUpdatedAt: hasPrecisePickup
          ? new Date(pickupContext!.updatedAt).toISOString()
          : null,
        ...(pickupInstructions ? { notes: pickupInstructions } : {}),
      },
      destination: {
        lat: destination.internalPoint.lat,
        lng: destination.internalPoint.lng,
        estateGeoid: destination.geoid,
        estateName: destination.baseName,
        pickupConfidence: 0.92,
        accessType: "roadside",
        locationSource: "estate_internal_point",
        locationAccuracyMeters: null,
        locationUpdatedAt: null,
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
      await getAdminDb()
        .collection("bookingRiderSecrets")
        .doc(bookingId)
        .set({
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

    const response = NextResponse.json({
      ok: true,
      bookingId,
      fare,
      island: origin.island,
      paymentStatus: "unpaid",
      consentVersion: PASSENGER_CONSENT_VERSION,
      riderVerificationCode,
      precisePickupAccepted: hasPrecisePickup,
    });
    response.cookies.set(PICKUP_CONTEXT_COOKIE, "", {
      path: "/",
      maxAge: 0,
      sameSite: "lax",
    });
    return response;
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
        {
          error: error.message,
          code: error.code,
          manualReviewRequired: true,
        },
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
