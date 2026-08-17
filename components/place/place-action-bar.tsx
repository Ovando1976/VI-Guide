import Link from "next/link";
import {
  Bookmark,
  CalendarCheck,
  ExternalLink,
  Map,
  MessageCircleMore,
  Navigation,
  Sparkles,
} from "lucide-react";

import { AddToJourneyButton } from "@/components/journey/add-to-journey-button";
import { SavePlaceButton } from "@/components/place/save-place-button";
import type { JourneyStopInput } from "@/lib/journey-planner";
import { buildMobilityRideHref } from "@/lib/mobility/ride-links";
import { buildContextualConciergeHref } from "@/lib/place/concierge-links";
import type { IntelligenceIsland } from "@/types/intelligence";

type Props = {
  name: string;
  island: string;
  mapHref?: string;
  rideHref?: string;
  website?: string | null;
  conciergeHref?: string;
  bookingHref?: string;
  journeyStop?: JourneyStopInput;
  className?: string;
};

export function PlaceActionBar({
  name,
  island,
  mapHref,
  rideHref,
  website,
  conciergeHref,
  bookingHref,
  journeyStop,
  className = "",
}: Props) {
  const fallbackJourneyStop = buildFallbackJourneyStop({
    name,
    island,
    mapHref,
    rideHref,
    bookingHref,
  });
  const tripStop = journeyStop ?? fallbackJourneyStop;
  const resolvedRideHref = rideHref?.startsWith("/mobility")
    ? buildMobilityRideHref({
        name: tripStop.title,
        island: tripStop.island,
        type: tripStop.kind,
        lat: tripStop.lat,
        lng: tripStop.lng,
        source: tripStop.kind === "beach" ? "beach" : "place",
        returnTo: tripStop.href,
      })
    : rideHref;
  const resolvedBookingHref = bookingHref;
  const resolvedConciergeHref =
    conciergeHref ??
    buildContextualConciergeHref({
      name,
      island,
      mapHref,
      prompt: `Help me plan a visit to ${name} on ${island}. Include the best timing, practical access, nearby food or activities, transportation, booking considerations, and a backup option.`,
    });

  return (
    <section
      className={`place-decision-bar overflow-hidden rounded-[30px] border border-[#d8e7e3] bg-[#fffdf8] shadow-[0_18px_55px_rgba(4,51,49,.08)] ${className}`}
      aria-label={`Actions for ${name}`}
    >
      <div className="grid lg:grid-cols-[.72fr_1.28fr]">
        <div className="relative overflow-hidden bg-[linear-gradient(145deg,#043331,#075e58)] p-5 text-white sm:p-6">
          <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-[#28c8bd]/20 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 text-[8px] font-black uppercase tracking-[.18em] text-[#f5c451]">
              <Sparkles className="h-3.5 w-3.5" /> Make it part of your day
            </div>
            <h2 className="vi-display mt-2 text-2xl font-black leading-[1.02] tracking-[-.04em] sm:text-3xl">
              Decide what happens next.
            </h2>
            <p className="mt-2 max-w-md text-xs font-semibold leading-5 text-white/62">
              Save the place, add it to your trip, see where it sits, arrange the ride, or ask USVI Explorer to connect the details.
            </p>
            <Link
              href="/saved"
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/[.08] px-3 py-2 text-[8px] font-black uppercase tracking-[.12em] text-white/78 transition hover:bg-white/[.13]"
            >
              <Bookmark className="h-3.5 w-3.5 text-[#7ce0d4]" /> View saved
            </Link>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            <SavePlaceButton
              place={{
                id: tripStop.id,
                title: tripStop.title,
                island: tripStop.island,
                kind: tripStop.kind,
                summary: tripStop.summary,
                ...(tripStop.href ? { href: tripStop.href } : {}),
                ...(mapHref ? { mapHref } : tripStop.mapHref ? { mapHref: tripStop.mapHref } : {}),
                ...(resolvedRideHref ? { rideHref: resolvedRideHref } : {}),
                ...(resolvedBookingHref ? { bookingHref: resolvedBookingHref } : {}),
                ...(typeof tripStop.lat === "number" ? { lat: tripStop.lat } : {}),
                ...(typeof tripStop.lng === "number" ? { lng: tripStop.lng } : {}),
              }}
              className="w-full"
            />
            <AddToJourneyButton stop={tripStop} className="w-full" />
            {mapHref ? <Action href={mapHref} icon={Map} label="View on map" /> : null}
            {resolvedRideHref ? <Action href={resolvedRideHref} icon={Navigation} label="Get a ride" accent="gold" /> : null}
            <Action
              href={resolvedConciergeHref}
              icon={MessageCircleMore}
              label="Ask Concierge"
              accent="teal"
            />
            {resolvedBookingHref ? (
              <Action
                href={resolvedBookingHref}
                icon={CalendarCheck}
                label="Book / request"
                accent="ink"
              />
            ) : null}
            {website ? <Action href={website} icon={ExternalLink} label="Official website" external /> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function buildFallbackJourneyStop({
  name,
  island,
  mapHref,
  rideHref,
  bookingHref,
}: {
  name: string;
  island: string;
  mapHref?: string;
  rideHref?: string;
  bookingHref?: string;
}): JourneyStopInput {
  const islandCode = islandToCode(island);
  const params = new URLSearchParams(mapHref?.split("?")[1] ?? "");
  const id = params.get("place") || params.get("estate") || slugify(name);
  const kind = params.get("placeType") || params.get("lens") || "place";

  return {
    id,
    title: name,
    island: islandCode,
    kind,
    summary: `Visit ${name} on ${island}. Review timing, transportation, and current conditions before the trip.`,
    ...(mapHref ? { mapHref } : {}),
    ...(bookingHref || rideHref ? { bookingHref: bookingHref || rideHref } : {}),
  };
}

function islandToCode(value: string): IntelligenceIsland {
  const normalized = value.trim().toLowerCase();
  if (normalized === "stj" || normalized.includes("john")) return "stj";
  if (normalized === "stx" || normalized.includes("croix")) return "stx";
  return "stt";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function Action({
  href,
  icon: Icon,
  label,
  accent = "neutral",
  external = false,
}: {
  href: string;
  icon: typeof Map;
  label: string;
  accent?: "neutral" | "gold" | "teal" | "ink";
  external?: boolean;
}) {
  const classes = `inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-4 text-[9px] font-black uppercase tracking-[.13em] transition hover:-translate-y-0.5 ${
    accent === "gold"
      ? "bg-[#f5c451] text-[#043331] hover:bg-[#ffca55]"
      : accent === "teal"
        ? "bg-[#e8f7f4] text-[#0f766e] ring-1 ring-[#bee4dd] hover:bg-[#dcf3ee]"
        : accent === "ink"
          ? "bg-[#043331] text-white hover:bg-[#075e58]"
          : "border border-[#dce7e4] bg-white text-[#35514e] hover:border-[#9fd4cc] hover:bg-[#f7fbfa]"
  }`;

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={classes}>
        <Icon className="h-4 w-4" />
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}