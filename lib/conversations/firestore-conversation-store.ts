import {
  FieldPath,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
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
  snapshot:
    | QueryDocumentSnapshot<DocumentData>
    | { exists: boolean; data(): DocumentData | undefined },
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

function messageKey(conversationId: string, messageId: string) {
  return `${conversationId}:${messageId}`;
}

function compareLastMessage(
  left: Conversation["lastMessage"],
  right: Conversation["lastMessage"],
) {
  if (!left && !right) return 0;
  if (!left) return -1;
  if (!right) return 1;
  const byTime = left.createdAt.localeCompare(right.createdAt);
  return byTime || left.id.localeCompare(right.id);
}

export class FirestoreConversationStore implements ConversationStore {
  private readonly db: Firestore;
  private readonly pendingNewMessages = new Map<string, ConversationMessage>();

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
    const pendingId = conversation.lastMessage?.id;
    const pending = pendingId
      ? this.pendingNewMessages.get(messageKey(conversation.id, pendingId))
      : undefined;

    if (pending) {
      await this.commitMessage(pending, conversation);
      this.pendingNewMessages.delete(messageKey(conversation.id, pending.id));
      return;
    }

    const conversationRef = this.conversationRef(conversation.id);
    await this.db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(conversationRef);
      if (!snapshot.exists) {
        transaction.create(conversationRef, conversation);
        return;
      }

      const stored = assertDocumentObject<Conversation>(snapshot, "conversation");
      if (!stored) throw new Error("Conversation snapshot disappeared.");

      const incomingIsOlder =
        compareLastMessage(conversation.lastMessage, stored.lastMessage) < 0;
      transaction.set(
        conversationRef,
        incomingIsOlder
          ? {
              ...conversation,
              updatedAt:
                stored.updatedAt.localeCompare(conversation.updatedAt) > 0
                  ? stored.updatedAt
                  : conversation.updatedAt,
              lastMessage: stored.lastMessage,
            }
          : conversation,
        { merge: false },
      );
    });
  }

  async commitMessage(
    message: ConversationMessage,
    conversation: Conversation,
  ): Promise<void> {
    const conversationRef = this.conversationRef(conversation.id);
    const messageRef = this.messages(conversation.id).doc(message.id);

    await this.db.runTransaction(async (transaction) => {
      const conversationSnapshot = await transaction.get(conversationRef);
      if (!conversationSnapshot.exists) {
        throw new Error("Conversation disappeared before message commit.");
      }

      const currentConversation = assertDocumentObject<Conversation>(
        conversationSnapshot,
        "conversation",
      );
      if (!currentConversation) {
        throw new Error("Conversation snapshot disappeared.");
      }

      const messageSnapshot = await transaction.get(messageRef);
      if (messageSnapshot.exists) {
        const stored = assertDocumentObject<ConversationMessage>(
          messageSnapshot,
          "conversation message",
        );
        if (JSON.stringify(stored) !== JSON.stringify(message)) {
          throw new Error(
            "Conversation message id already exists with different content.",
          );
        }
      } else {
        transaction.create(messageRef, message);
      }

      const incomingLast = conversation.lastMessage;
      const shouldAdvance =
        Boolean(incomingLast) &&
        compareLastMessage(incomingLast, currentConversation.lastMessage) >= 0;

      if (shouldAdvance && incomingLast) {
        transaction.set(
          conversationRef,
          {
            updatedAt:
              currentConversation.updatedAt.localeCompare(conversation.updatedAt) > 0
                ? currentConversation.updatedAt
                : conversation.updatedAt,
            lastMessage: incomingLast,
          },
          { merge: true },
        );
      }
    });
  }

  async getParticipant(
    conversationId: string,
    participantId: string,
  ): Promise<ConversationParticipant | null> {
    const snapshot = await this.participants(conversationId).doc(participantId).get();
    return assertDocumentObject<ConversationParticipant>(
      snapshot,
      "conversation participant",
    );
  }

  async listParticipants(
    conversationId: string,
  ): Promise<readonly ConversationParticipant[]> {
    const snapshot = await this.participants(conversationId)
      .orderBy("joinedAt", "asc")
      .get();
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
    const pending = this.pendingNewMessages.get(
      messageKey(conversationId, messageId),
    );
    if (pending) return pending;

    const snapshot = await this.messages(conversationId).doc(messageId).get();
    return assertDocumentObject<ConversationMessage>(
      snapshot,
      "conversation message",
    );
  }

  async listMessages(
    conversationId: string,
    options: ConversationMessageListOptions = {},
  ): Promise<readonly ConversationMessage[]> {
    let query = this.messages(conversationId)
      .orderBy("createdAt", "desc")
      .orderBy(FieldPath.documentId(), "desc")
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
    const ref = this.messages(message.conversationId).doc(message.id);
    const snapshot = await ref.get();

    if (snapshot.exists) {
      await ref.set(message, { merge: false });
      return;
    }

    const key = messageKey(message.conversationId, message.id);
    const pending = this.pendingNewMessages.get(key);
    if (pending && JSON.stringify(pending) !== JSON.stringify(message)) {
      throw new Error(
        "Conversation message id is already staged with different content.",
      );
    }
    this.pendingNewMessages.set(key, message);
  }

  async getArtifact(
    conversationId: string,
    artifactId: string,
  ): Promise<ConversationArtifact | null> {
    const snapshot = await this.artifacts(conversationId).doc(artifactId).get();
    return assertDocumentObject<ConversationArtifact>(
      snapshot,
      "conversation artifact",
    );
  }

  async listArtifacts(
    conversationId: string,
  ): Promise<readonly ConversationArtifact[]> {
    const snapshot = await this.artifacts(conversationId)
      .orderBy("createdAt", "asc")
      .get();
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
