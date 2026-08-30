import type {
  Conversation,
  ConversationArtifact,
  ConversationMessage,
  ConversationParticipant,
} from "@/types/conversation";
import type {
  ConversationMessageListOptions,
  ConversationStore,
} from "@/lib/conversations/conversation-store";

function key(conversationId: string, id: string) {
  return `${conversationId}:${id}`;
}

function compareMessages(a: ConversationMessage, b: ConversationMessage) {
  const byTime = a.createdAt.localeCompare(b.createdAt);
  return byTime || a.id.localeCompare(b.id);
}

export class InMemoryConversationStore implements ConversationStore {
  private readonly conversations = new Map<string, Conversation>();
  private readonly participants = new Map<string, ConversationParticipant>();
  private readonly messages = new Map<string, ConversationMessage>();
  private readonly artifacts = new Map<string, ConversationArtifact>();

  async getConversation(id: string) {
    return this.conversations.get(id) ?? null;
  }

  async putConversation(conversation: Conversation) {
    this.conversations.set(conversation.id, conversation);
  }

  async getParticipant(conversationId: string, participantId: string) {
    return this.participants.get(key(conversationId, participantId)) ?? null;
  }

  async listParticipants(conversationId: string) {
    return Array.from(this.participants.values())
      .filter((participant) => participant.conversationId === conversationId)
      .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
  }

  async putParticipant(participant: ConversationParticipant) {
    this.participants.set(
      key(participant.conversationId, participant.id),
      participant,
    );
  }

  async getMessage(conversationId: string, messageId: string) {
    return this.messages.get(key(conversationId, messageId)) ?? null;
  }

  async listMessages(
    conversationId: string,
    options: ConversationMessageListOptions = {},
  ) {
    const limit = Math.max(1, Math.min(options.limit ?? 50, 100));
    const sorted = Array.from(this.messages.values())
      .filter((message) => message.conversationId === conversationId)
      .sort(compareMessages);

    let end = sorted.length;
    if (options.before) {
      const cursorIndex = sorted.findIndex((message) => message.id === options.before);
      if (cursorIndex >= 0) end = cursorIndex;
    }

    return sorted.slice(Math.max(0, end - limit), end);
  }

  async putMessage(message: ConversationMessage) {
    this.messages.set(key(message.conversationId, message.id), message);
  }

  async commitMessage(message: ConversationMessage, conversation: Conversation) {
    const messageKey = key(message.conversationId, message.id);
    const existing = this.messages.get(messageKey);
    if (existing) {
      if (JSON.stringify(existing) === JSON.stringify(message)) return;
      throw new Error("Conversation message id already exists with different content.");
    }

    const currentConversation = this.conversations.get(conversation.id);
    if (!currentConversation) {
      throw new Error("Conversation disappeared before message commit.");
    }

    this.messages.set(messageKey, message);

    const currentLast = currentConversation.lastMessage
      ? this.messages.get(
          key(currentConversation.id, currentConversation.lastMessage.id),
        )
      : null;
    const shouldAdvance = !currentLast || compareMessages(currentLast, message) <= 0;

    this.conversations.set(
      conversation.id,
      shouldAdvance
        ? conversation
        : Object.freeze({
            ...conversation,
            updatedAt: currentConversation.updatedAt,
            lastMessage: currentConversation.lastMessage,
          }),
    );
  }

  async getArtifact(conversationId: string, artifactId: string) {
    return this.artifacts.get(key(conversationId, artifactId)) ?? null;
  }

  async listArtifacts(conversationId: string) {
    return Array.from(this.artifacts.values())
      .filter((artifact) => artifact.conversationId === conversationId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async putArtifact(artifact: ConversationArtifact) {
    this.artifacts.set(key(artifact.conversationId, artifact.id), artifact);
  }
}
