import type {
  DocumentData,
  Firestore,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase-admin";
import type {
  ConversationStore,
  ConversationMessageListOptions,
} from "@/lib/conversations/conversation-store";
import type {
  Conversation,
  ConversationArtifact,
  ConversationMessage,
  ConversationParticipant,
} from "@/types/conversation";

const ROOT_COLLECTION = "conversations";

function assertDocumentObject<T>(
  snapshot: QueryDocumentSnapshot<DocumentData> | { exists: boolean; data(): DocumentData | undefined },
  label: string,
): T | null {
  if (!snapshot.exists) return null;
  const value = snapshot.data();
  if (!value || typeof value !== "object") {
    throw new Error(`Stored ${label} document is invalid.`);
  }
  return value as T;
}

function boundedLimit(limit?: number) {
  return Math.max(1, Math.min(limit ?? 50, 100));
}

export class FirestoreConversationStore implements ConversationStore {
  private readonly db: Firestore;

  constructor(db: Firestore = getAdminDb()) {
    this.db = db;
  }

  private conversationRef(id: string) {
    return this.db.collection(ROOT_COLLECTION).doc(id);
  }

  private participants(conversationId: string) {
    return this.conversationRef(conversationId).collection("participants");
  }

  private messages(conversationId: string) {
    return this.conversationRef(conversationId).collection("messages");
  }

  private artifacts(conversationId: string) {
    return this.conversationRef(conversationId).collection("artifacts");
  }

  async getConversation(id: string): Promise<Conversation | null> {
    const snapshot = await this.conversationRef(id).get();
    return assertDocumentObject<Conversation>(snapshot, "conversation");
  }

  async putConversation(conversation: Conversation): Promise<void> {
    await this.conversationRef(conversation.id).set(conversation, { merge: false });
  }

  async commitMessage(
    message: ConversationMessage,
    conversation: Conversation,
  ): Promise<void> {
    const conversationRef = this.conversationRef(conversation.id);
    const messageRef = this.messages(conversation.id).doc(message.id);

    await this.db.runTransaction(async (transaction) => {
      const [conversationSnapshot, messageSnapshot] = await Promise.all([
        transaction.get(conversationRef),
        transaction.get(messageRef),
      ]);

      if (!conversationSnapshot.exists) {
        throw new Error("Conversation disappeared before message commit.");
      }

      if (messageSnapshot.exists) {
        const stored = assertDocumentObject<ConversationMessage>(
          messageSnapshot,
          "conversation message",
        );
        if (JSON.stringify(stored) === JSON.stringify(message)) {
          return;
        }
        throw new Error("Conversation message id already exists with different content.");
      }

      transaction.create(messageRef, message);
      transaction.set(conversationRef, conversation, { merge: false });
    });
  }

  async getParticipant(
    conversationId: string,
    participantId: string,
  ): Promise<ConversationParticipant | null> {
    const snapshot = await this.participants(conversationId).doc(participantId).get();
    return assertDocumentObject<ConversationParticipant>(snapshot, "conversation participant");
  }

  async listParticipants(
    conversationId: string,
  ): Promise<readonly ConversationParticipant[]> {
    const snapshot = await this.participants(conversationId).orderBy("joinedAt", "asc").get();
    return Object.freeze(
      snapshot.docs.map((doc) => {
        const value = assertDocumentObject<ConversationParticipant>(
          doc,
          "conversation participant",
        );
        if (!value) throw new Error("Conversation participant snapshot disappeared.");
        return Object.freeze(value);
      }),
    );
  }

  async putParticipant(participant: ConversationParticipant): Promise<void> {
    await this.participants(participant.conversationId)
      .doc(participant.id)
      .set(participant, { merge: false });
  }

  async getMessage(
    conversationId: string,
    messageId: string,
  ): Promise<ConversationMessage | null> {
    const snapshot = await this.messages(conversationId).doc(messageId).get();
    return assertDocumentObject<ConversationMessage>(snapshot, "conversation message");
  }

  async listMessages(
    conversationId: string,
    options: ConversationMessageListOptions = {},
  ): Promise<readonly ConversationMessage[]> {
    let query = this.messages(conversationId)
      .orderBy("createdAt", "desc")
      .limit(boundedLimit(options.limit));

    if (options.before) {
      const cursor = await this.messages(conversationId).doc(options.before).get();
      if (cursor.exists) query = query.startAfter(cursor);
    }

    const snapshot = await query.get();
    return Object.freeze(
      snapshot.docs
        .map((doc) => {
          const value = assertDocumentObject<ConversationMessage>(
            doc,
            "conversation message",
          );
          if (!value) throw new Error("Conversation message snapshot disappeared.");
          return Object.freeze(value);
        })
        .reverse(),
    );
  }

  async putMessage(message: ConversationMessage): Promise<void> {
    await this.messages(message.conversationId)
      .doc(message.id)
      .set(message, { merge: false });
  }

  async getArtifact(
    conversationId: string,
    artifactId: string,
  ): Promise<ConversationArtifact | null> {
    const snapshot = await this.artifacts(conversationId).doc(artifactId).get();
    return assertDocumentObject<ConversationArtifact>(snapshot, "conversation artifact");
  }

  async listArtifacts(
    conversationId: string,
  ): Promise<readonly ConversationArtifact[]> {
    const snapshot = await this.artifacts(conversationId).orderBy("createdAt", "asc").get();
    return Object.freeze(
      snapshot.docs.map((doc) => {
        const value = assertDocumentObject<ConversationArtifact>(
          doc,
          "conversation artifact",
        );
        if (!value) throw new Error("Conversation artifact snapshot disappeared.");
        return Object.freeze(value);
      }),
    );
  }

  async putArtifact(artifact: ConversationArtifact): Promise<void> {
    await this.artifacts(artifact.conversationId)
      .doc(artifact.id)
      .set(artifact, { merge: false });
  }
}
