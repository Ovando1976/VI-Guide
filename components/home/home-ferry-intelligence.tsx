"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  ExternalLink,
  ShieldCheck,
  ShipWheel,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  findFerryRoute,
  getNextFerryDeparture,
  isScheduleSuppressed,
  type FerryPortId,
  type FerryRoute,
} from "@/lib/ferry-planner";

const ROUTE_SPECS = [
  {
    from: "red-hook",
    to: "cruz-bay",
    label: "Red Hook → Cruz Bay",
    context: "St. Thomas → St. John",
  },
  {
    from: "crown-bay",
    to: "cruz-bay",
    label: "Crown Bay → Cruz Bay",
    context: "St. Thomas → St. John",
  },
  {
    from: "crown-bay",
    to: "phillips-landing",
    label: "Crown Bay → Water Island",
    context: "St. Thomas → Water Island",
  },
  {
    from: "charlotte-amalie",
    to: "gallows-bay",
    label: "Charlotte Amalie → St. Croix",
    context: "QE IV passenger ferry",
  },
] as const satisfies ReadonlyArray<{
  from: FerryPortId;
  to: FerryPortId;
  label: string;
  context: string;
}>;

export function HomeFerryIntelligence() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const syncClock = () => setNow(new Date());
    syncClock();
    const timer = window.setInterval(syncClock, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const routes = useMemo(
    () =>
      ROUTE_SPECS.map((spec) => ({
        ...spec,
        route: findFerryRoute(spec.from, spec.to),
      })).filter(
        (entry): entry is (typeof ROUTE_SPECS)[number] & { route: FerryRoute } =>
          Boolean(entry.route),
      ),
    [],
  );

  return (
    <div className="bg-[#073b39] p-5 text-white sm:p-6 lg:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.2em] text-[#f5c451]">
            <ShipWheel size={15} aria-hidden="true" /> Published ferry intelligence
          </div>
          <h3 className="vi-display mt-2 text-3xl font-bold leading-[1] sm:text-4xl">
            Next scheduled departures, without guessed status.
          </h3>
          <p className="mt-3 max-w-2xl text-xs font-semibold leading-5 text-white/62 sm:text-sm sm:leading-6">
            USVI Explorer uses governed schedules from the listed authority, calculates the next published departure in Virgin Islands time, and fails closed when a current timetable cannot be represented safely.
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-[#73e3d9]/20 bg-[#73e3d9]/10 px-3 py-2 text-[8px] font-black uppercase tracking-[.15em] text-[#9ff1e8]">
          <ShieldCheck size={13} aria-hidden="true" /> Source governed
        </span>
      </div>

      <div className="mt-5 grid gap-2">
        {routes.map(({ label, context, route }) => {
          const status = scheduleStatus(route, now);
          return (
            <div
              key={route.id}
              className="grid gap-3 rounded-[20px] border border-white/10 bg-white/[.06] p-4 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-black text-white">{label}</span>
                  <span className={`rounded-full px-2 py-1 text-[7px] font-black uppercase tracking-[.13em] ${status.badgeClass}`}>
                    {status.badge}
                  </span>
                </div>
                <div className="mt-1 text-[9px] font-bold uppercase tracking-[.12em] text-white/42">{context}</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-lg font-black text-[#f8d77c] sm:text-xl">{status.primary}</span>
                  {status.secondary ? <span className="text-[9px] font-semibold text-white/50">{status.secondary}</span> : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:max-w-[190px] sm:justify-end">
                <span className="inline-flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[.11em] text-white/45">
                  <CalendarClock size={12} aria-hidden="true" /> Checked {formatVerifiedAt(route.verifiedAt)}
                </span>
                <a
                  href={route.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[.07] px-3 py-2 text-[8px] font-black uppercase tracking-[.12em] text-white/72 transition hover:bg-white/[.12] hover:text-white"
                  aria-label={`Open official schedule source for ${label}`}
                >
                  {shortAuthority(route.sourceAuthority)} <ExternalLink size={11} aria-hidden="true" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-[18px] border border-amber-300/18 bg-amber-300/[.08] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 text-[9px] font-semibold leading-4 text-white/58">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#f5c451]" aria-hidden="true" />
          <span>Published schedules are planning data. Operating status is not live, and USVI Explorer does not infer delay, cancellation, or on-time status.</span>
        </div>
        <Link
          href="/journey"
          className="inline-flex shrink-0 items-center gap-2 text-[8px] font-black uppercase tracking-[.14em] text-[#f5c451]"
        >
          Build island journey <ArrowRight size={12} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

function scheduleStatus(route: FerryRoute, now: Date | null) {
  const suppressed = now
    ? isScheduleSuppressed(route, now)
    : route.scheduleStatus === "temporary-override" || route.scheduleStatus === "operator-dependent";

  if (suppressed) {
    return {
      badge: route.scheduleStatus === "temporary-override" ? "Temporary schedule" : "Operator schedules",
      badgeClass: "bg-amber-300/15 text-[#f8d77c]",
      primary: "Verify official source",
      secondary: "Regular next-departure calculation is intentionally suppressed.",
    };
  }

  if (!now) {
    return {
      badge: "Published schedule",
      badgeClass: "bg-white/10 text-white/65",
      primary: "Checking VI clock…",
      secondary: "",
    };
  }

  const next = getNextFerryDeparture(route, now);
  if (!next) {
    return {
      badge: "Verify schedule",
      badgeClass: "bg-amber-300/15 text-[#f8d77c]",
      primary: "No safe next departure",
      secondary: "Check the official source before leaving.",
    };
  }

  return {
    badge: "Scheduled",
    badgeClass: "bg-[#73e3d9]/12 text-[#9ff1e8]",
    primary: next.dayLabel === "Today" ? `${next.label} today` : `${next.dayLabel} · ${next.label}`,
    secondary:
      next.dayLabel === "Today"
        ? `Scheduled in ${formatMinutes(next.minutesUntil)} · arrive ${route.checkInMinutes} min early`
        : `Next published departure · arrive ${route.checkInMinutes} min early`,
  };
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${Math.max(0, minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

function formatVerifiedAt(value: string) {
  const date = new Date(`${value}T12:00:00-04:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/St_Thomas",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function shortAuthority(value: string) {
  if (/Virgin Islands Port Authority/i.test(value)) return "VIPA";
  if (/Water Island Ferry/i.test(value)) return "Water Island Ferry";
  return value;
}
