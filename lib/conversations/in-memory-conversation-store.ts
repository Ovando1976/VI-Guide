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
    const limit = Math.max(1, Math.min(options.limit ?? 50, 200));
    return Array.from(this.messages.values())
      .filter(
        (message) =>
          message.conversationId === conversationId &&
          (!options.before || message.createdAt < options.before),
      )
      .sort((a, b) => {
        const byTime = a.createdAt.localeCompare(b.createdAt);
        return byTime || a.id.localeCompare(b.id);
      })
      .slice(-limit);
  }

  async putMessage(message: ConversationMessage) {
    this.messages.set(key(message.conversationId, message.id), message);
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
