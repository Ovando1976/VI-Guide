"use client";

import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  MapPinned,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  buildBookingStatusHref,
  readTrackedBookings,
  TRACKED_BOOKINGS_UPDATED_EVENT,
  type TrackedBooking,
} from "@/lib/booking/booking-tracker";
import type { CommerceBookingStatus } from "@/types/commerce-booking";

const ISLAND_NAMES = {
  stt: "St. Thomas",
  stj: "St. John",
  stx: "St. Croix",
} as const;

const STATUS_LABELS: Record<CommerceBookingStatus, string> = {
  draft: "Draft",
  requested: "Request received",
  reviewing: "Under review",
  payment_required: "Payment required",
  paid: "Payment received",
  confirmed: "Confirmed",
  completed: "Completed",
  declined: "Unavailable",
  cancelled: "Cancelled",
};

export function RememberedBookingsPanel() {
  const [bookings, setBookings] = useState<TrackedBooking[]>([]);

  useEffect(() => {
    const refresh = () => setBookings(readTrackedBookings());
    refresh();
    window.addEventListener(TRACKED_BOOKINGS_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(TRACKED_BOOKINGS_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return (
    <section className="px-4 pt-6 sm:px-6 lg:pt-8">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[32px] border border-[#0f766e]/15 bg-white shadow-[0_24px_70px_rgba(4,51,49,.10)]">
        <div className="grid gap-0 lg:grid-cols-[.72fr_1.28fr]">
          <div className="relative overflow-hidden bg-[#043331] p-6 text-white sm:p-8">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-35"
              style={{ backgroundImage: "url('/images/usvi-harbor-hero.jpg')" }}
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(4,51,49,.97),rgba(4,51,49,.72))]" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-[#f5c451]">
                <ClipboardCheck className="h-4 w-4" /> My Bookings
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-[-.045em] sm:text-4xl">
                Your requests, in one place.
              </h1>
              <p className="mt-4 text-sm font-semibold leading-6 text-white/68">
                VI Guide remembers validated booking references on this device so you can reopen a request without hunting through messages.
              </p>
              <div className="mt-6 flex gap-3 rounded-2xl border border-white/10 bg-white/[.06] p-4 text-xs font-semibold leading-5 text-white/68">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#73e3d9]" />
                <span>
                  These cards show only locally remembered details. Opening one still performs the secure email + reference lookup before live status or payment actions appear.
                </span>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.18em] text-teal-700">
                  Remembered on this device
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-[-.035em] text-[#043331]">
                  {bookings.length
                    ? `${bookings.length} booking request${bookings.length === 1 ? "" : "s"}`
                    : "No remembered requests yet"}
                </h2>
              </div>
              <Link
                href="/experiences"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-[#fbfaf6] px-4 text-[9px] font-black uppercase tracking-[.14em] text-[#043331]"
              >
                <Sparkles className="h-3.5 w-3.5" /> Find something to book
              </Link>
            </div>

            {bookings.length ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {bookings.map((booking) => (
                  <BookingCard key={booking.reference} booking={booking} />
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-[24px] border border-dashed border-teal-200 bg-[#f8f4ea] p-5">
                <p className="text-sm font-bold leading-6 text-slate-700">
                  Submit a stay, tour, or experience request and VI Guide will keep the validated reference here on this device for quick return access.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href="/accommodations"
                    className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#043331] px-4 text-[9px] font-black uppercase tracking-[.14em] text-white"
                  >
                    Browse stays
                  </Link>
                  <Link
                    href="/experiences"
                    className="inline-flex min-h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-[9px] font-black uppercase tracking-[.14em] text-[#043331]"
                  >
                    Browse experiences
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function BookingCard({ booking }: { booking: TrackedBooking }) {
  const positive = ["confirmed", "paid", "completed"].includes(booking.status);
  const attention = booking.status === "payment_required";
  const Icon = positive ? CheckCircle2 : attention ? Clock3 : MapPinned;
  const dates = booking.endDate
    ? `${booking.startDate} → ${booking.endDate}`
    : booking.startDate;

  return (
    <Link
      href={buildBookingStatusHref(booking.reference)}
      className="group rounded-[24px] border border-slate-200 bg-[#fbfaf6] p-4 transition hover:-translate-y-0.5 hover:border-teal-300 hover:bg-white hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${
            attention
              ? "bg-amber-100 text-amber-700"
              : positive
                ? "bg-emerald-100 text-emerald-700"
                : "bg-teal-100 text-teal-700"
          }`}
        >
          <Icon className="h-4.5 w-4.5" />
        </span>
        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[8px] font-black uppercase tracking-[.12em] text-slate-500">
          {STATUS_LABELS[booking.status]}
        </span>
      </div>

      <h3 className="mt-4 line-clamp-2 text-base font-black leading-5 text-[#043331]">
        {booking.listingName}
      </h3>
      <p className="mt-1 text-[10px] font-bold text-slate-500">
        {ISLAND_NAMES[booking.island]} · {booking.reference}
      </p>
      <div className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-600">
        <CalendarDays className="h-3.5 w-3.5 text-teal-700" /> {dates}
      </div>
      <div className="mt-4 text-[9px] font-black uppercase tracking-[.14em] text-teal-800">
        Open live status →
      </div>
    </Link>
  );
}
