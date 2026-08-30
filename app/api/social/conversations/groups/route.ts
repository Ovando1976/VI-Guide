import type { NextRequest } from "next/server";

import {
  addSocialGroupMember,
  createSocialGroupConversation,
  removeSocialGroupMember,
} from "@/lib/social/conversation-service";
import { socialErrorResponse, socialJson, readJsonObject } from "@/lib/social/http";
import { ensureSocialProfile } from "@/lib/social/profile-service";
import { enforceSocialRateLimit } from "@/lib/social/rate-limit";
import { verifiedSocialIdentity } from "@/lib/social/server-auth";
import { cleanSocialText, uniqueStrings } from "@/lib/social/utils";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const identity = await verifiedSocialIdentity(request);
    await ensureSocialProfile(identity);
    await enforceSocialRateLimit(identity.uid, "create_group", { max: 10, windowSeconds: 3600 });
    const body = await readJsonObject(request);
    const title = cleanSocialText(body.title, 120);
    const memberIds = uniqueStrings(body.memberIds, 49, 160);
    return socialJson(await createSocialGroupConversation(identity.uid, memberIds, title));
  } catch (error) {
    return socialErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const identity = await verifiedSocialIdentity(request);
    const body = await readJsonObject(request);
    const conversationId = cleanSocialText(body.conversationId, 160);
    const memberUserId = cleanSocialText(body.memberUserId, 160);
    const action = cleanSocialText(body.action, 20);
    if (!conversationId || !memberUserId) throw new Error("Conversation and member are required.");
    if (action === "remove") await removeSocialGroupMember(identity.uid, conversationId, memberUserId);
    else await addSocialGroupMember(identity.uid, conversationId, memberUserId);
    return socialJson({ ok: true });
  } catch (error) {
    return socialErrorResponse(error);
  }
}
