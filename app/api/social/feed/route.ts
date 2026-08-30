import type { NextRequest } from "next/server";

import { listSocialFeed } from "@/lib/social/post-service";
import { socialErrorResponse, socialJson } from "@/lib/social/http";
import { verifiedSocialIdentity } from "@/lib/social/server-auth";
import { boundedSocialLimit } from "@/lib/social/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    let viewerId: string | null = null;
    try {
      viewerId = (await verifiedSocialIdentity(request)).uid;
    } catch {
      viewerId = null;
    }
    const rawMode = request.nextUrl.searchParams.get("mode");
    const mode = rawMode === "following" || rawMode === "local" ? rawMode : "for_you";
    const limit = boundedSocialLimit(request.nextUrl.searchParams.get("limit"), 20, 40);
    return socialJson(await listSocialFeed(viewerId, mode, limit));
  } catch (error) {
    return socialErrorResponse(error);
  }
}
