import { NextRequest, NextResponse } from "next/server";
import { assertMobilityPilotActive } from "@/lib/mobility-pilot-readiness";
import { resolveMobilityEndpoint } from "@/lib/mobility-hubs";
import { normalizeEstateCollection } from "@/lib/usvi";
import {
  OfficialTaxiRateUnavailableError,
  quoteOfficialTaxiFare,
} from "@/lib/usvi-taxi-tariffs";
import type { EstateCollection } from "@/types/usvi";
import type { RideBookingDraft } from "@/types/mobility";

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
    const body = (await request.json().catch(() => null)) as Partial<RideBookingDraft> | null;
    if (!body?.originEstateGeoid || !body.destinationEstateGeoid) {
      return NextResponse.json(
        { error: "Origin and destination are required." },
        { status: 400 },
      );
    }
    const response = await fetch(ESTATES_URL, { cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json(
        { error: "Unable to load estate data." },
        { status: 502 },
      );
    }
    const estates = normalizeEstateCollection(
      (await response.json()) as EstateCollection,
    );
    const origin = resolveMobilityEndpoint(body.originEstateGeoid, estates);
    const destination = resolveMobilityEndpoint(body.destinationEstateGeoid, estates);
    if (!origin || !destination) {
      return NextResponse.json(
        { error: "Invalid mobility endpoint selection." },
        { status: 400 },
      );
    }
    if (origin.island !== destination.island) {
      return NextResponse.json(
        { error: "Taxi quotes cannot cross islands." },
        { status: 400 },
      );
    }

    let pilotActive = true;
    let pilotMessage: string | undefined;
    try {
      await assertMobilityPilotActive(origin.island);
    } catch (error) {
      pilotActive = false;
      pilotMessage =
        error instanceof Error
          ? error.message
          : "Ride booking is not active for this island yet.";
    }

    const fare = await quoteOfficialTaxiFare({
      origin,
      destination,
      passengers: Math.max(1, Number(body.passengers || 1)),
      luggage: Math.max(0, Number(body.luggage || 0)),
    });
    return NextResponse.json({
      ok: true,
      fare,
      pilotActive,
      pilotMessage,
    });
  } catch (error) {
    if (error instanceof OfficialTaxiRateUnavailableError) {
      return NextResponse.json(
        { error: error.message, code: error.code, manualReviewRequired: true },
        { status: error.status },
      );
    }
    console.error("official taxi quote error", error);
    return NextResponse.json(
      { error: "Unable to load the official taxi rate." },
      { status: 500 },
    );
  }
}
