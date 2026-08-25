import type { ReactNode } from "react";

import { buildPublicPageLayoutMetadata } from "@/lib/public-page-metadata";

export const metadata = buildPublicPageLayoutMetadata({
  title: "My Day",
  description:
    "Build and protect a personalized, grounded U.S. Virgin Islands day plan from your traveler profile.",
  path: "/today",
});

export default function TodayLayout({ children }: { children: ReactNode }) {
  return children;
}
