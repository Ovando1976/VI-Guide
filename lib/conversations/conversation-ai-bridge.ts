import { randomUUID } from "node:crypto";

import type { ConversationEngine } from "@/lib/conversations/conversation-engine";
import type {
  AgentBlackboardMessage,
  AgentBlackboardTask,
} from "@/lib/intelligence/agent-blackboard";
import type { AgentWorker, AgentWorkerInput } from "@/lib/intelligence/agent-worker";
import type { CoordinationRootIntent } from "@/lib/intelligence/agent-policy";
import type { CollectiveAgentDescriptor } from "@/lib/intelligence/agent-registry";
import type { IntelligenceRouteDecision } from "@/lib/intelligence/model-router";
import type {
  IntelligenceCapability,
  IntelligenceContext,
  IntelligenceRequest,
} from "@/types/intelligence";
import type {
  ConversationAiContext,
  ConversationAiContextPart,
} from "@/types/conversation";

const ALL_CAPABILITIES: readonly IntelligenceCapability[] = [
  "recommend",
  "plan",
  "map",
  "mobility",
  "booking",
  "knowledge",
];

const DEFAULT_CAPABILITIES: readonly IntelligenceCapability[] = [
  "recommend",
  "plan",
  "knowledge",
];

const CHAT_AGENT: CollectiveAgentDescriptor = Object.freeze({
  id: "conversation-assistant",
  name: "Conversation Assistant",
  purpose:
    "Respond inside an authorized social conversation without gaining authority over bookings, payments, rides, or external actions.",
  capabilities: ALL_CAPABILITIES,
  roles: Object.freeze(["specialist"] as const),
  domains: Object.freeze(["conversation", "usvi", "traveler-assistance"]),
  priority: 90,
  maxConcurrentTasks: 1,
  enabled: true,
  version: "1.0.0",
});

type RoutableAgentWorker = AgentWorker &
  Readonly<{
    decide?: (input: AgentWorkerInput) => IntelligenceRouteDecision;
  }>;

export type ConversationAiBridgeInput = Readonly<{
  conversationId: string;
  requesterParticipantId: string;
  assistantParticipantId: string;
  invocation: "mention" | "active";
  invocationMessageId?: string;
  context: IntelligenceContext;
  capabilities?: readonly IntelligenceCapability[];
  historyLimit?: number;
}>;

export type ConversationAiBridgeResult = Readonly<{
  messageId: string;
  workerId: string;
  provider: string | null;
  model: string | null;
  confidence: "low" | "medium" | "high";
}>;

function safeCapabilities(
  requested: readonly IntelligenceCapability[] | undefined,
): readonly IntelligenceCapability[] {
  const allowed = new Set<IntelligenceCapability>(ALL_CAPABILITIES);
  const values = requested?.length ? requested : DEFAULT_CAPABILITIES;
  const result = Array.from(new Set(values.filter((value) => allowed.has(value))));
  return Object.freeze(result.length ? result : [...DEFAULT_CAPABILITIES]);
}

function partToText(part: ConversationAiContextPart): string {
  switch (part.type) {
    case "text":
      return part.text;
    case "image":
      return `[image${part.alt ? `: ${part.alt}` : ""}]`;
    case "video":
      return `[video${part.alt ? `: ${part.alt}` : ""}]`;
    case "audio":
      return "[audio]";
    case "file":
      return `[file: ${part.name}]`;
    case "location":
      return `[location: ${part.name}]`;
    case "artifact":
      return `[shared ${part.artifactType}: ${part.title}]`;
    case "poll":
      return `[poll: ${part.question}]`;
  }
}

function messageText(parts: readonly ConversationAiContextPart[]) {
  return parts.map(partToText).join("\n").trim().slice(0, 4_000);
}

function buildBlackboardMessages(
  context: ConversationAiContext,
): readonly AgentBlackboardMessage[] {
  return Object.freeze(
    context.messages.slice(-12, -1).map((message, index) =>
      Object.freeze({
        id: `chat-history-${index + 1}`,
        type: "observation" as const,
        fromAgentId:
          message.speakerType === "ai" ? "conversation-assistant" : "conversation-participant",
        content: `${message.role === "assistant" ? "Assistant" : "Participant"}: ${messageText(message.parts)}`.slice(
          0,
          1_500,
        ),
        requestedCapabilities: Object.freeze([]),
        createdAt: message.createdAt,
      }),
    ),
  );
}

function buildWorkerInput(
  context: ConversationAiContext,
  travelerContext: IntelligenceContext,
  capabilities: readonly IntelligenceCapability[],
): AgentWorkerInput {
  const now = new Date();
  const latest = context.messages.at(-1);
  const latestText = latest ? messageText(latest.parts) : "";
  if (!latest || latest.role !== "user" || !latestText) {
    throw new Error("Conversation AI invocation requires a non-empty user message.");
  }

  const request: IntelligenceRequest = Object.freeze({
    message: latestText,
    context: Object.freeze({
      ...travelerContext,
      userId: undefined,
      sessionId: `chat_${randomUUID().replace(/-/g, "")}`,
      now: now.toISOString(),
      timezone: "America/St_Thomas" as const,
    }),
    capabilities: Object.freeze([...capabilities]),
  });

  const rootIntent: CoordinationRootIntent = Object.freeze({
    id: `chat-${randomUUID()}`,
    userMessage: latestText,
    allowedCapabilities: Object.freeze([...capabilities]),
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 12_000).toISOString(),
  });

  const task: AgentBlackboardTask = Object.freeze({
    id: `chat-task-${randomUUID()}`,
    title: "Respond to the authorized conversation",
    description:
      "Use only the supplied conversation history and traveler context. Return a concise, useful response. Do not claim external actions were completed.",
    requiredCapabilities: Object.freeze([...capabilities]),
    status: "claimed" as const,
    depth: 0,
    dependsOn: Object.freeze([]),
    createdBy: CHAT_AGENT.id,
    claimedBy: CHAT_AGENT.id,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });

  return Object.freeze({
    request,
    rootIntent,
    agent: CHAT_AGENT,
    task,
    messages: buildBlackboardMessages(context),
    tools: Object.freeze([]),
    requestableToolIds: Object.freeze([]),
  });
}

export class ConversationAiParticipantBridge {
  constructor(
    private readonly engine: ConversationEngine,
    private readonly worker: AgentWorker,
  ) {}

  async respond(input: ConversationAiBridgeInput): Promise<ConversationAiBridgeResult> {
    const conversationContext = await this.engine.buildAiContext({
      conversationId: input.conversationId,
      requesterParticipantId: input.requesterParticipantId,
      assistantParticipantId: input.assistantParticipantId,
      invocation: input.invocation,
      invocationMessageId: input.invocationMessageId,
      limit: input.historyLimit,
    });

    const capabilities = safeCapabilities(input.capabilities);
    const workerInput = buildWorkerInput(
      conversationContext,
      input.context,
      capabilities,
    );
    const routableWorker = this.worker as RoutableAgentWorker;
    const routeDecision = routableWorker.decide?.(workerInput) ?? null;
    const output = await this.worker.run(workerInput);

    if (output.kind === "tool_request" || output.kind === "delegate") {
      throw new Error(
        "Conversation AI participant cannot execute tools or delegate from the direct reply bridge.",
      );
    }

    const selectedModel = routeDecision?.model ?? this.worker.model ?? null;
    const message = await this.engine.appendMessage({
      conversationId: input.conversationId,
      actorParticipantId: input.assistantParticipantId,
      parts: Object.freeze([
        Object.freeze({ type: "text" as const, text: output.summary }),
      ]),
      aiRun: Object.freeze({
        runId: workerInput.rootIntent.id,
        ...(routeDecision?.provider ? { provider: routeDecision.provider } : {}),
        ...(selectedModel ? { model: selectedModel } : {}),
        routeClass: routeDecision?.signals.complexity ?? "conversation-participant",
      }),
    });

    return Object.freeze({
      messageId: message.id,
      workerId: routeDecision?.workerId ?? this.worker.id,
      provider: routeDecision?.provider ?? null,
      model: selectedModel,
      confidence: output.confidence,
    });
  }
}
