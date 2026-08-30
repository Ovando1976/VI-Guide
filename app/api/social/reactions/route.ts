import type { NextRequest } from "next/server";

import { socialErrorResponse, socialJson, readJsonObject } from "@/lib/social/http";
import { removeSocialReaction, setSocialReaction } from "@/lib/social/post-service";
import { verifiedSocialIdentity } from "@/lib/social/server-auth";
import { cleanSocialText } from "@/lib/social/utils";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const identity = await verifiedSocialIdentity(request);
    const body = await readJsonObject(request);
    const targetType = body.targetType === "comment" ? "comment" : "post";
    const targetId = cleanSocialText(body.targetId, 160);
    if (!targetId) throw new Error("Reaction target is required.");
    await setSocialReaction(identity.uid, targetType, targetId, body.emoji);
    return socialJson({ ok: true });
  } catch (error) {
    return socialErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const identity = await verifiedSocialIdentity(request);
    const body = await readJsonObject(request);
    const targetType = body.targetType === "comment" ? "comment" : "post";
    const targetId = cleanSocialText(body.targetId, 160);
    if (!targetId) throw new Error("Reaction target is required.");
    await removeSocialReaction(identity.uid, targetType, targetId);
    return socialJson({ ok: true });
  } catch (error) {
    return socialErrorResponse(error);
  }
}
