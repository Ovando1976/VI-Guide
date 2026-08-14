"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Map,
  MapPin,
  MessageCircleMore,
  Navigation,
  Sparkles,
} from "lucide-react";

import { GooglePlacePhoto } from "@/components/directory/google-place-photo";
import { TagPill } from "@/components/directory/tag-pill";
import { AddToJourneyButton } from "@/components/journey/add-to-journey-button";
import { SavePlaceButton } from "@/components/place/save-place-button";
import { buildDirectoryMapHref } from "@/lib/discovery/map-links";
import type { JourneyStopInput } from "@/lib/journey-planner";
import { buildContextualConciergeHref } from "@/lib/place/concierge-links";
import type { DirectoryItem } from "@/types/directory";
import type { TerritoryMapPlaceType } from "@/types/territory-map";

type Props = {
  item: DirectoryItem;
  href: string;
  eyebrow?: string;
};

export function DirectoryCard({ item, href, eyebrow }: Props) {
  const googlePhoto = getGooglePhoto(item.heroImage);
  const savedImage =
    googlePhoto.fallback ||
    (item.heroImage?.startsWith("/api/google-places/photo?")
      ? ""
      : item.heroImage);
  const mapType = inferMapType(href);
  const mapHref = buildDirectoryMapHref(item, mapType);
  const rideHref = buildRideHref(item);
  const islandName = islandLabel(item.island);
  const conciergeHref = buildContextualConciergeHref({
    name: item.name,
    island: item.island,
    mapHref,
    prompt: `Help me decide how ${item.name} fits into my ${islandName} trip. Include timing, nearby options, transportation, and anything I should confirm before going.`,
  });
  const journeyStop: JourneyStopInput = {
    id: item.id,
    title: item.name,
    island: item.island,
    kind: mapType,
    summary: item.description,
    ...(typeof item.lat === "number" ? { lat: item.lat } : {}),
    ...(typeof item.lng === "number" ? { lng: item.lng } : {}),
    href,
    mapHref,
  };

  return (
    <article className="directory-story-card group flex h-full flex-col overflow-hidden rounded-[30px] border border-[#d9e6e2] bg-[#fffdf8] shadow-[0_16px_45px_rgba(4,51,49,.08)] transition duration-300 hover:-translate-y-1.5 hover:border-[#aad7d0] hover:shadow-[0_28px_65px_rgba(4,51,49,.14)]">
      <div className="relative overflow-hidden">
        <Link href={href} aria-label={`View ${item.name}`} className="block">
          <GooglePlacePhoto
            placeId={googlePhoto.placeId}
            name={item.name}
            island={item.island.toUpperCase()}
            fallbackImage={googlePhoto.fallback || item.heroImage}
            className="h-64 sm:h-72"
          />
          <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(3,47,45,.04)_30%,rgba(3,47,45,.72)_100%)]" />
        </Link>

        <div className="pointer-events-none absolute inset-x-4 top-4 flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-[#043331]/78 px-3 py-1.5 text-[8px] font-black uppercase tracking-[.13em] text-white shadow-lg backdrop-blur-md">
            <BadgeCheck size={11} className="text-[#7ce0d4]" />
            {item.sourceUrl || item.sourceUrls?.length ? "Source checked" : "Curated guide entry"}
          </span>
          <span className="rounded-full border border-white/25 bg-black/25 px-3 py-1.5 text-[8px] font-black uppercase tracking-[.14em] text-white backdrop-blur-md">
            {islandName}
          </span>
        </div>

        <div className="pointer-events-none absolute inset-x-5 bottom-4 text-white">
          <div className="text-[8px] font-black uppercase tracking-[.2em] text-[#f8d77c]">
            {eyebrow ?? item.category}
          </div>
          <h2 className="vi-display mt-1 line-clamp-2 text-3xl font-black leading-[.95] tracking-[-.045em] drop-shadow-sm">
            {item.name}
          </h2>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {item.address || item.tags[1] ? (
          <div className="flex items-center gap-2 text-xs font-black text-[#0f766e]">
            <MapPin size={14} />
            <span className="line-clamp-1">{item.address || item.tags[1]}</span>
          </div>
        ) : null}

        <p className="mt-3 line-clamp-3 text-sm font-semibold leading-6 text-[#5a6f6c]">
          {item.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {item.tags.slice(0, 3).map((tag) => (
            <TagPill key={tag} label={tag} />
          ))}
        </div>

        {item.bestFor?.length ? (
          <div className="mt-4 rounded-2xl border border-[#dce9e6] bg-[#f1f8f6] px-4 py-3">
            <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[.16em] text-[#0f766e]">
              <Sparkles className="h-3.5 w-3.5" /> Best for
            </div>
            <p className="mt-1.5 line-clamp-2 text-xs font-bold leading-5 text-[#35514e]">
              {item.bestFor.slice(0, 3).join(" · ")}
            </p>
          </div>
        ) : null}

        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-[#e4ece9] pt-5">
          <MiniAction href={mapHref} icon={Map} label="Map" />
          <MiniAction href={rideHref} icon={Navigation} label="Ride" gold />
          <MiniAction href={conciergeHref} icon={Sparkles} label="Ask VI" teal />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <SavePlaceButton
            place={{
              id: item.id,
              title: item.name,
              island: item.island,
              kind: mapType,
              summary: item.description,
              ...(savedImage ? { image: savedImage } : {}),
              href,
              mapHref,
              rideHref,
              ...(typeof item.lat === "number" ? { lat: item.lat } : {}),
              ...(typeof item.lng === "number" ? { lng: item.lng } : {}),
            }}
            compact
            className="w-full px-3 text-center text-[8px] tracking-[.12em]"
          />
          <AddToJourneyButton
            stop={journeyStop}
            className="w-full px-3 text-center text-[8px] tracking-[.12em]"
          />
        </div>

        <Link
          href={href}
          className="mt-3 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#043331] px-5 text-[9px] font-black uppercase tracking-[.14em] text-white transition hover:bg-[#075e58]"
        >
          Open the story <ArrowRight className="h-4 w-4 text-[#f5c451]" />
        </Link>
      </div>
    </article>
  );
}

function MiniAction({
  href,
  icon: Icon,
  label,
  gold = false,
  teal = false,
}: {
  href: string;
  icon: typeof MessageCircleMore;
  label: string;
  gold?: boolean;
  teal?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 flex-col items-center justify-center gap-1 rounded-[18px] border px-2 text-[8px] font-black uppercase tracking-[.09em] transition hover:-translate-y-0.5 ${
        gold
          ? "border-[#edd28f] bg-[#fff7df] text-[#8a5d13] hover:bg-[#fff0bd]"
          : teal
            ? "border-[#b8e2dc] bg-[#eaf8f5] text-[#0f766e] hover:bg-[#ddf3ee]"
            : "border-[#dce7e4] bg-white text-[#35514e] hover:border-[#b8dcd6]"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function inferMapType(href: string): TerritoryMapPlaceType {
  if (href.startsWith("/beaches/")) return "beach";
  if (href.startsWith("/accommodations/")) return "stay";
  if (href.startsWith("/historic/") || href.startsWith("/heritage/")) {
    return "historic";
  }
  return "place";
}

function buildRideHref(item: DirectoryItem) {
  const params = new URLSearchParams({
    island: item.island,
    destination: item.name,
  });
  if (item.estateGeoid) params.set("to", item.estateGeoid);
  if (typeof item.lat === "number") params.set("toLat", String(item.lat));
  if (typeof item.lng === "number") params.set("toLng", String(item.lng));
  return `/mobility?${params.toString()}`;
}

function getGooglePhoto(value?: string) {
  if (!value?.startsWith("/api/google-places/photo?")) {
    return { placeId: "", fallback: "" };
  }
  const params = new URLSearchParams(value.split("?")[1] || "");
  return {
    placeId: params.get("placeId") || "",
    fallback: params.get("fallback") || "",
  };
}

function islandLabel(island: DirectoryItem["island"]) {
  if (island === "stj") return "St. John";
  if (island === "stx") return "St. Croix";
  return "St. Thomas";
}
