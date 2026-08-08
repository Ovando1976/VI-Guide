"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { mapHrefForJourneyPlan } from "@/lib/island-journey-map";
import type { JourneyPlan } from "@/lib/journey-planner";

export function TripCommandMapLink({
  plan,
  icon: Icon,
  label,
  detail,
  variant,
}: {
  plan: JourneyPlan | null;
  icon: LucideIcon;
  label: string;
  detail?: string;
  variant: "quick" | "tool";
}) {
  const href = mapHrefForJourneyPlan(plan);
  const islandJourney = href.startsWith("/map/journey");
  const resolvedLabel = islandJourney ? "Journey Map" : label;
  const resolvedDetail = islandJourney
    ? "See taxi + ferry + taxi journey"
    : detail;

  if (variant === "quick") {
    return (
      <Link
        href={href}
        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/12 bg-white/[.08] px-4 text-[9px] font-black uppercase tracking-[.13em] text-white transition hover:bg-white/[.14]"
      >
        <Icon className="h-3.5 w-3.5 text-[#7ce0d4]" />
        {islandJourney ? "Open journey map" : label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="rounded-[20px] border border-slate-200 bg-[#fbfaf6] p-4 transition hover:border-teal-500/50"
    >
      <Icon className="h-5 w-5 text-teal-700" />
      <p className="mt-3 text-sm font-black text-[#043331]">{resolvedLabel}</p>
      <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-500">
        {resolvedDetail}
      </p>
    </Link>
  );
}
