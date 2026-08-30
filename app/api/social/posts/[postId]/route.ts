import type { NextRequest } from "next/server";

import { socialErrorResponse, socialJson, readJsonObject } from "@/lib/social/http";
import { deleteSocialPost, editSocialPost, getSocialPost } from "@/lib/social/post-service";
import { verifiedSocialIdentity } from "@/lib/social/server-auth";

export const dynamic = "force-dynamic";

type RouteContext = { params: { postId: string } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    let viewerId: string | null = null;
    try { viewerId = (await verifiedSocialIdentity(request)).uid; } catch { viewerId = null; }
    const post = await getSocialPost(params.postId, viewerId);
    if (!post) return socialJson({ error: "Post was not found." }, { status: 404 });
    return socialJson({ post });
  } catch (error) {
    return socialErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const identity = await verifiedSocialIdentity(request);
    const body = await readJsonObject(request);
    await editSocialPost(identity.uid, params.postId, body.body);
    return socialJson({ post: await getSocialPost(params.postId, identity.uid) });
  } catch (error) {
    return socialErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const identity = await verifiedSocialIdentity(request);
    await deleteSocialPost(identity.uid, params.postId);
    return socialJson({ ok: true });
  } catch (error) {
    return socialErrorResponse(error);
  }
}
