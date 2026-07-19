"use client";

import L from "leaflet";

import type { TerritoryMapPlaceType as PlaceType } from "@/types/territory-map";

export type DriverStatus =
  | "available"
  | "assigned"
  | "repositioning";

type PlaceIconSet = {
  normal: L.DivIcon;
  selected: L.DivIcon;
};

const PLACE_COLORS: Record<PlaceType, string> = {
  place: "#f97316",
  beach: "#38bdf8",
  historic: "#f59e0b",
  stay: "#a78bfa",
};

const PLACE_GLYPHS: Record<PlaceType, string> = {
  place: "●",
  beach: "≈",
  historic: "⌂",
  stay: "▰",
};

const DRIVER_COLORS: Record<DriverStatus, string> = {
  available: "#22c55e",
  assigned: "#3b82f6",
  repositioning: "#f59e0b",
};

export const pickupIcon = makePinIcon("#14b8a6", "P");
export const destinationIcon = makePinIcon("#f59e0b", "D");

export const estateDetailIcon = makeDotIcon({
  color: "#b9772b",
  size: 22,
  borderWidth: 3,
  shadow: "0 8px 24px rgba(0,0,0,0.24)",
});

export const driverIcons: Record<DriverStatus, L.DivIcon> = {
  available: makeDriverIcon(DRIVER_COLORS.available),
  assigned: makeDriverIcon(DRIVER_COLORS.assigned),
  repositioning: makeDriverIcon(DRIVER_COLORS.repositioning),
};

export const placeIcons: Record<PlaceType, PlaceIconSet> = {
  place: {
    normal: makePlaceIcon("place", false),
    selected: makePlaceIcon("place", true),
  },
  beach: {
    normal: makePlaceIcon("beach", false),
    selected: makePlaceIcon("beach", true),
  },
  historic: {
    normal: makePlaceIcon("historic", false),
    selected: makePlaceIcon("historic", true),
  },
  stay: {
    normal: makePlaceIcon("stay", false),
    selected: makePlaceIcon("stay", true),
  },
};

export function getPlaceIcon(
  type: PlaceType,
  selected = false,
): L.DivIcon {
  return selected
    ? placeIcons[type].selected
    : placeIcons[type].normal;
}

export function getDriverIcon(
  status: DriverStatus,
): L.DivIcon {
  return driverIcons[status];
}

export function makePlaceIcon(
  type: PlaceType,
  selected: boolean,
): L.DivIcon {
  const color = placeColor(type);
  const glyph = placeGlyph(type);
  const size = selected ? 40 : 32;

  return L.divIcon({
    className: "vi-place-marker",
    html: `
      <div
        class="vi-place-marker__pin${selected ? " is-selected" : ""}"
        style="
          --marker-color: ${escapeStyleValue(color)};
          width: ${size}px;
          height: ${size}px;
        "
        aria-hidden="true"
      >
        <span>${escapeHtml(glyph)}</span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    tooltipAnchor: [0, -size / 2],
  });
}

export function makePinIcon(
  color: string,
  label: string,
): L.DivIcon {
  const safeColor = escapeStyleValue(color);
  const safeLabel = escapeHtml(label.slice(0, 2));

  return L.divIcon({
    className: "vi-route-pin",
    html: `
      <div
        class="vi-route-pin__marker"
        style="
          width: 30px;
          height: 30px;
          border-radius: 999px;
          background: ${safeColor};
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 12px;
          border: 2px solid rgba(255,255,255,0.9);
          box-shadow: 0 8px 22px rgba(0,0,0,0.35);
        "
        aria-hidden="true"
      >
        ${safeLabel}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
    tooltipAnchor: [0, -15],
  });
}

export function makeDriverIcon(
  color: string,
): L.DivIcon {
  return makeDotIcon({
    color,
    size: 18,
    borderWidth: 2,
    shadow: "0 8px 20px rgba(0,0,0,0.35)",
    className: "vi-driver-marker",
  });
}

export function makeDotIcon({
  color,
  size,
  borderWidth = 2,
  borderColor = "#ffffff",
  shadow = "0 8px 20px rgba(0,0,0,0.35)",
  className = "vi-dot-marker",
}: {
  color: string;
  size: number;
  borderWidth?: number;
  borderColor?: string;
  shadow?: string;
  className?: string;
}): L.DivIcon {
  const safeSize =
    Number.isFinite(size) && size > 0
      ? size
      : 18;

  return L.divIcon({
    className,
    html: `
      <div
        style="
          width: ${safeSize}px;
          height: ${safeSize}px;
          border-radius: 999px;
          background: ${escapeStyleValue(color)};
          border: ${borderWidth}px solid ${escapeStyleValue(borderColor)};
          box-shadow: ${escapeStyleValue(shadow)};
        "
        aria-hidden="true"
      ></div>
    `,
    iconSize: [safeSize, safeSize],
    iconAnchor: [safeSize / 2, safeSize / 2],
    popupAnchor: [0, -safeSize / 2],
    tooltipAnchor: [0, -safeSize / 2],
  });
}

export function placeGlyph(
  type: PlaceType,
): string {
  return PLACE_GLYPHS[type];
}

export function placeColor(
  type: PlaceType,
): string {
  return PLACE_COLORS[type];
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeStyleValue(value: string): string {
  return value.replace(/[;<>{}]/g, "");
}