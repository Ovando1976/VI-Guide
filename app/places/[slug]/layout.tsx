import type { Metadata } from "next";
import type { ReactNode } from "react";

import { buildPublicPageLayoutMetadata } from "@/lib/public-page-metadata";

type Props = {
  children: ReactNode;
  params: { slug: string };
};

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function generateMetadata({ params }: Pick<Props, "params">): Metadata {
  const title = titleFromSlug(params.slug) || "USVI Place";
  return buildPublicPageLayoutMetadata({
    title,
    description:
      "Explore this U.S. Virgin Islands place with local context, arrival planning, maps, Concierge, transportation, and My Trip tools.",
    path: `/places/${params.slug}`,
  });
}

export default function PlaceDetailLayout({ children }: Props) {
  return children;
}
