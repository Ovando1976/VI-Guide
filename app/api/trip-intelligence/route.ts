import { NextRequest, NextResponse } from "next/server";

import { fetchOfficialViWeatherAlerts } from "@/lib/intelligence/weather-alerts";
import type { IntelligenceIsland } from "@/types/intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900",
};

export async function GET(request: NextRequest) {
  const island = normalizeIsland(request.nextUrl.searchParams.get("island"));
  if (!island) {
    return NextResponse.json(
      { error: "A valid island is required." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const result = await fetchOfficialViWeatherAlerts();
  return NextResponse.json(
    {
      ...result,
      island,
    },
    { headers: CACHE_HEADERS },
  );
}

function normalizeIsland(value: unknown): IntelligenceIsland | null {
  return value === "stt" || value === "stj" || value === "stx"
    ? value
    : null;
}
