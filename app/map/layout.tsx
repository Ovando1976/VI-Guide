import type { ReactNode } from "react";

import { buildPublicPageMetadata } from "@/lib/public-page-metadata";

export const metadata = buildPublicPageMetadata({
  title: "Living Map",
  description:
    "Explore St. Thomas, St. John, and St. Croix on the USVI Explorer Living Map, then connect places to routes, rides, saved stops, and Concierge.",
  path: "/map",
});

export default function MapLayout({ children }: { children: ReactNode }) {
  return children;
}
