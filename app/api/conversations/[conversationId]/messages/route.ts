import { NextRequest, NextResponse } from "next/server";

import { ConversationEngine } from "@/lib/conversations/conversation-engine";
import { FirestoreConversationStore } from "@/lib/conversations/firestore-conversation-store";
import {
  ConversationAuthenticationError,
  bindConversationParticipant,
  verifiedConversationUserId,
} from "@/lib/conversations/server-auth";
import {
  ConversationPolicyError,
  assertCanWrite,
} from "@/lib/conversations/conversation-policy";
import type { ConversationMessage } from "@/types/conversation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const store = new FirestoreConversationStore();
const engine = new ConversationEngine(store);

function validId(value: string) {
  return /^[a-zA-Z0-9_-]{1,160}$/.test(value);
}

function publicMessage(message: ConversationMessage) {
  const { aiRun: _internalAiRun, ...safe } = message;
  return safe;
}

function policyStatus(error: ConversationPolicyError) {
  switch (error.code) {
    case "conversation_not_found":
    case "message_not_found":
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
  console.error("Conversation message API failed.", error);
  return NextResponse.json(
    { error: "Conversation messaging is temporarily unavailable." },
    { status: 500 },
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } },
) {
  try {
    const conversationId = params.conversationId;
    if (!validId(conversationId)) {
      return NextResponse.json({ error: "Invalid conversation id." }, { status: 400 });
    }

    const userId = await verifiedConversationUserId(request);
    await bindConversationParticipant(store, conversationId, userId);

    const url = new URL(request.url);
    const requestedLimit = Number(url.searchParams.get("limit") ?? 50);
    const limit = Number.isFinite(requestedLimit)
      ? Math.max(1, Math.min(Math.trunc(requestedLimit), 100))
      : 50;
    const before = url.searchParams.get("before")?.trim();
    if (before && !validId(before)) {
      return NextResponse.json({ error: "Invalid message cursor." }, { status: 400 });
    }

    const messages = await store.listMessages(conversationId, {
      limit,
      ...(before ? { before } : {}),
    });

    return NextResponse.json(
      {
        conversationId,
        messages: messages.map(publicMessage),
        nextCursor: messages.length === limit ? messages[0]?.id ?? null : null,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
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
    const participant = await bindConversationParticipant(
      store,
      conversationId,
      userId,
    );
    assertCanWrite(participant);

    const payload = (await request.json().catch(() => null)) as
      | {
          text?: unknown;
          id?: unknown;
          replyToMessageId?: unknown;
          mentions?: unknown;
        }
      | null;
    if (!payload) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const text = typeof payload.text === "string" ? payload.text.trim() : "";
    if (!text || text.length > 4_000) {
      return NextResponse.json(
        { error: "Message text must contain 1 to 4000 characters." },
        { status: 400 },
      );
    }

    const id = typeof payload.id === "string" ? payload.id.trim() : undefined;
    if (id && !validId(id)) {
      return NextResponse.json({ error: "Invalid message id." }, { status: 400 });
    }

    const replyToMessageId =
      typeof payload.replyToMessageId === "string"
        ? payload.replyToMessageId.trim()
        : undefined;
    if (replyToMessageId && !validId(replyToMessageId)) {
      return NextResponse.json({ error: "Invalid reply target." }, { status: 400 });
    }

    const mentions = Array.isArray(payload.mentions)
      ? Array.from(
          new Set(
            payload.mentions
              .filter((value): value is string => typeof value === "string")
              .map((value) => value.trim())
              .filter((value) => validId(value)),
          ),
        ).slice(0, 20)
      : undefined;

    const message = await engine.appendMessage({
      conversationId,
      actorParticipantId: participant.id,
      ...(id ? { id } : {}),
      parts: [{ type: "text", text }],
      ...(replyToMessageId ? { replyToMessageId } : {}),
      ...(mentions?.length ? { mentions } : {}),
    });

    return NextResponse.json(
      { message: publicMessage(message) },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
          "X-VI-Conversation-Message": message.id,
        },
      },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
