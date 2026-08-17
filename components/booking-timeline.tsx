"use client";

import { useEffect, useMemo, useState } from "react";

import { PostRideExperience } from "@/components/post-ride-experience";
import { subscribeToBookingEvents } from "@/lib/firestore-trips";
import type { RideBooking } from "@/types/mobility";
import type { TripEvent } from "@/types/trip-event";

type Props = {
  bookingId: string;
};

export function BookingTimeline({ bookingId }: Props) {
  const [events, setEvents] = useState<TripEvent[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedBooking, setCompletedBooking] = useState<RideBooking | null>(null);
  const hasCompletedEvent = useMemo(
    () => events.some((event) => event.type === "trip_completed"),
    [events],
  );

  useEffect(() => {
    return subscribeToBookingEvents(
      bookingId,
      (data) => {
        setEvents(data);
        setErrorMessage(null);
      },
      (error) => {
        console.error(error);
        setErrorMessage(error.message);
      },
    );
  }, [bookingId]);

  useEffect(() => {
    if (!hasCompletedEvent) {
      setCompletedBooking(null);
      return;
    }

    let cancelled = false;
    async function loadCompletedBooking() {
      try {
        const response = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const payload = (await response.json()) as { booking?: RideBooking };
        if (!cancelled && payload.booking?.status === "completed") {
          setCompletedBooking(payload.booking);
        }
      } catch {
        // The timeline remains useful even when the post-ride summary cannot refresh.
      }
    }

    void loadCompletedBooking();
    return () => {
      cancelled = true;
    };
  }, [bookingId, hasCompletedEvent]);

  return (
    <section className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.25em] text-[#f59e0b]">
            Trip timeline
          </div>
          <h3 className="mt-2 text-2xl font-black italic tracking-tight text-[#043331]">
            Live movement feed
          </h3>
        </div>

        <div className="rounded-full bg-[#f8f4ea] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
          {events.length} event{events.length === 1 ? "" : "s"}
        </div>
      </div>

      {errorMessage ? (
        <div className="mt-5 rounded-[24px] border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-6 space-y-5">
        {events.length ? (
          events.map((event, index) => (
            <div key={event.id} className="flex gap-4">
              <div className="flex w-8 flex-col items-center">
                <div className="mt-1 h-3.5 w-3.5 rounded-full bg-[#f5b942] ring-4 ring-[#fff4d6]" />
                {index < events.length - 1 ? (
                  <div className="mt-2 w-px flex-1 bg-slate-200" />
                ) : null}
              </div>

              <div className="flex-1 rounded-[24px] border border-slate-200 bg-[#f8f4ea] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                      {formatEventType(event.type)}
                    </div>
                    <div className="mt-2 text-sm font-semibold leading-6 text-[#043331]">
                      {event.message}
                    </div>
                  </div>

                  <div className="rounded-full bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                    {formatTimestamp(event.createdAt)}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <EventMetaChip label={formatActorType(event.actorType)} />
                  {event.actorId ? <EventMetaChip label={event.actorId} /> : null}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[24px] border border-slate-200 bg-[#f8f4ea] p-5">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
              Timeline pending
            </div>
            <div className="mt-2 text-lg font-black italic tracking-tight text-[#043331]">
              No timeline events yet.
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-500">
              Once the booking starts moving through the territory, status events will appear here in order.
            </div>
          </div>
        )}
      </div>

      {completedBooking ? <PostRideExperience booking={completedBooking} /> : null}
    </section>
  );
}

function EventMetaChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
      {label}
    </span>
  );
}

function formatEventType(type: string) {
  switch (type) {
    case "booking_requested":
      return "Booking Requested";
    case "driver_matched":
      return "Driver Matched";
    case "driver_en_route":
      return "Driver En Route";
    case "driver_arrived":
      return "Driver Arrived";
    case "trip_started":
      return "Trip Started";
    case "trip_completed":
      return "Trip Completed";
    case "trip_cancelled":
      return "Trip Cancelled";
    default:
      return type.replaceAll("_", " ");
  }
}

function formatActorType(actorType: string) {
  switch (actorType) {
    case "driver":
      return "Driver";
    case "rider":
      return "Rider";
    case "admin":
      return "Dispatch";
    case "system":
      return "System";
    default:
      return actorType;
  }
}

function formatTimestamp(value?: string) {
  if (!value) return "Time pending";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time pending";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
