"use client";

import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  CalendarClock,
  Clock3,
  Loader2,
  RefreshCcw,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { CommerceBookingStatus } from "@/types/commerce-booking";

type Booking = {
  id: string;
  reference: string;
  status: CommerceBookingStatus;
  listingName: string;
  island: string;
  guestName: string;
  adults: number;
  children: number;
  startDate: string;
  preferredTime: string | null;
  merchantNote: string | null;
  proposedTime: string | null;
  createdAt: string;
  updatedAt: string;
};

export function OperationsCommandCenter() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/merchant-bookings", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as
        | { bookings?: Booking[]; error?: string }
        | null;
      if (!response.ok) throw new Error(payload?.error || "Unable to load operations data.");
      setBookings(payload?.bookings ?? []);
      setLastUpdated(new Date());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load operations data.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(true), 15_000);
    return () => window.clearInterval(interval);
  }, [load]);

  const metrics = useMemo(() => {
    const active = bookings.filter((item) => ["requested", "reviewing"].includes(item.status));
    const confirmed = bookings.filter((item) => item.status === "confirmed");
    const closed = bookings.filter((item) => ["declined", "cancelled"].includes(item.status));
    const travelers = bookings.reduce((total, item) => total + item.adults + item.children, 0);
    const averageResponseMinutes = responseAverage(bookings);
    return { active: active.length, confirmed: confirmed.length, closed: closed.length, travelers, averageResponseMinutes };
  }, [bookings]);

  const alerts = useMemo(() => buildAlerts(bookings), [bookings]);
  const activity = useMemo(
    () => [...bookings].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 12),
    [bookings],
  );

  return (
    <main className="min-h-screen bg-[#f7f2e7] px-4 py-8 text-[#043331] sm:px-6 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[36px] bg-[linear-gradient(145deg,#031f26,#074c4a_58%,#0b756d)] p-7 text-white shadow-xl sm:p-10">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#f5c451]">USVI Explorer Operations</p>
              <h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-6xl">Command Center</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/65">
                Monitor booking demand, merchant responses, traveler volume, and operational exceptions from one live view.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-[10px] font-black uppercase tracking-[.15em]"
            >
              <RefreshCcw className="h-4 w-4" /> Refresh
            </button>
          </div>
          <p className="mt-5 text-[9px] font-black uppercase tracking-[.15em] text-white/40">
            {lastUpdated ? `Live · updated ${lastUpdated.toLocaleTimeString()}` : "Connecting to live operations"}
          </p>
        </section>

        {error ? <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div> : null}

        {loading ? (
          <div className="mt-6 grid min-h-72 place-items-center rounded-[30px] border border-slate-200 bg-white">
            <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
          </div>
        ) : (
          <>
            <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <Metric icon={CalendarClock} label="Needs action" value={String(metrics.active)} />
              <Metric icon={BadgeCheck} label="Confirmed" value={String(metrics.confirmed)} />
              <Metric icon={Users} label="Travelers" value={String(metrics.travelers)} />
              <Metric icon={Clock3} label="Avg response" value={metrics.averageResponseMinutes === null ? "—" : `${metrics.averageResponseMinutes}m`} />
              <Metric icon={Activity} label="Closed" value={String(metrics.closed)} />
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
              <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <h2 className="text-xl font-black">Operational alerts</h2>
                </div>
                <div className="mt-5 space-y-3">
                  {alerts.length ? alerts.map((alert) => (
                    <article key={alert.id} className={`rounded-2xl border p-4 ${alert.tone}`}>
                      <p className="text-sm font-black">{alert.title}</p>
                      <p className="mt-2 text-xs font-semibold leading-5 opacity-75">{alert.detail}</p>
                    </article>
                  )) : (
                    <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800">No urgent operational exceptions.</div>
                  )}
                </div>
              </div>

              <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-teal-700" />
                  <h2 className="text-xl font-black">Live activity</h2>
                </div>
                <div className="mt-5 divide-y divide-slate-100">
                  {activity.map((item) => (
                    <article key={item.id} className="flex items-start justify-between gap-4 py-4 first:pt-0">
                      <div>
                        <p className="text-sm font-black">{item.listingName}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {item.reference} · {item.guestName} · {item.island.toUpperCase()}
                        </p>
                        <p className="mt-1 text-[10px] font-bold text-slate-400">
                          {item.proposedTime ? `Alternate time: ${item.proposedTime}` : item.merchantNote || `Travel date: ${item.startDate}`}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-2 text-[9px] font-black uppercase tracking-[.12em]">{item.status}</span>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <Icon className="h-5 w-5 text-teal-700" />
      <div className="mt-4 text-3xl font-black">{value}</div>
      <div className="mt-1 text-[9px] font-black uppercase tracking-[.14em] text-slate-400">{label}</div>
    </div>
  );
}

function responseAverage(bookings: Booking[]) {
  const samples = bookings
    .filter((item) => item.status !== "requested")
    .map((item) => (Date.parse(item.updatedAt) - Date.parse(item.createdAt)) / 60_000)
    .filter((value) => Number.isFinite(value) && value >= 0);
  if (!samples.length) return null;
  return Math.round(samples.reduce((sum, value) => sum + value, 0) / samples.length);
}

function buildAlerts(bookings: Booking[]) {
  const now = Date.now();
  const stale = bookings.filter(
    (item) => ["requested", "reviewing"].includes(item.status) && now - Date.parse(item.createdAt) > 30 * 60_000,
  );
  const today = new Date().toISOString().slice(0, 10);
  const todayConfirmed = bookings.filter((item) => item.status === "confirmed" && item.startDate === today);
  const declined = bookings.filter((item) => item.status === "declined").slice(0, 3);

  return [
    ...(stale.length ? [{ id: "stale", title: `${stale.length} requests awaiting response`, detail: "These requests have been open for more than 30 minutes and may need operator intervention.", tone: "border-amber-200 bg-amber-50 text-amber-900" }] : []),
    ...(todayConfirmed.length ? [{ id: "today", title: `${todayConfirmed.length} confirmed services today`, detail: "Review timing, traveler contact details, and transportation dependencies before service begins.", tone: "border-sky-200 bg-sky-50 text-sky-900" }] : []),
    ...(declined.length ? [{ id: "declined", title: `${declined.length} recent unavailable requests`, detail: "Concierge may need to offer replacements so affected travelers can keep their missions intact.", tone: "border-red-200 bg-red-50 text-red-800" }] : []),
  ];
}
