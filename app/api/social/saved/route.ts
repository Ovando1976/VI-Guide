import type { NextRequest } from "next/server";

import { socialErrorResponse, socialJson, readJsonObject } from "@/lib/social/http";
import { setSocialPostSaved } from "@/lib/social/post-service";
import { verifiedSocialIdentity } from "@/lib/social/server-auth";
import { cleanSocialText } from "@/lib/social/utils";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const identity = await verifiedSocialIdentity(request);
    const body = await readJsonObject(request);
    const postId = cleanSocialText(body.postId, 160);
    if (!postId) throw new Error("Post is required.");
    await setSocialPostSaved(identity.uid, postId, body.saved !== false);
    return socialJson({ ok: true });
  } catch (error) {
    return socialErrorResponse(error);
  }
}
