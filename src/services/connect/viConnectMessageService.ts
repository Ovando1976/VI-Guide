import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { firestore } from "../../lib/firebaseClient";
import { viConnectProfiles } from "../../data/viConnect";
import type { VIConnectProfile } from "../../types/viConnect";
import type {
  VIConnectConversation,
  VIConnectMessage,
  VIConnectMessageKind,
} from "../../types/viConnectMessages";
import {
  ensureVIConnectAuth,
  getCurrentVIConnectUid,
} from "./viConnectAuthService";

const LOCAL_CONVERSATIONS_KEY = "vi-connect-conversations-v1";
const LOCAL_MESSAGES_KEY = "vi-connect-messages-v1";
const LOCAL_UID_KEY = "vi-connect-local-uid-v1";
const EVENT_NAME = "vi-connect-messages-changed";

type StoredMessages = Record<string, VIConnectMessage[]>;

function nowIso() {
  return new Date().toISOString();
}

function emitChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

function safeReadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWriteJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function getLocalUid() {
  const existing = safeReadJson<string>(LOCAL_UID_KEY, "");
  if (existing) return existing;

  const uid = `local-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;
  safeWriteJson(LOCAL_UID_KEY, uid);
  return uid;
}

export function getVIConnectMessagingUid() {
  return getCurrentVIConnectUid() || getLocalUid();
}

function conversationIdForProfile(profileId: string, uid = getVIConnectMessagingUid()) {
  return `connect-${uid}-${profileId}`.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function getProfile(profileId: string) {
  return viConnectProfiles.find((profile) => profile.id === profileId) || null;
}

function conversationFromProfile(profile: VIConnectProfile): VIConnectConversation {
  const uid = getVIConnectMessagingUid();
  const createdAt = nowIso();

  return {
    id: conversationIdForProfile(profile.id, uid),
    profileId: profile.id,
    profileDisplayName: profile.displayName,
    profileImageUrl: profile.imageUrl,
    participantUids: [uid, `demo-${profile.id}`],
    createdAt,
    updatedAt: createdAt,
    status: "active",
    unreadCount: 0,
  };
}

export function getVIConnectConversations() {
  return safeReadJson<VIConnectConversation[]>(LOCAL_CONVERSATIONS_KEY, [])
    .filter((conversation) => conversation.status !== "blocked")
    .sort((a, b) =>
      String(b.lastMessageAt || b.updatedAt).localeCompare(
        String(a.lastMessageAt || a.updatedAt)
      )
    );
}

export function getVIConnectMessages(conversationId: string) {
  const stored = safeReadJson<StoredMessages>(LOCAL_MESSAGES_KEY, {});
  return [...(stored[conversationId] || [])].sort((a, b) =>
    String(a.createdAt).localeCompare(String(b.createdAt))
  );
}

export function getOrCreateVIConnectConversation(profile: VIConnectProfile) {
  const conversations = getVIConnectConversations();
  const existing = conversations.find(
    (conversation) => conversation.profileId === profile.id
  );

  if (existing) return existing;

  const conversation = conversationFromProfile(profile);
  const introMessage: VIConnectMessage = {
    id: `system-${Date.now()}`,
    conversationId: conversation.id,
    senderUid: "system",
    senderLabel: "system",
    kind: "system",
    text: `You matched with ${profile.displayName}. Keep it respectful, meet in public first, and use VI Guide to plan a safe island date.`,
    createdAt: nowIso(),
    readBy: [getVIConnectMessagingUid()],
  };

  safeWriteJson(LOCAL_CONVERSATIONS_KEY, [conversation, ...conversations]);

  const stored = safeReadJson<StoredMessages>(LOCAL_MESSAGES_KEY, {});
  stored[conversation.id] = [introMessage];
  safeWriteJson(LOCAL_MESSAGES_KEY, stored);

  void saveConversationToCloud(conversation).catch(() => undefined);
  void saveMessageToCloud(introMessage).catch(() => undefined);

  emitChanged();
  return conversation;
}

export function getVIConnectConversationBundle(conversationId: string) {
  const conversation =
    getVIConnectConversations().find((item) => item.id === conversationId) ||
    null;
  const profile = conversation ? getProfile(conversation.profileId) : null;

  return {
    conversation,
    profile,
    messages: conversation ? getVIConnectMessages(conversation.id) : [],
  };
}

export function sendVIConnectMessage(input: {
  conversationId: string;
  text: string;
  kind?: VIConnectMessageKind;
  metadata?: VIConnectMessage["metadata"];
}) {
  const cleanText = input.text.trim().slice(0, 1200);
  if (!cleanText) return null;

  const uid = getVIConnectMessagingUid();
  const conversations = getVIConnectConversations();
  const conversation = conversations.find((item) => item.id === input.conversationId);

  if (!conversation) return null;

  const message: VIConnectMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    conversationId: conversation.id,
    senderUid: uid,
    senderLabel: "me",
    kind: input.kind || "text",
    text: cleanText,
    metadata: input.metadata,
    createdAt: nowIso(),
    readBy: [uid],
  };

  const stored = safeReadJson<StoredMessages>(LOCAL_MESSAGES_KEY, {});
  stored[conversation.id] = [...(stored[conversation.id] || []), message];
  safeWriteJson(LOCAL_MESSAGES_KEY, stored);

  const updatedConversation: VIConnectConversation = {
    ...conversation,
    updatedAt: nowIso(),
    lastMessageAt: message.createdAt,
    lastMessageText: message.text,
  };

  safeWriteJson(
    LOCAL_CONVERSATIONS_KEY,
    conversations.map((item) =>
      item.id === conversation.id ? updatedConversation : item
    )
  );

  void saveConversationToCloud(updatedConversation).catch(() => undefined);
  void saveMessageToCloud(message).catch(() => undefined);

  emitChanged();
  return message;
}

export function sendVIConnectQuickInvite(input: {
  conversationId: string;
  profile: VIConnectProfile;
  mode: "coffee" | "beach" | "dinner" | "event" | "ride";
}) {
  const templates = {
    coffee: `Want to grab coffee or a smoothie somewhere easy this week?`,
    beach: `Want to pick a beach and keep it simple? I can build us a VI Guide plan.`,
    dinner: `Want to plan dinner somewhere relaxed and public?`,
    event: `Want to check events this weekend and pick one that feels easy?`,
    ride: `I can map the route and ride plan first so meeting up is simple.`,
  } as const;

  return sendVIConnectMessage({
    conversationId: input.conversationId,
    text: templates[input.mode],
    kind: input.mode === "ride" ? "ride_plan" : "text",
    metadata: {
      profileId: input.profile.id,
      mapPath: `/map?island=${input.profile.island}`,
      ridePath: `/mobility?island=${input.profile.island}`,
    },
  });
}

export function shareVIConnectDatePlanMessage(input: {
  conversationId: string;
  profile: VIConnectProfile;
  dateIdeaTitle: string;
}) {
  return sendVIConnectMessage({
    conversationId: input.conversationId,
    kind: "date_plan",
    text: `I built a date idea for us: ${input.dateIdeaTitle}. Want to check it out and adjust the place or time?`,
    metadata: {
      profileId: input.profile.id,
      dateIdeaTitle: input.dateIdeaTitle,
      mapPath: `/map?island=${input.profile.island}`,
      ridePath: `/mobility?island=${input.profile.island}`,
    },
  });
}

export function archiveVIConnectConversation(conversationId: string) {
  const conversations = getVIConnectConversations();
  safeWriteJson(
    LOCAL_CONVERSATIONS_KEY,
    conversations.map((item) =>
      item.id === conversationId
        ? { ...item, status: "archived", updatedAt: nowIso() }
        : item
    )
  );
  emitChanged();
}

async function saveConversationToCloud(conversation: VIConnectConversation) {
  if (!firestore) return;

  const user = await ensureVIConnectAuth();
  if (!user) return;

  await setDoc(
    doc(firestore, "connectConversations", conversation.id),
    {
      ...conversation,
      ownerUid: user.uid,
      participantUids: Array.from(
        new Set([user.uid, ...conversation.participantUids])
      ),
      updatedAtServer: serverTimestamp(),
    },
    { merge: true }
  );
}

async function saveMessageToCloud(message: VIConnectMessage) {
  if (!firestore) return;

  const user = await ensureVIConnectAuth();
  if (!user) return;

  await addDoc(
    collection(firestore, "connectConversations", message.conversationId, "messages"),
    {
      ...message,
      senderUid: user.uid,
      createdAtServer: serverTimestamp(),
    }
  );
}
