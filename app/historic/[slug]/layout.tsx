import type { Metadata } from "next";
import type { ReactNode } from "react";

import { buildPublicPageLayoutMetadata } from "@/lib/public-page-metadata";
import { getTravelKnowledgeItem } from "@/lib/travel-knowledge";

type Props = {
  children: ReactNode;
  params: { slug: string };
};

export function generateMetadata({ params }: Props): Metadata {
  const site = getTravelKnowledgeItem("historic", params.slug);
  const title = site?.name ?? "Historic Site";
  const description =
    site?.description ??
    "Explore a U.S. Virgin Islands historic place with map, trip, transportation, and Concierge connections.";

  return buildPublicPageLayoutMetadata({
    title,
    description,
    path: `/historic/${site?.slug ?? params.slug}`,
  });
}

export default function HistoricDetailLayout({ children }: Props) {
  return children;
}
