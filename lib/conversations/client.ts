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

export type PersonalAiConversation = Readonly<{
  conversationId: string;
  title: string;
  participantId: string;
  assistantParticipantId: string;
  aiAccess: "off" | "mention" | "active";
}>;

export type ConversationConnectionState =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "offline";

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

function parseSseBlock(block: string) {
  let event = "message";
  const data: string[] = [];
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    if (line.startsWith("data:")) data.push(line.slice(5).trim());
  }
  return { event, data: data.join("\n") };
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

  async ensurePersonalAi(): Promise<PersonalAiConversation> {
    const response = await fetch("/api/conversations/personal-ai", {
      method: "POST",
      headers: await this.headers(),
      cache: "no-store",
    });
    if (!response.ok) throw await responseError(response);
    return Object.freeze((await response.json()) as PersonalAiConversation);
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

  subscribeMessages(
    conversationId: string,
    handlers: Readonly<{
      onMessage: (message: PublicConversationMessage) => void;
      onState?: (state: ConversationConnectionState) => void;
      onError?: (error: Error) => void;
    }>,
  ) {
    if (!validId(conversationId)) throw new Error("Invalid conversation id.");

    const abort = new AbortController();
    const run = async () => {
      let first = true;
      while (!abort.signal.aborted) {
        handlers.onState?.(first ? "connecting" : "reconnecting");
        try {
          const headers = await this.headers();
          const response = await fetch(
            `/api/conversations/${encodeURIComponent(conversationId)}/stream`,
            {
              method: "GET",
              headers: { ...headers, Accept: "text/event-stream" },
              cache: "no-store",
              signal: abort.signal,
            },
          );
          if (!response.ok) throw await responseError(response);
          if (!response.body) throw new Error("Realtime response had no stream.");

          handlers.onState?.("connected");
          first = false;
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (!abort.signal.aborted) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const blocks = buffer.split("\n\n");
            buffer = blocks.pop() ?? "";

            for (const block of blocks) {
              if (!block.trim()) continue;
              const parsed = parseSseBlock(block);
              if (parsed.event === "message" && parsed.data) {
                handlers.onMessage(
                  Object.freeze(
                    JSON.parse(parsed.data) as PublicConversationMessage,
                  ),
                );
              }
              if (parsed.event === "stream_error") {
                handlers.onError?.(
                  new Error("Realtime connection was interrupted."),
                );
              }
            }
          }
        } catch (error) {
          if (abort.signal.aborted) break;
          handlers.onError?.(
            error instanceof Error ? error : new Error("Realtime connection failed."),
          );
        }

        if (!abort.signal.aborted) {
          handlers.onState?.("reconnecting");
          await new Promise((resolve) => setTimeout(resolve, 1_200));
        }
      }
      handlers.onState?.("offline");
    };

    void run();
    return () => abort.abort();
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
