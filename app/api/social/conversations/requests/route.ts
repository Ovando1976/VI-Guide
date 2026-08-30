import type { NextRequest } from "next/server";

import { respondToSocialMessageRequest } from "@/lib/social/conversation-service";
import { readJsonObject, socialErrorResponse, socialJson } from "@/lib/social/http";
import { verifiedSocialIdentity } from "@/lib/social/server-auth";
import { cleanSocialText } from "@/lib/social/utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const identity = await verifiedSocialIdentity(request);
    const body = await readJsonObject(request);
    const conversationId = cleanSocialText(body.conversationId, 160);
    const action = cleanSocialText(body.action, 20);
    if (!conversationId) throw new Error("Conversation is required.");
    if (action !== "accept" && action !== "decline") throw new Error("Message request action is invalid.");
    return socialJson(await respondToSocialMessageRequest(identity.uid, conversationId, action));
  } catch (error) {
    return socialErrorResponse(error);
  }
}
