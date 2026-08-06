import { NextResponse } from "next/server";

import { cruiseProviderErrorResponse } from "@/lib/cruise-inventory/http";
import { CruiseProviderError } from "@/lib/cruise-inventory/provider";
import { getCruiseInventoryProvider } from "@/lib/cruise-inventory/provider-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: { sailingId: string } },
) {
  const sailingId = cleanId(context.params.sailingId);
  if (!sailingId) {
    return NextResponse.json(
      { ok: false, error: "Choose a valid sailing." },
      { status: 400 },
    );
  }

  try {
    const provider = getCruiseInventoryProvider();
    const sailing = await provider.getSailing(sailingId);
    return NextResponse.json({ ok: true, sailing });
  } catch (error) {
    return cruiseProviderErrorResponse(error);
  }
}

function cleanId(value: unknown) {
  if (typeof value !== "string") return "";
  const id = value.trim().slice(0, 180);
  if (!/^[A-Za-z0-9._:-]+$/.test(id)) {
    throw new CruiseProviderError(
      "invalid_request",
      "The sailing identifier is invalid.",
      400,
    );
  }
  return id;
}
