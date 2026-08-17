import { redirect } from "next/navigation";
import { Suspense } from "react";

import { MobilityBookingScreen } from "@/components/mobility-booking-screen";
import { FareStatusBanner } from "@/components/mobility/fare-status-banner";
import { RideConfirmationPortal } from "@/components/mobility/ride-confirmation-portal";
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
    <>
      <style>{`
        @media (max-width: 639px) {
          main:has(section#book) {
            padding-left: 12px;
            padding-right: 12px;
            padding-top: 12px;
          }

          main:has(section#book) > div {
            gap: 14px;
          }

          main:has(section#book) > div > section:first-of-type {
            min-height: 228px;
            border-radius: 26px;
          }

          main:has(section#book) > div > section:first-of-type > div:last-child {
            min-height: 228px;
            gap: 12px;
            padding: 18px;
          }

          main:has(section#book) > div > section:first-of-type h1 {
            margin-top: 12px;
            font-size: 2rem;
            line-height: .96;
          }

          main:has(section#book) > div > section:first-of-type h1 + p {
            margin-top: 8px;
            font-size: .75rem;
            line-height: 1.25rem;
          }

          main:has(section#book) > div > section:first-of-type div.grid.gap-3 {
            display: none;
          }

          section#book {
            border-radius: 28px;
            overflow: visible;
          }

          section#book > header {
            border-radius: 28px 28px 0 0;
            padding: 16px;
          }

          section#book > header h2 {
            margin-top: 10px;
            font-size: 1.65rem;
            line-height: 1;
          }

          section#book > header h2 + p {
            display: none;
          }

          section#book > header .grid-cols-4 {
            gap: 6px;
          }

          section#book > header .grid-cols-4 button {
            border-radius: 12px;
            padding: 8px 4px;
          }

          /* #trip-review only exists during the confirmation step. Keep the
             sticky control out of steps 1-3 so the visible in-panel Next action
             is always the only mobile primary action and Review is never a dead tap. */
          section#book:not(:has(#trip-review)) > div:last-of-type.sticky {
            display: none;
          }

          section#book > div:last-of-type.sticky {
            bottom: calc(10px + env(safe-area-inset-bottom));
            margin-left: 10px;
            margin-right: 10px;
            margin-bottom: 10px;
          }

          section#book #trip-review .text-5xl {
            font-size: 3.5rem;
            line-height: 1;
          }
        }
      `}</style>
      <Suspense fallback={<MobilityLoadingState />}>
        <TripAwareMobilityHandoff />
        <FareStatusBanner />
        <MobilityBookingScreen />
        <RideConfirmationPortal />
      </Suspense>
    </>
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
