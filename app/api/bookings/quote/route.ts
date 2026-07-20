import { NextRequest, NextResponse } from "next/server";
import { normalizeEstateCollection } from "@/lib/usvi";
import { OfficialTaxiRateUnavailableError, quoteOfficialTaxiFare } from "@/lib/usvi-taxi-tariffs";
import type { EstateCollection, EstateRecord } from "@/types/usvi";
import type { RideBookingDraft } from "@/types/mobility";

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
    const body = (await request.json()) as RideBookingDraft;
    if (!body.originEstateGeoid || !body.destinationEstateGeoid) {
      return NextResponse.json({ error: "Origin and destination are required." }, { status: 400 });
    }
    const response = await fetch(ESTATES_URL, { cache: "no-store" });
    if (!response.ok) return NextResponse.json({ error: "Unable to load estate data." }, { status: 502 });
    const estates = normalizeEstateCollection((await response.json()) as EstateCollection);
    const origin = estates.find((estate: EstateRecord) => estate.geoid === body.originEstateGeoid);
    const destination = estates.find((estate: EstateRecord) => estate.geoid === body.destinationEstateGeoid);
    if (!origin || !destination) return NextResponse.json({ error: "Invalid estate selection." }, { status: 400 });
    const fare = await quoteOfficialTaxiFare({
      origin,
      destination,
      passengers: Math.trunc(Number(body.passengers)),
      luggage: Math.trunc(Number(body.luggage)),
      requestedOriginLabel: body.pickupLabel,
      requestedDestinationLabel: body.destinationLabel,
    });
    return NextResponse.json({ ok: true, fare });
  } catch (error) {
    if (error instanceof OfficialTaxiRateUnavailableError) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code, quoteStatus: "manual_review_required", manualReviewRequired: true },
        { status: 200 },
      );
    }
    console.error("official taxi quote error", error);
    return NextResponse.json({ error: "Unable to load the official taxi rate." }, { status: 500 });
  }
}
