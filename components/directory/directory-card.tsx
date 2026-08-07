"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Eye,
  Map,
  MapPin,
  MessageCircleMore,
  Navigation,
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
    <article className="group flex h-full flex-col overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_12px_35px_rgba(4,51,49,.07)] transition duration-300 hover:-translate-y-1 hover:border-teal-700/20 hover:shadow-[0_22px_50px_rgba(4,51,49,.13)]">
      <Link href={href} aria-label={`View ${item.name}`} className="block">
        <GooglePlacePhoto
          placeId={googlePhoto.placeId}
          name={item.name}
          island={item.island.toUpperCase()}
          fallbackImage={googlePhoto.fallback || item.heroImage}
        />
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[.14em] text-emerald-800">
            <BadgeCheck size={12} /> Verified
          </span>
          <Link
            href={href}
            aria-label={`Open ${item.name}`}
            className="text-slate-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#0f766e]"
          >
            <ArrowUpRight size={17} />
          </Link>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-500">
            {eyebrow ?? item.category}
          </div>
          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            {item.island.toUpperCase()}
          </div>
        </div>

        <Link href={href} className="mt-3 block">
          <h2 className="text-2xl font-black tracking-[-.03em] text-[#043331] transition group-hover:text-[#0f766e]">
            {item.name}
          </h2>
        </Link>

        {item.address || item.tags[1] ? (
          <div className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-500">
            <MapPin size={14} className="text-[#0f766e]" />
            <span className="line-clamp-1">{item.address || item.tags[1]}</span>
          </div>
        ) : null}

        <p className="mt-3 line-clamp-3 text-sm font-semibold leading-6 text-slate-600">
          {item.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {item.tags.slice(0, 3).map((tag) => (
            <TagPill key={tag} label={tag} />
          ))}
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2 border-t border-slate-100 pt-5">
          <CardAction href={href} icon={Eye} label="Details" />
          <CardAction href={mapHref} icon={Map} label="Map" />
          <SavePlaceButton
            place={{
              id: item.id,
              title: item.name,
              island: item.island,
              kind: mapType,
              summary: item.description,
              href,
              mapHref,
              rideHref,
              ...(typeof item.lat === "number" ? { lat: item.lat } : {}),
              ...(typeof item.lng === "number" ? { lng: item.lng } : {}),
            }}
            compact
            className="w-full px-3 text-center text-[9px] tracking-[.13em]"
          />
          <AddToJourneyButton
            stop={journeyStop}
            className="w-full px-3 text-center text-[9px] tracking-[.13em]"
          />
          <CardAction href={rideHref} icon={Navigation} label="Ride" accent />
          <CardAction
            href={conciergeHref}
            icon={MessageCircleMore}
            label="Concierge"
            teal
          />
        </div>
      </div>
    </article>
  );
}

function CardAction({
  href,
  icon: Icon,
  label,
  accent = false,
  teal = false,
}: {
  href: string;
  icon: typeof Map;
  label: string;
  accent?: boolean;
  teal?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-3 text-[9px] font-black uppercase tracking-[.13em] transition hover:-translate-y-0.5 ${
        accent
          ? "bg-[#f5c451] text-[#043331] hover:bg-[#ffca55]"
          : teal
            ? "bg-[#0f766e] text-white hover:bg-[#0b5d5b]"
            : "border border-slate-200 bg-[#f8f4ea] text-[#043331] hover:border-[#0f766e] hover:bg-white"
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
