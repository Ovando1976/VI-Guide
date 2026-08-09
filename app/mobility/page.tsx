import { redirect } from "next/navigation";
import { Suspense } from "react";

import { MobilityBookingScreen } from "@/components/mobility-booking-screen";
import { TripAwareMobilityHandoff } from "@/components/mobility/trip-aware-mobility-handoff";

type MobilitySearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizedMobilityHref(searchParams: MobilitySearchParams) {
  const trip = firstParam(searchParams.trip)?.trim();
  const from = firstParam(searchParams.from)?.trim();
  const to = firstParam(searchParams.to)?.trim();
  const pickupName = firstParam(searchParams.pickupName)?.trim();
  const destinationName = firstParam(searchParams.destinationName)?.trim();

  if (!trip || (!from && !to) || (pickupName && destinationName)) return null;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else if (value !== undefined) {
      params.set(key, value);
    }
  }

  if (from && !pickupName) params.set("pickupName", from);
  if (to && !destinationName) params.set("destinationName", to);

  return `/mobility?${params.toString()}`;
}

export default function MobilityPage({
  searchParams,
}: {
  searchParams: MobilitySearchParams;
}) {
  const normalizedHref = normalizedMobilityHref(searchParams);
  if (normalizedHref) redirect(normalizedHref);

  return (
    <Suspense fallback={<MobilityLoadingState />}>
      <TripAwareMobilityHandoff />
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
