import { Suspense } from "react";

import { MobilityBookingScreen } from "@/components/mobility-booking-screen";

export default function MobilityPage() {
  return (
    <Suspense fallback={<MobilityLoadingState />}>
      <MobilityBookingScreen />
    </Suspense>
  );
}

function MobilityLoadingState() {
  return (
    <main className="min-h-screen bg-[#f8f4ea] px-4 py-8 md:px-6">
      <div className="mx-auto max-w-6xl space-y-5" role="status">
        <div className="h-14 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-[680px] animate-pulse rounded-[36px] bg-white" />
        <span className="sr-only">Loading mobility booking</span>
      </div>
    </main>
  );
}
