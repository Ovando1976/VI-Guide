import { NextRequest, NextResponse } from "next/server";

import { cruiseProviderErrorResponse } from "@/lib/cruise-inventory/http";
import { getCruiseInventoryProvider } from "@/lib/cruise-inventory/provider-registry";
import { normalizeCruiseQuoteRequest } from "@/lib/cruise-inventory/transaction-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | Record<string, unknown>
    | null;
  if (!body) {
    return NextResponse.json(
      { ok: false, error: "Submit a valid cruise quote request." },
      { status: 400 },
    );
  }

  const validation = normalizeCruiseQuoteRequest(body);
  if (!validation.ok) {
    return NextResponse.json(
      { ok: false, error: validation.error, code: "invalid_request" },
      { status: 400 },
    );
  }

  try {
    const provider = getCruiseInventoryProvider();
    const quote = await provider.createQuote(validation.request);
    return NextResponse.json({ ok: true, quote });
  } catch (error) {
    return cruiseProviderErrorResponse(error);
  }
}
