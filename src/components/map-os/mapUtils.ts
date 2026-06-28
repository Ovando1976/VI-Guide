import {
  Anchor,
  Archive,
  Building2,
  CircleDot,
  FileText,
  Layers3,
  MapPin,
  type LucideIcon,
} from "lucide-react";

import type { IslandCode } from "../../types";
import type {
  LngLat,
  SearchItemType,
  SelectedMapItem,
} from "./mapTypes";

export function normalizeIsland(value: unknown): IslandCode | "" {
  const key = String(value ?? "").toLowerCase().trim();

  if (["stt", "st_thomas", "st. thomas", "saint thomas"].includes(key)) {
    return "st_thomas";
  }

  if (["stj", "st_john", "st. john", "saint john"].includes(key)) {
    return "st_john";
  }

  if (["stx", "st_croix", "st. croix", "saint croix"].includes(key)) {
    return "st_croix";
  }

  if (["wat", "water_island", "water island"].includes(key)) {
    return "water_island";
  }

  return "";
}

export function islandLabel(island?: string | null) {
  const normalized = normalizeIsland(island);

  if (normalized === "st_thomas") return "St. Thomas";
  if (normalized === "st_john") return "St. John";
  if (normalized === "st_croix") return "St. Croix";
  if (normalized === "water_island") return "Water Island";

  return "USVI";
}

export function cleanTitle(value: unknown) {
  return String(value ?? "Selected location")
    .replace(/^estate\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getItemTitle(item: SelectedMapItem) {
  return cleanTitle(
    item.name ||
      item.baseName ||
      item.fullName ||
      item.estate ||
      item.ADDRESS ||
      item.address ||
      item.id,
  );
}

export function getItemType(item: SelectedMapItem) {
  if (item.type === "business" || item.source === "business") return "Business";
  if (item.isEstate || item.type === "estate") return "Estate";
  if (item.isParcel || item.type === "parcel") return "Parcel";
  if (item.source === "historicSite" || item.type === "historic") return "Historic Site";
  if (item.source === "archive" || item.type === "archive") return "Danish Archive";
  if (item.source === "dictionary" || item.type === "dictionary") return "Dictionary";
  if (item.source === "beach" || item.type === "beach") return "Beach";
  if (item.isPoint) return String(item.type || "Point");

  return "Location";
}

export function getIcon(type?: string): LucideIcon {
  if (type === "business") return Building2;
  if (type === "ferry") return Anchor;
  if (type === "beach") return MapPin;
  if (type === "town" || type === "place") return CircleDot;
  if (type === "parcel") return Building2;
  if (type === "archive" || type === "dictionary") return Archive;
  if (type === "historic") return FileText;

  return Layers3;
}

export function getTagTone(type?: string) {
  if (type === "beach") return "bg-sky-400/15 text-sky-200 border-sky-300/20";
  if (type === "ferry") return "bg-amber-400/15 text-amber-200 border-amber-300/20";
  if (type === "estate") return "bg-emerald-400/15 text-emerald-200 border-emerald-300/20";
  if (type === "business") return "bg-cyan-400/15 text-cyan-200 border-cyan-300/20";
  if (type === "historic") return "bg-violet-400/15 text-violet-200 border-violet-300/20";
  if (type === "archive" || type === "dictionary") {
    return "bg-slate-300/15 text-slate-200 border-slate-300/20";
  }

  return "bg-white/10 text-white/75 border-white/10";
}

export function hasCoords(value: unknown): value is LngLat {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number" &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1])
  );
}

export function sourceToType(source: string): SearchItemType {
  if (source === "business" || source === "businesses") return "business";
  if (source === "estate" || source === "estates") return "estate";
  if (source === "beach" || source === "beaches") return "beach";
  if (source === "historicSite" || source === "historic_sites") return "historic";
  if (source === "archive" || source === "archives") return "archive";
  if (source === "dictionary") return "dictionary";
  if (source === "parcel" || source === "parcels") return "parcel";
  if (source === "ferry" || source === "ferry-terminals") return "ferry";
  if (source === "restaurant" || source.startsWith("restaurants")) return "place";
  if (source === "places" || source === "place") return "place";
  if (source === "grocery" || source === "shopping" || source === "transportation") {
    return "place";
  }

  return "place";
}

export function formatCoords(coords?: LngLat) {
  if (!coords) return "";
  return `${coords[1].toFixed(5)}° N, ${Math.abs(coords[0]).toFixed(5)}° W`;
}

export function go(path: string) {
  window.location.href = path;
}