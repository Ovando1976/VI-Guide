import { FieldValue } from "firebase-admin/firestore";

import { ConversationEngine } from "@/lib/conversations/conversation-engine";
import { FirestoreConversationStore } from "@/lib/conversations/firestore-conversation-store";
import { ensurePersonalAiConversation } from "@/lib/conversations/personal-ai";
import { getAdminDb } from "@/lib/firebase-admin";
import { getFollowRelationship, isBlockedBetween } from "@/lib/social/graph-service";
import { getSocialProfile, publicSocialProfile } from "@/lib/social/profile-service";
import { cleanSocialText, socialHash, socialNow, socialPairId } from "@/lib/social/utils";
import type { Conversation, ConversationMessage, ConversationParticipant } from "@/types/conversation";
import type {
  PublicSocialProfile,
  SocialConversationInboxItem,
  SocialMessageRequestState,
} from "@/types/social";

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
  if (part.type === "system") return part.text.replace(/\s+/g, " ").trim().slice(0, 160);
  return "New message";
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
  requestStateByUser?: ReadonlyMap<string, SocialMessageRequestState>,
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
    const kind: SocialConversationInboxItem["kind"] =
      conversation.kind === "workspace" ? "ai_private" : conversation.kind;
    const lastMessageId = lastMessage?.id ?? conversation.lastMessage?.id ?? null;
    const lastMessagePreview = lastMessage
      ? messagePreview(lastMessage)
      : conversation.lastMessage?.preview ?? null;
    const lastMessageAt = lastMessage?.createdAt ?? conversation.lastMessage?.createdAt ?? null;
    const requestState = requestStateByUser?.get(participant.actorId)
      ?? current?.requestState
      ?? (conversation.kind === "direct" ? "accepted" : "none");
    const item: SocialConversationInboxItem = {
      version: 1,
      conversationId: conversation.id,
      userId: participant.actorId,
      kind,
      title,
      imageUrl,
      peerUserIds: Object.freeze(peerIds),
      requestState,
      lastMessageId,
      lastMessagePreview,
      lastMessageAt,
      lastReadMessageId: current?.lastReadMessageId ?? null,
      unreadCount: current?.unreadCount ?? 0,
      pinnedAt: current?.pinnedAt ?? null,
      mutedUntil: current?.mutedUntil ?? null,
      archivedAt: current?.archivedAt ?? null,
      updatedAt: lastMessageAt ?? current?.updatedAt ?? conversation.updatedAt ?? now,
    };
    batch.set(itemRef, item, { merge: true });
  }
  await batch.commit();
}

export async function ensurePersonalSocialConversation(userId: string) {
  const personal = await ensurePersonalAiConversation(userId);
  const store = new FirestoreConversationStore();
  const conversation = await store.getConversation(personal.conversationId);
  if (!conversation) throw new Error("Personal AI conversation was not found.");
  const participants = await store.listParticipants(conversation.id);
  await upsertInboxForConversation(conversation, participants, null);
  return personal;
}

export async function ensureDirectSocialConversation(userId: string, targetUserId: string) {
  if (!targetUserId || targetUserId === userId) throw new Error("Choose another person to message.");
  if (await isBlockedBetween(userId, targetUserId)) throw new Error("This conversation is unavailable.");
  const [self, target] = await Promise.all([getSocialProfile(userId), getSocialProfile(targetUserId)]);
  if (!self || !target || self.state !== "active" || target.state !== "active") {
    throw new Error("Both people need active social profiles.");
  }
  const conversationId = `dm-${socialPairId(userId, targetUserId)}`;
  const store = new FirestoreConversationStore();
  let conversation = await store.getConversation(conversationId);
  const now = socialNow();

  if (!conversation) {
    const relationship = await getFollowRelationship(targetUserId, userId);
    const trusted = relationship.outgoing?.status === "accepted";
    const participants = [
      Object.freeze({
        id: participantId(userId),
        conversationId,
        actorType: "human" as const,
        actorId: userId,
        role: "owner" as const,
        joinedAt: now,
        leftAt: null,
        canRead: true,
        canWrite: true,
        canInvokeAi: false,
      }),
      Object.freeze({
        id: participantId(targetUserId),
        conversationId,
        actorType: "human" as const,
        actorId: targetUserId,
        role: "member" as const,
        joinedAt: now,
        leftAt: null,
        canRead: true,
        canWrite: trusted,
        canInvokeAi: false,
      }),
    ];
    const engine = new ConversationEngine(store);
    conversation = await engine.createConversation({
      id: conversationId,
      kind: "direct",
      title: undefined,
      visibility: "private",
      aiAccess: "off",
      createdByParticipantId: participantId(userId),
      participants,
    });
    const requestStates = new Map<string, SocialMessageRequestState>([
      [userId, trusted ? "accepted" : "outgoing"],
      [targetUserId, trusted ? "accepted" : "incoming"],
    ]);
    await upsertInboxForConversation(conversation, participants, null, requestStates);
  } else {
    const ids = [userId, targetUserId];
    const participants = ids.map((actorId, index) => Object.freeze({
      id: participantId(actorId),
      conversationId,
      actorType: "human" as const,
      actorId,
      role: index === 0 ? "owner" as const : "member" as const,
      joinedAt: now,
      leftAt: null,
      canRead: true,
      canWrite: true,
      canInvokeAi: false,
    }));
    for (const participant of participants) {
      const existing = await store.getParticipant(conversationId, participant.id);
      if (!existing) await store.putParticipant(participant);
    }
    const activeParticipants = await store.listParticipants(conversationId);
    await upsertInboxForConversation(conversation, activeParticipants, null);
  }

  return {
    conversationId,
    participantId: participantId(userId),
    peer: publicSocialProfile(target),
    aiAccess: conversation.ai.access,
  };
}

export async function respondToSocialMessageRequest(
  userId: string,
  conversationId: string,
  action: "accept" | "decline",
) {
  const store = new FirestoreConversationStore();
  const conversation = await store.getConversation(conversationId);
  if (!conversation || conversation.kind !== "direct") throw new Error("Message request was not found.");
  const self = await store.getParticipant(conversationId, participantId(userId));
  if (!self || self.leftAt) throw new Error("Message request is unavailable.");
  const inboxRef = inboxCollection(userId).doc(conversationId);
  const inboxSnapshot = await inboxRef.get();
  const inbox = inboxSnapshot.exists ? (inboxSnapshot.data() as SocialConversationInboxItem) : null;
  if (!inbox || inbox.requestState !== "incoming") throw new Error("Message request is no longer pending.");
  const participants = await store.listParticipants(conversationId);
  const peer = participants.find((participant) => participant.actorType === "human" && !participant.leftAt && participant.actorId !== userId);
  if (!peer) throw new Error("Message request sender was not found.");
  if (await isBlockedBetween(userId, peer.actorId)) throw new Error("This conversation is unavailable.");
  const now = socialNow();
  const db = getAdminDb();
  const batch = db.batch();

  if (action === "accept") {
    await store.putParticipant(Object.freeze({ ...self, canRead: true, canWrite: true }));
    if (!peer.canWrite) await store.putParticipant(Object.freeze({ ...peer, canRead: true, canWrite: true }));
    batch.set(inboxCollection(userId).doc(conversationId), {
      requestState: "accepted",
      archivedAt: null,
      updatedAt: now,
    }, { merge: true });
    batch.set(inboxCollection(peer.actorId).doc(conversationId), {
      requestState: "accepted",
      archivedAt: null,
      updatedAt: now,
    }, { merge: true });
  } else {
    await store.putParticipant(Object.freeze({ ...self, canWrite: false }));
    await store.putParticipant(Object.freeze({ ...peer, canWrite: false }));
    batch.set(inboxCollection(userId).doc(conversationId), {
      requestState: "declined",
      archivedAt: now,
      unreadCount: 0,
      updatedAt: now,
    }, { merge: true });
    batch.set(inboxCollection(peer.actorId).doc(conversationId), {
      requestState: "declined",
      updatedAt: now,
    }, { merge: true });
  }
  await batch.commit();
  return { conversationId, state: action === "accept" ? "accepted" as const : "declined" as const };
}

export async function createSocialGroupConversation(
  ownerId: string,
  rawMemberIds: readonly string[],
  rawTitle: unknown,
) {
  const title = cleanSocialText(rawTitle, 120);
  if (title.length < 2) throw new Error("Group name must contain at least 2 characters.");
  const memberIds = Array.from(new Set([ownerId, ...rawMemberIds])).filter(Boolean).slice(0, 50);
  if (memberIds.length < 2) throw new Error("A group needs at least two people.");
  const profiles = await Promise.all(memberIds.map(getSocialProfile));
  if (profiles.some((profile) => !profile || profile.state !== "active")) {
    throw new Error("Every group member needs an active social profile.");
  }
  for (const memberId of memberIds) {
    if (memberId !== ownerId && await isBlockedBetween(ownerId, memberId)) {
      throw new Error("A blocked relationship cannot be added to a group.");
    }
  }

  const store = new FirestoreConversationStore();
  const engine = new ConversationEngine(store);
  const conversationId = `group-${socialHash(ownerId, socialNow(), title).slice(0, 24)}`;
  const now = socialNow();
  const participants = [
    ...memberIds.map((actorId) => Object.freeze({
      id: participantId(actorId),
      conversationId,
      actorType: "human" as const,
      actorId,
      role: actorId === ownerId ? "owner" as const : "member" as const,
      joinedAt: now,
      leftAt: null,
      canRead: true,
      canWrite: true,
      canInvokeAi: true,
    })),
    Object.freeze({
      id: ASSISTANT_PARTICIPANT_ID,
      conversationId,
      actorType: "ai" as const,
      actorId: "island-ai",
      role: "assistant" as const,
      joinedAt: now,
      leftAt: null,
      canRead: true,
      canWrite: true,
      canInvokeAi: false,
    }),
  ];
  const conversation = await engine.createConversation({
    id: conversationId,
    kind: "group",
    title,
    visibility: "members",
    aiAccess: "mention",
    createdByParticipantId: participantId(ownerId),
    participants,
  });
  await upsertInboxForConversation(conversation, participants, null);
  return { conversationId, participantId: participantId(ownerId), assistantParticipantId: ASSISTANT_PARTICIPANT_ID };
}

async function requireGroupAdmin(requesterId: string, conversationId: string) {
  const store = new FirestoreConversationStore();
  const conversation = await store.getConversation(conversationId);
  if (!conversation || conversation.kind !== "group") throw new Error("Group conversation was not found.");
  const participant = await store.getParticipant(conversationId, participantId(requesterId));
  if (!participant || participant.leftAt || !["owner", "admin"].includes(participant.role)) {
    throw new Error("Group administration permission is required.");
  }
  return { store, conversation };
}

export async function addSocialGroupMember(requesterId: string, conversationId: string, memberUserId: string) {
  const { store, conversation } = await requireGroupAdmin(requesterId, conversationId);
  if (await isBlockedBetween(requesterId, memberUserId)) throw new Error("A blocked relationship cannot be added to a group.");
  const profile = await getSocialProfile(memberUserId);
  if (!profile || profile.state !== "active") throw new Error("The member needs an active social profile.");
  const existing = await store.getParticipant(conversationId, participantId(memberUserId));
  const now = socialNow();
  await store.putParticipant(Object.freeze({
    id: participantId(memberUserId),
    conversationId,
    actorType: "human" as const,
    actorId: memberUserId,
    role: existing?.role === "owner" ? "owner" as const : "member" as const,
    joinedAt: existing?.joinedAt ?? now,
    leftAt: null,
    canRead: true,
    canWrite: true,
    canInvokeAi: true,
  }));
  const participants = await store.listParticipants(conversationId);
  await upsertInboxForConversation(conversation, participants, null);
}

export async function removeSocialGroupMember(requesterId: string, conversationId: string, memberUserId: string) {
  const { store, conversation } = await requireGroupAdmin(requesterId, conversationId);
  if (memberUserId === requesterId) throw new Error("Use leave group for your own membership.");
  const member = await store.getParticipant(conversationId, participantId(memberUserId));
  if (!member || member.leftAt) return;
  if (member.role === "owner") throw new Error("The group owner cannot be removed.");
  await store.putParticipant(Object.freeze({ ...member, leftAt: socialNow(), canWrite: false, canInvokeAi: false }));
  const participants = await store.listParticipants(conversationId);
  await inboxCollection(memberUserId).doc(conversationId).delete();
  await upsertInboxForConversation(conversation, participants, null);
}

export async function listSocialConversationInbox(userId: string, limit = 100) {
  await ensurePersonalSocialConversation(userId);
  const snapshot = await inboxCollection(userId)
    .orderBy("updatedAt", "desc")
    .limit(Math.max(1, Math.min(limit, 150)))
    .get();
  return snapshot.docs.map((doc) => {
    const item = doc.data() as SocialConversationInboxItem;
    return {
      ...item,
      requestState: item.requestState ?? (item.kind === "direct" ? "accepted" : "none"),
    } satisfies SocialConversationInboxItem;
  });
}

export async function updateSocialConversationInbox(
  userId: string,
  conversationId: string,
  input: Readonly<{ readMessageId?: unknown; pinned?: unknown; mutedUntil?: unknown }>,
) {
  const ref = inboxCollection(userId).doc(conversationId);
  const snapshot = await ref.get();
  if (!snapshot.exists) throw new Error("Conversation is not in your inbox.");
  const patch: Record<string, unknown> = { updatedAt: socialNow() };
  if (input.readMessageId !== undefined) {
    patch.lastReadMessageId = cleanSocialText(input.readMessageId, 160) || null;
    patch.unreadCount = 0;
  }
  if (input.pinned !== undefined) patch.pinnedAt = input.pinned ? socialNow() : null;
  if (input.mutedUntil !== undefined) patch.mutedUntil = cleanSocialText(input.mutedUntil, 80) || null;
  await ref.set(patch, { merge: true });
}

export async function recordSocialMessageForInbox(conversationId: string, message: ConversationMessage) {
  const store = new FirestoreConversationStore();
  const conversation = await store.getConversation(conversationId);
  if (!conversation) return;
  const participants = await store.listParticipants(conversationId);
  await upsertInboxForConversation(conversation, participants, message);
  const activeHumans = participants.filter((participant) => participant.actorType === "human" && !participant.leftAt);
  const sender = activeHumans.find((participant) => participant.id === message.senderParticipantId);
  if (!sender) return;
  const batch = getAdminDb().batch();
  for (const participant of activeHumans) {
    if (participant.id === message.senderParticipantId) continue;
    const ref = inboxCollection(participant.actorId).doc(conversationId);
    batch.set(ref, {
      unreadCount: FieldValue.increment(1),
      updatedAt: message.createdAt,
    }, { merge: true });
  }
  await batch.commit();
}
