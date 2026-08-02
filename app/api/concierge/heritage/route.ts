import { NextRequest, NextResponse } from "next/server";

import { rankHeritageEvidence } from "@/lib/heritage/evidence";
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

Use only the supplied heritageEvidence for named historic places, timeline events, governors, administrations, and record-specific claims. A canonical or reviewed record confirms that VI Guide has a source-aware record for the subject; it does not prove every possible interpretation.

Rules:
- Answer the traveler directly and practically.
- Separate verified record facts from interpretation or recommendation.
- Never invent dates, people, ownership, architecture, events, quotations, opening hours, admission, accessibility, travel times, or current conditions.
- When the supplied evidence is insufficient, state what is unknown instead of filling the gap.
- Do not silently move a traveler between islands.
- Keep itineraries realistic and explain any island transfer.
- Mention supporting evidence record titles naturally.
- Use timeline and governor records when they directly answer the question.
- Never claim a booking, ride, purchase, message, or external action occurred.

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
  evidence: ReturnType<typeof rankHeritageEvidence>,
) {
  if (!evidence.length) {
    return `I do not have a reviewed heritage record on ${islandName} that directly supports that request yet. Try a historic place, event, governor, administration, estate, church, district, or year, and I will stay within the records currently available in VI Guide.`;
  }

  const names = evidence.slice(0, 3).map((item) => item.title);
  const lead =
    names.length === 1
      ? names[0]
      : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  const planningIntent = /plan|route|day|visit|tour|itinerary|nearby/i.test(message);

  return planningIntent
    ? `A grounded ${islandName} heritage starting set is ${lead}. These VI Guide records may include historic places, timeline events, or administrations. Current access, hours, admission, and on-site conditions still need local verification. Open the records below for map and transportation handoffs, and keep the route on one island unless you intentionally plan a transfer.`
    : `The strongest reviewed ${islandName} heritage matches are ${lead}. Open the records below to continue into the timeline, governors, historic-place pages, or map. Claims absent from those records remain unverified until source material is connected.`;
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const runId = crypto.randomUUID();

  try {
    const body = (await request.json().catch(() => null)) as Partial<ConciergeChatRequest> | null;

    if (!body) {
      return NextResponse.json(
        { error: "The heritage request body is invalid." },
        { status: 400 },
      );
    }

    if (
      !validIdentifier(body.sessionId) ||
      !validIdentifier(body.clientId) ||
      !validIdentifier(body.idempotencyKey)
    ) {
      return NextResponse.json(
        { error: "The concierge session identifiers are invalid." },
        { status: 400 },
      );
    }

    const message = typeof body.message === "string" ? body.message.trim() : "";
    const context = body.context;

    if (!message || message.length > 3000 || !context) {
      return NextResponse.json(
        { error: "The heritage request is invalid." },
        { status: 400 },
      );
    }

    if (context.island !== "stt" && context.island !== "stj" && context.island !== "stx") {
      return NextResponse.json(
        { error: "The selected island is invalid." },
        { status: 400 },
      );
    }

    const evidence = rankHeritageEvidence({
      query: message,
      island: context.island,
      estateGeoid: context.selectedEstate?.geoid,
      limit: 14,
    });

    let provider: ConciergeReply["provider"] = "local";
    let answer = localAnswer(context.islandName, message, evidence);
    let outputTokensUsed = 0;

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
              recentConversation: normalizeHistory(body.recentMessages).map(
                ({ role, text }) => ({ role, text }),
              ),
              heritageEvidence: evidence,
              userMessage: message,
            }),
            reasoning: { effort: "medium" },
            max_output_tokens: MAX_OUTPUT_TOKENS,
          }),
        });

        const payload = (await response.json().catch(() => null)) as
          | Record<string, unknown>
          | null;

        if (response.ok && payload) {
          const generated = extractOutputText(payload).trim();
          if (generated) {
            answer = generated.slice(0, 5000);
            provider = "openai";
            const usage = payload.usage as { output_tokens?: unknown } | undefined;
            outputTokensUsed =
              typeof usage?.output_tokens === "number" ? usage.output_tokens : 0;
          }
        }
      } catch (error) {
        console.error(
          "Heritage concierge model request failed. Using grounded local fallback.",
          error,
        );
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
      suggestions: evidence
        .slice(0, 3)
        .map((item) => `Tell me more about ${item.title}`),
      actions: evidence.slice(0, 4).map((item) => ({
        id: `heritage_${item.id.replace(/[^a-zA-Z0-9_-]/g, "_")}`.slice(0, 100),
        type: "open_heritage",
        label: `Open ${item.title}`.slice(0, 120),
        geoid: item.estateGeoid ?? null,
        href: item.href,
        rationale: `Open the reviewed ${item.type} record used in this answer.`,
        risk: "local",
        requiresApproval: false,
      })),
      provider,
      memoryStatus: "session-only",
      budget: {
        maxModelCalls: 1,
        modelCallsUsed: provider === "openai" ? 1 : 0,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        outputTokensUsed,
        maxRuntimeMs: MAX_RUNTIME_MS,
        runtimeMs: Date.now() - startedAt,
        externalSpendLimitCents: 0,
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
    return NextResponse.json(
      { error: "The heritage concierge could not respond." },
      { status: 500 },
    );
  }
}
