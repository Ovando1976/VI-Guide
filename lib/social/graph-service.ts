import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase-admin";
import { getSocialProfile } from "@/lib/social/profile-service";
import { socialNow, socialRelationId } from "@/lib/social/utils";
import type { SocialBlock, SocialFollow, SocialFollowStatus, SocialMute } from "@/types/social";

const FOLLOWS = "socialFollows";
const BLOCKS = "socialBlocks";
const MUTES = "socialMutes";
const PROFILES = "socialProfiles";

function followId(followerId: string, targetId: string) {
  return socialRelationId("follow", followerId, targetId);
}
function blockId(blockerId: string, blockedId: string) {
  return socialRelationId("block", blockerId, blockedId);
}
function muteId(muterId: string, mutedId: string) {
  return socialRelationId("mute", muterId, mutedId);
}

export async function isBlockedBetween(leftId: string, rightId: string) {
  const db = getAdminDb();
  const [left, right] = await Promise.all([
    db.collection(BLOCKS).doc(blockId(leftId, rightId)).get(),
    db.collection(BLOCKS).doc(blockId(rightId, leftId)).get(),
  ]);
  return left.exists || right.exists;
}

export async function getFollowRelationship(viewerId: string, targetId: string) {
  const db = getAdminDb();
  const [outgoing, incoming, blocked, blockedBy] = await Promise.all([
    db.collection(FOLLOWS).doc(followId(viewerId, targetId)).get(),
    db.collection(FOLLOWS).doc(followId(targetId, viewerId)).get(),
    db.collection(BLOCKS).doc(blockId(viewerId, targetId)).get(),
    db.collection(BLOCKS).doc(blockId(targetId, viewerId)).get(),
  ]);
  return Object.freeze({
    outgoing: outgoing.exists ? (outgoing.data() as SocialFollow) : null,
    incoming: incoming.exists ? (incoming.data() as SocialFollow) : null,
    blocked: blocked.exists,
    blockedBy: blockedBy.exists,
  });
}

export async function followSocialUser(followerId: string, targetId: string) {
  if (followerId === targetId) throw new Error("You cannot follow yourself.");
  if (await isBlockedBetween(followerId, targetId)) {
    throw new Error("This relationship is unavailable.");
  }
  const target = await getSocialProfile(targetId);
  if (!target || target.state !== "active") throw new Error("Profile was not found.");

  const db = getAdminDb();
  const ref = db.collection(FOLLOWS).doc(followId(followerId, targetId));
  const followerProfileRef = db.collection(PROFILES).doc(followerId);
  const targetProfileRef = db.collection(PROFILES).doc(targetId);
  const now = socialNow();
  const nextStatus: SocialFollowStatus = target.privacyMode === "private" ? "pending" : "accepted";

  await db.runTransaction(async (transaction) => {
    const current = await transaction.get(ref);
    const currentData = current.exists ? (current.data() as SocialFollow) : null;
    if (currentData?.status === "accepted" || currentData?.status === "pending") return;

    const follow: SocialFollow = {
      version: 1,
      id: ref.id,
      followerId,
      targetId,
      status: nextStatus,
      createdAt: currentData?.createdAt ?? now,
      updatedAt: now,
    };
    transaction.set(ref, follow);
    if (nextStatus === "accepted") {
      transaction.update(followerProfileRef, {
        followingCount: FieldValue.increment(1),
        updatedAt: now,
      });
      transaction.update(targetProfileRef, {
        followerCount: FieldValue.increment(1),
        updatedAt: now,
      });
    }
  });

  const snapshot = await ref.get();
  return snapshot.data() as SocialFollow;
}

export async function acceptFollowRequest(targetId: string, followerId: string) {
  const db = getAdminDb();
  const ref = db.collection(FOLLOWS).doc(followId(followerId, targetId));
  const now = socialNow();

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) throw new Error("Follow request was not found.");
    const current = snapshot.data() as SocialFollow;
    if (current.targetId !== targetId) throw new Error("Follow request is not authorized.");
    if (current.status === "accepted") return;
    if (current.status !== "pending") throw new Error("Follow request is no longer pending.");
    transaction.update(ref, { status: "accepted", updatedAt: now });
    transaction.update(db.collection(PROFILES).doc(followerId), {
      followingCount: FieldValue.increment(1),
      updatedAt: now,
    });
    transaction.update(db.collection(PROFILES).doc(targetId), {
      followerCount: FieldValue.increment(1),
      updatedAt: now,
    });
  });
}

export async function declineFollowRequest(targetId: string, followerId: string) {
  const ref = getAdminDb().collection(FOLLOWS).doc(followId(followerId, targetId));
  const snapshot = await ref.get();
  if (!snapshot.exists || snapshot.data()?.targetId !== targetId) {
    throw new Error("Follow request was not found.");
  }
  await ref.set({ status: "declined", updatedAt: socialNow() }, { merge: true });
}

export async function unfollowSocialUser(followerId: string, targetId: string) {
  const db = getAdminDb();
  const ref = db.collection(FOLLOWS).doc(followId(followerId, targetId));
  const now = socialNow();
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) return;
    const current = snapshot.data() as SocialFollow;
    transaction.delete(ref);
    if (current.status === "accepted") {
      transaction.update(db.collection(PROFILES).doc(followerId), {
        followingCount: FieldValue.increment(-1),
        updatedAt: now,
      });
      transaction.update(db.collection(PROFILES).doc(targetId), {
        followerCount: FieldValue.increment(-1),
        updatedAt: now,
      });
    }
  });
}

export async function blockSocialUser(blockerId: string, blockedId: string) {
  if (blockerId === blockedId) throw new Error("You cannot block yourself.");
  const db = getAdminDb();
  const now = socialNow();
  const blockRef = db.collection(BLOCKS).doc(blockId(blockerId, blockedId));
  const outgoingRef = db.collection(FOLLOWS).doc(followId(blockerId, blockedId));
  const incomingRef = db.collection(FOLLOWS).doc(followId(blockedId, blockerId));

  await db.runTransaction(async (transaction) => {
    const [existingBlock, outgoing, incoming] = await Promise.all([
      transaction.get(blockRef),
      transaction.get(outgoingRef),
      transaction.get(incomingRef),
    ]);
    if (!existingBlock.exists) {
      const block: SocialBlock = {
        version: 1,
        id: blockRef.id,
        blockerId,
        blockedId,
        createdAt: now,
      };
      transaction.set(blockRef, block);
    }
    const outgoingData = outgoing.exists ? (outgoing.data() as SocialFollow) : null;
    const incomingData = incoming.exists ? (incoming.data() as SocialFollow) : null;
    if (outgoing.exists) transaction.delete(outgoingRef);
    if (incoming.exists) transaction.delete(incomingRef);

    if (outgoingData?.status === "accepted") {
      transaction.update(db.collection(PROFILES).doc(blockerId), {
        followingCount: FieldValue.increment(-1), updatedAt: now,
      });
      transaction.update(db.collection(PROFILES).doc(blockedId), {
        followerCount: FieldValue.increment(-1), updatedAt: now,
      });
    }
    if (incomingData?.status === "accepted") {
      transaction.update(db.collection(PROFILES).doc(blockedId), {
        followingCount: FieldValue.increment(-1), updatedAt: now,
      });
      transaction.update(db.collection(PROFILES).doc(blockerId), {
        followerCount: FieldValue.increment(-1), updatedAt: now,
      });
    }
  });
  return blockRef.id;
}

export async function unblockSocialUser(blockerId: string, blockedId: string) {
  await getAdminDb().collection(BLOCKS).doc(blockId(blockerId, blockedId)).delete();
}

export async function muteSocialUser(muterId: string, mutedId: string) {
  if (muterId === mutedId) throw new Error("You cannot mute yourself.");
  const ref = getAdminDb().collection(MUTES).doc(muteId(muterId, mutedId));
  const mute: SocialMute = {
    version: 1,
    id: ref.id,
    muterId,
    mutedId,
    createdAt: socialNow(),
  };
  await ref.set(mute);
  return mute;
}

export async function unmuteSocialUser(muterId: string, mutedId: string) {
  await getAdminDb().collection(MUTES).doc(muteId(muterId, mutedId)).delete();
}

export async function listFollowingIds(userId: string, limit = 500) {
  const snapshot = await getAdminDb()
    .collection(FOLLOWS)
    .where("followerId", "==", userId)
    .where("status", "==", "accepted")
    .limit(Math.max(1, Math.min(limit, 1000)))
    .get();
  return snapshot.docs.map((doc) => (doc.data() as SocialFollow).targetId);
}
