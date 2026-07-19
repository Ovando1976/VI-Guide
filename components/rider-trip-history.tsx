"use client";

import { useEffect, useMemo, useState } from "react";
import { subscribeToRiderBookings } from "@/lib/firestore-trips";
import type { RideBooking } from "@/types/mobility";
import { BookingTimeline } from "@/components/booking-timeline";

type Props = {
  riderId: string;
};

const ACTIVE_STATUSES: RideBooking["status"][] = [
  "requested",
  "matched",
  "driver_en_route",
  "arrived",
  "in_progress",
];

export function RiderTripHistory({ riderId }: Props) {
  const [bookings, setBookings] = useState<RideBooking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    return subscribeToRiderBookings(
      riderId,
      (data) => {
        setBookings(data);
        setErrorMessage(null);
      },
      (error) => {
        console.error(error);
        setErrorMessage(error.message);
      }
    );
  }, [riderId]);

  const activeBookings = useMemo(
    () =>
      bookings.filter((booking) => ACTIVE_STATUSES.includes(booking.status)),
    [bookings]
  );

  const historicalBookings = useMemo(
    () =>
      bookings.filter((booking) => !ACTIVE_STATUSES.includes(booking.status)),
    [bookings]
  );

  const selectedBooking =
    bookings.find((booking) => booking.id === selectedBookingId) ?? null;

  useEffect(() => {
    if (!bookings.length) {
      setSelectedBookingId(null);
      return;
    }

    if (
      selectedBookingId &&
      bookings.some((booking) => booking.id === selectedBookingId)
    ) {
      return;
    }

    if (activeBookings.length) {
      setSelectedBookingId(activeBookings[0].id);
      return;
    }

    if (historicalBookings.length) {
      setSelectedBookingId(historicalBookings[0].id);
    }
  }, [bookings, activeBookings, historicalBookings, selectedBookingId]);

  const primaryActive = activeBookings[0] ?? null;

  return (
    <section className="space-y-6">
      <div>
        <div className="text-[11px] font-black uppercase tracking-[0.3em] text-[#f59e0b]">
          Rider lounge
        </div>
        <h2 className="mt-3 text-4xl font-black italic tracking-tight text-[#043331]">
          Your island trip center
        </h2>
        <p className="mt-3 max-w-3xl text-sm font-semibold text-slate-500">
          Track active rides, review completed trips, and follow live trip
          movement across the territory.
        </p>
      </div>

      {errorMessage ? (
        <section className="rounded-[24px] border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {errorMessage}
        </section>
      ) : null}

      {primaryActive ? (
        <section className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
          <div className="overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-sm">
            <div className="bg-[linear-gradient(135deg,#043331_0%,#0b5d5b_55%,#14b8a6_100%)] px-6 py-6 text-white">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] font-black uppercase tracking-[0.25em] text-[#fde68a]">
                  Active island trip
                </div>
                <StatusBadge status={primaryActive.status} />
              </div>

              <div className="mt-5 text-3xl font-black italic tracking-tight">
                {primaryActive.origin.estateName} →{" "}
                {primaryActive.destination.estateName}
              </div>

              <div className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-teal-50/80">
                {primaryActive.mode} · {primaryActive.passengers} passenger
                {primaryActive.passengers === 1 ? "" : "s"} ·{" "}
                {primaryActive.luggage} bag
                {primaryActive.luggage === 1 ? "" : "s"}
              </div>
            </div>

            <div className="space-y-6 p-6">
              <div className="grid gap-4 md:grid-cols-3">
                <MetricCard
                  label="Driver"
                  value={primaryActive.driverId || "Pending"}
                />
                <MetricCard
                  label="Fare"
                  value={`$${primaryActive.quotedFare.total.toFixed(2)}`}
                />
                <MetricCard
                  label="Status"
                  value={prettyStatus(primaryActive.status)}
                />
              </div>

              <div className="rounded-[26px] border border-slate-200 bg-[#f8f4ea] p-5">
                <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                  Rider guidance
                </div>
                <div className="mt-3 text-sm font-semibold leading-6 text-slate-700">
                  {statusGuidance(primaryActive.status)}
                </div>
              </div>

              {activeBookings.length > 1 ? (
                <div>
                  <div className="mb-3 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Other active trips
                  </div>

                  <div className="space-y-3">
                    {activeBookings.slice(1).map((booking) => (
                      <button
                        key={booking.id}
                        onClick={() => setSelectedBookingId(booking.id)}
                        className="block w-full rounded-[22px] border border-slate-200 bg-white p-4 text-left transition hover:border-[#0f766e]/35 hover:bg-[#f8f4ea]"
                      >
                        <div className="text-lg font-black italic tracking-tight text-[#043331]">
                          {booking.origin.estateName} →{" "}
                          {booking.destination.estateName}
                        </div>
                        <div className="mt-1 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                          {prettyStatus(booking.status)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <BookingTimelineCard
            bookingId={selectedBookingId ?? primaryActive.id}
            booking={selectedBooking ?? primaryActive}
          />
        </section>
      ) : (
        <section className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#f59e0b]">
            No live movement
          </div>
          <div className="mt-3 text-2xl font-black italic tracking-tight text-[#043331]">
            No active trips right now.
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-500">
            Once you request a ride, live trip activity will appear here.
          </div>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.25em] text-[#f59e0b]">
                Trip archive
              </div>
              <h3 className="mt-2 text-3xl font-black italic tracking-tight text-[#043331]">
                Recent island rides
              </h3>
            </div>

            <div className="rounded-full bg-[#f8f4ea] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              {historicalBookings.length} trips
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {historicalBookings.length ? (
              historicalBookings.map((booking) => {
                const active = booking.id === selectedBookingId;

                return (
                  <button
                    key={booking.id}
                    onClick={() => setSelectedBookingId(booking.id)}
                    className={`block w-full rounded-[24px] border p-4 text-left transition ${
                      active
                        ? "border-[#f5b942] bg-[#fff4d6]"
                        : "border-slate-200 bg-white hover:border-[#0f766e]/35 hover:bg-[#f8f4ea]"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-black italic tracking-tight text-[#043331]">
                          {booking.origin.estateName} →{" "}
                          {booking.destination.estateName}
                        </div>
                        <div className="mt-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                          {booking.mode} · {prettyStatus(booking.status)}
                        </div>
                      </div>

                      <div className="text-lg font-black text-[#043331]">
                        ${booking.quotedFare.total.toFixed(2)}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-[24px] border border-slate-200 bg-[#f8f4ea] p-4 text-sm font-semibold text-slate-500">
                No completed or past trips yet.
              </div>
            )}
          </div>
        </section>

        <BookingTimelineCard
          bookingId={selectedBookingId}
          booking={selectedBooking}
        />
      </div>
    </section>
  );
}

function BookingTimelineCard({
  bookingId,
  booking,
}: {
  bookingId: string | null;
  booking?: RideBooking | null;
}) {
  if (!bookingId) {
    return (
      <section className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-sm font-semibold text-slate-500">
          Select a trip to view its timeline.
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {booking ? (
        <section className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-[11px] font-black uppercase tracking-[0.25em] text-[#f59e0b]">
            Selected trip
          </div>

          <div className="mt-4 text-2xl font-black italic tracking-tight text-[#043331]">
            {booking.origin.estateName} → {booking.destination.estateName}
          </div>

          <div className="mt-3 text-sm font-semibold text-slate-500">
            {booking.passengers} passenger{booking.passengers === 1 ? "" : "s"}{" "}
            · {booking.luggage} bag{booking.luggage === 1 ? "" : "s"} ·{" "}
            {booking.mode}
          </div>
        </section>
      ) : null}

      <section className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-sm">
        <BookingTimeline bookingId={bookingId} />
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-4">
      <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-lg font-black text-[#043331]">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: RideBooking["status"] }) {
  return (
    <div className="rounded-full bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-white backdrop-blur">
      {prettyStatus(status)}
    </div>
  );
}

function prettyStatus(status: RideBooking["status"]) {
  switch (status) {
    case "driver_en_route":
      return "Driver En Route";
    case "in_progress":
      return "In Progress";
    default:
      return status.replaceAll("_", " ");
  }
}

function statusGuidance(status: RideBooking["status"]) {
  switch (status) {
    case "requested":
      return "Your ride request is now in the island queue and waiting for assignment.";
    case "matched":
      return "A driver has accepted your trip. Expect movement toward pickup shortly.";
    case "driver_en_route":
      return "Your driver is on the way to the pickup point now.";
    case "arrived":
      return "Your driver has arrived. Head to the pickup location.";
    case "in_progress":
      return "Your ride is in progress across the territory.";
    case "completed":
      return "This trip has been completed.";
    case "cancelled":
      return "This trip was cancelled.";
    default:
      return "Trip status updated.";
  }
}
