import type { ReactNode } from "react";

import { buildPublicPageLayoutMetadata } from "@/lib/public-page-metadata";

export const metadata = buildPublicPageLayoutMetadata({
  title: "Official Port Calls",
  description:
    "See upcoming official U.S. Virgin Islands cruise port calls and the local excursions that fit the ship window with published operator capacity.",
  path: "/cruises/port-calls",
});

export default function PortCallsLayout({ children }: { children: ReactNode }) {
  return children;
}
