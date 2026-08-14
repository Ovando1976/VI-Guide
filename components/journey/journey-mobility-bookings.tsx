"use client";

import Link from "next/link";
import { CarFront, CheckCircle2, Clock3, CreditCard, Loader2, Navigation, UserCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { readJourneyPlans, type JourneyPlan } from "@/lib/journey-planner";
import type { BookingStatus, RideBooking, RideBookingPaymentStatus } from "@/types/mobility";

type LiveRideState = Pick<RideBooking, "id" | "status" | "paymentStatus" | "driverId"> & {
  riderVerificationCode?: string | null;
};

type RideStatusView = {
  label: string;
  detail: string;
  actionLabel: string;
  tone: "amber" | "teal" | "emerald" | "slate" | "rose";
};

export function JourneyMobilityBookings() {
  const [plans, setPlans] = useState<JourneyPlan[]>([]);
  const [liveRides, setLiveRides] = useState<Record<string, LiveRideState>>({});
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const refresh = () => setPlans(readJourneyPlans());
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("vi-guide:traveler-trip-selected", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("vi-guide:traveler-trip-selected", refresh);
    };
  }, []);

  const rides = useMemo(
    () =>
      plans.flatMap((plan) =>
        plan.plan
          .filter((stop) => stop.kind === "mobility_booking" && stop.bookingHref)
          .map((stop) => ({
            plan,
            stop,
            bookingId: bookingIdFromHref(stop.bookingHref!),
          }))
          .filter((ride): ride is typeof ride & { bookingId: string } => Boolean(ride.bookingId)),
      ),
    [plans],
  );

  const bookingKey = useMemo(
    () => [...new Set(rides.map((ride) => ride.bookingId))].join("|"),
    [rides],
  );

  useEffect(() => {
    const bookingIds = bookingKey.split("|").filter(Boolean);
    if (!bookingIds.length) return;
    let cancelled = false;

    async function refreshLiveRides() {
      setLoadingIds((current) => new Set([...current, ...bookingIds]));
      const results = await Promise.all(
        bookingIds.map(async (bookingId) => {
          try {
            const response = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}`, {
              cache: "no-store",
            });
            if (!response.ok) return null;
            const payload = (await response.json().catch(() => null)) as
              | { booking?: RideBooking; riderVerificationCode?: string | null }
              | null;
            if (!payload?.booking) return null;
            return {
              id: payload.booking.id,
              status: payload.booking.status,
              paymentStatus: payload.booking.paymentStatus,
              driverId: payload.booking.driverId,
              riderVerificationCode: payload.riderVerificationCode,
            } satisfies LiveRideState;
          } catch {
            return null;
          }
        }),
      );

      if (cancelled) return;
      setLiveRides((current) => {
        const next = { ...current };
        for (const result of results) if (result) next[result.id] = result;
        return next;
      });
      setLoadingIds((current) => {
        const next = new Set(current);
        for (const bookingId of bookingIds) next.delete(bookingId);
        return next;
      });
    }

    void refreshLiveRides();
    const interval = window.setInterval(() => void refreshLiveRides(), 15000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [bookingKey]);

  if (!rides.length) return null;

  return (
    <section className="border-b border-teal-200 bg-[#eaf8f5] px-4 py-4 text-[#043331] sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#043331] text-[#8ef0e7]">
            <CarFront className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.18em] text-teal-700">Transportation attached</p>
            <h2 className="mt-1 text-lg font-black">Your rides stay connected to My Trip.</h2>
          </div>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {rides.slice(0, 4).map(({ plan, stop, bookingId }) => {
            const liveRide = liveRides[bookingId];
            const loading = loadingIds.has(bookingId) && !liveRide;
            const view = liveRide ? rideStatusView(liveRide.status, liveRide.paymentStatus) : null;

            return (
              <div key={`${plan.id}:${stop.id}`} className="flex flex-col gap-3 rounded-[22px] border border-teal-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-black">{stop.title}</p>
                    {loading ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[8px] font-black uppercase tracking-[.12em] text-slate-500">
                        <Loader2 className="h-3 w-3 animate-spin" /> Updating
                      </span>
                    ) : view ? (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-[.12em] ${statusToneClass(view.tone)}`}>
                        {statusIcon(liveRide!.status)} {view.label}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{plan.title}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    {view?.detail ?? stop.summary}
                  </p>
                  {liveRide?.riderVerificationCode ? (
                    <div className="mt-3 inline-flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-950">
                      <UserCheck className="h-4 w-4 shrink-0" />
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[.14em] text-emerald-700">Pickup PIN</p>
                        <p className="text-lg font-black tracking-[.24em]">{liveRide.riderVerificationCode}</p>
                        <p className="text-[10px] font-semibold tracking-normal text-emerald-800">Share only with your assigned driver after arrival.</p>
                      </div>
                    </div>
                  ) : null}
                </div>
                <Link href={stop.bookingHref!} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-[#043331] px-4 text-[9px] font-black uppercase tracking-[.14em] text-white transition hover:-translate-y-0.5">
                  {view?.actionLabel === "Continue payment" ? <CreditCard className="h-4 w-4" /> : <Navigation className="h-4 w-4" />}
                  {view?.actionLabel ?? "Continue ride"}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function bookingIdFromHref(href: string) {
  const match = href.match(/^\/checkout\/([^/?#]+)/);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function rideStatusView(status: BookingStatus, paymentStatus?: RideBookingPaymentStatus): RideStatusView {
  if (status === "cancelled") return { label: "Cancelled", detail: "This ride request was cancelled.", actionLabel: "View ride", tone: "rose" };
  if (status === "completed") return { label: "Completed", detail: "This ride is complete and remains attached to your trip history.", actionLabel: "View ride", tone: "slate" };
  if (paymentStatus !== "paid") {
    if (paymentStatus === "processing") return { label: "Payment processing", detail: "Payment is processing. USVI Explorer will update this ride automatically.", actionLabel: "View payment", tone: "amber" };
    if (paymentStatus === "failed") return { label: "Payment failed", detail: "Payment needs attention before the ride can advance.", actionLabel: "Continue payment", tone: "rose" };
    return { label: "Payment needed", detail: "Secure payment to move this ride into dispatch.", actionLabel: "Continue payment", tone: "amber" };
  }

  switch (status) {
    case "matched":
      return { label: "Driver assigned", detail: "A driver has accepted this ride and is preparing for pickup.", actionLabel: "View ride", tone: "teal" };
    case "driver_en_route":
      return { label: "Driver en route", detail: "Your driver is on the way to the pickup point.", actionLabel: "Track ride", tone: "teal" };
    case "arrived":
      return { label: "Driver arrived", detail: "Your driver has arrived at the pickup point.", actionLabel: "View ride", tone: "emerald" };
    case "in_progress":
      return { label: "Trip underway", detail: "Your ride is currently in progress.", actionLabel: "Track ride", tone: "emerald" };
    case "requested":
      return { label: "Awaiting driver", detail: "Payment is secured and dispatch is finding an eligible driver.", actionLabel: "View ride", tone: "teal" };
    default:
      return { label: "Ride requested", detail: "This transportation request is active in USVI Explorer.", actionLabel: "View ride", tone: "teal" };
  }
}

function statusToneClass(tone: RideStatusView["tone"]) {
  if (tone === "amber") return "bg-amber-50 text-amber-800";
  if (tone === "emerald") return "bg-emerald-50 text-emerald-800";
  if (tone === "rose") return "bg-rose-50 text-rose-700";
  if (tone === "slate") return "bg-slate-100 text-slate-600";
  return "bg-teal-50 text-teal-800";
}

function statusIcon(status: BookingStatus) {
  if (status === "completed") return <CheckCircle2 className="h-3 w-3" />;
  if (status === "matched") return <UserCheck className="h-3 w-3" />;
  if (status === "driver_en_route" || status === "in_progress") return <Navigation className="h-3 w-3" />;
  return <Clock3 className="h-3 w-3" />;
}
