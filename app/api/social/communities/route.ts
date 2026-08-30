import type { NextRequest } from "next/server";

import {
  createSocialCommunity,
  listSocialCommunities,
} from "@/lib/social/community-service";
import { socialErrorResponse, socialJson, readJsonObject } from "@/lib/social/http";
import { ensureSocialProfile } from "@/lib/social/profile-service";
import { enforceSocialRateLimit } from "@/lib/social/rate-limit";
import { verifiedSocialIdentity } from "@/lib/social/server-auth";
import { boundedSocialLimit } from "@/lib/social/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q") ?? "";
    const limit = boundedSocialLimit(request.nextUrl.searchParams.get("limit"), 40, 80);
    return socialJson({ communities: await listSocialCommunities(query, limit) });
  } catch (error) {
    return socialErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const identity = await verifiedSocialIdentity(request);
    await ensureSocialProfile(identity);
    await enforceSocialRateLimit(identity.uid, "create_community", { max: 5, windowSeconds: 86400 });
    const body = await readJsonObject(request);
    return socialJson({ community: await createSocialCommunity(identity.uid, body) }, { status: 201 });
  } catch (error) {
    return socialErrorResponse(error);
  }
}
