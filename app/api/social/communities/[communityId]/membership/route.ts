import type { NextRequest } from "next/server";

import {
  approveCommunityMember,
  getCommunityMembership,
  joinSocialCommunity,
  leaveSocialCommunity,
} from "@/lib/social/community-service";
import { socialErrorResponse, socialJson, readJsonObject } from "@/lib/social/http";
import { verifiedSocialIdentity } from "@/lib/social/server-auth";
import { cleanSocialText } from "@/lib/social/utils";

export const dynamic = "force-dynamic";
type RouteContext = { params: { communityId: string } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const identity = await verifiedSocialIdentity(request);
    return socialJson({ membership: await getCommunityMembership(params.communityId, identity.uid) });
  } catch (error) {
    return socialErrorResponse(error);
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const identity = await verifiedSocialIdentity(request);
    const body = await readJsonObject(request).catch(() => ({}));
    const action = cleanSocialText(body.action, 20) || "join";
    if (action === "approve") {
      const userId = cleanSocialText(body.userId, 160);
      if (!userId) throw new Error("Member is required.");
      await approveCommunityMember(identity.uid, params.communityId, userId);
      return socialJson({ ok: true });
    }
    return socialJson({ membership: await joinSocialCommunity(identity.uid, params.communityId) });
  } catch (error) {
    return socialErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const identity = await verifiedSocialIdentity(request);
    await leaveSocialCommunity(identity.uid, params.communityId);
    return socialJson({ ok: true });
  } catch (error) {
    return socialErrorResponse(error);
  }
}
