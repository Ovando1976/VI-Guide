import type { NextRequest } from "next/server";

import {
  listSocialConversationInbox,
  markSocialConversationRead,
  setSocialConversationPinned,
} from "@/lib/social/conversation-service";
import { socialErrorResponse, socialJson, readJsonObject } from "@/lib/social/http";
import { verifiedSocialIdentity } from "@/lib/social/server-auth";
import { boundedSocialLimit, cleanSocialText } from "@/lib/social/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const identity = await verifiedSocialIdentity(request);
    const limit = boundedSocialLimit(request.nextUrl.searchParams.get("limit"), 50, 100);
    return socialJson({ conversations: await listSocialConversationInbox(identity.uid, limit) });
  } catch (error) {
    return socialErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const identity = await verifiedSocialIdentity(request);
    const body = await readJsonObject(request);
    const conversationId = cleanSocialText(body.conversationId, 160);
    if (!conversationId) throw new Error("Conversation is required.");
    if (body.action === "pin") {
      await setSocialConversationPinned(identity.uid, conversationId, Boolean(body.pinned));
    } else {
      await markSocialConversationRead(identity.uid, conversationId, cleanSocialText(body.messageId, 160) || null);
    }
    return socialJson({ ok: true });
  } catch (error) {
    return socialErrorResponse(error);
  }
}
