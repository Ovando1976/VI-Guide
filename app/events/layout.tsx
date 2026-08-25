import type { ReactNode } from "react";

import { buildPublicPageLayoutMetadata } from "@/lib/public-page-metadata";

export const metadata = buildPublicPageLayoutMetadata({
  title: "Events",
  description:
    "Discover source-backed upcoming events across St. Thomas, St. John, and St. Croix, then connect them to maps, transportation, Concierge, and My Trip.",
  path: "/events",
});

export default function EventsLayout({ children }: { children: ReactNode }) {
  return children;
}
