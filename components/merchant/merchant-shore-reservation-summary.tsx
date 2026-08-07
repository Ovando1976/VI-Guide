"use client";

import {
  AlertTriangle,
  Clock3,
  Loader2,
  MapPin,
  RefreshCcw,
  ShieldCheck,
  ShipWheel,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { CommerceBookingStatus } from "@/types/commerce-booking";

type ShoreExcursionSnapshot = {
  shipName: string;
  cruiseLine: string | null;
  portId: string;
  portLabel: string;
  allAboardTime: string;
  meetingPoint: string;
  pickupIncluded: boolean;
  durationMinutes: number | null;
  minReturnBufferMinutes: number | null;
  excursionEndsAt: string | null;
  safeReturnDeadline: string | null;
  latestSafeStartTime: string | null;
  verifiedReturnBufferMinutes: number | null;
  timingStatus: string | null;
};

type Booking = {
  id: string;
  reference: string;
  status: CommerceBookingStatus;
  listingName: string;
  offerTitle: string | null;
  startDate: string;
  preferredTime: string | null;
  adults: number;
  children: number;
  guestName: string;
  shoreExcursion: ShoreExcursionSnapshot | null;
  createdAt: string;
};

export function MerchantShoreReservationSummary() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/merchant-bookings", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as
        | { bookings?: Booking[]; error?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load cruise reservations.");
      }
      const parsedBookings = payload?.bookings;
      setBookings(Array.isArray(parsedBookings) ? parsedBookings : []);
    } catch (caught) {
      if (!silent) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load cruise reservations.",
        );
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(true), 15_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const cruiseBookings = useMemo(
    () =>
      bookings
        .filter((booking) => booking.shoreExcursion)
        .sort((left, right) => {
          const dateOrder = left.startDate.localeCompare(right.startDate);
          if (dateOrder !== 0) return dateOrder;
          return (left.preferredTime ?? "").localeCompare(right.preferredTime ?? "");
        })
        .slice(0, 8),
    [bookings],
  );

  if (!loading && !error && !cruiseBookings.length) return null;

  return (
    <section className="bg-[#f7f2e7] px-4 pt-8 text-[#043331] sm:px-6 lg:pt-12">
      <div className="mx-auto max-w-7xl rounded-[34px] border border-teal-900/10 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.16em] text-teal-700">
              <ShipWheel className="h-4 w-4" /> Cruise dispatch board
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-.045em]">
              Ship clock and return window at a glance
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
              Cruise requests surface the port, all-aboard time, planned return to
              port, and the return buffer captured when the traveler requested the
              booking.
            </p>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => void load()}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-[9px] font-black uppercase tracking-[.14em] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            Refresh
          </button>
        </div>

        {error ? (
          <div className="mt-5 flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold leading-6 text-rose-700">
            <AlertTriangle className="mt-1 h-4 w-4 shrink-0" /> {error}
          </div>
        ) : null}

        {loading && !bookings.length ? (
          <div className="mt-5 grid min-h-32 place-items-center rounded-2xl bg-slate-50">
            <Loader2 className="h-6 w-6 animate-spin text-teal-700" />
          </div>
        ) : cruiseBookings.length ? (
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {cruiseBookings.map((booking) => {
              const shore = booking.shoreExcursion;
              if (!shore) return null;
              return (
                <article
                  key={booking.id}
                  className="rounded-[26px] border border-slate-200 bg-[#fbfaf7] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[.14em] text-teal-700">
                        {booking.reference}
                      </p>
                      <h3 className="mt-2 text-xl font-black tracking-[-.035em]">
                        {booking.offerTitle || booking.listingName}
                      </h3>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {booking.guestName} · {booking.adults + booking.children} guests
                      </p>
                    </div>
                    <StatusPill status={booking.status} />
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <Datum
                      icon={ShipWheel}
                      label="Ship"
                      value={
                        shore.cruiseLine
                          ? `${shore.shipName} · ${shore.cruiseLine}`
                          : shore.shipName
                      }
                    />
                    <Datum icon={MapPin} label="Port" value={shore.portLabel} />
                    <Datum
                      icon={Clock3}
                      label="Excursion"
                      value={`${booking.startDate} · ${booking.preferredTime || "time pending"}`}
                    />
                    <Datum
                      icon={Clock3}
                      label="Ship all aboard"
                      value={shore.allAboardTime}
                    />
                    <Datum
                      icon={ShieldCheck}
                      label="Safe return deadline"
                      value={shore.safeReturnDeadline || "Not recorded"}
                    />
                    <Datum
                      icon={Users}
                      label="Verified buffer"
                      value={
                        shore.verifiedReturnBufferMinutes !== null
                          ? `${shore.verifiedReturnBufferMinutes} min`
                          : "Not recorded"
                      }
                    />
                  </div>

                  <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-semibold leading-5 text-emerald-950/75">
                    <strong className="text-emerald-900">Meeting point:</strong>{" "}
                    {shore.meetingPoint || "Confirm with traveler before fulfillment."}
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Datum({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-3">
      <div className="flex items-center gap-2 text-teal-700">
        <Icon className="h-4 w-4" />
        <span className="text-[8px] font-black uppercase tracking-[.12em] text-slate-400">
          {label}
        </span>
      </div>
      <p className="mt-2 text-sm font-black leading-5">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: CommerceBookingStatus }) {
  const className =
    status === "confirmed" || status === "paid"
      ? "bg-emerald-100 text-emerald-800"
      : status === "cancelled" || status === "declined"
        ? "bg-rose-100 text-rose-800"
        : status === "completed"
          ? "bg-slate-200 text-slate-700"
          : "bg-amber-100 text-amber-900";
  return (
    <span
      className={`rounded-full px-3 py-1 text-[8px] font-black uppercase tracking-[.12em] ${className}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
