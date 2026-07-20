import { NextRequest, NextResponse } from "next/server";

import { getHeritageEvidence } from "@/lib/heritage-evidence";
import type {
  ConciergeChatRequest,
  ConciergeMessage,
  ConciergeReply,
} from "@/types/concierge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_RUNTIME_MS = 25_000;
const MAX_OUTPUT_TOKENS = 1600;

const SYSTEM_INSTRUCTIONS = `
You are VI Guide Heritage Concierge, a locally literate research and trip-planning guide for the U.S. Virgin Islands.

Use only the supplied heritageEvidence for named historic places and record-specific claims. A canonical record confirms that the place exists in VI Guide's reviewed directory; it does not prove every possible historical interpretation.

Rules:
- Answer the traveler directly and practically.
- Separate verified record facts from interpretation or recommendation.
- Never invent dates, people, ownership, architecture, events, quotations, opening hours, admission, accessibility, travel times, or current conditions.
- When the supplied evidence is insufficient, state what is unknown instead of filling the gap.
- Do not silently move a traveler between islands.
- For an itinerary, keep the sequence realistic and explain any island transfer.
- Mention the evidence record titles that support the answer naturally in the response.
- Provide the smallest useful next step.
- Do not claim a booking, ride, message, purchase, or external action occurred.

Style: warm, precise, concise, culturally respectful, and free of tourism-brochure filler.
`;

function validIdentifier(value: unknown) {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{8,100}$/.test(value);
}

function normalizeHistory(value: unknown): ConciergeMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is ConciergeMessage => {
      if (!item || typeof item !== "object") return false;
      const message = item as Partial<ConciergeMessage>;
      return (
        (message.role === "user" || message.role === "assistant") &&
        typeof message.text === "string"
      );
    })
    .slice(-8)
    .map((message) => ({
      id: String(message.id || crypto.randomUUID()).slice(0, 100),
      role: message.role,
      text: message.text.trim().slice(0, 2500),
      createdAt: String(message.createdAt || new Date().toISOString()),
    }));
}

function extractOutputText(payload: Record<string, unknown>) {
  if (typeof payload.output_text === "string") return payload.output_text;

  const output = Array.isArray(payload.output) ? payload.output : [];
  const parts: string[] = [];

  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = Array.isArray((item as { content?: unknown }).content)
      ? (item as { content: unknown[] }).content
      : [];

    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const text = (part as { text?: unknown }).text;
      if (typeof text === "string") parts.push(text);
    }
  }

  return parts.join("\n");
}

function localAnswer(
  islandName: string,
  message: string,
  evidence: ReturnType<typeof getHeritageEvidence>,
) {
  if (!evidence.length) {
    return `I do not have a reviewed heritage record on ${islandName} that directly supports that request yet. Try a fort, estate, church, district, ruin, or historic place name, and I will stay within the records currently available in VI Guide.`;
  }

  const names = evidence.slice(0, 3).map((item) => item.title);
  const lead = names.length === 1
    ? names[0]
    : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;

  const planningIntent = /plan|route|day|visit|tour|itinerary|nearby/i.test(message);

  return planningIntent
    ? `A grounded ${islandName} heritage starting set is ${lead}. These are reviewed VI Guide place records, but current access, hours, admission, and on-site conditions still need local verification. Open the individual records for map and transportation handoffs, then keep the route on one island unless you intentionally plan a ferry or flight transfer.`
    : `The strongest reviewed ${islandName} heritage matches are ${lead}. I can describe only what the current VI Guide records support; dates, people, or historical claims not present in those records should be treated as unverified until source material is connected.`;
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const runId = crypto.randomUUID();

  try {
    const body = (await request.json()) as Partial<ConciergeChatRequest>;

    if (
      !validIdentifier(body.sessionId) ||
      !validIdentifier(body.clientId) ||
      !validIdentifier(body.idempotencyKey)
    ) {
      return NextResponse.json({ error: "The concierge session identifiers are invalid." }, { status: 400 });
    }

    const message = typeof body.message === "string" ? body.message.trim() : "";
    const context = body.context;

    if (!message || message.length > 3000 || !context) {
      return NextResponse.json({ error: "The heritage request is invalid." }, { status: 400 });
    }

    if (context.island !== "stt" && context.island !== "stj" && context.island !== "stx") {
      return NextResponse.json({ error: "The selected island is invalid." }, { status: 400 });
    }

    const evidence = getHeritageEvidence({
      query: message,
      island: context.island,
      estateGeoid: context.selectedEstate?.geoid,
      limit: 14,
    });

    let provider: ConciergeReply["provider"] = "local";
    let answer = localAnswer(context.islandName, message, evidence);
    let outputTokens = 0;

    if (process.env.OPENAI_API_KEY) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), MAX_RUNTIME_MS - 1500);

      try {
        const response = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || "gpt-5.6-sol",
            store: false,
            instructions: SYSTEM_INSTRUCTIONS,
            input: JSON.stringify({
              liveAppContext: context,
              recentConversation: normalizeHistory(body.recentMessages).map(({ role, text }) => ({ role, text })),
              heritageEvidence: evidence,
              userMessage: message,
            }),
            reasoning: { effort: "medium" },
            max_output_tokens: MAX_OUTPUT_TOKENS,
          }),
        });

        const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;

        if (response.ok && payload) {
          const generated = extractOutputText(payload).trim();
          if (generated) {
            answer = generated.slice(0, 5000);
            provider = "openai";
            const usage = payload.usage as { output_tokens?: unknown } | undefined;
            outputTokens = typeof usage?.output_tokens === "number" ? usage.output_tokens : 0;
          }
        }
      } catch (error) {
        console.error("Heritage concierge model request failed. Using grounded local fallback.", error);
      } finally {
        clearTimeout(timeout);
      }
    }

    const reply: ConciergeReply = {
      runId,
      sessionId: body.sessionId as string,
      message: {
        id: crypto.randomUUID(),
        role: "assistant",
        text: answer,
        createdAt: new Date().toISOString(),
      },
      suggestions: evidence.slice(0, 3).map((item) => `Tell me more about ${item.title}`),
      actions: [],
      provider,
      budget: {
        modelCallsUsed: provider === "openai" ? 1 : 0,
        outputTokens,
        runtimeMs: Date.now() - startedAt,
        externalSpendCents: 0,
      },
    };

    return NextResponse.json(reply, {
      headers: {
        "Cache-Control": "no-store",
        "X-Heritage-Evidence-Count": String(evidence.length),
      },
    });
  } catch (error) {
    console.error("Heritage concierge request failed.", error);
    return NextResponse.json({ error: "The heritage concierge could not respond." }, { status: 500 });
  }
}
