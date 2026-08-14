"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bookmark,
  Map,
  MessageCircleMore,
  Navigation,
  Route,
  Sparkles,
} from "lucide-react";

import { AddToJourneyButton } from "@/components/journey/add-to-journey-button";
import { SavePlaceButton } from "@/components/place/save-place-button";
import { buildContextualConciergeHref } from "@/lib/place/concierge-links";
import {
  SAVED_PLACES_UPDATED_EVENT,
  readSavedPlaces,
  type SavedPlace,
} from "@/lib/saved-places";

const ISLAND_BACKDROPS: Record<SavedPlace["island"], string> = {
  stt: "/images/usvi-harbor-hero.jpg",
  stj: "/images/places/st-john/trunk-bay-overlook-1.jpg",
  stx: "/images/places/st-croix/cane-bay-beach-1.jpg",
};

export function SavedPlacesBoard() {
  const [places, setPlaces] = useState<SavedPlace[]>([]);

  useEffect(() => {
    function refresh() {
      setPlaces(readSavedPlaces());
    }
    refresh();
    window.addEventListener(SAVED_PLACES_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(SAVED_PLACES_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  if (!places.length) {
    return (
      <section className="relative isolate overflow-hidden rounded-[34px] bg-[#032f2d] p-8 text-white shadow-[0_24px_70px_rgba(3,47,45,.16)] sm:p-10 lg:p-12">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/beaches/st-thomas/magens-bay-1.jpg"
          alt=""
          className="absolute inset-0 -z-30 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(2,31,29,.98),rgba(3,47,45,.88)_58%,rgba(3,47,45,.58))]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_82%_15%,rgba(115,227,217,.18),transparent_30%)]" />

        <Bookmark className="h-9 w-9 text-[#f5c451]" />
        <h2 className="vi-display mt-5 max-w-3xl text-4xl font-bold tracking-[-.04em] sm:text-5xl">
          Your shortlist starts with one save.
        </h2>
        <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/68">
          Save beaches, stays, restaurants, historic sites, and other places while you browse. Saved places stay separate from the itinerary until you decide to add them to My Trip.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/places"
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#f5c451] px-6 text-[9px] font-black uppercase tracking-[.14em] text-[#032f2d]"
          >
            Explore USVI Explorer <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/concierge?prompt=Help%20me%20find%20a%20few%20great%20places%20to%20save%20for%20my%20Virgin%20Islands%20trip"
            className="vi-glass inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-[9px] font-black uppercase tracking-[.14em] text-white"
          >
            <Sparkles className="h-4 w-4 text-[#73e3d9]" /> Ask Concierge
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {places.map((place) => {
        const conciergeHref = buildContextualConciergeHref({
          name: place.title,
          island: place.island,
          mapHref: place.mapHref,
          prompt: `Help me decide how ${place.title} fits into my ${islandLabel(place.island)} trip. Include timing, transportation, nearby options, and the best next step.`,
        });
        const visual = savedVisual(place);

        return (
          <article
            key={`${place.island}:${place.id}`}
            className="group flex h-full flex-col overflow-hidden rounded-[30px] border border-[#d9e6e2] bg-[#fffdf8] shadow-[0_16px_45px_rgba(4,51,49,.08)] transition duration-300 hover:-translate-y-1.5 hover:border-[#aad7d0] hover:shadow-[0_28px_65px_rgba(4,51,49,.14)]"
          >
            <div className="relative h-64 overflow-hidden bg-[#073b39] sm:h-72">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={visual.image}
                alt={visual.specific ? place.title : ""}
                loading="lazy"
                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,47,45,.05)_25%,rgba(3,47,45,.8)_100%)]" />
              <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-3">
                <span className="rounded-full border border-white/25 bg-[#043331]/78 px-3 py-1.5 text-[8px] font-black uppercase tracking-[.13em] text-white backdrop-blur-md">
                  {islandLabel(place.island)} · {humanize(place.kind)}
                </span>
                <span className="rounded-full border border-white/20 bg-black/25 px-3 py-1.5 text-[8px] font-black uppercase tracking-[.12em] text-white/82 backdrop-blur-md">
                  {visual.specific ? "From Explore" : "Island context"}
                </span>
              </div>
              <div className="absolute inset-x-5 bottom-5 text-white">
                <div className="text-[8px] font-black uppercase tracking-[.2em] text-[#f8d77c]">
                  Saved place
                </div>
                <h2 className="vi-display mt-2 line-clamp-2 text-3xl font-bold leading-[.96] tracking-[-.04em]">
                  {place.title}
                </h2>
              </div>
            </div>

            <div className="flex flex-1 flex-col p-5 sm:p-6">
              <p className="flex-1 text-sm font-semibold leading-6 text-[#607370]">
                {place.summary || "Saved for later in USVI Explorer."}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-2 border-t border-[#e4ece9] pt-5">
                <SavePlaceButton
                  place={{
                    id: place.id,
                    title: place.title,
                    island: place.island,
                    kind: place.kind,
                    summary: place.summary,
                    ...(place.image ? { image: place.image } : {}),
                    ...(place.href ? { href: place.href } : {}),
                    ...(place.mapHref ? { mapHref: place.mapHref } : {}),
                    ...(place.rideHref ? { rideHref: place.rideHref } : {}),
                    ...(place.bookingHref ? { bookingHref: place.bookingHref } : {}),
                    ...(typeof place.lat === "number" ? { lat: place.lat } : {}),
                    ...(typeof place.lng === "number" ? { lng: place.lng } : {}),
                  }}
                  compact
                  className="w-full px-3 text-[9px] tracking-[.12em]"
                />
                <AddToJourneyButton
                  stop={{
                    id: place.id,
                    title: place.title,
                    island: place.island,
                    kind: place.kind,
                    summary: place.summary,
                    ...(place.href ? { href: place.href } : {}),
                    ...(place.mapHref ? { mapHref: place.mapHref } : {}),
                    ...(place.bookingHref ? { bookingHref: place.bookingHref } : {}),
                    ...(typeof place.lat === "number" ? { lat: place.lat } : {}),
                    ...(typeof place.lng === "number" ? { lng: place.lng } : {}),
                  }}
                  className="w-full px-3 text-[9px] tracking-[.12em]"
                />
                {place.mapHref ? <SavedAction href={place.mapHref} icon={Map} label="Map" /> : null}
                {place.rideHref ? (
                  <SavedAction href={place.rideHref} icon={Navigation} label="Ride" gold />
                ) : null}
                <SavedAction href={conciergeHref} icon={MessageCircleMore} label="Concierge" teal />
                {place.href ? <SavedAction href={place.href} icon={Route} label="Details" ink /> : null}
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}

function savedVisual(place: SavedPlace) {
  if (place.image) return { image: place.image, specific: true };
  return { image: ISLAND_BACKDROPS[place.island], specific: false };
}

function SavedAction({
  href,
  icon: Icon,
  label,
  gold = false,
  teal = false,
  ink = false,
}: {
  href: string;
  icon: typeof Map;
  label: string;
  gold?: boolean;
  teal?: boolean;
  ink?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-3 text-[9px] font-black uppercase tracking-[.12em] transition hover:-translate-y-0.5 ${
        gold
          ? "bg-[#f5c451] text-[#043331]"
          : teal
            ? "bg-[#eaf8f5] text-[#0f766e] ring-1 ring-[#b8e2dc]"
            : ink
              ? "bg-[#043331] text-white"
              : "border border-[#dce7e4] bg-white text-[#35514e]"
      }`}
    >
      <Icon className="h-4 w-4" /> {label}
    </Link>
  );
}

function islandLabel(island: SavedPlace["island"]) {
  if (island === "stj") return "St. John";
  if (island === "stx") return "St. Croix";
  return "St. Thomas";
}

function humanize(value: string) {
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
