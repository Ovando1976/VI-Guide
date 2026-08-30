import type { NextRequest } from "next/server";

import { socialErrorResponse, socialJson, readJsonObject } from "@/lib/social/http";
import { createSocialComment, listSocialComments } from "@/lib/social/post-service";
import { enforceSocialRateLimit } from "@/lib/social/rate-limit";
import { verifiedSocialIdentity } from "@/lib/social/server-auth";
import { boundedSocialLimit, cleanSocialText } from "@/lib/social/utils";

export const dynamic = "force-dynamic";
type RouteContext = { params: { postId: string } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const limit = boundedSocialLimit(request.nextUrl.searchParams.get("limit"), 100, 200);
    return socialJson({ comments: await listSocialComments(params.postId, limit) });
  } catch (error) {
    return socialErrorResponse(error);
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const identity = await verifiedSocialIdentity(request);
    await enforceSocialRateLimit(identity.uid, "create_comment", { max: 80, windowSeconds: 3600 });
    const body = await readJsonObject(request);
    const parentCommentId = cleanSocialText(body.parentCommentId, 160) || null;
    const comment = await createSocialComment(identity.uid, params.postId, body.body, parentCommentId);
    return socialJson({ comment }, { status: 201 });
  } catch (error) {
    return socialErrorResponse(error);
  }
}
