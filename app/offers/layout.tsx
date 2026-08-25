import type { ReactNode } from "react";

import { buildPublicPageLayoutMetadata } from "@/lib/public-page-metadata";

export const metadata = buildPublicPageLayoutMetadata({
  title: "Island Offers",
  description:
    "Book live U.S. Virgin Islands stays, tours, and experiences offered by verified USVI Explorer businesses.",
  path: "/offers",
});

export default function OffersLayout({ children }: { children: ReactNode }) {
  return children;
}
