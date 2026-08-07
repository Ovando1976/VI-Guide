import Link from "next/link";
import { ArrowRight, CalendarClock, ClipboardCheck, ShipWheel } from "lucide-react";

import { ShoreExcursionBoard } from "@/components/merchant/shore-excursion-board";
import { ShoreExcursionCapacityReadiness } from "@/components/merchant/shore-excursion-capacity-readiness";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shore Excursions | VI Guide Business Console",
  description:
    "Configure cruise-port pickup, excursion duration, dated capacity, accessibility, and return-to-ship operating buffers for VI Guide offers.",
};

export default function MerchantShoreExcursionsPage() {
  return (
    <>
      <section className="bg-[#f8f4ea] px-4 pt-6 sm:px-6 lg:pt-8">
        <div className="mx-auto max-w-7xl rounded-[30px] border border-amber-200 bg-[linear-gradient(135deg,#fff8df,#fffdf7)] p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.16em] text-amber-700">
                <ShipWheel className="h-4 w-4" /> Capacity activation
              </p>
              <h1 className="mt-2 text-2xl font-black tracking-[-.04em] text-[#043331] sm:text-3xl">
                Publishing the excursion is only step one.
              </h1>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                VI Guide only shows <strong className="text-[#043331]">Capacity verified</strong> to cruise travelers when the linked business also publishes that port-call date, operating hours, and guest capacity. Keep the excursion profile and dated availability in sync so live ship matches can be sold with confidence.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Link
                href="/merchant/availability"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#043331] px-5 text-[9px] font-black uppercase tracking-[.13em] text-white"
              >
                <CalendarClock className="h-4 w-4 text-[#f5c451]" /> Publish dated capacity
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/merchant/reservations"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-[9px] font-black uppercase tracking-[.13em] text-[#043331]"
              >
                <ClipboardCheck className="h-4 w-4 text-teal-700" /> Open dispatch board
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <ActivationStep
              number="01"
              title="Cruise product"
              detail="Set supported ports, meeting point, duration, pickup, accessibility, and return buffer."
            />
            <ActivationStep
              number="02"
              title="Dated capacity"
              detail="Publish open days, operating hours, and capacity for the exact cruise-call dates you want to sell."
            />
            <ActivationStep
              number="03"
              title="Dispatch"
              detail="Review requests against the ship clock, remaining capacity, meeting point, and booking lifecycle."
            />
          </div>
        </div>
      </section>

      <ShoreExcursionCapacityReadiness />
      <ShoreExcursionBoard />
    </>
  );
}

function ActivationStep({
  number,
  title,
  detail,
}: {
  number: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-[22px] border border-amber-100 bg-white/80 p-4">
      <p className="text-[8px] font-black uppercase tracking-[.15em] text-amber-600">
        Step {number}
      </p>
      <p className="mt-2 text-sm font-black text-[#043331]">{title}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{detail}</p>
    </div>
  );
}