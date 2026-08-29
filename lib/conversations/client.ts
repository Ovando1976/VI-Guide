"use client";

import type { ConversationMessage } from "@/types/conversation";
import type {
  IntelligenceCapability,
  IntelligenceContext,
} from "@/types/intelligence";

export type PublicConversationMessage = Omit<ConversationMessage, "aiRun">;

export type ConversationPage = Readonly<{
  conversationId: string;
  messages: readonly PublicConversationMessage[];
  nextCursor: string | null;
}>;

export type ConversationClientTokenProvider = () => Promise<string | null>;

function validId(value: string) {
  return /^[a-zA-Z0-9_-]{1,160}$/.test(value);
}

async function responseError(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | { error?: unknown }
    | null;
  return new Error(
    typeof payload?.error === "string"
      ? payload.error
      : `Conversation request failed with ${response.status}.`,
  );
}

export class ConversationClient {
  constructor(private readonly getToken: ConversationClientTokenProvider) {}

  private async headers() {
    const token = await this.getToken();
    if (!token) throw new Error("Sign in to use conversations.");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  async listMessages(
    conversationId: string,
    options: Readonly<{ limit?: number; before?: string }> = {},
  ): Promise<ConversationPage> {
    if (!validId(conversationId)) throw new Error("Invalid conversation id.");
    if (options.before && !validId(options.before)) {
      throw new Error("Invalid message cursor.");
    }

    const params = new URLSearchParams();
    if (options.limit) {
      params.set("limit", String(Math.max(1, Math.min(options.limit, 100))));
    }
    if (options.before) params.set("before", options.before);

    const response = await fetch(
      `/api/conversations/${encodeURIComponent(conversationId)}/messages${
        params.size ? `?${params.toString()}` : ""
      }`,
      {
        method: "GET",
        headers: await this.headers(),
        cache: "no-store",
      },
    );
    if (!response.ok) throw await responseError(response);

    const payload = (await response.json()) as ConversationPage;
    return Object.freeze({
      conversationId: payload.conversationId,
      messages: Object.freeze([...payload.messages]),
      nextCursor: payload.nextCursor ?? null,
    });
  }

  async sendText(
    conversationId: string,
    text: string,
    options: Readonly<{
      id?: string;
      replyToMessageId?: string;
      mentions?: readonly string[];
    }> = {},
  ): Promise<PublicConversationMessage> {
    if (!validId(conversationId)) throw new Error("Invalid conversation id.");
    const cleanedText = text.trim();
    if (!cleanedText || cleanedText.length > 4_000) {
      throw new Error("Message text must contain 1 to 4000 characters.");
    }

    const response = await fetch(
      `/api/conversations/${encodeURIComponent(conversationId)}/messages`,
      {
        method: "POST",
        headers: await this.headers(),
        body: JSON.stringify({
          text: cleanedText,
          ...(options.id ? { id: options.id } : {}),
          ...(options.replyToMessageId
            ? { replyToMessageId: options.replyToMessageId }
            : {}),
          ...(options.mentions?.length
            ? { mentions: [...options.mentions] }
            : {}),
        }),
      },
    );
    if (!response.ok) throw await responseError(response);

    const payload = (await response.json()) as {
      message: PublicConversationMessage;
    };
    return Object.freeze(payload.message);
  }

  async invokeAi(
    conversationId: string,
    input: Readonly<{
      assistantParticipantId: string;
      invocation?: "mention" | "active";
      invocationMessageId?: string;
      context?: Partial<IntelligenceContext>;
      capabilities?: readonly IntelligenceCapability[];
    }>,
  ): Promise<Readonly<{
    message: PublicConversationMessage;
    confidence: "low" | "medium" | "high";
  }>> {
    if (!validId(conversationId)) throw new Error("Invalid conversation id.");
    if (!validId(input.assistantParticipantId)) {
      throw new Error("Invalid assistant participant id.");
    }
    if (input.invocationMessageId && !validId(input.invocationMessageId)) {
      throw new Error("Invalid invocation message id.");
    }

    const invocation = input.invocation ?? "mention";
    if (invocation === "mention" && !input.invocationMessageId) {
      throw new Error("Mention invocation requires a message id.");
    }

    const response = await fetch(
      `/api/conversations/${encodeURIComponent(conversationId)}/ai`,
      {
        method: "POST",
        headers: await this.headers(),
        body: JSON.stringify({
          assistantParticipantId: input.assistantParticipantId,
          invocation,
          ...(input.invocationMessageId
            ? { invocationMessageId: input.invocationMessageId }
            : {}),
          context: input.context ?? {},
          ...(input.capabilities?.length
            ? { capabilities: [...input.capabilities] }
            : {}),
        }),
      },
    );
    if (!response.ok) throw await responseError(response);

    const payload = (await response.json()) as {
      message: PublicConversationMessage;
      confidence: "low" | "medium" | "high";
    };
    return Object.freeze({
      message: Object.freeze(payload.message),
      confidence: payload.confidence,
    });
  }
}
