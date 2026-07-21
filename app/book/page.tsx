import type { Metadata } from "next";
import { Suspense } from "react";

import { CommerceBookingForm } from "@/components/booking/commerce-booking-form";

export const metadata: Metadata = {
  title: "Book with VI Guide",
  description:
    "Request accommodations, tours, and island experiences through one clear VI Guide booking flow.",
};

export default function BookingPage() {
  return (
    <Suspense fallback={<BookingLoading />}>
      <CommerceBookingForm />
    </Suspense>
  );
}

function BookingLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f8f4ea] px-6 text-center text-[#043331]">
      <div>
        <div className="text-[10px] font-black uppercase tracking-[.22em] text-teal-700">
          VI Guide Booking
        </div>
        <h1 className="mt-3 text-3xl font-black">Preparing your request…</h1>
      </div>
    </main>
  );
}
