import type { ReactNode } from "react";

import { buildPublicPageLayoutMetadata } from "@/lib/public-page-metadata";

export const metadata = buildPublicPageLayoutMetadata({
  title: "Cruise Hub",
  description:
    "Plan the cruise, verify USVI port calls, match capacity-aware shore excursions, request advisor help, and keep the trip connected inside one USVI Explorer cruise hub.",
  path: "/cruises",
});

export default function CruisesLayout({ children }: { children: ReactNode }) {
  return children;
}
