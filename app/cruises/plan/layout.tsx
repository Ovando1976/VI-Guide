import type { ReactNode } from "react";

import { buildPublicPageLayoutMetadata } from "@/lib/public-page-metadata";

export const metadata = buildPublicPageLayoutMetadata({
  title: "Cruise Advisor",
  description:
    "Plan a cruise and check a USVI port-day return-to-ship buffer before you commit to an itinerary.",
  path: "/cruises/plan",
});

export default function CruisePlanLayout({ children }: { children: ReactNode }) {
  return children;
}
