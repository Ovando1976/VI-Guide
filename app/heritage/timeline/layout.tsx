import type { ReactNode } from "react";

import { buildPublicPageLayoutMetadata } from "@/lib/public-page-metadata";

export const metadata = buildPublicPageLayoutMetadata({
  title: "Virgin Islands Timeline",
  description:
    "Explore major Virgin Islands historical events and every U.S.-period governor in one connected chronology.",
  path: "/heritage/timeline",
});

export default function HeritageTimelineLayout({ children }: { children: ReactNode }) {
  return children;
}
