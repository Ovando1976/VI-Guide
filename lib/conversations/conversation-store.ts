import type {
  Conversation,
  ConversationArtifact,
  ConversationMessage,
  ConversationParticipant,
} from "@/types/conversation";

export type ConversationMessageListOptions = Readonly<{
  limit?: number;
  /** Message id cursor. Returns messages strictly before that message. */
  before?: string;
}>;

export interface ConversationStore {
  getConversation(id: string): Promise<Conversation | null>;
  putConversation(conversation: Conversation): Promise<void>;

  getParticipant(
    conversationId: string,
    participantId: string,
  ): Promise<ConversationParticipant | null>;
  listParticipants(conversationId: string): Promise<readonly ConversationParticipant[]>;
  putParticipant(participant: ConversationParticipant): Promise<void>;

  getMessage(
    conversationId: string,
    messageId: string,
  ): Promise<ConversationMessage | null>;
  listMessages(
    conversationId: string,
    options?: ConversationMessageListOptions,
  ): Promise<readonly ConversationMessage[]>;
  putMessage(message: ConversationMessage): Promise<void>;
  commitMessage(
    message: ConversationMessage,
    conversation: Conversation,
  ): Promise<void>;

  getArtifact(
    conversationId: string,
    artifactId: string,
  ): Promise<ConversationArtifact | null>;
  listArtifacts(conversationId: string): Promise<readonly ConversationArtifact[]>;
  putArtifact(artifact: ConversationArtifact): Promise<void>;
}
