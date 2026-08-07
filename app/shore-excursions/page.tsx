import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  MapPin,
  ShipWheel,
  ShieldCheck,
  Users,
} from "lucide-react";

import { formatMerchantOfferMoney } from "@/lib/merchant-offers";
import { loadPublicShoreExcursions } from "@/lib/shore-excursion-public";
import { shoreExcursionPort } from "@/lib/shore-excursions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shore Excursions | VI Guide",
  description:
    "Book U.S. Virgin Islands shore excursions designed around cruise ports, all-aboard times, and conservative return-to-ship buffers.",
};

export default async function ShoreExcursionsPage() {
  const excursions = await loadPublicShoreExcursions();

  return (
    <main className="min-h-screen bg-[#f8f4ea] px-4 py-8 pb-28 text-[#043331] sm:px-6 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[40px] bg-[radial-gradient(circle_at_top_right,rgba(245,196,81,.38),transparent_34%),linear-gradient(145deg,#032f2d,#0b6b64)] p-8 text-white shadow-[0_30px_90px_rgba(4,51,49,.22)] sm:p-12 lg:p-16">
          <div className="max-w-4xl">
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.24em] text-[#f5c451]">
              <ShipWheel className="h-4 w-4" /> Cruise day, locally operated
            </p>
            <h1 className="mt-5 text-5xl font-black leading-[.9] tracking-[-.06em] sm:text-7xl">
              Explore the Virgin Islands without gambling with the ship clock.
            </h1>
            <p className="mt-6 max-w-3xl text-sm font-semibold leading-7 text-white/70 sm:text-base">
              VI Guide shore excursions are linked to local operators and checked
              against your ship&apos;s all-aboard time before the request is accepted.
              Every published excursion carries an operator-defined minimum return
              buffer.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3 text-[9px] font-black uppercase tracking-[.14em] text-white/80">
            <span className="rounded-full border border-white/10 bg-white/[.08] px-4 py-2.5">
              {excursions.length} cruise-ready option{excursions.length === 1 ? "" : "s"}
            </span>
            <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[.08] px-4 py-2.5">
              <ShieldCheck className="h-4 w-4 text-[#f5c451]" /> Return buffer checked before request
            </span>
          </div>
        </section>

        {excursions.length ? (
          <section className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {excursions.map((excursion) => (
              <Link
                key={excursion.offer.offerId}
                href={`/shore-excursions/${encodeURIComponent(excursion.offer.offerId)}`}
                className="group overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-teal-300 hover:shadow-xl"
              >
                <div className="bg-[radial-gradient(circle_at_top_right,rgba(245,196,81,.35),transparent_38%),linear-gradient(145deg,#063e3a,#0f8278)] p-6 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[.13em]">
                      {humanizeIsland(excursion.island)} shore excursion
                    </span>
                    <ShipWheel className="h-5 w-5 text-[#f5c451]" />
                  </div>
                  <h2 className="mt-8 text-3xl font-black leading-[.95] tracking-[-.05em]">
                    {excursion.offer.offerTitle}
                  </h2>
                  <p className="mt-3 text-sm font-semibold text-white/60">
                    {excursion.offer.listingName}
                  </p>
                </div>

                <div className="p-6">
                  <div className="flex items-end justify-between gap-4">
                    <p className="text-3xl font-black tracking-[-.04em]">
                      {formatMerchantOfferMoney(excursion.offer.offerPriceCents)}
                    </p>
                    <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-[8px] font-black uppercase tracking-[.12em] text-emerald-800">
                      {excursion.minReturnBufferMinutes} min ship buffer
                    </span>
                  </div>

                  <div className="mt-5 space-y-3 text-xs font-bold text-slate-500">
                    <p className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-teal-700" />
                      {formatDuration(excursion.durationMinutes)} planned duration
                    </p>
                    <p className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-teal-700" />
                      Up to {excursion.maxGuests} guests per request
                    </p>
                    <p className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                      {excursion.supportedPorts
                        .map((portId) => shoreExcursionPort(portId)?.shortLabel)
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>

                  <span className="mt-7 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.14em]">
                    Check my ship timing
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </section>
        ) : (
          <section className="mt-7 rounded-[34px] border border-emerald-200 bg-emerald-50 p-10 text-center">
            <ShipWheel className="mx-auto h-9 w-9 text-emerald-700" />
            <h2 className="mt-5 text-3xl font-black tracking-[-.04em]">
              Cruise-ready local excursions are being onboarded
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-7 text-emerald-950/65">
              Only operator offers with published cruise-port details and a valid
              return-to-ship buffer appear here. You can still use the Cruise Desk
              for a personalized port-day plan.
            </p>
            <Link
              href="/cruises"
              className="mt-6 inline-flex min-h-11 items-center rounded-full bg-[#043331] px-6 text-[9px] font-black uppercase tracking-[.14em] text-white"
            >
              Open Cruise Desk
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}

function humanizeIsland(value: string) {
  return value === "stt"
    ? "St. Thomas"
    : value === "stj"
      ? "St. John"
      : "St. Croix";
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${minutes} min`;
  if (!remainder) return `${hours} hr${hours === 1 ? "" : "s"}`;
  return `${hours} hr ${remainder} min`;
}
