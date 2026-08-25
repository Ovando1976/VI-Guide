import type { ReactNode } from "react";

import { buildPublicPageLayoutMetadata } from "@/lib/public-page-metadata";

export const metadata = buildPublicPageLayoutMetadata({
  title: "Dining",
  description:
    "Compare local favorites, waterfront restaurants, casual stops, and special-occasion dining across St. Thomas, St. John, and St. Croix, then connect a meal to the map, Concierge, rides, and My Trip.",
  path: "/dining",
});

export default function DiningLayout({ children }: { children: ReactNode }) {
  return children;
}
