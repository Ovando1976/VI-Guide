import assert from "node:assert/strict";

import { ConversationAiParticipantBridge } from "@/lib/conversations/conversation-ai-bridge";
import { ConversationEngine } from "@/lib/conversations/conversation-engine";
import { InMemoryConversationStore } from "@/lib/conversations/in-memory-conversation-store";
import { ConversationPolicyError } from "@/lib/conversations/conversation-policy";
import type {
  AgentWorker,
  AgentWorkerInput,
  AgentWorkerOutput,
} from "@/lib/intelligence/agent-worker";
import type { IntelligenceContext } from "@/types/intelligence";

class FakeWorker implements AgentWorker {
  readonly id = "fake-router";
  readonly model = "fake-model";
  lastInput: AgentWorkerInput | null = null;

  constructor(private readonly output: AgentWorkerOutput) {}

  async run(input: AgentWorkerInput) {
    this.lastInput = input;
    return this.output;
  }
}

function travelerContext(): IntelligenceContext {
  return {
    sessionId: "client_session_12345678",
    userId: "private-account-id",
    page: "community",
    island: "stt",
    now: "2026-08-29T16:00:00.000Z",
    timezone: "America/St_Thomas",
    party: { adults: 1, children: 0, accessibilityNeeds: [] },
    preferences: {
      interests: ["beaches"],
      pace: "balanced",
      budget: "moderate",
      food: [],
      avoid: [],
    },
    memory: {},
  };
}

async function main() {
  let id = 0;
  let second = 0;
  const store = new InMemoryConversationStore();
  const engine = new ConversationEngine(store, {
    createId: () => `generated-${++id}`,
    now: () => `2026-08-29T16:00:${String(second++).padStart(2, "0")}.000Z`,
  });

  await engine.createConversation({
    id: "conversation-1",
    kind: "direct",
    aiAccess: "mention",
    createdByParticipantId: "human-1",
    participants: [
      { id: "human-1", actorType: "human", actorId: "account-secret-1" },
      { id: "human-2", actorType: "human", actorId: "account-secret-2" },
      {
        id: "assistant-1",
        actorType: "ai",
        actorId: "island-assistant",
        role: "assistant",
        canInvokeAi: false,
      },
    ],
  });

  const trigger = await engine.appendMessage({
    conversationId: "conversation-1",
    actorParticipantId: "human-1",
    mentions: ["assistant-1"],
    parts: [
      {
        type: "text",
        text: "@IslandAI suggest a calm beach for this afternoon.",
      },
    ],
  });

  const worker = new FakeWorker({
    kind: "result",
    summary: "Try a calm-water beach and confirm current sea conditions before heading out.",
    confidence: "medium",
    requestedCapabilities: [],
    toolRequest: null,
  });
  const bridge = new ConversationAiParticipantBridge(engine, worker);

  const result = await bridge.respond({
    conversationId: "conversation-1",
    requesterParticipantId: "human-1",
    assistantParticipantId: "assistant-1",
    invocation: "mention",
    invocationMessageId: trigger.id,
    context: travelerContext(),
    capabilities: ["recommend", "knowledge"],
  });

  assert.equal(result.workerId, "fake-router");
  assert.equal(result.model, "fake-model");
  assert.ok(worker.lastInput);
  assert.equal(worker.lastInput.request.context.userId, undefined);
  assert.notEqual(worker.lastInput.request.context.sessionId, "client_session_12345678");
  assert.equal(worker.lastInput.request.message.includes("account-secret"), false);
  assert.equal(JSON.stringify(worker.lastInput).includes("account-secret-1"), false);
  assert.equal(JSON.stringify(worker.lastInput).includes("account-secret-2"), false);
  assert.deepEqual(worker.lastInput.rootIntent.allowedCapabilities, [
    "recommend",
    "knowledge",
  ]);

  const messages = await store.listMessages("conversation-1");
  const assistantMessage = messages.find((message) => message.id === result.messageId);
  assert.equal(assistantMessage?.senderParticipantId, "assistant-1");
  assert.equal(assistantMessage?.aiRun?.model, "fake-model");
  assert.equal(assistantMessage?.parts[0]?.type, "text");

  await engine.createConversation({
    id: "conversation-2",
    kind: "direct",
    aiAccess: "off",
    createdByParticipantId: "h1",
    participants: [
      { id: "h1", actorType: "human", actorId: "account-a" },
      { id: "h2", actorType: "human", actorId: "account-b" },
      {
        id: "a1",
        actorType: "ai",
        actorId: "island-assistant",
        role: "assistant",
        canInvokeAi: false,
      },
    ],
  });
  const offMessage = await engine.appendMessage({
    conversationId: "conversation-2",
    actorParticipantId: "h1",
    parts: [{ type: "text", text: "Please answer this." }],
  });

  await assert.rejects(
    () =>
      bridge.respond({
        conversationId: "conversation-2",
        requesterParticipantId: "h1",
        assistantParticipantId: "a1",
        invocation: "mention",
        invocationMessageId: offMessage.id,
        context: travelerContext(),
      }),
    (error: unknown) =>
      error instanceof ConversationPolicyError && error.code === "ai_disabled",
  );

  const toolWorker = new FakeWorker({
    kind: "tool_request",
    summary: "Need evidence.",
    confidence: "low",
    requestedCapabilities: [],
    toolRequest: { toolId: "directory-search", query: "calm beaches" },
  });
  const toolBridge = new ConversationAiParticipantBridge(engine, toolWorker);
  await assert.rejects(
    () =>
      toolBridge.respond({
        conversationId: "conversation-1",
        requesterParticipantId: "human-1",
        assistantParticipantId: "assistant-1",
        invocation: "mention",
        invocationMessageId: trigger.id,
        context: travelerContext(),
      }),
    /cannot execute tools or delegate/i,
  );

  console.log(
    "Conversation AI bridge tests passed: authorization, identity minimization, self-authored AI replies, bounded capabilities, and no direct tool execution.",
  );
}

void main();
