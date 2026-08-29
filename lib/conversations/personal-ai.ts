import { createHash } from "node:crypto";

import { ConversationEngine } from "@/lib/conversations/conversation-engine";
import { FirestoreConversationStore } from "@/lib/conversations/firestore-conversation-store";
import type { ConversationAiAccessMode } from "@/types/conversation";

const ASSISTANT_PARTICIPANT_ID = "island-ai";

function personalKey(userId: string) {
  return createHash("sha256")
    .update(`usvi-social-personal-ai:${userId}`)
    .digest("hex")
    .slice(0, 24);
}

export type PersonalAiConversation = Readonly<{
  conversationId: string;
  title: string;
  participantId: string;
  assistantParticipantId: string;
  aiAccess: ConversationAiAccessMode;
}>;

export async function ensurePersonalAiConversation(
  userId: string,
  store = new FirestoreConversationStore(),
): Promise<PersonalAiConversation> {
  const key = personalKey(userId);
  const conversationId = `island-ai-${key}`;
  const participantId = `member-${key}`;
  const existing = await store.getConversation(conversationId);

  if (!existing) {
    const engine = new ConversationEngine(store);
    await engine.createConversation({
      id: conversationId,
      kind: "workspace",
      title: "Island AI",
      visibility: "private",
      aiAccess: "active",
      createdByParticipantId: participantId,
      participants: [
        {
          id: participantId,
          actorType: "human",
          actorId: userId,
          role: "owner",
          canRead: true,
          canWrite: true,
          canInvokeAi: true,
        },
        {
          id: ASSISTANT_PARTICIPANT_ID,
          actorType: "ai",
          actorId: "island-ai",
          role: "assistant",
          canRead: true,
          canWrite: true,
          canInvokeAi: false,
        },
      ],
    });
  } else {
    const human = await store.getParticipant(conversationId, participantId);
    if (human && human.actorId !== userId) {
      throw new Error("Personal conversation identity mismatch.");
    }
    if (!human) {
      await store.putParticipant(
        Object.freeze({
          id: participantId,
          conversationId,
          actorType: "human" as const,
          actorId: userId,
          role: "owner" as const,
          joinedAt: existing.createdAt,
          leftAt: null,
          canRead: true,
          canWrite: true,
          canInvokeAi: true,
        }),
      );
    }

    const assistant = await store.getParticipant(
      conversationId,
      ASSISTANT_PARTICIPANT_ID,
    );
    if (!assistant) {
      await store.putParticipant(
        Object.freeze({
          id: ASSISTANT_PARTICIPANT_ID,
          conversationId,
          actorType: "ai" as const,
          actorId: "island-ai",
          role: "assistant" as const,
          joinedAt: existing.createdAt,
          leftAt: null,
          canRead: true,
          canWrite: true,
          canInvokeAi: false,
        }),
      );
    }
  }

  const conversation = await store.getConversation(conversationId);
  if (!conversation) {
    throw new Error("Personal Island AI conversation could not be provisioned.");
  }

  return Object.freeze({
    conversationId,
    title: conversation.title ?? "Island AI",
    participantId,
    assistantParticipantId: ASSISTANT_PARTICIPANT_ID,
    aiAccess: conversation.ai.access,
  });
}
