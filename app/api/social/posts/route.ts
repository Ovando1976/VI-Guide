import type { NextRequest } from "next/server";

import { socialErrorResponse, socialJson, readJsonObject } from "@/lib/social/http";
import { createSocialPost } from "@/lib/social/post-service";
import { ensureSocialProfile } from "@/lib/social/profile-service";
import { enforceSocialRateLimit } from "@/lib/social/rate-limit";
import { verifiedSocialIdentity } from "@/lib/social/server-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const identity = await verifiedSocialIdentity(request);
    await ensureSocialProfile(identity);
    await enforceSocialRateLimit(identity.uid, "create_post", { max: 30, windowSeconds: 3600 });
    const body = await readJsonObject(request);
    return socialJson({ post: await createSocialPost(identity.uid, body) }, { status: 201 });
  } catch (error) {
    return socialErrorResponse(error);
  }
}
