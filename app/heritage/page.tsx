import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Images } from "lucide-react";

import { HeritageConcierge } from "@/components/heritage/heritage-concierge";
import { HeritageExplorer } from "@/components/heritage/heritage-explorer";
import { getTravelKnowledge } from "@/lib/travel-knowledge";

export const metadata: Metadata = {
  title: "USVI Heritage | USVI Explorer",
  description:
    "Explore historic places, cultural landscapes, maps, archives, and stories across the U.S. Virgin Islands.",
};

export default function HeritagePage() {
  return (
    <>
      <div className="bg-[#032d2c] px-5 pt-4 sm:px-8 lg:px-10">
        <Link
          href="/heritage/library-of-congress"
          className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-[22px] border border-amber-100/15 bg-amber-50/10 px-4 py-3 text-white transition hover:bg-amber-50/15 sm:px-5"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#f5c451] text-[#043331]">
              <Images size={18} />
            </span>
            <span className="min-w-0">
              <strong className="block truncate text-sm font-black">
                Library of Congress · U.S. Virgin Islands Gallery
              </strong>
              <span className="mt-0.5 block truncate text-xs font-semibold text-white/55">
                Curated 1941 photographs with corrected captions, source links, and attribution.
              </span>
            </span>
          </span>
          <ArrowRight className="shrink-0 text-[#f5c451]" size={18} />
        </Link>
      </div>
      <HeritageExplorer items={getTravelKnowledge("historic")} />
      <HeritageConcierge />
    </>
  );
}
