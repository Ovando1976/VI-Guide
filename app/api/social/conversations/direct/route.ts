import type { NextRequest } from "next/server";

import { ensureDirectSocialConversation } from "@/lib/social/conversation-service";
import { socialErrorResponse, socialJson, readJsonObject } from "@/lib/social/http";
import { ensureSocialProfile } from "@/lib/social/profile-service";
import { enforceSocialRateLimit } from "@/lib/social/rate-limit";
import { verifiedSocialIdentity } from "@/lib/social/server-auth";
import { cleanSocialText } from "@/lib/social/utils";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const identity = await verifiedSocialIdentity(request);
    await ensureSocialProfile(identity);
    await enforceSocialRateLimit(identity.uid, "start_dm", { max: 30, windowSeconds: 3600 });
    const body = await readJsonObject(request);
    const targetUserId = cleanSocialText(body.targetUserId, 160);
    if (!targetUserId) throw new Error("Target user is required.");
    return socialJson(await ensureDirectSocialConversation(identity.uid, targetUserId));
  } catch (error) {
    return socialErrorResponse(error);
  }
}
