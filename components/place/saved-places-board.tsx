"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bookmark,
  Map,
  MessageCircleMore,
  Navigation,
  Route,
} from "lucide-react";

import { AddToJourneyButton } from "@/components/journey/add-to-journey-button";
import { SavePlaceButton } from "@/components/place/save-place-button";
import { buildContextualConciergeHref } from "@/lib/place/concierge-links";
import {
  SAVED_PLACES_UPDATED_EVENT,
  readSavedPlaces,
  type SavedPlace,
} from "@/lib/saved-places";

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
      <section className="rounded-[30px] border border-slate-200 bg-white p-10 text-center shadow-sm">
        <Bookmark className="mx-auto h-10 w-10 text-slate-300" />
        <h1 className="mt-4 text-2xl font-black tracking-[-.035em]">No saved places yet</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-500">
          Save beaches, stays, restaurants, historic sites, and other places while you browse. Saved places stay separate from your itinerary until you add them to My Trip.
        </p>
        <Link
          href="/places"
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-[#043331] px-6 text-[10px] font-black uppercase tracking-[.15em] text-white"
        >
          Explore VI Guide
        </Link>
      </section>
    );
  }

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {places.map((place) => {
        const conciergeHref = buildContextualConciergeHref({
          name: place.title,
          island: place.island,
          mapHref: place.mapHref,
          prompt: `Help me decide how ${place.title} fits into my ${islandLabel(place.island)} trip. Include timing, transportation, nearby options, and the best next step.`,
        });
        return (
          <article key={`${place.island}:${place.id}`} className="flex h-full flex-col rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.15em] text-teal-700">
                  {islandLabel(place.island)} · {humanize(place.kind)}
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-.035em] text-[#043331]">
                  {place.title}
                </h2>
              </div>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Bookmark className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 flex-1 text-sm font-semibold leading-6 text-slate-600">
              {place.summary || "Saved for later in VI Guide."}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-100 pt-5">
              <SavePlaceButton
                place={{
                  id: place.id,
                  title: place.title,
                  island: place.island,
                  kind: place.kind,
                  summary: place.summary,
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
          </article>
        );
      })}
    </section>
  );
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
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-3 text-[9px] font-black uppercase tracking-[.12em] ${
        gold
          ? "bg-[#f5c451] text-[#043331]"
          : teal
            ? "bg-[#0f766e] text-white"
            : ink
              ? "bg-[#043331] text-white"
              : "border border-slate-200 bg-[#f8f4ea] text-[#043331]"
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
