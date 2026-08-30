import assert from "node:assert/strict";
import type { Firestore } from "firebase-admin/firestore";

import { FirestoreConversationStore } from "@/lib/conversations/firestore-conversation-store";
import type { Conversation, ConversationMessage } from "@/types/conversation";

type Stored = Record<string, unknown>;

class FakeSnapshot {
  constructor(
    readonly path: string,
    private readonly records: Map<string, Stored>,
  ) {}

  get exists() {
    return this.records.has(this.path);
  }

  data() {
    return this.records.get(this.path);
  }
}

class FakeDocumentReference {
  constructor(
    readonly path: string,
    private readonly records: Map<string, Stored>,
  ) {}

  collection(name: string) {
    return new FakeCollectionReference(`${this.path}/${name}`, this.records);
  }

  async get() {
    return new FakeSnapshot(this.path, this.records);
  }

  async set(value: Stored) {
    this.records.set(this.path, structuredClone(value));
  }
}

class FakeCollectionReference {
  constructor(
    readonly path: string,
    private readonly records: Map<string, Stored>,
  ) {}

  doc(id: string) {
    return new FakeDocumentReference(`${this.path}/${id}`, this.records);
  }
}

class FakeTransaction {
  constructor(private readonly records: Map<string, Stored>) {}

  async get(ref: FakeDocumentReference) {
    return new FakeSnapshot(ref.path, this.records);
  }

  create(ref: FakeDocumentReference, value: Stored) {
    if (this.records.has(ref.path)) {
      throw new Error(`Document already exists: ${ref.path}`);
    }
    this.records.set(ref.path, structuredClone(value));
    return this;
  }

  set(
    ref: FakeDocumentReference,
    value: Stored,
    options?: { merge?: boolean },
  ) {
    if (options?.merge && this.records.has(ref.path)) {
      this.records.set(ref.path, {
        ...this.records.get(ref.path),
        ...structuredClone(value),
      });
    } else {
      this.records.set(ref.path, structuredClone(value));
    }
    return this;
  }
}

class FakeFirestore {
  readonly records = new Map<string, Stored>();
  transactionCount = 0;

  collection(name: string) {
    return new FakeCollectionReference(name, this.records);
  }

  async runTransaction<T>(callback: (transaction: FakeTransaction) => Promise<T>) {
    this.transactionCount += 1;
    return callback(new FakeTransaction(this.records));
  }

  read(path: string) {
    return this.records.get(path);
  }
}

const initialConversation: Conversation = Object.freeze({
  version: 1,
  id: "conversation-firestore-1",
  kind: "direct",
  createdByParticipantId: "human-1",
  visibility: "private",
  ai: Object.freeze({ access: "off", assistantParticipantIds: Object.freeze([]) }),
  createdAt: "2026-08-29T16:00:00.000Z",
  updatedAt: "2026-08-29T16:00:00.000Z",
});

function message(id: string, createdAt: string, text: string): ConversationMessage {
  return Object.freeze({
    version: 1,
    id,
    conversationId: initialConversation.id,
    senderParticipantId: "human-1",
    parts: Object.freeze([Object.freeze({ type: "text" as const, text })]),
    createdAt,
    editedAt: null,
    deletedAt: null,
    deletedByParticipantId: null,
  });
}

function withLastMessage(
  base: Conversation,
  value: ConversationMessage,
): Conversation {
  return Object.freeze({
    ...base,
    updatedAt: value.createdAt,
    lastMessage: Object.freeze({
      id: value.id,
      senderParticipantId: value.senderParticipantId,
      createdAt: value.createdAt,
      preview:
        value.parts[0]?.type === "text" ? value.parts[0].text : "New message",
    }),
  });
}

async function main() {
  const fake = new FakeFirestore();
  const store = new FirestoreConversationStore(fake as unknown as Firestore);

  await store.putConversation(initialConversation);
  assert.deepEqual(
    fake.read("conversations/conversation-firestore-1"),
    initialConversation,
  );

  const first = message(
    "message-1",
    "2026-08-29T16:01:00.000Z",
    "First message",
  );
  await store.putMessage(first);
  assert.equal(
    fake.read("conversations/conversation-firestore-1/messages/message-1"),
    undefined,
    "A new message must stay staged until its conversation pointer can commit atomically.",
  );

  await store.putConversation(withLastMessage(initialConversation, first));
  assert.deepEqual(
    fake.read("conversations/conversation-firestore-1/messages/message-1"),
    first,
  );
  assert.equal(
    (
      fake.read("conversations/conversation-firestore-1") as unknown as Conversation
    ).lastMessage?.id,
    "message-1",
  );

  const newer = message(
    "message-3",
    "2026-08-29T16:03:00.000Z",
    "Newer message",
  );
  const older = message(
    "message-2",
    "2026-08-29T16:02:00.000Z",
    "Older message",
  );

  await store.putMessage(newer);
  await store.putMessage(older);
  await store.putConversation(withLastMessage(initialConversation, newer));
  await store.putConversation(withLastMessage(initialConversation, older));

  const persistedConversation = fake.read(
    "conversations/conversation-firestore-1",
  ) as unknown as Conversation;
  assert.equal(
    persistedConversation.lastMessage?.id,
    "message-3",
    "A slower older commit must not move lastMessage backwards.",
  );

  const editedNewer = Object.freeze({
    ...newer,
    parts: Object.freeze([
      Object.freeze({ type: "text" as const, text: "Edited newer message" }),
    ]),
    editedAt: "2026-08-29T16:04:00.000Z",
  }) satisfies ConversationMessage;
  await store.putMessage(editedNewer);
  assert.deepEqual(
    fake.read("conversations/conversation-firestore-1/messages/message-3"),
    editedNewer,
    "Existing-message edits should persist immediately instead of entering the append staging path.",
  );

  await assert.rejects(
    () =>
      store.commitMessage(
        message(
          "message-3",
          "2026-08-29T16:03:00.000Z",
          "Conflicting duplicate",
        ),
        withLastMessage(initialConversation, newer),
      ),
    /already exists with different content/i,
  );

  assert.ok(fake.transactionCount >= 4);
  console.log(
    "Firestore conversation store tests passed: staged append, atomic message/preview commit, monotonic concurrency, direct edits, and duplicate-id conflict rejection.",
  );
}

void main();
