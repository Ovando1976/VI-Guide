import { FieldValue } from "firebase-admin/firestore";

import { ConversationEngine } from "@/lib/conversations/conversation-engine";
import { FirestoreConversationStore } from "@/lib/conversations/firestore-conversation-store";
import { ensurePersonalAiConversation } from "@/lib/conversations/personal-ai";
import { getAdminDb } from "@/lib/firebase-admin";
import { isBlockedBetween } from "@/lib/social/graph-service";
import { getSocialProfile, publicSocialProfile } from "@/lib/social/profile-service";
import { cleanSocialText, socialHash, socialNow, socialPairId } from "@/lib/social/utils";
import type { Conversation, ConversationMessage, ConversationParticipant } from "@/types/conversation";
import type { PublicSocialProfile, SocialConversationInboxItem } from "@/types/social";

const INBOX_ROOT = "socialConversationInbox";
const ASSISTANT_PARTICIPANT_ID = "island-ai";

function participantId(userId: string) {
  return `human-${socialHash(userId).slice(0, 20)}`;
}

function inboxCollection(userId: string) {
  return getAdminDb().collection(INBOX_ROOT).doc(userId).collection("items");
}

function messagePreview(message: ConversationMessage) {
  const part = message.parts.find((candidate) => candidate.type !== "system") ?? message.parts[0];
  if (!part) return "New message";
  if (part.type === "text") return part.text.replace(/\s+/g, " ").trim().slice(0, 160);
  if (part.type === "file") return `Shared file: ${part.name}`.slice(0, 160);
  if (part.type === "artifact") return `Shared ${part.artifactType}: ${part.title}`.slice(0, 160);
  if (part.type === "location") return `Shared location: ${part.name}`.slice(0, 160);
  if (part.type === "poll") return `Poll: ${part.question}`.slice(0, 160);
  if (part.type === "image") return "Shared an image";
  if (part.type === "video") return "Shared a video";
  if (part.type === "audio") return "Shared audio";
  return part.text.slice(0, 160);
}

async function humanParticipantProfiles(participants: readonly ConversationParticipant[]) {
  const entries = await Promise.all(
    participants
      .filter((participant) => participant.actorType === "human" && !participant.leftAt)
      .map(async (participant) => {
        const profile = await getSocialProfile(participant.actorId);
        return profile ? [participant.actorId, publicSocialProfile(profile)] as const : null;
      }),
  );
  return new Map(entries.filter((entry): entry is readonly [string, PublicSocialProfile] => Boolean(entry)));
}

async function upsertInboxForConversation(
  conversation: Conversation,
  participants: readonly ConversationParticipant[],
  lastMessage?: ConversationMessage | null,
) {
  const db = getAdminDb();
  const profiles = await humanParticipantProfiles(participants);
  const activeHumans = participants.filter(
    (participant) => participant.actorType === "human" && !participant.leftAt,
  );
  const batch = db.batch();
  const now = socialNow();

  for (const participant of activeHumans) {
    const peerIds = activeHumans
      .filter((peer) => peer.actorId !== participant.actorId)
      .map((peer) => peer.actorId);
    const peer = peerIds.length === 1 ? profiles.get(peerIds[0]) : null;
    const title =
      conversation.kind === "direct" && peer
        ? peer.displayName
        : conversation.title || (conversation.kind === "workspace" ? "Island AI" : "Conversation");
    const imageUrl = conversation.kind === "direct" && peer ? peer.avatarUrl : null;
    const itemRef = inboxCollection(participant.actorId).doc(conversation.id);
    const existing = await itemRef.get();
    const current = existing.exists ? (existing.data() as SocialConversationInboxItem) : null;
    const item: SocialConversationInboxItem = {
      version: 1,
      conversationId: conversation.id,
      userId: participant.actorId,
      kind:
        conversation.kind === "workspace"
          ? "ai_private"
          : conversation.kind === "community"
            ? "community"
            : conversation.kind === "business"
              ? "business"
              : conversation.kind,
      title,
      imageUrl,
      peerUserIds: peerIds,
      lastMessageId: lastMessage?.id ?? current?.lastMessageId ?? conversation.lastMessage?.id ?? null,
      lastMessagePreview:
        (lastMessage ? messagePreview(lastMessage) : null) ?? current?.lastMessagePreview ?? conversation.lastMessage?.preview ?? null,
      lastMessageAt: lastMessage?.createdAt ?? current?.lastMessageAt ?? conversation.lastMessage?.createdAt ?? null,
      lastReadMessageId: current?.lastReadMessageId ?? null,
      unreadCount: current?.unreadCount ?? 0,
      pinnedAt: current?.pinnedAt ?? null,
      mutedUntil: current?.mutedUntil ?? null,
      archivedAt: current?.archivedAt ?? null,
      updatedAt: lastMessage?.createdAt ?? now,
    };
    batch.set(itemRef, item, { merge: true });
  }
  await batch.commit();
}

export async function ensurePersonalAiInbox(userId: string) {
  const store = new FirestoreConversationStore();
  const personal = await ensurePersonalAiConversation(userId, store);
  const conversation = await store.getConversation(personal.conversationId);
  if (!conversation) throw new Error("Personal AI conversation was not found.");
  const participants = await store.listParticipants(conversation.id);
  await upsertInboxForConversation(conversation, participants);
  return personal;
}

export async function ensureDirectSocialConversation(userId: string, targetUserId: string) {
  if (userId === targetUserId) throw new Error("Choose another person to message.");
  if (await isBlockedBetween(userId, targetUserId)) throw new Error("This conversation is unavailable.");
  const [viewer, target] = await Promise.all([
    getSocialProfile(userId),
    getSocialProfile(targetUserId),
  ]);
  if (!viewer || viewer.state !== "active" || !target || target.state !== "active") {
    throw new Error("A social profile is unavailable.");
  }

  const store = new FirestoreConversationStore();
  const conversationId = socialPairId("dm", userId, targetUserId);
  let conversation = await store.getConversation(conversationId);
  if (!conversation) {
    const ownerParticipantId = participantId(userId);
    const targetParticipantId = participantId(targetUserId);
    const engine = new ConversationEngine(store);
    conversation = await engine.createConversation({
      id: conversationId,
      kind: "direct",
      visibility: "private",
      aiAccess: "mention",
      createdByParticipantId: ownerParticipantId,
      participants: [
        {
          id: ownerParticipantId,
          actorType: "human",
          actorId: userId,
          role: "owner",
          canRead: true,
          canWrite: true,
          canInvokeAi: true,
        },
        {
          id: targetParticipantId,
          actorType: "human",
          actorId: targetUserId,
          role: "member",
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
  }
  const participants = await store.listParticipants(conversationId);
  await upsertInboxForConversation(conversation, participants);
  return Object.freeze({
    conversationId,
    participantId: participantId(userId),
    assistantParticipantId: ASSISTANT_PARTICIPANT_ID,
  });
}

export async function createSocialGroupConversation(
  ownerId: string,
  memberIds: readonly string[],
  title: string,
) {
  const uniqueMembers = Array.from(new Set(memberIds.filter((id) => id && id !== ownerId))).slice(0, 49);
  if (!uniqueMembers.length) throw new Error("Add at least one other person to the group.");
  for (const memberId of uniqueMembers) {
    if (await isBlockedBetween(ownerId, memberId)) throw new Error("A selected member cannot be added.");
    const profile = await getSocialProfile(memberId);
    if (!profile || profile.state !== "active") throw new Error("A selected profile is unavailable.");
  }

  const store = new FirestoreConversationStore();
  const engine = new ConversationEngine(store);
  const conversationId = `group_${socialHash(ownerId, socialNow(), Math.random().toString()).slice(0, 28)}`;
  const ownerParticipantId = participantId(ownerId);
  const conversation = await engine.createConversation({
    id: conversationId,
    kind: "group",
    title: cleanSocialText(title, 120) || "Island group",
    visibility: "private",
    aiAccess: "mention",
    createdByParticipantId: ownerParticipantId,
    participants: [
      {
        id: ownerParticipantId,
        actorType: "human",
        actorId: ownerId,
        role: "owner",
        canRead: true,
        canWrite: true,
        canInvokeAi: true,
      },
      ...uniqueMembers.map((memberId) => ({
        id: participantId(memberId),
        actorType: "human" as const,
        actorId: memberId,
        role: "member" as const,
        canRead: true,
        canWrite: true,
        canInvokeAi: true,
      })),
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
  const participants = await store.listParticipants(conversationId);
  await upsertInboxForConversation(conversation, participants);
  return Object.freeze({
    conversationId,
    participantId: ownerParticipantId,
    assistantParticipantId: ASSISTANT_PARTICIPANT_ID,
  });
}

export async function addSocialGroupMember(
  actorUserId: string,
  conversationId: string,
  newUserId: string,
) {
  if (await isBlockedBetween(actorUserId, newUserId)) throw new Error("This member cannot be added.");
  const store = new FirestoreConversationStore();
  const actor = await store.getParticipant(conversationId, participantId(actorUserId));
  if (!actor || actor.leftAt || !["owner", "admin"].includes(actor.role)) {
    throw new Error("Group administration is required.");
  }
  const conversation = await store.getConversation(conversationId);
  if (!conversation || conversation.kind !== "group") throw new Error("Group conversation was not found.");
  const profile = await getSocialProfile(newUserId);
  if (!profile || profile.state !== "active") throw new Error("Profile was not found.");
  const id = participantId(newUserId);
  const existing = await store.getParticipant(conversationId, id);
  if (!existing) {
    await store.putParticipant(Object.freeze({
      id,
      conversationId,
      actorType: "human" as const,
      actorId: newUserId,
      role: "member" as const,
      joinedAt: socialNow(),
      leftAt: null,
      canRead: true,
      canWrite: true,
      canInvokeAi: true,
    }));
  }
  await upsertInboxForConversation(conversation, await store.listParticipants(conversationId));
}

export async function removeSocialGroupMember(
  actorUserId: string,
  conversationId: string,
  memberUserId: string,
) {
  const store = new FirestoreConversationStore();
  const actor = await store.getParticipant(conversationId, participantId(actorUserId));
  if (!actor || actor.leftAt || !["owner", "admin"].includes(actor.role)) {
    throw new Error("Group administration is required.");
  }
  if (actorUserId === memberUserId) throw new Error("Use leave group for your own membership.");
  const member = await store.getParticipant(conversationId, participantId(memberUserId));
  if (!member || member.leftAt) return;
  await store.putParticipant(Object.freeze({ ...member, leftAt: socialNow(), canRead: false, canWrite: false, canInvokeAi: false }));
  await inboxCollection(memberUserId).doc(conversationId).delete();
}

export async function listSocialConversationInbox(userId: string, limit = 50) {
  await ensurePersonalAiInbox(userId);
  const snapshot = await inboxCollection(userId)
    .orderBy("updatedAt", "desc")
    .limit(Math.max(1, Math.min(limit, 100)))
    .get();
  return snapshot.docs.map((doc) => doc.data() as SocialConversationInboxItem);
}

export async function syncConversationInboxAfterMessage(
  conversationId: string,
  message: ConversationMessage,
) {
  const store = new FirestoreConversationStore();
  const conversation = await store.getConversation(conversationId);
  if (!conversation) return;
  const participants = await store.listParticipants(conversationId);
  const sender = participants.find((participant) => participant.id === message.senderParticipantId);
  const profiles = await humanParticipantProfiles(participants);
  const batch = getAdminDb().batch();

  for (const participant of participants) {
    if (participant.actorType !== "human" || participant.leftAt) continue;
    const ref = inboxCollection(participant.actorId).doc(conversationId);
    const existing = await ref.get();
    const current = existing.exists ? (existing.data() as SocialConversationInboxItem) : null;
    const peerIds = participants
      .filter((peer) => peer.actorType === "human" && !peer.leftAt && peer.actorId !== participant.actorId)
      .map((peer) => peer.actorId);
    const peer = peerIds.length === 1 ? profiles.get(peerIds[0]) : null;
    const title = conversation.kind === "direct" && peer ? peer.displayName : conversation.title ?? "Conversation";
    const incrementUnread = sender?.actorId !== participant.actorId;
    batch.set(ref, {
      version: 1,
      conversationId,
      userId: participant.actorId,
      kind: conversation.kind === "workspace" ? "ai_private" : conversation.kind,
      title,
      imageUrl: conversation.kind === "direct" && peer ? peer.avatarUrl : current?.imageUrl ?? null,
      peerUserIds: peerIds,
      lastMessageId: message.id,
      lastMessagePreview: messagePreview(message),
      lastMessageAt: message.createdAt,
      lastReadMessageId: current?.lastReadMessageId ?? null,
      unreadCount: incrementUnread ? FieldValue.increment(1) : current?.unreadCount ?? 0,
      pinnedAt: current?.pinnedAt ?? null,
      mutedUntil: current?.mutedUntil ?? null,
      archivedAt: current?.archivedAt ?? null,
      updatedAt: message.createdAt,
    }, { merge: true });
  }
  await batch.commit();
}

export async function markSocialConversationRead(
  userId: string,
  conversationId: string,
  messageId: string | null,
) {
  await inboxCollection(userId).doc(conversationId).set({
    lastReadMessageId: messageId,
    unreadCount: 0,
    updatedAt: socialNow(),
  }, { merge: true });
}

export async function setSocialConversationPinned(userId: string, conversationId: string, pinned: boolean) {
  await inboxCollection(userId).doc(conversationId).set({
    pinnedAt: pinned ? socialNow() : null,
    updatedAt: socialNow(),
  }, { merge: true });
}
