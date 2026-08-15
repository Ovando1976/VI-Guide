"use client";

import { useSearchParams } from "next/navigation";
import { Radio, ShieldCheck } from "lucide-react";

import { BookingTimeline } from "@/components/booking-timeline";
import { RideConfirmationLifecycle } from "@/components/mobility/ride-confirmation-lifecycle";

export function TripRideStatusFromUrl() {
  const searchParams = useSearchParams();
  const bookingId = (searchParams.get("booking") ?? "").trim();
  if (!bookingId) return null;

  return (
    <section className="mt-6 overflow-hidden rounded-[34px] border border-teal-200 bg-white shadow-sm">
      <div className="bg-[linear-gradient(135deg,#043331,#0f766e)] px-5 py-5 text-white sm:px-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.18em] text-[#f5c451]">
              <Radio className="h-4 w-4" /> Ride status
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-[-.04em] sm:text-3xl">Payment submitted. Now watch dispatch.</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/68">Payment does not by itself mean a driver has been assigned. Your ride becomes confirmed when dispatch matches an authorized operator, and the live timeline below will show that progression.</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[8px] font-black uppercase tracking-[.14em] text-white/80">
            <ShieldCheck className="h-4 w-4 text-[#7ce0d4]" /> Booking {bookingId.slice(0, 8)}
          </span>
        </div>
      </div>
      <div className="p-4 sm:p-6">
        <RideConfirmationLifecycle />
        <div className="mt-5">
          <BookingTimeline bookingId={bookingId} />
        </div>
      </div>
    </section>
  );
}
