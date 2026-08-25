import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getCommunityStory } from "@/lib/community-stories";
import { buildPublicPageLayoutMetadata } from "@/lib/public-page-metadata";

type Props = {
  children: ReactNode;
  params: { postId: string };
};

export function generateMetadata({ params }: Props): Metadata {
  const story = getCommunityStory(params.postId);
  const title = story?.title ?? "Community Story";
  const description =
    story?.summary ??
    "Explore source-backed USVI community field notes and local context connected to your trip.";

  return buildPublicPageLayoutMetadata({
    title,
    description,
    path: `/community/${story?.slug ?? params.postId}`,
  });
}

export default function CommunityStoryLayout({ children }: Props) {
  return children;
}
