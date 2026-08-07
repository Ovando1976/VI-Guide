import Link from "next/link";
import {
  CalendarCheck,
  ExternalLink,
  Map,
  MessageCircleMore,
  Navigation,
} from "lucide-react";

import { AddToJourneyButton } from "@/components/journey/add-to-journey-button";
import { SavePlaceButton } from "@/components/place/save-place-button";
import type { JourneyStopInput } from "@/lib/journey-planner";
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
  const resolvedBookingHref = bookingHref ?? journeyStop?.bookingHref;
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
      className={`rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm ${className}`}
      aria-label={`Actions for ${name}`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[.18em] text-teal-700">
            Universal trip actions
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Save it, map it, plan around it, move to it, and book when available.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SavePlaceButton
          place={{
            id: tripStop.id,
            title: tripStop.title,
            island: tripStop.island,
            kind: tripStop.kind,
            summary: tripStop.summary,
            ...(tripStop.href ? { href: tripStop.href } : {}),
            ...(mapHref ? { mapHref } : tripStop.mapHref ? { mapHref: tripStop.mapHref } : {}),
            ...(rideHref ? { rideHref } : {}),
            ...(resolvedBookingHref ? { bookingHref: resolvedBookingHref } : {}),
            ...(typeof tripStop.lat === "number" ? { lat: tripStop.lat } : {}),
            ...(typeof tripStop.lng === "number" ? { lng: tripStop.lng } : {}),
          }}
          className="w-full"
        />
        <AddToJourneyButton stop={tripStop} className="w-full" />
        {mapHref ? <Action href={mapHref} icon={Map} label="View on map" /> : null}
        {rideHref ? (
          <Action href={rideHref} icon={Navigation} label="Get a ride" accent="gold" />
        ) : null}
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
        {website ? (
          <Action href={website} icon={ExternalLink} label="Official website" external />
        ) : null}
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
  const classes = `inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 text-[10px] font-black uppercase tracking-[.16em] transition hover:-translate-y-0.5 ${
    accent === "gold"
      ? "bg-[#f5c451] text-[#043331] hover:bg-[#ffca55]"
      : accent === "teal"
        ? "bg-[#0f766e] text-white hover:bg-[#0b5d5b]"
        : accent === "ink"
          ? "bg-[#043331] text-white hover:bg-[#075e58]"
          : "border border-slate-200 bg-[#f8f4ea] text-[#043331] hover:border-[#0f766e] hover:bg-white"
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
