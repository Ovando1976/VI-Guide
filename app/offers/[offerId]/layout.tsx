import type { Metadata } from "next";
import type { ReactNode } from "react";

import { buildPublicPageLayoutMetadata } from "@/lib/public-page-metadata";

type Props = {
  children: ReactNode;
  params: { offerId: string };
};

export function generateMetadata({ params }: Props): Metadata {
  return buildPublicPageLayoutMetadata({
    title: "Island Package",
    description:
      "Review a live USVI Explorer business package and request verified availability.",
    path: `/offers/${params.offerId}`,
  });
}

export default function OfferDetailLayout({ children }: Props) {
  return children;
}
