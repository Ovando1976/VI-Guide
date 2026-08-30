import type { NextRequest } from "next/server";

import {
  blockSocialUser,
  muteSocialUser,
  unblockSocialUser,
  unmuteSocialUser,
} from "@/lib/social/graph-service";
import { socialErrorResponse, socialJson, readJsonObject } from "@/lib/social/http";
import { verifiedSocialIdentity } from "@/lib/social/server-auth";
import { cleanSocialText } from "@/lib/social/utils";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const identity = await verifiedSocialIdentity(request);
    const body = await readJsonObject(request);
    const targetUserId = cleanSocialText(body.targetUserId, 160);
    const action = cleanSocialText(body.action, 20) || "block";
    if (!targetUserId) throw new Error("Target user is required.");
    if (action === "mute") return socialJson({ mute: await muteSocialUser(identity.uid, targetUserId) });
    const id = await blockSocialUser(identity.uid, targetUserId);
    return socialJson({ blockId: id });
  } catch (error) {
    return socialErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const identity = await verifiedSocialIdentity(request);
    const body = await readJsonObject(request);
    const targetUserId = cleanSocialText(body.targetUserId, 160);
    const action = cleanSocialText(body.action, 20) || "block";
    if (!targetUserId) throw new Error("Target user is required.");
    if (action === "mute") await unmuteSocialUser(identity.uid, targetUserId);
    else await unblockSocialUser(identity.uid, targetUserId);
    return socialJson({ ok: true });
  } catch (error) {
    return socialErrorResponse(error);
  }
}
