import type { ReactNode } from "react";

import { buildPublicPageLayoutMetadata } from "@/lib/public-page-metadata";

export const metadata = buildPublicPageLayoutMetadata({
  title: "Governors of the Virgin Islands",
  description:
    "Explore recorded Virgin Islands governors and administrations from early Danish company rule through British occupations, Danish Crown government, U.S. naval and appointed government, and the elected era.",
  path: "/heritage/governors",
});

export default function GovernorsLayout({ children }: { children: ReactNode }) {
  return children;
}
