import type { ReactNode } from "react";

import { buildPublicPageLayoutMetadata } from "@/lib/public-page-metadata";

export const metadata = buildPublicPageLayoutMetadata({
  title: "USVI Fishing Guide",
  description:
    "Explore common Virgin Islands fishing species, habitats, conservation guidance, and direct map and concierge tools.",
  path: "/fishing",
});

export default function FishingLayout({ children }: { children: ReactNode }) {
  return children;
}
