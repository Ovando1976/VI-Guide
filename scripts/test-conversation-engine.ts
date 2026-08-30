import assert from "node:assert/strict";

import { ConversationEngine } from "../lib/conversations/conversation-engine";
import { InMemoryConversationStore } from "../lib/conversations/in-memory-conversation-store";
import {
  ConversationPolicyError,
  type ConversationPolicyErrorCode,
} from "../lib/conversations/conversation-policy";

function deterministicIds() {
  let value = 0;
  return () => `generated-${++value}`;
}

function deterministicNow() {
  let value = 0;
  return () => `2026-08-29T16:${String(value++).padStart(2, "0")}:00.000Z`;
}

async function rejectsWithCode(
  operation: () => Promise<unknown>,
  code: ConversationPolicyErrorCode,
) {
  await assert.rejects(operation, (error: unknown) => {
    return error instanceof ConversationPolicyError && error.code === code;
  });
}

async function runConversationEngineTests() {
  const store = new InMemoryConversationStore();
  const engine = new ConversationEngine(store, {
    createId: deterministicIds(),
    now: deterministicNow(),
  });

  const direct = await engine.createConversation({
    id: "direct-1",
    kind: "direct",
    createdByParticipantId: "human-a",
    aiAccess: "mention",
    participants: [
      {
        id: "human-a",
        actorType: "human",
        actorId: "firebase-user-secret-a",
        canInvokeAi: true,
      },
      {
        id: "human-b",
        actorType: "human",
        actorId: "firebase-user-secret-b",
        role: "admin",
        canInvokeAi: true,
      },
      {
        id: "island-ai",
        actorType: "ai",
        actorId: "island-ai-runtime",
        role: "assistant",
        canInvokeAi: false,
      },
    ],
  });

  assert.equal(direct.ai.access, "mention");
  assert.deepEqual(direct.ai.assistantParticipantIds, ["island-ai"]);

  await rejectsWithCode(
    () =>
      engine.createConversation({
        id: "invalid-direct",
        kind: "direct",
        createdByParticipantId: "a",
        participants: [
          { id: "a", actorType: "human", actorId: "a" },
          { id: "b", actorType: "human", actorId: "b" },
          { id: "c", actorType: "human", actorId: "c" },
        ],
      }),
    "invalid_conversation",
  );

  const invocation = await engine.appendMessage({
    conversationId: direct.id,
    actorParticipantId: "human-a",
    id: "message-1",
    parts: [{ type: "text", text: "@IslandAI help us plan Saturday." }],
    mentions: ["island-ai"],
  });

  await rejectsWithCode(
    () =>
      engine.appendMessage({
        conversationId: direct.id,
        actorParticipantId: "human-a",
        senderParticipantId: "island-ai",
        parts: [{ type: "text", text: "Pretend this came from AI." }],
      }),
    "impersonation_denied",
  );

  await rejectsWithCode(
    () =>
      engine.appendMessage({
        conversationId: direct.id,
        actorParticipantId: "human-a",
        parts: [
          {
            type: "system",
            event: "other",
            text: "Pretend this is a system event.",
          },
        ],
      }),
    "impersonation_denied",
  );

  const aiReply = await engine.appendMessage({
    conversationId: direct.id,
    actorParticipantId: "island-ai",
    id: "message-2",
    parts: [{ type: "text", text: "I can help with that plan." }],
    aiRun: {
      runId: "private-provider-run-123",
      provider: "gpt-oss",
      model: "gpt-oss-20b",
      routeClass: "private",
    },
  });
  assert.equal(aiReply.aiRun?.provider, "gpt-oss");

  const followUp = await engine.appendMessage({
    conversationId: direct.id,
    actorParticipantId: "human-b",
    id: "message-3",
    parts: [{ type: "text", text: "Keep the beach part relaxed." }],
  });

  await rejectsWithCode(
    () =>
      engine.editMessage({
        conversationId: direct.id,
        actorParticipantId: "human-a",
        messageId: followUp.id,
        parts: [{ type: "text", text: "I should not be able to edit this." }],
      }),
    "message_edit_denied",
  );

  const edited = await engine.editMessage({
    conversationId: direct.id,
    actorParticipantId: "human-b",
    messageId: followUp.id,
    parts: [{ type: "text", text: "Keep the beach part very relaxed." }],
  });
  assert.ok(edited.editedAt);

  const deleted = await engine.deleteMessage({
    conversationId: direct.id,
    actorParticipantId: "human-b",
    messageId: invocation.id,
  });
  assert.ok(deleted.deletedAt);
  assert.equal(deleted.deletedByParticipantId, "human-b");
  assert.equal(deleted.aiRun, undefined);

  await rejectsWithCode(
    () =>
      engine.buildAiContext({
        conversationId: direct.id,
        requesterParticipantId: "human-b",
        assistantParticipantId: "island-ai",
        invocation: "active",
      }),
    "ai_invocation_denied",
  );

  const mention2 = await engine.appendMessage({
    conversationId: direct.id,
    actorParticipantId: "human-b",
    id: "message-4",
    parts: [{ type: "text", text: "@IslandAI summarize the plan so far." }],
    mentions: ["island-ai"],
  });

  const aiContext = await engine.buildAiContext({
    conversationId: direct.id,
    requesterParticipantId: "human-b",
    assistantParticipantId: "island-ai",
    invocation: "mention",
    invocationMessageId: mention2.id,
  });

  assert.equal(aiContext.invocation, "mention");
  assert.equal(
    aiContext.messages.some((message) => message.messageId === invocation.id),
    false,
    "Deleted messages must not enter AI context.",
  );
  assert.equal(
    aiContext.messages.some((message) => message.messageId === aiReply.id),
    true,
  );
  const serializedAiContext = JSON.stringify(aiContext);
  assert.equal(serializedAiContext.includes("firebase-user-secret-a"), false);
  assert.equal(serializedAiContext.includes("firebase-user-secret-b"), false);
  assert.equal(serializedAiContext.includes("private-provider-run-123"), false);
  assert.equal(serializedAiContext.includes("gpt-oss-20b"), false);

  await rejectsWithCode(
    () =>
      engine.buildAiContext({
        conversationId: direct.id,
        requesterParticipantId: "human-b",
        assistantParticipantId: "island-ai",
        invocation: "mention",
        invocationMessageId: followUp.id,
      }),
    "ai_invocation_denied",
  );

  const artifact = await engine.createArtifact({
    conversationId: direct.id,
    actorParticipantId: "human-a",
    id: "artifact-1",
    type: "document",
    title: "Saturday plan",
    referenceId: "shared-doc-1",
  });
  assert.equal(engine.artifactPart(artifact).artifactId, artifact.id);

  await engine.appendMessage({
    conversationId: direct.id,
    actorParticipantId: "human-a",
    id: "message-5",
    parts: [engine.artifactPart(artifact)],
  });

  const aiOff = await engine.createConversation({
    id: "ai-off-group",
    kind: "group",
    createdByParticipantId: "owner",
    participants: [
      { id: "owner", actorType: "human", actorId: "owner-external" },
      { id: "member-1", actorType: "human", actorId: "member-external" },
      {
        id: "ai-off-assistant",
        actorType: "ai",
        actorId: "assistant-runtime",
        role: "assistant",
      },
    ],
  });
  assert.equal(aiOff.ai.access, "off");

  await rejectsWithCode(
    () =>
      engine.buildAiContext({
        conversationId: aiOff.id,
        requesterParticipantId: "owner",
        assistantParticipantId: "ai-off-assistant",
        invocation: "active",
      }),
    "ai_disabled",
  );

  const activeGroup = await engine.createConversation({
    id: "active-group",
    kind: "group",
    createdByParticipantId: "group-owner",
    aiAccess: "active",
    participants: [
      { id: "group-owner", actorType: "human", actorId: "external-owner" },
      { id: "group-member-a", actorType: "human", actorId: "external-a" },
      { id: "group-member-b", actorType: "human", actorId: "external-b" },
      {
        id: "active-ai",
        actorType: "ai",
        actorId: "active-ai-runtime",
        role: "assistant",
      },
    ],
  });
  assert.equal(activeGroup.kind, "group");

  await engine.appendMessage({
    conversationId: activeGroup.id,
    actorParticipantId: "group-owner",
    id: "group-message-1",
    parts: [{ type: "text", text: "Plan our community meetup." }],
  });
  const activeContext = await engine.buildAiContext({
    conversationId: activeGroup.id,
    requesterParticipantId: "group-owner",
    assistantParticipantId: "active-ai",
    invocation: "active",
  });
  assert.equal(activeContext.messages.length, 1);

  const readOnlyGroup = await engine.createConversation({
    id: "read-only-group",
    kind: "group",
    createdByParticipantId: "read-owner",
    participants: [
      { id: "read-owner", actorType: "human", actorId: "read-owner-external" },
      {
        id: "read-member",
        actorType: "human",
        actorId: "read-member-external",
        canWrite: false,
      },
    ],
  });

  await rejectsWithCode(
    () =>
      engine.appendMessage({
        conversationId: readOnlyGroup.id,
        actorParticipantId: "read-member",
        parts: [{ type: "text", text: "This write must be denied." }],
      }),
    "write_denied",
  );

  console.log(
    "Unified conversation engine tests passed: direct/group shape, impersonation protection, write policy, edits, moderator deletion, AI opt-in/mentions, context minimization, and shared artifacts.",
  );
}

void runConversationEngineTests().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
