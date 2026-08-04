"use client";

import Link from "next/link";
import {
  BellRing,
  CalendarClock,
  CircleAlert,
  Clock3,
  Navigation,
  Sparkles,
} from "lucide-react";

import type { JourneyPlan } from "@/lib/journey-planner";
import type { IntelligencePlanStop } from "@/types/intelligence";

type GuidanceTone = "go" | "prepare" | "review";

type MissionGuidance = {
  eyebrow: string;
  title: string;
  summary: string;
  actionLabel: string;
  actionHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  tone: GuidanceTone;
};

export function ProactiveMissionGuide({
  journey,
  currentStop,
}: {
  journey: JourneyPlan;
  currentStop: IntelligencePlanStop | null;
}) {
  const guidance = buildGuidance(journey, currentStop);
  const tone = {
    go: {
      shell: "border-emerald-200 bg-emerald-50",
      icon: "bg-emerald-700 text-white",
      eyebrow: "text-emerald-700",
      primary: "bg-emerald-800 text-white",
    },
    prepare: {
      shell: "border-amber-200 bg-amber-50",
      icon: "bg-amber-500 text-[#043331]",
      eyebrow: "text-amber-700",
      primary: "bg-[#043331] text-white",
    },
    review: {
      shell: "border-sky-200 bg-sky-50",
      icon: "bg-sky-700 text-white",
      eyebrow: "text-sky-700",
      primary: "bg-[#043331] text-white",
    },
  }[guidance.tone];

  return (
    <section className={`rounded-[32px] border p-5 shadow-sm sm:p-6 ${tone.shell}`}>
      <div className="flex items-start gap-4">
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${tone.icon}`}>
          {guidance.tone === "go" ? (
            <Navigation className="h-5 w-5" />
          ) : guidance.tone === "prepare" ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <CircleAlert className="h-5 w-5" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={`text-[9px] font-black uppercase tracking-[.18em] ${tone.eyebrow}`}>
              {guidance.eyebrow}
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/75 px-3 py-1 text-[8px] font-black uppercase tracking-[.14em] text-slate-500">
              <Clock3 className="h-3 w-3" /> Live mission guidance
            </span>
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-[-.04em] text-[#043331]">
            {guidance.title}
          </h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            {guidance.summary}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <Link
          href={guidance.actionHref}
          className={`inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-[9px] font-black uppercase tracking-[.14em] ${tone.primary}`}
        >
          {guidance.actionLabel}
        </Link>
        <Link
          href={guidance.secondaryHref}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/80 bg-white/75 px-4 text-[9px] font-black uppercase tracking-[.14em] text-[#043331]"
        >
          {guidance.secondaryLabel}
        </Link>
      </div>
    </section>
  );
}

function buildGuidance(
  journey: JourneyPlan,
  currentStop: IntelligencePlanStop | null,
): MissionGuidance {
  const now = new Date();
  const missionDate = parseMissionDate(journey.date);
  const mapHref = currentStop?.mapHref || currentStop?.href || "/workspace";
  const conciergeHref = `/map?concierge=open&prompt=${encodeURIComponent(
    `Review my active mission ${journey.title}. Focus on ${currentStop?.title ?? "the next stop"}, current timing, transportation, reservations, and one practical backup. Keep confirmed plans intact.`,
  )}`;

  if (!currentStop) {
    return {
      eyebrow: "Mission needs a next action",
      title: "Add the next useful stop",
      summary:
        "Your mission is active but there is no current destination. The Concierge can add a practical next stop without rebuilding the rest of the day.",
      actionLabel: "Ask Concierge to add stop",
      actionHref: conciergeHref,
      secondaryLabel: "Open Journey Planner",
      secondaryHref: "/planner",
      tone: "review",
    };
  }

  if (currentStop.bookingHref) {
    return {
      eyebrow: "Reservation action available",
      title: `Confirm ${currentStop.title}`,
      summary:
        "This stop exposes a booking action. Confirm it before departure so the mission timeline and transportation plan remain dependable.",
      actionLabel: "Open booking",
      actionHref: currentStop.bookingHref,
      secondaryLabel: "Review mission timing",
      secondaryHref: conciergeHref,
      tone: "prepare",
    };
  }

  if (missionDate) {
    const daysUntilMission = Math.ceil(
      (startOfDay(missionDate).getTime() - startOfDay(now).getTime()) / 86_400_000,
    );

    if (daysUntilMission > 0) {
      return {
        eyebrow: `${daysUntilMission} day${daysUntilMission === 1 ? "" : "s"} until mission`,
        title: `Prepare for ${currentStop.title}`,
        summary:
          "Review transportation and reservation needs now. VI Guide can optimize timing and add a backup before the mission begins.",
        actionLabel: "Prepare this stop",
        actionHref: conciergeHref,
        secondaryLabel: "View destination",
        secondaryHref: mapHref,
        tone: "prepare",
      };
    }

    if (daysUntilMission < 0) {
      return {
        eyebrow: "Mission date has passed",
        title: "Review or reschedule this mission",
        summary:
          "The saved mission date is in the past. Update the journey before relying on its current sequence, timing, or reservations.",
        actionLabel: "Reschedule with Concierge",
        actionHref: conciergeHref,
        secondaryLabel: "Open Journey Planner",
        secondaryHref: "/planner",
        tone: "review",
      };
    }
  }

  return {
    eyebrow: "Next action",
    title: `Continue to ${currentStop.title}`,
    summary:
      "This is the active stop. Open navigation now, or let the Concierge check timing, transportation, reservations, and a backup before you leave.",
    actionLabel: "Navigate now",
    actionHref: mapHref,
    secondaryLabel: "Check mission conditions",
    secondaryHref: conciergeHref,
    tone: "go",
  };
}

function parseMissionDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}
