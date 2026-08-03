import { NextRequest, NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import {
  listAgentEventHandlers,
  listRecentIntelligenceEvents,
} from "@/lib/intelligence/event-bus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireSession(["admin"]);
    const requestedLimit = Number(request.nextUrl.searchParams.get("limit") ?? 50);
    const limit = Number.isFinite(requestedLimit)
      ? Math.max(1, Math.min(requestedLimit, 100))
      : 50;
    const events = await listRecentIntelligenceEvents(limit);

    return NextResponse.json(
      {
        events,
        subscribers: listAgentEventHandlers(),
        count: events.length,
        generatedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json(
      { error: "Unable to load the intelligence event stream." },
      { status: 500 },
    );
  }
}
