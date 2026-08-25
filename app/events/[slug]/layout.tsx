import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getEventBySlug } from "@/lib/events";
import { buildPublicPageLayoutMetadata } from "@/lib/public-page-metadata";

type Props = {
  children: ReactNode;
  params: { slug: string };
};

export function generateMetadata({ params }: Pick<Props, "params">): Metadata {
  const event = getEventBySlug(params.slug);
  return buildPublicPageLayoutMetadata({
    title: event?.name ?? "Event",
    description:
      event?.description ??
      "Plan a U.S. Virgin Islands event day with source-backed details, transportation, maps, Concierge, and My Trip.",
    path: `/events/${params.slug}`,
  });
}

export default function EventDetailLayout({ children }: Props) {
  return children;
}
