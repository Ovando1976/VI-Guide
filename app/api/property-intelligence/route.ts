import { NextRequest, NextResponse } from "next/server";

import {
  filterPropertyIntelligence,
  loadPropertyIntelligence,
  type PropertyIsland,
} from "@/lib/property-intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_ISLANDS = new Set<PropertyIsland>(["stt", "stj", "stx"]);

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const islandParam = searchParams.get("island")?.trim().toLowerCase() ?? "";
  const query = searchParams.get("q")?.trim() ?? "";
  const limitParam = Number(searchParams.get("limit") ?? 100);

  if (islandParam && !VALID_ISLANDS.has(islandParam as PropertyIsland)) {
    return NextResponse.json(
      { error: "Invalid island. Use stt, stj, or stx." },
      { status: 400 },
    );
  }

  const limit = Number.isFinite(limitParam) ? Math.floor(limitParam) : 100;

  try {
    const allRecords = await loadPropertyIntelligence();
    const records = filterPropertyIntelligence(allRecords, {
      island: islandParam ? (islandParam as PropertyIsland) : undefined,
      query,
      limit,
    });

    return NextResponse.json({
      records,
      count: records.length,
      meta: {
        schemaVersion: 1,
        estateSource: "data/derived/estates.enriched-with-dictionary.json",
        overlayPolicy: "fail-closed",
        overlayReadiness: {
          parcel: "not_joined",
          zoning: "not_joined",
          historicDistrict: "not_joined",
        },
        filters: {
          island: islandParam || null,
          q: query || null,
          limit: Math.max(1, Math.min(limit, 500)),
        },
      },
    });
  } catch (error) {
    console.error("Property intelligence load failed.", error);
    return NextResponse.json(
      { error: "Property intelligence data is temporarily unavailable." },
      { status: 503 },
    );
  }
}
