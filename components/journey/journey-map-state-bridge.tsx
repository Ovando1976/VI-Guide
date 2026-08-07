"use client";

import { useEffect } from "react";

import {
  TRIP_STORAGE_KEY,
  type TripItem,
  type TripItemKind,
} from "@/components/trip-planner/trip-types";
import {
  JOURNEY_PLAN_UPDATED_EVENT,
  readJourneyPlans,
  type JourneyPlan,
} from "@/lib/journey-planner";

export function JourneyMapStateBridge() {
  useEffect(() => {
    function sync() {
      const tripItems = journeyPlansToTripItems(readJourneyPlans());
      try {
        window.localStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify(tripItems));
        window.dispatchEvent(new Event("vi-guide-trip-updated"));
      } catch {
        // Journey Planner remains the source of truth if legacy map storage is unavailable.
      }
    }

    sync();
    window.addEventListener(JOURNEY_PLAN_UPDATED_EVENT, sync);
    return () => window.removeEventListener(JOURNEY_PLAN_UPDATED_EVENT, sync);
  }, []);

  return null;
}

function journeyPlansToTripItems(plans: JourneyPlan[]): TripItem[] {
  const ordered = [...plans].sort((a, b) => a.date.localeCompare(b.date));
  const items: TripItem[] = [];

  ordered.forEach((plan, planIndex) => {
    plan.plan.forEach((stop) => {
      const kind = tripKind(stop.kind);
      if (!kind) return;
      const id = stop.placeId || stop.id;
      const href = safeInternalHref(stop.href) || safeInternalHref(stop.mapHref) || "/planner";
      const mapHref = safeInternalHref(stop.mapHref);
      items.push({
        id,
        slug: slugFromHref(href) || slugify(stop.title) || id,
        name: stop.title,
        kind,
        island: stop.island,
        description: stop.summary,
        href,
        ...(mapHref ? { mapHref } : {}),
        ...(typeof stop.lat === "number" ? { lat: stop.lat } : {}),
        ...(typeof stop.lng === "number" ? { lng: stop.lng } : {}),
        day: Math.min(7, planIndex + 1),
        timeOfDay: timeOfDay(stop.startTime),
        addedAt: plan.updatedAt,
      });
    });
  });

  return Array.from(
    new Map(items.map((item) => [`${item.island}:${item.id}`, item])).values(),
  );
}

function tripKind(value: string): TripItemKind | null {
  const normalized = value.toLowerCase();
  if (normalized.includes("beach")) return "beach";
  if (/stay|hotel|resort|villa|lodging|accommodation/.test(normalized)) return "stay";
  if (/historic|heritage|museum|fort|landmark|ruin/.test(normalized)) return "historic";
  if (normalized) return "place";
  return null;
}

function timeOfDay(value?: string): TripItem["timeOfDay"] {
  if (!value || !/^\d{2}:\d{2}/.test(value)) return "flexible";
  const hour = Number(value.slice(0, 2));
  if (!Number.isFinite(hour)) return "flexible";
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function safeInternalHref(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "";
  return value.slice(0, 1200);
}

function slugFromHref(href: string) {
  const path = href.split("?")[0] || "";
  const parts = path.split("/").filter(Boolean);
  return parts.at(-1)?.slice(0, 180) || "";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}
