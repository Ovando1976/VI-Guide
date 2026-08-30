import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase-admin";
import { listFollowingIds } from "@/lib/social/graph-service";
import { createSocialNotification } from "@/lib/social/notification-service";
import { getSocialProfile, publicSocialProfile } from "@/lib/social/profile-service";
import {
  cleanOptionalSocialText,
  cleanSocialText,
  socialRelationId,
  socialNow,
} from "@/lib/social/utils";
import type {
  SocialComment,
  SocialFeedPage,
  SocialMediaReference,
  SocialPlaceReference,
  SocialPost,
  SocialPostType,
  SocialPostView,
  SocialPostVisibility,
  SocialReaction,
  SocialSavedItem,
} from "@/types/social";

const POSTS = "socialPosts";
const COMMENTS = "socialComments";
const REACTIONS = "socialReactions";
const SAVED = "socialSavedItems";
const FOLLOWS = "socialFollows";
const COMMUNITY_MEMBERS = "socialCommunityMembers";

const POST_TYPES = new Set<SocialPostType>([
  "text", "photo", "video", "poll", "event", "shared_place", "business", "community",
]);
const VISIBILITY = new Set<SocialPostVisibility>(["public", "followers", "community", "private"]);
const ALLOWED_EMOJI = new Set(["👍", "❤️", "😂", "🔥", "👏", "😮", "😢", "🙏"]);

function reactionId(actorId: string, targetType: "post" | "comment", targetId: string) {
  return socialRelationId(`reaction_${targetType}`, actorId, targetId);
}
function savedId(userId: string, postId: string) {
  return socialRelationId("saved_post", userId, postId);
}

function cleanMedia(value: unknown): readonly SocialMediaReference[] {
  if (!Array.isArray(value)) return Object.freeze([]);
  return Object.freeze(
    value.slice(0, 10).flatMap((raw) => {
      if (!raw || typeof raw !== "object") return [];
      const item = raw as Record<string, unknown>;
      const type = item.type;
      const id = cleanSocialText(item.id, 160);
      const url = cleanSocialText(item.url, 1000);
      if (!id || !url || !["image", "video", "audio"].includes(String(type))) return [];
      return [{
        id,
        type: type as SocialMediaReference["type"],
        url,
        thumbnailUrl: cleanOptionalSocialText(item.thumbnailUrl, 1000),
        alt: cleanOptionalSocialText(item.alt, 300),
        width: typeof item.width === "number" ? item.width : null,
        height: typeof item.height === "number" ? item.height : null,
        durationMs: typeof item.durationMs === "number" ? item.durationMs : null,
      } satisfies SocialMediaReference];
    }),
  );
}

function cleanPlace(value: unknown): SocialPlaceReference | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const id = cleanSocialText(raw.id, 160);
  const name = cleanSocialText(raw.name, 160);
  if (!id || !name) return null;
  return {
    id,
    name,
    island: typeof raw.island === "string" ? (raw.island as SocialPlaceReference["island"]) : null,
    href: cleanOptionalSocialText(raw.href, 500),
  };
}

async function activeCommunityMember(userId: string, communityId: string) {
  const id = socialRelationId("community_member", communityId, userId);
  const snapshot = await getAdminDb().collection(COMMUNITY_MEMBERS).doc(id).get();
  return snapshot.exists && snapshot.data()?.status === "active";
}

async function acceptedFollower(viewerId: string, authorId: string) {
  const id = socialRelationId("follow", viewerId, authorId);
  const snapshot = await getAdminDb().collection(FOLLOWS).doc(id).get();
  return snapshot.exists && snapshot.data()?.status === "accepted";
}

async function canViewPost(viewerId: string | null, post: SocialPost) {
  if (post.deletedAt) return false;
  if (post.visibility === "public") return true;
  if (!viewerId) return false;
  if (post.authorId === viewerId) return true;
  if (post.visibility === "followers") return acceptedFollower(viewerId, post.authorId);
  if (post.visibility === "community" && post.communityId) {
    return activeCommunityMember(viewerId, post.communityId);
  }
  return false;
}

async function postView(post: SocialPost, viewerId: string | null): Promise<SocialPostView | null> {
  if (!(await canViewPost(viewerId, post))) return null;
  const author = await getSocialProfile(post.authorId);
  if (!author || author.state !== "active") return null;
  let viewerReaction: string | null = null;
  let viewerSaved = false;
  if (viewerId) {
    const [reaction, saved] = await Promise.all([
      getAdminDb().collection(REACTIONS).doc(reactionId(viewerId, "post", post.id)).get(),
      getAdminDb().collection(SAVED).doc(savedId(viewerId, post.id)).get(),
    ]);
    viewerReaction = reaction.exists ? String(reaction.data()?.emoji ?? "") || null : null;
    viewerSaved = saved.exists;
  }
  return Object.freeze({ ...post, author: publicSocialProfile(author), viewerReaction, viewerSaved });
}

export type CreateSocialPostInput = Readonly<{
  type?: unknown;
  body?: unknown;
  media?: unknown;
  visibility?: unknown;
  island?: unknown;
  communityId?: unknown;
  place?: unknown;
}>;

export async function createSocialPost(authorId: string, input: CreateSocialPostInput) {
  const profile = await getSocialProfile(authorId);
  if (!profile || profile.state !== "active") throw new Error("An active social profile is required.");
  const db = getAdminDb();
  const ref = db.collection(POSTS).doc();
  const now = socialNow();
  const type = POST_TYPES.has(input.type as SocialPostType) ? (input.type as SocialPostType) : "text";
  const visibility = VISIBILITY.has(input.visibility as SocialPostVisibility)
    ? (input.visibility as SocialPostVisibility)
    : "public";
  const body = cleanSocialText(input.body, 5000);
  const media = cleanMedia(input.media);
  const communityId = cleanOptionalSocialText(input.communityId, 160);
  if (!body && !media.length) throw new Error("Post must include text or media.");
  if ((visibility === "community" || communityId) && !communityId) {
    throw new Error("Community posts require a community id.");
  }
  if (communityId && !(await activeCommunityMember(authorId, communityId))) {
    throw new Error("Join this community before posting.");
  }

  const post: SocialPost = {
    version: 1,
    id: ref.id,
    authorId,
    type: communityId && type === "text" ? "community" : type,
    body,
    media,
    visibility: communityId ? "community" : visibility,
    island: typeof input.island === "string" ? (input.island as SocialPost["island"]) : profile.primaryIsland,
    communityId,
    place: cleanPlace(input.place),
    reactionCount: 0,
    commentCount: 0,
    shareCount: 0,
    saveCount: 0,
    createdAt: now,
    updatedAt: now,
    editedAt: null,
    deletedAt: null,
  };

  const batch = db.batch();
  batch.set(ref, post);
  batch.update(db.collection("socialProfiles").doc(authorId), {
    postCount: FieldValue.increment(1),
    updatedAt: now,
  });
  if (communityId) {
    batch.update(db.collection("socialCommunities").doc(communityId), {
      postCount: FieldValue.increment(1), updatedAt: now,
    });
  }
  await batch.commit();
  return postView(post, authorId);
}

export async function getSocialPost(postId: string, viewerId: string | null) {
  const snapshot = await getAdminDb().collection(POSTS).doc(postId).get();
  if (!snapshot.exists) return null;
  return postView(snapshot.data() as SocialPost, viewerId);
}

export async function listSocialFeed(
  viewerId: string | null,
  mode: "following" | "local" | "for_you" = "for_you",
  limit = 20,
): Promise<SocialFeedPage> {
  const db = getAdminDb();
  const requested = Math.max(1, Math.min(limit, 40));
  const snapshot = await db.collection(POSTS).orderBy("createdAt", "desc").limit(Math.min(160, requested * 5)).get();
  let following = new Set<string>();
  let island: string | null = null;
  if (viewerId) {
    const [ids, profile] = await Promise.all([listFollowingIds(viewerId), getSocialProfile(viewerId)]);
    following = new Set(ids);
    island = profile?.primaryIsland ?? null;
  }

  const candidates = snapshot.docs
    .map((doc) => doc.data() as SocialPost)
    .filter((post) => {
      if (mode === "following") return viewerId === post.authorId || following.has(post.authorId);
      if (mode === "local") return !island || post.island === island || post.island === null;
      return true;
    });
  const views = (await Promise.all(candidates.map((post) => postView(post, viewerId))))
    .filter((post): post is SocialPostView => Boolean(post))
    .slice(0, requested);
  return Object.freeze({ posts: Object.freeze(views), nextCursor: null });
}

export async function editSocialPost(authorId: string, postId: string, body: unknown) {
  const ref = getAdminDb().collection(POSTS).doc(postId);
  const snapshot = await ref.get();
  if (!snapshot.exists || snapshot.data()?.authorId !== authorId) throw new Error("Post was not found.");
  const cleaned = cleanSocialText(body, 5000);
  if (!cleaned && !(snapshot.data()?.media?.length > 0)) throw new Error("Post cannot be empty.");
  const now = socialNow();
  await ref.update({ body: cleaned, editedAt: now, updatedAt: now });
}

export async function deleteSocialPost(authorId: string, postId: string) {
  const db = getAdminDb();
  const ref = db.collection(POSTS).doc(postId);
  const now = socialNow();
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists || snapshot.data()?.authorId !== authorId) throw new Error("Post was not found.");
    if (snapshot.data()?.deletedAt) return;
    transaction.update(ref, { body: "", media: [], deletedAt: now, updatedAt: now });
    transaction.update(db.collection("socialProfiles").doc(authorId), {
      postCount: FieldValue.increment(-1), updatedAt: now,
    });
  });
}

export async function createSocialComment(
  authorId: string,
  postId: string,
  body: unknown,
  parentCommentId?: string | null,
) {
  const post = await getSocialPost(postId, authorId);
  if (!post) throw new Error("Post is unavailable.");
  const cleaned = cleanSocialText(body, 2000);
  if (!cleaned) throw new Error("Comment cannot be empty.");
  const db = getAdminDb();
  const ref = db.collection(COMMENTS).doc();
  const now = socialNow();
  const parentId = parentCommentId ? cleanSocialText(parentCommentId, 160) : null;
  if (parentId) {
    const parent = await db.collection(COMMENTS).doc(parentId).get();
    if (!parent.exists || parent.data()?.postId !== postId) throw new Error("Reply target was not found.");
  }
  const comment: SocialComment = {
    version: 1,
    id: ref.id,
    postId,
    authorId,
    parentCommentId: parentId,
    body: cleaned,
    reactionCount: 0,
    createdAt: now,
    updatedAt: now,
    editedAt: null,
    deletedAt: null,
  };
  const batch = db.batch();
  batch.set(ref, comment);
  batch.update(db.collection(POSTS).doc(postId), { commentCount: FieldValue.increment(1), updatedAt: now });
  await batch.commit();

  await createSocialNotification({
    userId: parentId ? String((await db.collection(COMMENTS).doc(parentId).get()).data()?.authorId ?? post.authorId) : post.authorId,
    actorId: authorId,
    type: parentId ? "reply" : "comment",
    title: parentId ? "New reply" : "New comment",
    body: cleaned.slice(0, 140),
    href: `/post/${postId}`,
    dedupeKey: comment.id,
  });
  return comment;
}

export async function listSocialComments(postId: string, limit = 100) {
  const snapshot = await getAdminDb()
    .collection(COMMENTS)
    .where("postId", "==", postId)
    .orderBy("createdAt", "asc")
    .limit(Math.max(1, Math.min(limit, 200)))
    .get();
  return snapshot.docs.map((doc) => doc.data() as SocialComment).filter((comment) => !comment.deletedAt);
}

export async function setSocialReaction(
  actorId: string,
  targetType: "post" | "comment",
  targetId: string,
  emoji: unknown,
) {
  const normalizedEmoji = cleanSocialText(emoji, 8);
  if (!ALLOWED_EMOJI.has(normalizedEmoji)) throw new Error("Unsupported reaction.");
  const db = getAdminDb();
  const ref = db.collection(REACTIONS).doc(reactionId(actorId, targetType, targetId));
  const targetRef = db.collection(targetType === "post" ? POSTS : COMMENTS).doc(targetId);
  const now = socialNow();
  await db.runTransaction(async (transaction) => {
    const [target, current] = await Promise.all([transaction.get(targetRef), transaction.get(ref)]);
    if (!target.exists) throw new Error("Reaction target was not found.");
    const reaction: SocialReaction = {
      version: 1,
      id: ref.id,
      actorId,
      targetType,
      targetId,
      emoji: normalizedEmoji,
      createdAt: current.exists ? String(current.data()?.createdAt ?? now) : now,
      updatedAt: now,
    };
    transaction.set(ref, reaction);
    if (!current.exists) transaction.update(targetRef, { reactionCount: FieldValue.increment(1), updatedAt: now });
  });
}

export async function removeSocialReaction(actorId: string, targetType: "post" | "comment", targetId: string) {
  const db = getAdminDb();
  const ref = db.collection(REACTIONS).doc(reactionId(actorId, targetType, targetId));
  const targetRef = db.collection(targetType === "post" ? POSTS : COMMENTS).doc(targetId);
  await db.runTransaction(async (transaction) => {
    const current = await transaction.get(ref);
    if (!current.exists) return;
    transaction.delete(ref);
    transaction.update(targetRef, { reactionCount: FieldValue.increment(-1), updatedAt: socialNow() });
  });
}

export async function setSocialPostSaved(userId: string, postId: string, saved: boolean) {
  const db = getAdminDb();
  const ref = db.collection(SAVED).doc(savedId(userId, postId));
  const postRef = db.collection(POSTS).doc(postId);
  const now = socialNow();
  await db.runTransaction(async (transaction) => {
    const [post, current] = await Promise.all([transaction.get(postRef), transaction.get(ref)]);
    if (!post.exists) throw new Error("Post was not found.");
    if (saved && !current.exists) {
      const item: SocialSavedItem = { version: 1, id: ref.id, userId, itemType: "post", itemId: postId, createdAt: now };
      transaction.set(ref, item);
      transaction.update(postRef, { saveCount: FieldValue.increment(1), updatedAt: now });
    } else if (!saved && current.exists) {
      transaction.delete(ref);
      transaction.update(postRef, { saveCount: FieldValue.increment(-1), updatedAt: now });
    }
  });
}
