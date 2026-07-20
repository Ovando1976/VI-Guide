import { NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getRiderOperations } from "@/lib/rider-operations";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireSession();
    const payload = await getRiderOperations(session.uid);
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("rider operations read error", error);
    return NextResponse.json({ error: "Unable to load your trip operations." }, { status: 500 });
  }
}
