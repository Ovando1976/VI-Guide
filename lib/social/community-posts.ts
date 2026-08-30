import { getAdminDb } from "@/lib/firebase-admin";
import { getSocialPost } from "@/lib/social/post-service";
import type { SocialPost, SocialPostView } from "@/types/social";

export async function listCommunitySocialPosts(communityId: string, viewerId: string | null, limit = 30) {
  const snapshot = await getAdminDb().collection("socialPosts").where("communityId", "==", communityId).limit(Math.max(30, Math.min(limit * 3, 100))).get();
  const candidates = snapshot.docs
    .map((doc) => doc.data() as SocialPost)
    .filter((post) => !post.deletedAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
  const views = await Promise.all(candidates.map((post) => getSocialPost(post.id, viewerId)));
  return views.filter((post): post is SocialPostView => Boolean(post));
}
