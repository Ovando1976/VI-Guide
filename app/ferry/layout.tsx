import type { ReactNode } from "react";

import { buildPublicPageLayoutMetadata } from "@/lib/public-page-metadata";

export const metadata = buildPublicPageLayoutMetadata({
  title: "USVI Ferry Planner",
  description:
    "Plan USVI and BVI passenger ferries, car barges, published departures, official fare guidance, passport requirements, terminal rides, and door-to-door island connections.",
  path: "/ferry",
});

export default function FerryLayout({ children }: { children: ReactNode }) {
  return children;
}
