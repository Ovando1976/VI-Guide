import type { NextRequest } from "next/server";

import {
  acceptFollowRequest,
  declineFollowRequest,
  followSocialUser,
  getFollowRelationship,
  unfollowSocialUser,
} from "@/lib/social/graph-service";
import { socialErrorResponse, socialJson, readJsonObject } from "@/lib/social/http";
import { createSocialNotification } from "@/lib/social/notification-service";
import { ensureSocialProfile, getSocialProfile } from "@/lib/social/profile-service";
import { enforceSocialRateLimit } from "@/lib/social/rate-limit";
import { verifiedSocialIdentity } from "@/lib/social/server-auth";
import { cleanSocialText } from "@/lib/social/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const identity = await verifiedSocialIdentity(request);
    await ensureSocialProfile(identity);
    const targetUserId = cleanSocialText(request.nextUrl.searchParams.get("userId"), 160);
    if (!targetUserId) throw new Error("Target user is required.");
    return socialJson({ relationship: await getFollowRelationship(identity.uid, targetUserId) });
  } catch (error) {
    return socialErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const identity = await verifiedSocialIdentity(request);
    const viewer = await ensureSocialProfile(identity);
    await enforceSocialRateLimit(identity.uid, "follow", { max: 40, windowSeconds: 3600 });
    const body = await readJsonObject(request);
    const targetUserId = cleanSocialText(body.targetUserId, 160);
    const action = cleanSocialText(body.action, 30) || "follow";
    if (!targetUserId) throw new Error("Target user is required.");

    if (action === "accept") {
      await acceptFollowRequest(identity.uid, targetUserId);
      await createSocialNotification({
        userId: targetUserId,
        actorId: identity.uid,
        type: "follow_accepted",
        title: `${viewer.displayName} accepted your follow request`,
        body: "You can now see follower-only updates.",
        href: `/u/${viewer.handle}`,
        dedupeKey: `accepted:${identity.uid}:${targetUserId}`,
      });
      return socialJson({ ok: true });
    }
    if (action === "decline") {
      await declineFollowRequest(identity.uid, targetUserId);
      return socialJson({ ok: true });
    }

    const follow = await followSocialUser(identity.uid, targetUserId);
    const target = await getSocialProfile(targetUserId);
    if (target) {
      await createSocialNotification({
        userId: targetUserId,
        actorId: identity.uid,
        type: follow.status === "pending" ? "follow_request" : "follow",
        title: follow.status === "pending" ? `${viewer.displayName} requested to follow you` : `${viewer.displayName} followed you`,
        body: follow.status === "pending" ? "Review the request from your social profile." : `@${viewer.handle} is now following you.`,
        href: `/u/${viewer.handle}`,
        dedupeKey: follow.id,
      });
    }
    return socialJson({ follow });
  } catch (error) {
    return socialErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const identity = await verifiedSocialIdentity(request);
    const body = await readJsonObject(request);
    const targetUserId = cleanSocialText(body.targetUserId, 160);
    if (!targetUserId) throw new Error("Target user is required.");
    await unfollowSocialUser(identity.uid, targetUserId);
    return socialJson({ ok: true });
  } catch (error) {
    return socialErrorResponse(error);
  }
}
