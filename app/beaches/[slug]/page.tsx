import { DirectoryDetailScreen } from "@/components/directory/directory-detail-screen";
import { LiveBeachDetailScreen } from "@/components/beaches/live-beach-detail-screen";

export default function BeachDetailPage({ params }: { params: { slug: string } }) {
  if (looksLikeGooglePlaceId(params.slug)) {
    return <LiveBeachDetailScreen placeId={params.slug} />;
  }

  return <DirectoryDetailScreen slug={params.slug} kind="beach" />;
}

function looksLikeGooglePlaceId(value: string) {
  return /^ChI[A-Za-z0-9_-]{10,}$/.test(value);
}
