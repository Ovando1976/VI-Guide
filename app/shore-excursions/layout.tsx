import type { ReactNode } from "react";
import { ShipWheel } from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";
import { buildPublicPageLayoutMetadata } from "@/lib/public-page-metadata";

export const metadata = buildPublicPageLayoutMetadata({
  title: "Shore Excursions",
  description:
    "Book U.S. Virgin Islands shore excursions designed around official cruise port calls, operator capacity, all-aboard times, and conservative return-to-ship buffers.",
  path: "/shore-excursions",
});

export default function ShoreExcursionsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f8f4ea] text-[#043331]">
      <section className="px-4 pt-5 sm:px-6 lg:pt-8">
        <ViPublicHeader
          actionHref="/cruises/plan"
          actionLabel="Ask cruise advisor"
          actionIcon={ShipWheel}
          secondaryHref="/cruises"
          secondaryLabel="Cruise Hub"
        />
      </section>
      {children}
    </div>
  );
}
