import { SocialPostDetailScreen } from "@/components/social/social-post-detail-screen";

export const dynamic = "force-dynamic";

export default function SocialPostPage({ params }: { params: { postId: string } }) {
  return <SocialPostDetailScreen postId={params.postId} />;
}
