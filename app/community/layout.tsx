import type { ReactNode } from "react";

import { buildPublicPageLayoutMetadata } from "@/lib/public-page-metadata";

export const metadata = buildPublicPageLayoutMetadata({
  title: "Community & Local Stories",
  description:
    "Explore source-backed USVI community field notes, cultural context, neighborhood knowledge, and local stories connected to the Living Map and your trip.",
  path: "/community",
});

export default function CommunityLayout({ children }: { children: ReactNode }) {
  return children;
}
