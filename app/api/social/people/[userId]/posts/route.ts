import type { NextRequest } from "next/server";

import { socialErrorResponse, socialJson } from "@/lib/social/http";
import { listSocialProfilePosts } from "@/lib/social/profile-posts";
import { verifiedSocialIdentity } from "@/lib/social/server-auth";
import { boundedSocialLimit } from "@/lib/social/utils";

export const dynamic = "force-dynamic";
type RouteContext = { params: { userId: string } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    let viewerId: string | null = null;
    try { viewerId = (await verifiedSocialIdentity(request)).uid; } catch { viewerId = null; }
    const limit = boundedSocialLimit(request.nextUrl.searchParams.get("limit"), 30, 50);
    return socialJson({ posts: await listSocialProfilePosts(params.userId, viewerId, limit) });
  } catch (error) {
    return socialErrorResponse(error);
  }
}
