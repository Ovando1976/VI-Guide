import type {
  Conversation,
  ConversationMessage,
  ConversationMessagePart,
  ConversationParticipant,
} from "@/types/conversation";

export type ConversationPolicyErrorCode =
  | "conversation_not_found"
  | "participant_not_found"
  | "participant_inactive"
  | "read_denied"
  | "write_denied"
  | "impersonation_denied"
  | "message_not_found"
  | "message_edit_denied"
  | "message_delete_denied"
  | "invalid_conversation"
  | "invalid_message"
  | "ai_disabled"
  | "ai_invocation_denied"
  | "assistant_not_found"
  | "assistant_invalid";

export class ConversationPolicyError extends Error {
  readonly code: ConversationPolicyErrorCode;

  constructor(code: ConversationPolicyErrorCode, message: string) {
    super(message);
    this.name = "ConversationPolicyError";
    this.code = code;
  }
}

export function isActiveParticipant(participant: ConversationParticipant) {
  return !participant.leftAt;
}

export function assertCanRead(participant: ConversationParticipant) {
  if (!isActiveParticipant(participant)) {
    throw new ConversationPolicyError(
      "participant_inactive",
      "Conversation participant is no longer active.",
    );
  }
  if (!participant.canRead) {
    throw new ConversationPolicyError(
      "read_denied",
      "Conversation read access is denied.",
    );
  }
}

export function assertCanWrite(participant: ConversationParticipant) {
  assertCanRead(participant);
  if (!participant.canWrite) {
    throw new ConversationPolicyError(
      "write_denied",
      "Conversation write access is denied.",
    );
  }
}

export function assertCanInvokeAi(participant: ConversationParticipant) {
  assertCanRead(participant);
  if (!participant.canInvokeAi) {
    throw new ConversationPolicyError(
      "ai_invocation_denied",
      "This participant cannot invoke AI in the conversation.",
    );
  }
}

export function assertConversationShape(
  conversation: Conversation,
  participants: readonly ConversationParticipant[],
) {
  if (!conversation.id.trim()) {
    throw new ConversationPolicyError(
      "invalid_conversation",
      "Conversation id is required.",
    );
  }
  if (!participants.length) {
    throw new ConversationPolicyError(
      "invalid_conversation",
      "A conversation requires at least one participant.",
    );
  }

  const participantIds = new Set<string>();
  for (const participant of participants) {
    if (participant.conversationId !== conversation.id) {
      throw new ConversationPolicyError(
        "invalid_conversation",
        "All participants must belong to the same conversation.",
      );
    }
    if (participantIds.has(participant.id)) {
      throw new ConversationPolicyError(
        "invalid_conversation",
        "Conversation participant ids must be unique.",
      );
    }
    participantIds.add(participant.id);
  }

  const creator = participants.find(
    (participant) => participant.id === conversation.createdByParticipantId,
  );
  if (!creator || creator.role !== "owner" || !isActiveParticipant(creator)) {
    throw new ConversationPolicyError(
      "invalid_conversation",
      "Conversation creator must be an active owner participant.",
    );
  }

  if (conversation.kind === "direct") {
    const activeHumans = participants.filter(
      (participant) =>
        isActiveParticipant(participant) && participant.actorType === "human",
    );
    if (activeHumans.length !== 2) {
      throw new ConversationPolicyError(
        "invalid_conversation",
        "Direct conversations require exactly two active human participants.",
      );
    }
  }

  const assistantIds = new Set(conversation.ai.assistantParticipantIds);
  if (assistantIds.size !== conversation.ai.assistantParticipantIds.length) {
    throw new ConversationPolicyError(
      "invalid_conversation",
      "AI assistant participant ids must be unique.",
    );
  }
  for (const assistantId of assistantIds) {
    const assistant = participants.find(
      (participant) => participant.id === assistantId,
    );
    if (
      !assistant ||
      !isActiveParticipant(assistant) ||
      assistant.actorType !== "ai" ||
      assistant.role !== "assistant"
    ) {
      throw new ConversationPolicyError(
        "invalid_conversation",
        "Configured AI assistants must be active AI assistant participants.",
      );
    }
  }
}

export function assertMessageParts(parts: readonly ConversationMessagePart[]) {
  if (!parts.length) {
    throw new ConversationPolicyError(
      "invalid_message",
      "Conversation messages require at least one part.",
    );
  }
  if (parts.length > 20) {
    throw new ConversationPolicyError(
      "invalid_message",
      "Conversation messages may contain at most 20 parts.",
    );
  }

  for (const part of parts) {
    if (part.type === "text" && !part.text.trim()) {
      throw new ConversationPolicyError(
        "invalid_message",
        "Text message parts cannot be empty.",
      );
    }
    if (part.type === "system" && !part.text.trim()) {
      throw new ConversationPolicyError(
        "invalid_message",
        "System message parts cannot be empty.",
      );
    }
  }
}

export function assertCanEditMessage(
  actor: ConversationParticipant,
  message: ConversationMessage,
) {
  assertCanWrite(actor);
  if (message.deletedAt) {
    throw new ConversationPolicyError(
      "message_edit_denied",
      "Deleted messages cannot be edited.",
    );
  }
  if (message.senderParticipantId !== actor.id) {
    throw new ConversationPolicyError(
      "message_edit_denied",
      "Participants may edit only their own messages.",
    );
  }
  if (message.parts.some((part) => part.type === "system")) {
    throw new ConversationPolicyError(
      "message_edit_denied",
      "System messages cannot be edited through the participant API.",
    );
  }
}

export function assertCanDeleteMessage(
  actor: ConversationParticipant,
  message: ConversationMessage,
) {
  assertCanWrite(actor);
  if (message.senderParticipantId === actor.id) return;
  if (actor.role === "owner" || actor.role === "admin") return;
  throw new ConversationPolicyError(
    "message_delete_denied",
    "Only the sender or a conversation moderator can remove this message.",
  );
}
