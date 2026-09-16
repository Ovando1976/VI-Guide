import { NextRequest, NextResponse } from "next/server";
import { runConciergeTool, type ConciergeToolName } from "@/lib/concierge-tools";
import type { ConciergeContext } from "@/types/concierge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOOLS = new Set<ConciergeToolName>([
  "search_places",
  "search_beaches",
  "search_history",
  "search_stays",
  "nearby",
  "check_time_budget",
  "build_day_plan",
]);

function validContext(value: unknown): value is ConciergeContext {
  if (!value || typeof value !== "object") return false;
  const context = value as ConciergeContext;
  return context.island === "stt" || context.island === "stj" || context.island === "stx";
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    tool?: unknown;
    input?: unknown;
    context?: unknown;
  } | null;

  if (!body || typeof body.tool !== "string" || !TOOLS.has(body.tool as ConciergeToolName)) {
    return NextResponse.json({ error: "Unknown Concierge tool." }, { status: 400 });
  }

  if (!validContext(body.context)) {
    return NextResponse.json({ error: "A valid live Explorer context is required." }, { status: 400 });
  }

  const input = body.input && typeof body.input === "object"
    ? body.input as { query?: string; minutesAvailable?: number; departureTime?: string }
    : {};

  const result = runConciergeTool(body.tool as ConciergeToolName, input, body.context);

  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
