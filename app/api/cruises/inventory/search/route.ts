import { NextRequest, NextResponse } from "next/server";

import { cruiseProviderErrorResponse } from "@/lib/cruise-inventory/http";
import { getCruiseInventoryProvider } from "@/lib/cruise-inventory/provider-registry";
import { normalizeCruiseSearchRequest } from "@/lib/cruise-inventory/search-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | Record<string, unknown>
    | null;
  if (!body) {
    return NextResponse.json(
      { ok: false, error: "Submit a valid cruise search request." },
      { status: 400 },
    );
  }

  const validation = normalizeCruiseSearchRequest(body);
  if (!validation.ok) {
    return NextResponse.json(
      { ok: false, error: validation.error, code: "invalid_request" },
      { status: 400 },
    );
  }

  try {
    const provider = getCruiseInventoryProvider();
    const result = await provider.searchSailings(validation.request);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return cruiseProviderErrorResponse(error);
  }
}
