import { DirectoryDetailScreen } from "@/components/directory/directory-detail-screen";

export default function BeachDetailPage({ params }: { params: { slug: string } }) {
  return <DirectoryDetailScreen slug={params.slug} kind="beach" />;
}
