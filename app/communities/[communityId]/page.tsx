import { SocialCommunityScreen } from "@/components/social/social-community-screen";

export const dynamic = "force-dynamic";

export default function SocialCommunityPage({ params }: { params: { communityId: string } }) {
  return <SocialCommunityScreen communityId={params.communityId} />;
}
