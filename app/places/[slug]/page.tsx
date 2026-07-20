import { DirectoryDetailScreen } from "@/components/directory/directory-detail-screen";

export default function PlaceDetailPage({ params }: { params: { slug: string } }) {
  return <DirectoryDetailScreen slug={params.slug} kind="place" />;
}
