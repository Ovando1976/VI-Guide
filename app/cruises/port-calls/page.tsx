import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  ExternalLink,
  MapPin,
  ShieldCheck,
  ShipWheel,
  Users,
} from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";
import { CruiseHubNav } from "@/components/cruise/cruise-hub-nav";
import { getUsviToday } from "@/lib/booking/booking-dates";
import { loadOfficialPortCallBoard } from "@/lib/cruise-port-call-public";
import { OFFICIAL_CRUISE_SCHEDULE_COVERAGE } from "@/lib/cruise-port-calls";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Official Port Calls | VI Guide Cruise Hub",
  description:
    "See upcoming official U.S. Virgin Islands cruise port calls and the local excursions that fit the ship window with published operator capacity.",
};

export default async function CruisePortCallsPage() {
  const today = getUsviToday(new Date());
  const from = today > OFFICIAL_CRUISE_SCHEDULE_COVERAGE.from
    ? today
    : OFFICIAL_CRUISE_SCHEDULE_COVERAGE.from;
  const board = await loadOfficialPortCallBoard({
    from,
    through: OFFICIAL_CRUISE_SCHEDULE_COVERAGE.through,
    partySize: 1,
  });
  const active = board.filter((item) => item.call.status === "scheduled");
  const verifiedFits = active.reduce(
    (sum, item) => sum + item.availableMatches.length,
    0,
  );

  return (
    <main className="min-h-screen bg-[#f8f4ea] pb-28 text-[#043331]">
      <section className="px-4 pt-5 sm:px-6 lg:pt-8">
        <ViPublicHeader
          actionHref="/cruises/plan"
          actionLabel="Ask cruise advisor"
          actionIcon={ShipWheel}
          secondaryHref="/cruises"
          secondaryLabel="Cruise Hub"
        />
      </section>
      <div className="mt-5">
        <CruiseHubNav compact />
      </div>

      <section className="px-4 py-8 sm:px-6 lg:py-12">
        <div className="mx-auto max-w-7xl">
          <section className="overflow-hidden rounded-[40px] bg-[radial-gradient(circle_at_top_right,rgba(245,196,81,.38),transparent_34%),linear-gradient(145deg,#032f2d,#0b6b64)] p-8 text-white shadow-[0_30px_90px_rgba(4,51,49,.22)] sm:p-12 lg:p-16">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
              <div>
                <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.22em] text-[#f5c451]">
                  <ShipWheel className="h-4 w-4" /> Cruise Hub · Official port calls
                </p>
                <h1 className="mt-5 text-5xl font-black leading-[.9] tracking-[-.06em] sm:text-7xl">
                  Start with the ship schedule. Then show only the island days that fit.
                </h1>
                <p className="mt-6 max-w-3xl text-sm font-semibold leading-7 text-white/70 sm:text-base">
                  VI Guide is matching published VIPA and WICO port calls to active
                  shore excursions, operator hours, daily capacity, current booking
                  demand, and a conservative return-to-ship window.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <Metric icon={CalendarDays} label="Upcoming calls" value={String(active.length)} />
                <Metric icon={ShieldCheck} label="Capacity-verified fits" value={String(verifiedFits)} />
                <Metric
                  icon={Clock3}
                  label="Schedule coverage"
                  value={`${OFFICIAL_CRUISE_SCHEDULE_COVERAGE.from} → ${OFFICIAL_CRUISE_SCHEDULE_COVERAGE.through}`}
                />
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-[28px] border border-amber-200 bg-amber-50 p-5 text-amber-950">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.14em] text-amber-700">
                  Ship-clock rule
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-amber-950/70">
                  Official schedules publish arrival and departure times, not the
                  ship&apos;s authoritative all-aboard announcement. VI Guide therefore
                  uses departure minus 30 minutes as a conservative planning proxy and
                  still tells the traveler to verify the onboard announcement.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-7 space-y-4">
            {active.map((item) => {
              const available = item.availableMatches.length;
              const unverified = item.unverifiedMatches.length;
              const href = `/shore-excursions?officialPortCall=${encodeURIComponent(
                item.call.id,
              )}&party=1`;
              return (
                <article
                  key={item.call.id}
                  className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm"
                >
                  <div className="grid gap-5 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-teal-50 px-3 py-1.5 text-[8px] font-black uppercase tracking-[.13em] text-teal-700">
                          {humanizeIsland(item.call.island)}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[8px] font-black uppercase tracking-[.13em] text-slate-500">
                          {formatDate(item.call.date)}
                        </span>
                        {available > 0 ? (
                          <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-[8px] font-black uppercase tracking-[.13em] text-emerald-800">
                            {available} capacity-verified {available === 1 ? "fit" : "fits"}
                          </span>
                        ) : unverified > 0 ? (
                          <span className="rounded-full bg-amber-100 px-3 py-1.5 text-[8px] font-black uppercase tracking-[.13em] text-amber-800">
                            {unverified} timing {unverified === 1 ? "fit" : "fits"} · capacity pending
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[8px] font-black uppercase tracking-[.13em] text-slate-500">
                            No published fit yet
                          </span>
                        )}
                      </div>

                      <h2 className="mt-4 text-3xl font-black tracking-[-.045em]">
                        {item.call.shipName}
                      </h2>
                      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold text-slate-500">
                        <span className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-teal-700" />
                          {item.call.terminalLabel}
                        </span>
                        <span className="flex items-center gap-2">
                          <Clock3 className="h-4 w-4 text-teal-700" />
                          {item.call.arrivesAt}–{item.call.departsAt}
                        </span>
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-teal-700" />
                          Planning all aboard {item.planningAllAboardTime ?? "verify onboard"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      {(available > 0 || unverified > 0) ? (
                        <Link
                          href={href}
                          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#043331] px-5 text-[9px] font-black uppercase tracking-[.14em] text-white"
                        >
                          Match excursions <ArrowRight className="h-4 w-4 text-[#f5c451]" />
                        </Link>
                      ) : (
                        <Link
                          href="/cruises/plan"
                          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-[9px] font-black uppercase tracking-[.14em]"
                        >
                          Ask advisor <ArrowRight className="h-4 w-4" />
                        </Link>
                      )}
                      {item.source ? (
                        <a
                          href={item.source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-[9px] font-black uppercase tracking-[.14em]"
                        >
                          Official source <ExternalLink className="h-4 w-4 text-teal-700" />
                        </a>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}

            {!active.length ? (
              <div className="rounded-[30px] border border-slate-200 bg-white p-10 text-center shadow-sm">
                <ShipWheel className="mx-auto h-8 w-8 text-teal-700" />
                <h2 className="mt-4 text-2xl font-black">No scheduled calls are in the loaded official window.</h2>
                <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                  The schedule layer is intentionally source-bounded. VI Guide does not
                  invent future ship calls beyond the official data currently loaded.
                </p>
              </div>
            ) : null}
          </section>
        </div>
      </section>
    </main>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[.07] p-5">
      <Icon className="h-5 w-5 text-[#f5c451]" />
      <p className="mt-4 text-[8px] font-black uppercase tracking-[.14em] text-white/45">
        {label}
      </p>
      <p className="mt-2 text-lg font-black leading-6">{value}</p>
    </div>
  );
}

function humanizeIsland(value: string) {
  if (value === "stj") return "St. John";
  if (value === "stx") return "St. Croix";
  return "St. Thomas";
}

function formatDate(value: string) {
  const parsed = Date.parse(`${value}T12:00:00.000Z`);
  return Number.isFinite(parsed)
    ? new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: "America/St_Thomas",
      }).format(parsed)
    : value;
}
