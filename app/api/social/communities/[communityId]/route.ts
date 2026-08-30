import type { NextRequest } from "next/server";

import { getSocialCommunity, getCommunityMembership } from "@/lib/social/community-service";
import { listCommunitySocialPosts } from "@/lib/social/community-posts";
import { socialErrorResponse, socialJson } from "@/lib/social/http";
import { verifiedSocialIdentity } from "@/lib/social/server-auth";

export const dynamic = "force-dynamic";
type RouteContext = { params: { communityId: string } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    let viewerId: string | null = null;
    try { viewerId = (await verifiedSocialIdentity(request)).uid; } catch { viewerId = null; }
    const community = await getSocialCommunity(params.communityId);
    if (!community) return socialJson({ error: "Community was not found." }, { status: 404 });
    const [membership, posts] = await Promise.all([
      viewerId ? getCommunityMembership(params.communityId, viewerId) : Promise.resolve(null),
      listCommunitySocialPosts(params.communityId, viewerId, 30),
    ]);
    return socialJson({ community, membership, posts });
  } catch (error) {
    return socialErrorResponse(error);
  }
}
