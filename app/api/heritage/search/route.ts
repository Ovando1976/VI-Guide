import { NextRequest, NextResponse } from "next/server";

import { rankHeritageEvidence } from "@/lib/heritage/evidence";
import type { DirectoryIsland } from "@/types/directory";

export const dynamic = "force-dynamic";

function parseIsland(value: string | null): DirectoryIsland | null {
  return value === "stt" || value === "stj" || value === "stx" ? value : null;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const island = parseIsland(request.nextUrl.searchParams.get("island"));
  const estateGeoid = request.nextUrl.searchParams.get("estateGeoid")?.trim() || null;
  const requestedLimit = Number(request.nextUrl.searchParams.get("limit") ?? 12);
  const limit = Number.isFinite(requestedLimit)
    ? Math.max(1, Math.min(Math.trunc(requestedLimit), 30))
    : 12;

  const results = rankHeritageEvidence({
    query,
    island,
    estateGeoid,
    limit,
  });

  return NextResponse.json(
    {
      query,
      island,
      count: results.length,
      results,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800",
      },
    },
  );
}
