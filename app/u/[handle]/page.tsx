import { PublicSocialProfileScreen } from "@/components/social/public-profile-screen";

export const dynamic = "force-dynamic";

export default function PublicSocialProfilePage({ params }: { params: { handle: string } }) {
  return <PublicSocialProfileScreen handle={params.handle} />;
}
