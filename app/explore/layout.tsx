import type { ReactNode } from "react";

import { PageEvent } from "@/components/analytics/page-event";
import { buildPublicPageLayoutMetadata } from "@/lib/public-page-metadata";

export const metadata = buildPublicPageLayoutMetadata({
  title: "Explore St. Thomas, St. John & St. Croix",
  description:
    "Explore verified stays, activities, events, transportation, beaches, history, dining, and practical island guidance across the U.S. Virgin Islands.",
  path: "/explore",
});

export default function ExploreLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageEvent eventName="landing_view" payload={{ surface: "explore" }} context={{ source: "explore" }} />
      {children}
    </>
  );
}
