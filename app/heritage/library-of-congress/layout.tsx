import type { ReactNode } from "react";

import { buildPublicPageLayoutMetadata } from "@/lib/public-page-metadata";

export const metadata = buildPublicPageLayoutMetadata({
  title: "Library of Congress Virgin Islands Collection",
  description:
    "Explore the Library of Congress Virgin Islands photographic collection, including Jack Delano's 1941 record of St. Thomas, St. Croix, and St. John.",
  path: "/heritage/library-of-congress",
});

export default function LibraryOfCongressLayout({ children }: { children: ReactNode }) {
  return children;
}
