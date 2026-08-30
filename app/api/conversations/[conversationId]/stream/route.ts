import { NextRequest } from "next/server";

import { FirestoreConversationStore } from "@/lib/conversations/firestore-conversation-store";
import {
  bindConversationParticipant,
  verifiedConversationUserId,
} from "@/lib/conversations/server-auth";
import { getAdminDb } from "@/lib/firebase-admin";
import type { ConversationMessage } from "@/types/conversation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function validId(value: string) {
  return /^[a-zA-Z0-9_-]{1,160}$/.test(value);
}

function publicMessage(message: ConversationMessage) {
  const { aiRun: _internalAiRun, ...safe } = message;
  return safe;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } },
) {
  const conversationId = params.conversationId;
  if (!validId(conversationId)) {
    return new Response("Invalid conversation id.", { status: 400 });
  }

  let userId: string;
  try {
    userId = await verifiedConversationUserId(request);
    const store = new FirestoreConversationStore();
    await bindConversationParticipant(store, conversationId, userId);
  } catch {
    return new Response("Unauthorized.", { status: 401 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      let unsubscribe: (() => void) | null = null;
      let timer: ReturnType<typeof setTimeout> | null = null;

      const emit = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      const close = () => {
        if (closed) return;
        closed = true;
        if (timer) clearTimeout(timer);
        unsubscribe?.();
        try {
          controller.close();
        } catch {
          // The client may have already disconnected.
        }
      };

      emit("ready", { conversationId });

      const query = getAdminDb()
        .collection("conversations")
        .doc(conversationId)
        .collection("messages")
        .orderBy("createdAt", "desc")
        .limit(50);

      unsubscribe = query.onSnapshot(
        (snapshot) => {
          for (const change of snapshot.docChanges()) {
            if (change.type === "removed") continue;
            const message = change.doc.data() as ConversationMessage;
            emit("message", publicMessage(message));
          }
        },
        (error) => {
          console.error("Conversation realtime stream failed.", error);
          emit("stream_error", { error: "Realtime connection interrupted." });
          close();
        },
      );

      timer = setTimeout(() => {
        emit("reconnect", { reason: "stream_window_complete" });
        close();
      }, 45_000);

      request.signal.addEventListener("abort", close, { once: true });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
