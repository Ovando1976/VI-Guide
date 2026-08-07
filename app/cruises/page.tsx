import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ShipWheel } from "lucide-react";

import { CruiseInventoryGateway } from "@/components/cruise/cruise-inventory-gateway";
import { CruisePlanningForm } from "@/components/cruise/cruise-planning-form";

export const metadata: Metadata = {
  title: "Cruise Planning",
  description:
    "Search connected cruise inventory when available, book USVI shore excursions, or request personalized cruise research, cabin guidance, and Caribbean port planning from VI Guide.",
};

export default function CruisesPage() {
  return (
    <>
      <section className="bg-[#f8f4ea] px-4 pt-8 sm:px-6 lg:pt-12">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/shore-excursions"
            className="group flex flex-col gap-5 overflow-hidden rounded-[34px] border border-teal-900/10 bg-[radial-gradient(circle_at_top_right,rgba(245,196,81,.34),transparent_38%),linear-gradient(145deg,#032f2d,#0b6b64)] p-7 text-white shadow-[0_24px_70px_rgba(4,51,49,.18)] transition hover:-translate-y-0.5 hover:shadow-xl sm:flex-row sm:items-center sm:justify-between sm:p-8"
          >
            <div className="max-w-3xl">
              <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.18em] text-[#f5c451]">
                <ShipWheel className="h-4 w-4" /> New: local shore excursions
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-[-.045em] sm:text-4xl">
                Turn a port day into a bookable VI experience with the ship clock built in.
              </h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-white/65">
                Browse local operator offers by cruise port and check the planned
                excursion against your all-aboard time before submitting a request.
              </p>
            </div>
            <span className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[#f5c451] px-6 text-[9px] font-black uppercase tracking-[.14em] text-[#043331]">
              Browse excursions
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
          </Link>
        </div>
      </section>
      <CruiseInventoryGateway />
      <CruisePlanningForm />
    </>
  );
}
