import type { NextRequest } from "next/server";

import { getAdminDb } from "@/lib/firebase-admin";
import { socialErrorResponse, socialJson, readJsonObject } from "@/lib/social/http";
import { createSocialComment, listSocialComments } from "@/lib/social/post-service";
import { enforceSocialRateLimit } from "@/lib/social/rate-limit";
import { verifiedSocialIdentity } from "@/lib/social/server-auth";
import { boundedSocialLimit, cleanSocialText } from "@/lib/social/utils";
import type { SocialComment } from "@/types/social";

export const dynamic = "force-dynamic";
type RouteContext = { params: { postId: string } };

function missingCompositeIndex(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: unknown; message?: unknown; details?: unknown };
  return (
    candidate.code === 9 ||
    /requires an index/i.test(String(candidate.message ?? candidate.details ?? ""))
  );
}

async function listCommentsWithProvisioningFallback(postId: string, limit: number) {
  try {
    return await listSocialComments(postId, limit);
  } catch (error) {
    if (!missingCompositeIndex(error)) throw error;

    // Temporary release-safety path while the declared Firestore composite index
    // is still provisioning. Equality-only queries use Firestore's automatic
    // single-field index. Keep the fallback strictly bounded so a missing index
    // cannot turn into an unbounded production read.
    const snapshot = await getAdminDb()
      .collection("socialComments")
      .where("postId", "==", postId)
      .limit(501)
      .get();

    if (snapshot.size > 500) {
      throw new Error(
        "Comment history requires the production Firestore composite index before serving more than 500 comments.",
      );
    }

    return snapshot.docs
      .map((doc) => doc.data() as SocialComment)
      .filter((comment) => !comment.deletedAt)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
      .slice(0, limit);
  }
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const limit = boundedSocialLimit(request.nextUrl.searchParams.get("limit"), 100, 200);
    return socialJson({ comments: await listCommentsWithProvisioningFallback(params.postId, limit) });
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
