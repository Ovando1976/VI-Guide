import { NextRequest, NextResponse } from "next/server";

import { ConversationAiParticipantBridge } from "@/lib/conversations/conversation-ai-bridge";
import { createConfiguredConversationAiWorker } from "@/lib/conversations/conversation-ai-worker";
import { ConversationEngine } from "@/lib/conversations/conversation-engine";
import { FirestoreConversationStore } from "@/lib/conversations/firestore-conversation-store";
import {
  ConversationAuthenticationError,
  bindConversationParticipant,
  verifiedConversationUserId,
} from "@/lib/conversations/server-auth";
import { ConversationPolicyError } from "@/lib/conversations/conversation-policy";
import type {
  IntelligenceCapability,
  IntelligenceContext,
  IntelligenceIsland,
  IntelligencePage,
} from "@/types/intelligence";
import type { ConversationMessage } from "@/types/conversation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ISLANDS: readonly IntelligenceIsland[] = ["stt", "stj", "stx"];
const PAGES: readonly IntelligencePage[] = [
  "home",
  "explore",
  "map",
  "heritage",
  "mobility",
  "stays",
  "beaches",
  "fishing",
  "community",
  "concierge",
  "cruises",
  "planner",
  "profile",
  "today",
  "search",
  "unknown",
];
const CAPABILITIES: readonly IntelligenceCapability[] = [
  "recommend",
  "plan",
  "map",
  "mobility",
  "booking",
  "knowledge",
];

function validId(value: string) {
  return /^[a-zA-Z0-9_-]{1,160}$/.test(value);
}

function normalizeStrings(value: unknown, limit: number) {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().slice(0, 120))
        .filter(Boolean)
        .slice(0, limit)
    : [];
}

function normalizeContext(value: unknown): IntelligenceContext | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<IntelligenceContext>;
  const island = ISLANDS.includes(raw.island as IntelligenceIsland)
    ? (raw.island as IntelligenceIsland)
    : "stt";
  const page = PAGES.includes(raw.page as IntelligencePage)
    ? (raw.page as IntelligencePage)
    : "community";

  return {
    sessionId: "chat_server_context",
    page,
    island,
    now: new Date().toISOString(),
    timezone: "America/St_Thomas",
    party: {
      adults: Math.max(1, Math.min(Number(raw.party?.adults) || 1, 50)),
      children: Math.max(0, Math.min(Number(raw.party?.children) || 0, 50)),
      accessibilityNeeds: normalizeStrings(
        raw.party?.accessibilityNeeds,
        12,
      ),
    },
    preferences: {
      interests: normalizeStrings(raw.preferences?.interests, 24),
      ...(raw.preferences?.pace ? { pace: raw.preferences.pace } : {}),
      ...(raw.preferences?.budget ? { budget: raw.preferences.budget } : {}),
      food: normalizeStrings(raw.preferences?.food, 20),
      avoid: normalizeStrings(raw.preferences?.avoid, 20),
    },
    memory: {},
  };
}

function publicMessage(message: ConversationMessage) {
  const { aiRun: _internalAiRun, ...safe } = message;
  return safe;
}

function policyStatus(error: ConversationPolicyError) {
  switch (error.code) {
    case "conversation_not_found":
    case "message_not_found":
    case "assistant_not_found":
      return 404;
    case "invalid_message":
    case "invalid_conversation":
      return 400;
    default:
      return 403;
  }
}

function errorResponse(error: unknown) {
  if (error instanceof ConversationAuthenticationError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  if (error instanceof ConversationPolicyError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: policyStatus(error) },
    );
  }
  console.error("Conversation AI API failed.", error);
  return NextResponse.json(
    { error: "Conversation AI is temporarily unavailable." },
    { status: 500 },
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } },
) {
  try {
    const conversationId = params.conversationId;
    if (!validId(conversationId)) {
      return NextResponse.json({ error: "Invalid conversation id." }, { status: 400 });
    }

    const userId = await verifiedConversationUserId(request);
    const store = new FirestoreConversationStore();
    const participant = await bindConversationParticipant(
      store,
      conversationId,
      userId,
    );

    const payload = (await request.json().catch(() => null)) as
      | {
          assistantParticipantId?: unknown;
          invocation?: unknown;
          invocationMessageId?: unknown;
          capabilities?: unknown;
          context?: unknown;
        }
      | null;
    if (!payload) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const assistantParticipantId =
      typeof payload.assistantParticipantId === "string"
        ? payload.assistantParticipantId.trim()
        : "";
    if (!validId(assistantParticipantId)) {
      return NextResponse.json(
        { error: "Invalid assistant participant id." },
        { status: 400 },
      );
    }

    const invocation = payload.invocation === "active" ? "active" : "mention";
    const invocationMessageId =
      typeof payload.invocationMessageId === "string"
        ? payload.invocationMessageId.trim()
        : undefined;
    if (invocation === "mention" && !invocationMessageId) {
      return NextResponse.json(
        { error: "Mention invocation requires a message id." },
        { status: 400 },
      );
    }
    if (invocationMessageId && !validId(invocationMessageId)) {
      return NextResponse.json(
        { error: "Invalid invocation message id." },
        { status: 400 },
      );
    }

    const context = normalizeContext(payload.context ?? {});
    if (!context) {
      return NextResponse.json({ error: "Invalid AI context." }, { status: 400 });
    }

    const capabilities = Array.isArray(payload.capabilities)
      ? Array.from(
          new Set(
            payload.capabilities.filter(
              (value): value is IntelligenceCapability =>
                typeof value === "string" &&
                CAPABILITIES.includes(value as IntelligenceCapability),
            ),
          ),
        ).slice(0, CAPABILITIES.length)
      : undefined;

    const worker = createConfiguredConversationAiWorker();
    if (!worker) {
      return NextResponse.json(
        { error: "Conversation AI is not configured." },
        { status: 503 },
      );
    }

    const bridge = new ConversationAiParticipantBridge(
      new ConversationEngine(store),
      worker,
    );
    const result = await bridge.respond({
      conversationId,
      requesterParticipantId: participant.id,
      assistantParticipantId,
      invocation,
      ...(invocationMessageId ? { invocationMessageId } : {}),
      context,
      ...(capabilities?.length ? { capabilities } : {}),
    });

    const message = await store.getMessage(conversationId, result.messageId);
    if (!message) {
      throw new Error("AI reply committed without a readable conversation message.");
    }

    return NextResponse.json(
      {
        message: publicMessage(message),
        confidence: result.confidence,
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
          "X-VI-Conversation-AI": "completed",
        },
      },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
