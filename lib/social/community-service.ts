import { FieldValue } from "firebase-admin/firestore";

import { ConversationEngine } from "@/lib/conversations/conversation-engine";
import { FirestoreConversationStore } from "@/lib/conversations/firestore-conversation-store";
import { getAdminDb } from "@/lib/firebase-admin";
import { getSocialProfile } from "@/lib/social/profile-service";
import { cleanSocialText, normalizeSearch, socialHash, socialNow, socialRelationId } from "@/lib/social/utils";
import type {
  SocialCommunity,
  SocialCommunityMembership,
  SocialCommunityVisibility,
  SocialIsland,
} from "@/types/social";

const COMMUNITIES = "socialCommunities";
const MEMBERS = "socialCommunityMembers";
const ASSISTANT_PARTICIPANT_ID = "island-ai";
const SYSTEM_PARTICIPANT_ID = "community-system";

const SEEDED_COMMUNITIES: ReadonlyArray<
  Pick<SocialCommunity, "slug" | "name" | "description" | "island" | "category">
> = [
  { slug: "st-thomas", name: "St. Thomas", description: "People, places, questions and everyday life across St. Thomas.", island: "stt", category: "island" },
  { slug: "st-john", name: "St. John", description: "Community life, beaches, trails, businesses and conversations around St. John.", island: "stj", category: "island" },
  { slug: "st-croix", name: "St. Croix", description: "Community, culture, food, events and local knowledge across St. Croix.", island: "stx", category: "island" },
  { slug: "water-island", name: "Water Island", description: "Neighbors, visitors and local updates from Water Island.", island: "water_island", category: "island" },
  { slug: "charlotte-amalie", name: "Charlotte Amalie", description: "Downtown life, businesses, events and local conversations.", island: "stt", category: "neighborhood" },
  { slug: "red-hook", name: "Red Hook", description: "East End conversations, ferry movement, dining and what is happening now.", island: "stt", category: "neighborhood" },
  { slug: "cruz-bay", name: "Cruz Bay", description: "Cruz Bay community, ferry arrivals, food, events and local updates.", island: "stj", category: "neighborhood" },
  { slug: "christiansted", name: "Christiansted", description: "Christiansted community, culture, dining, businesses and events.", island: "stx", category: "neighborhood" },
  { slug: "frederiksted", name: "Frederiksted", description: "Frederiksted community, waterfront life, culture and events.", island: "stx", category: "neighborhood" },
  { slug: "usvi-food", name: "USVI Food", description: "Restaurants, cooks, recipes, recommendations and island food culture.", island: null, category: "food" },
  { slug: "usvi-music", name: "USVI Music", description: "Artists, DJs, live music, releases and the territory's sound.", island: null, category: "music" },
  { slug: "usvi-jobs", name: "USVI Jobs", description: "Jobs, hiring, career opportunities and workforce conversations.", island: null, category: "jobs" },
  { slug: "usvi-small-business", name: "USVI Small Business", description: "Owners, entrepreneurs, customers and local business growth.", island: null, category: "business" },
  { slug: "usvi-fishing", name: "USVI Fishing", description: "Fishing reports, techniques, regulations and local knowledge.", island: null, category: "fishing" },
  { slug: "usvi-boating", name: "USVI Boating", description: "Boats, sailing, marinas, charters and life on the water.", island: null, category: "boating" },
  { slug: "usvi-carnival", name: "USVI Carnival", description: "Carnival culture, events, music, food and community conversation.", island: null, category: "culture" },
  { slug: "usvi-events", name: "USVI Events", description: "What is happening across the Virgin Islands.", island: null, category: "events" },
  { slug: "usvi-housing", name: "USVI Housing", description: "Housing, rentals, neighborhoods and practical local information.", island: null, category: "housing" },
  { slug: "usvi-history", name: "USVI History", description: "Territory history, archives, estates, stories and preservation.", island: null, category: "history" },
  { slug: "virgin-islanders-abroad", name: "Virgin Islanders Abroad", description: "A home for the USVI diaspora to stay connected.", island: "diaspora", category: "diaspora" },
];

function membershipId(communityId: string, userId: string) {
  return socialRelationId("community_member", communityId, userId);
}
function humanParticipantId(userId: string) {
  return `human-${socialHash(userId).slice(0, 20)}`;
}

export async function ensureSeedSocialCommunities() {
  const db = getAdminDb();
  const refs = SEEDED_COMMUNITIES.map((seed) => ({
    seed,
    id: `community_${socialHash(seed.slug).slice(0, 24)}`,
  }));
  const snapshots = await db.getAll(...refs.map(({ id }) => db.collection(COMMUNITIES).doc(id)));
  const batch = db.batch();
  const now = socialNow();
  let writes = 0;

  snapshots.forEach((snapshot, index) => {
    if (snapshot.exists) return;
    const { seed, id } = refs[index]!;
    const community: SocialCommunity = {
      version: 1,
      id,
      slug: seed.slug,
      name: seed.name,
      description: seed.description,
      imageUrl: null,
      coverImageUrl: null,
      island: seed.island,
      category: seed.category,
      visibility: "public",
      ownerId: "system",
      memberCount: 0,
      postCount: 0,
      conversationId: null,
      seeded: true,
      createdAt: now,
      updatedAt: now,
    };
    batch.set(snapshot.ref, community);
    writes += 1;
  });

  if (writes) await batch.commit();
}

async function ensureCommunityConversation(community: SocialCommunity) {
  const store = new FirestoreConversationStore();
  const conversationId = community.conversationId ?? `community-chat-${socialHash(community.id).slice(0, 24)}`;
  let conversation = await store.getConversation(conversationId);
  if (!conversation) {
    const engine = new ConversationEngine(store);
    conversation = await engine.createConversation({
      id: conversationId,
      kind: "community",
      title: community.name,
      visibility: "members",
      aiAccess: "mention",
      createdByParticipantId: SYSTEM_PARTICIPANT_ID,
      participants: [
        {
          id: SYSTEM_PARTICIPANT_ID,
          actorType: "system",
          actorId: `community:${community.id}`,
          role: "owner",
          canRead: true,
          canWrite: false,
          canInvokeAi: false,
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
  if (community.conversationId !== conversationId) {
    await getAdminDb().collection(COMMUNITIES).doc(community.id).set({ conversationId, updatedAt: socialNow() }, { merge: true });
  }
  return { store, conversationId };
}

export async function createSocialCommunity(
  ownerId: string,
  input: Readonly<{ name: unknown; description?: unknown; island?: unknown; category?: unknown; visibility?: unknown }>,
) {
  const owner = await getSocialProfile(ownerId);
  if (!owner || owner.state !== "active") throw new Error("An active social profile is required.");
  const name = cleanSocialText(input.name, 100);
  if (name.length < 3) throw new Error("Community name must contain at least 3 characters.");
  const slugBase = normalizeSearch(name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "community";
  const id = `community_${socialHash(ownerId, name, socialNow()).slice(0, 24)}`;
  const now = socialNow();
  const visibility: SocialCommunityVisibility = ["public", "private", "invite_only"].includes(String(input.visibility))
    ? (input.visibility as SocialCommunityVisibility)
    : "public";
  const community: SocialCommunity = {
    version: 1,
    id,
    slug: `${slugBase}-${id.slice(-5)}`,
    name,
    description: cleanSocialText(input.description, 1000),
    imageUrl: null,
    coverImageUrl: null,
    island: typeof input.island === "string" ? (input.island as SocialIsland) : null,
    category: cleanSocialText(input.category, 60) || "community",
    visibility,
    ownerId,
    memberCount: 1,
    postCount: 0,
    conversationId: null,
    seeded: false,
    createdAt: now,
    updatedAt: now,
  };
  const db = getAdminDb();
  const member: SocialCommunityMembership = {
    version: 1,
    id: membershipId(id, ownerId),
    communityId: id,
    userId: ownerId,
    role: "owner",
    status: "active",
    joinedAt: now,
    updatedAt: now,
  };
  await db.collection(COMMUNITIES).doc(id).set(community);
  await db.collection(MEMBERS).doc(member.id).set(member);
  const { store, conversationId } = await ensureCommunityConversation(community);
  await store.putParticipant(Object.freeze({
    id: humanParticipantId(ownerId),
    conversationId,
    actorType: "human" as const,
    actorId: ownerId,
    role: "owner" as const,
    joinedAt: now,
    leftAt: null,
    canRead: true,
    canWrite: true,
    canInvokeAi: true,
  }));
  return { ...community, conversationId };
}

export async function listSocialCommunities(query = "", limit = 40) {
  await ensureSeedSocialCommunities();
  const normalized = normalizeSearch(query);
  const snapshot = await getAdminDb().collection(COMMUNITIES).orderBy("memberCount", "desc").limit(Math.max(50, Math.min(limit * 3, 150))).get();
  return snapshot.docs
    .map((doc) => doc.data() as SocialCommunity)
    .filter((community) => !normalized || `${community.name} ${community.description} ${community.category}`.toLowerCase().includes(normalized))
    .slice(0, limit);
}

export async function getSocialCommunity(communityId: string) {
  const snapshot = await getAdminDb().collection(COMMUNITIES).doc(communityId).get();
  return snapshot.exists ? (snapshot.data() as SocialCommunity) : null;
}

export async function getCommunityMembership(communityId: string, userId: string) {
  const snapshot = await getAdminDb().collection(MEMBERS).doc(membershipId(communityId, userId)).get();
  return snapshot.exists ? (snapshot.data() as SocialCommunityMembership) : null;
}

export async function joinSocialCommunity(userId: string, communityId: string) {
  const community = await getSocialCommunity(communityId);
  if (!community) throw new Error("Community was not found.");
  const db = getAdminDb();
  const ref = db.collection(MEMBERS).doc(membershipId(communityId, userId));
  const now = socialNow();
  const active = community.visibility === "public";
  await db.runTransaction(async (transaction) => {
    const existing = await transaction.get(ref);
    const current = existing.exists ? (existing.data() as SocialCommunityMembership) : null;
    if (current?.status === "active" || current?.status === "pending") return;
    const membership: SocialCommunityMembership = {
      version: 1,
      id: ref.id,
      communityId,
      userId,
      role: "member",
      status: active ? "active" : "pending",
      joinedAt: current?.joinedAt ?? now,
      updatedAt: now,
    };
    transaction.set(ref, membership);
    if (active) transaction.update(db.collection(COMMUNITIES).doc(communityId), { memberCount: FieldValue.increment(1), updatedAt: now });
  });

  if (active) {
    const latest = (await getSocialCommunity(communityId)) ?? community;
    const { store, conversationId } = await ensureCommunityConversation(latest);
    const id = humanParticipantId(userId);
    const existing = await store.getParticipant(conversationId, id);
    if (!existing) {
      await store.putParticipant(Object.freeze({
        id,
        conversationId,
        actorType: "human" as const,
        actorId: userId,
        role: "member" as const,
        joinedAt: now,
        leftAt: null,
        canRead: true,
        canWrite: true,
        canInvokeAi: true,
      }));
    } else if (existing.leftAt) {
      await store.putParticipant(Object.freeze({ ...existing, leftAt: null, canRead: true, canWrite: true, canInvokeAi: true, joinedAt: now }));
    }
  }
  return getCommunityMembership(communityId, userId);
}

export async function leaveSocialCommunity(userId: string, communityId: string) {
  const db = getAdminDb();
  const ref = db.collection(MEMBERS).doc(membershipId(communityId, userId));
  const community = await getSocialCommunity(communityId);
  if (!community) return;
  const now = socialNow();
  await db.runTransaction(async (transaction) => {
    const existing = await transaction.get(ref);
    if (!existing.exists) return;
    const current = existing.data() as SocialCommunityMembership;
    if (current.role === "owner") throw new Error("Transfer or delete the community before leaving as owner.");
    transaction.set(ref, { ...current, status: "removed", updatedAt: now });
    if (current.status === "active") transaction.update(db.collection(COMMUNITIES).doc(communityId), { memberCount: FieldValue.increment(-1), updatedAt: now });
  });
  if (community.conversationId) {
    const store = new FirestoreConversationStore();
    const id = humanParticipantId(userId);
    const participant = await store.getParticipant(community.conversationId, id);
    if (participant) await store.putParticipant(Object.freeze({ ...participant, leftAt: now, canRead: false, canWrite: false, canInvokeAi: false }));
  }
}

export async function approveCommunityMember(actorId: string, communityId: string, userId: string) {
  const actor = await getCommunityMembership(communityId, actorId);
  if (!actor || actor.status !== "active" || !["owner", "admin", "moderator"].includes(actor.role)) {
    throw new Error("Community moderation is required.");
  }
  const db = getAdminDb();
  const ref = db.collection(MEMBERS).doc(membershipId(communityId, userId));
  const community = await getSocialCommunity(communityId);
  if (!community) throw new Error("Community was not found.");
  const now = socialNow();
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists || snapshot.data()?.status !== "pending") throw new Error("Membership request was not found.");
    transaction.update(ref, { status: "active", updatedAt: now });
    transaction.update(db.collection(COMMUNITIES).doc(communityId), { memberCount: FieldValue.increment(1), updatedAt: now });
  });
  const latest = (await getSocialCommunity(communityId)) ?? community;
  const { store, conversationId } = await ensureCommunityConversation(latest);
  const id = humanParticipantId(userId);
  const existing = await store.getParticipant(conversationId, id);
  if (existing) {
    await store.putParticipant(Object.freeze({ ...existing, leftAt: null, canRead: true, canWrite: true, canInvokeAi: true, joinedAt: now }));
  } else {
    await store.putParticipant(Object.freeze({
      id, conversationId, actorType: "human" as const, actorId: userId,
      role: "member" as const, joinedAt: now, leftAt: null, canRead: true, canWrite: true, canInvokeAi: true,
    }));
  }
}
