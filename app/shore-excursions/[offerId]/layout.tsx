import type { Metadata } from "next";
import type { ReactNode } from "react";

import { buildPublicPageLayoutMetadata } from "@/lib/public-page-metadata";

type Props = {
  children: ReactNode;
  params: { offerId: string };
};

export function generateMetadata({ params }: Pick<Props, "params">): Metadata {
  return buildPublicPageLayoutMetadata({
    title: "Shore Excursion",
    description:
      "Review a USVI shore excursion with cruise-port timing, pickup, guest, capacity, and return-to-ship planning context.",
    path: `/shore-excursions/${params.offerId}`,
  });
}

export default function ShoreExcursionDetailLayout({ children }: Props) {
  return children;
}
