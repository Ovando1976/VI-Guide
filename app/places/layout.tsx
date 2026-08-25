import type { ReactNode } from "react";

import { buildPublicPageLayoutMetadata } from "@/lib/public-page-metadata";

export const metadata = buildPublicPageLayoutMetadata({
  title: "Places & Dining",
  description:
    "Explore restaurants, waterfront districts, island towns, attractions, and practical stops across St. Thomas, St. John, and St. Croix, then connect discoveries to the map, Concierge, rides, and My Trip.",
  path: "/places",
});

export default function PlacesLayout({ children }: { children: ReactNode }) {
  return children;
}
