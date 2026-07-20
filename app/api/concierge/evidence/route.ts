import { NextRequest, NextResponse } from "next/server";

import { getConciergeDirectoryEvidence } from "@/lib/concierge-directory-evidence";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() || "";
  const island = normalizeIsland(request.nextUrl.searchParams.get("island"));
  const estateGeoid = request.nextUrl.searchParams.get("estateGeoid")?.trim() || null;
  const requestedLimit = Number(request.nextUrl.searchParams.get("limit") || 18);
  const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(requestedLimit, 24)) : 18;

  if (!query) {
    return NextResponse.json({ error: "A non-empty q parameter is required." }, { status: 400 });
  }

  if (!island) {
    return NextResponse.json({ error: "island must be stt, stj, or stx." }, { status: 400 });
  }

  const evidence = getConciergeDirectoryEvidence({
    context: {
      island,
      selectedEstate: estateGeoid ? { geoid: estateGeoid, name: estateGeoid } : null,
    },
    message: query,
    limit,
  });

  return NextResponse.json({
    query,
    island,
    count: evidence.length,
    evidence,
  });
}

function normalizeIsland(value: string | null) {
  const normalized = value?.trim().toLowerCase();
  return normalized === "stt" || normalized === "stj" || normalized === "stx" ? normalized : null;
}
