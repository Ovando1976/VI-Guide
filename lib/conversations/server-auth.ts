import type { NextRequest } from "next/server";

import type { ConversationStore } from "@/lib/conversations/conversation-store";
import {
  assertCanRead,
  isActiveParticipant,
  ConversationPolicyError,
} from "@/lib/conversations/conversation-policy";
import { bearerTokenFromAuthorization } from "@/lib/intelligence/identity";
import {
  getAdminAuth,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import type { ConversationParticipant } from "@/types/conversation";

export class ConversationAuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConversationAuthenticationError";
  }
}

export async function verifiedConversationUserId(request: NextRequest) {
  const token = bearerTokenFromAuthorization(request.headers.get("authorization"));
  if (!token) {
    throw new ConversationAuthenticationError("Authentication is required.");
  }
  if (!hasFirebaseAdminConfiguration()) {
    throw new ConversationAuthenticationError(
      "Authenticated conversations are not configured.",
    );
  }

  try {
    return (await getAdminAuth().verifyIdToken(token)).uid;
  } catch {
    throw new ConversationAuthenticationError("Invalid user session.");
  }
}

export async function bindConversationParticipant(
  store: ConversationStore,
  conversationId: string,
  userId: string,
): Promise<ConversationParticipant> {
  const conversation = await store.getConversation(conversationId);
  if (!conversation) {
    throw new ConversationPolicyError(
      "conversation_not_found",
      "Conversation was not found.",
    );
  }

  const participants = await store.listParticipants(conversationId);
  const participant = participants.find(
    (candidate) =>
      candidate.actorType === "human" &&
      candidate.actorId === userId &&
      isActiveParticipant(candidate),
  );

  if (!participant) {
    throw new ConversationPolicyError(
      "participant_not_found",
      "The authenticated user is not an active participant in this conversation.",
    );
  }

  assertCanRead(participant);
  return participant;
}
