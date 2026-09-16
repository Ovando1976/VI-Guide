import { NextRequest, NextResponse } from "next/server";
import { runConciergeTool } from "@/lib/concierge-tools";
import type { ConciergeContext } from "@/types/concierge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM = `You are the USVI Explorer planning engine. Create practical, evidence-grounded USVI day plans. Use only supplied evidence for named places. Respect hard time limits and preserve a conservative return buffer. Never invent prices, hours, availability, travel times, ferry schedules, or bookings. State assumptions. Prefer geographically coherent plans and avoid overpacking. Return JSON with title, summary, stops (name, purpose, approximateMinutes, evidenceType), logistics, assumptions, and nextAction.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "summary", "stops", "logistics", "assumptions", "nextAction"],
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    stops: { type: "array", maxItems: 5, items: { type: "object", additionalProperties: false, required: ["name", "purpose", "approximateMinutes", "evidenceType"], properties: { name: { type: "string" }, purpose: { type: "string" }, approximateMinutes: { type: "number" }, evidenceType: { type: "string" } } } },
    logistics: { type: "array", maxItems: 6, items: { type: "string" } },
    assumptions: { type: "array", maxItems: 6, items: { type: "string" } },
    nextAction: { type: "string" },
  },
} as const;

function validContext(value: unknown): value is ConciergeContext {
  if (!value || typeof value !== "object") return false;
  const context = value as ConciergeContext;
  return context.island === "stt" || context.island === "stj" || context.island === "stx";
}

function outputText(payload: Record<string, unknown>) {
  if (typeof payload.output_text === "string") return payload.output_text;
  const output = Array.isArray(payload.output) ? payload.output : [];
  return output.flatMap((item) => item && typeof item === "object" && Array.isArray((item as { content?: unknown }).content) ? (item as { content: unknown[] }).content : [])
    .map((part) => part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string" ? (part as { text: string }).text : "")
    .filter(Boolean).join("\n");
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { message?: unknown; minutesAvailable?: unknown; context?: unknown } | null;
  if (!body || typeof body.message !== "string" || !body.message.trim()) return NextResponse.json({ error: "A planning request is required." }, { status: 400 });
  if (!validContext(body.context)) return NextResponse.json({ error: "A valid live Explorer context is required." }, { status: 400 });

  const context = body.context;
  const minutes = Math.max(0, Math.min(1440, Number(body.minutesAvailable) || 0));
  const query = body.message.slice(0, 2000);
  const evidence = [
    runConciergeTool("search_beaches", { query }, context),
    runConciergeTool("search_places", { query }, context),
    runConciergeTool("search_history", { query }, context),
    runConciergeTool("check_time_budget", { minutesAvailable: minutes }, context),
    runConciergeTool("build_day_plan", { query, minutesAvailable: minutes }, context),
  ];

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI planning is not configured.", evidence }, { status: 503 });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.6-sol",
        store: false,
        instructions: SYSTEM,
        input: JSON.stringify({ liveAppContext: context, minutesAvailable: minutes, request: query, evidence }),
        reasoning: { effort: "medium" },
        max_output_tokens: 1800,
        text: { format: { type: "json_schema", name: "usvi_day_plan", strict: true, schema: SCHEMA } },
      }),
    });
    const payload = await response.json().catch(() => null) as Record<string, unknown> | null;
    if (!response.ok || !payload) return NextResponse.json({ error: "The planning model request failed.", evidence }, { status: 502 });
    const text = outputText(payload);
    if (!text) return NextResponse.json({ error: "The planning model returned no plan.", evidence }, { status: 502 });
    const plan = JSON.parse(text);
    return NextResponse.json({ plan, evidence, planner: "evidence-grounded" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "The planning engine timed out.", evidence }, { status: 504 });
  } finally {
    clearTimeout(timeout);
  }
}
