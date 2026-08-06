import { NextResponse } from "next/server";

import {
  getCruiseInventoryReadiness,
  publicCruiseInventoryStatus,
} from "@/lib/cruise-inventory/readiness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const readiness = getCruiseInventoryReadiness();
  return NextResponse.json({
    ok: true,
    inventory: publicCruiseInventoryStatus(readiness),
  });
}
