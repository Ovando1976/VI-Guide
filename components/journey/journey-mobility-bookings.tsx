"use client";

import Link from "next/link";
import { CarFront, CreditCard } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { readJourneyPlans, type JourneyPlan } from "@/lib/journey-planner";

export function JourneyMobilityBookings() {
  const [plans, setPlans] = useState<JourneyPlan[]>([]);

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
          .map((stop) => ({ plan, stop })),
      ),
    [plans],
  );

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
            <h2 className="mt-1 text-lg font-black">Your ride is connected to My Trip.</h2>
          </div>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {rides.slice(0, 4).map(({ plan, stop }) => (
            <div key={`${plan.id}:${stop.id}`} className="flex flex-col gap-3 rounded-[22px] border border-teal-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-black">{stop.title}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{plan.title} · {stop.summary}</p>
              </div>
              <Link href={stop.bookingHref!} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-[#043331] px-4 text-[9px] font-black uppercase tracking-[.14em] text-white transition hover:-translate-y-0.5">
                <CreditCard className="h-4 w-4" /> Continue ride
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
