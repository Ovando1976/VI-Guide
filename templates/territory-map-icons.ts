"use client";

import L from "leaflet";
import type { TerritoryMapPlaceType as PlaceType } from "@/types/territory-map";

export type DriverStatus = "available" | "assigned" | "repositioning";
type PlaceIconSet = { normal: L.DivIcon; selected: L.DivIcon };

const PLACE_COLORS: Record<PlaceType, { top: string; bottom: string; glow: string }> = {
  place: { top: "#ff9a3d", bottom: "#e8520b", glow: "rgba(249,115,22,.48)" },
  beach: { top: "#67e8f9", bottom: "#0789c9", glow: "rgba(56,189,248,.48)" },
  historic: { top: "#ffd56a", bottom: "#d97706", glow: "rgba(245,158,11,.46)" },
  stay: { top: "#c4b5fd", bottom: "#7652d5", glow: "rgba(167,139,250,.48)" },
};

const DRIVER_COLORS: Record<DriverStatus, string> = {
  available: "#22c55e", assigned: "#3b82f6", repositioning: "#f59e0b",
};

const ICON_PATHS: Record<PlaceType, string> = {
  place: '<path d="M7 11.5 12 7l5 4.5v6a1 1 0 0 1-1 1h-2.5v-4h-3v4H8a1 1 0 0 1-1-1v-6Z"/><path d="M5.5 12 12 6l6.5 6"/>',
  beach: '<path d="M4 15c1.2-1 2.4-1 3.6 0s2.4 1 3.6 0 2.4-1 3.6 0 2.4 1 3.6 0"/><path d="M5 11c2.2-3.7 4.5-5.5 7-5.5s4.8 1.8 7 5.5c-2.3-.8-4.7-.8-7 0-2.3-.8-4.7-.8-7 0Z"/>',
  historic: '<path d="m5 10 7-4 7 4"/><path d="M6.5 10.5h11M7.5 17.5h9M8.5 11v5.5M12 11v5.5M15.5 11v5.5"/>',
  stay: '<path d="M5 17V8.5A1.5 1.5 0 0 1 6.5 7h4A1.5 1.5 0 0 1 12 8.5V17M12 10h5.5a1.5 1.5 0 0 1 1.5 1.5V17M4 17h16"/><path d="M7.5 10h2M7.5 13h2M15 13h1"/>',
};

export const pickupIcon = makePinIcon("#14b8a6", "P");
export const destinationIcon = makePinIcon("#f59e0b", "D");
export const estateDetailIcon = makeDotIcon({ color: "#b9772b", size: 24, borderWidth: 3 });
export const driverIcons: Record<DriverStatus, L.DivIcon> = {
  available: makeDriverIcon(DRIVER_COLORS.available),
  assigned: makeDriverIcon(DRIVER_COLORS.assigned),
  repositioning: makeDriverIcon(DRIVER_COLORS.repositioning),
};
export const placeIcons: Record<PlaceType, PlaceIconSet> = {
  place: { normal: makePlaceIcon("place", false), selected: makePlaceIcon("place", true) },
  beach: { normal: makePlaceIcon("beach", false), selected: makePlaceIcon("beach", true) },
  historic: { normal: makePlaceIcon("historic", false), selected: makePlaceIcon("historic", true) },
  stay: { normal: makePlaceIcon("stay", false), selected: makePlaceIcon("stay", true) },
};

export function getPlaceIcon(type: PlaceType, selected = false) { return selected ? placeIcons[type].selected : placeIcons[type].normal; }
export function getDriverIcon(status: DriverStatus) { return driverIcons[status]; }

export function makePlaceIcon(type: PlaceType, selected: boolean): L.DivIcon {
  const palette = PLACE_COLORS[type];
  const width = selected ? 48 : 40, height = selected ? 56 : 48;
  const gid = `vi-${type}`;
  return L.divIcon({
    className: `vi-3d-marker vi-3d-marker--${type}${selected ? " is-selected" : ""}`,
    html: `<div style="width:${width}px;height:${height}px;filter:drop-shadow(0 10px 8px rgba(0,0,0,.38));transform:${selected ? "translateY(-4px) scale(1.06)" : "translateY(0)"};transition:transform .18s ease" aria-hidden="true">
      <svg viewBox="0 0 48 56" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs><linearGradient id="${gid}-body" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${palette.top}"/><stop offset="1" stop-color="${palette.bottom}"/></linearGradient><radialGradient id="${gid}-face" cx="34%" cy="25%" r="76%"><stop stop-color="#fff" stop-opacity=".46"/><stop offset=".28" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#07131b" stop-opacity=".24"/></radialGradient></defs>
        ${selected ? `<circle cx="24" cy="22" r="21" fill="none" stroke="#fff" stroke-opacity=".72" stroke-width="2"/>` : ""}
        <path d="M24 2C12.4 2 4 10.5 4 21.4 4 36 24 54 24 54s20-18 20-32.6C44 10.5 35.6 2 24 2Z" fill="url(#${gid}-body)" stroke="#fff" stroke-opacity=".78" stroke-width="1.5"/>
        <ellipse cx="24" cy="21" rx="15.5" ry="15" fill="url(#${gid}-face)" stroke="#07131b" stroke-opacity=".24"/>
        <g transform="translate(12 9)" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[type]}</g>
        <ellipse cx="17" cy="9" rx="7" ry="3.2" fill="#fff" fill-opacity=".25" transform="rotate(-24 17 9)"/>
      </svg></div>`,
    iconSize: [width, height], iconAnchor: [width / 2, height - 2], popupAnchor: [0, -height + 8], tooltipAnchor: [0, -height + 8],
  });
}

export function makePinIcon(color: string, label: string): L.DivIcon {
  const safe = escapeStyleValue(color), text = escapeHtml(label.slice(0, 2));
  return L.divIcon({ className: "vi-3d-route-pin", html: `<div style="width:38px;height:46px;filter:drop-shadow(0 9px 7px rgba(0,0,0,.4))" aria-hidden="true"><svg viewBox="0 0 38 46" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="route-${text}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff" stop-opacity=".38"/><stop offset=".25" stop-color="${safe}"/><stop offset="1" stop-color="${safe}" stop-opacity=".72"/></linearGradient></defs><path d="M19 1C8.6 1 2 8.6 2 18.2 2 30.4 19 45 19 45s17-14.6 17-26.8C36 8.6 29.4 1 19 1Z" fill="url(#route-${text})" stroke="#fff" stroke-width="2"/><circle cx="19" cy="18" r="11" fill="#07131b" fill-opacity=".3" stroke="#fff" stroke-opacity=".45"/><text x="19" y="22" text-anchor="middle" fill="#fff" font-family="system-ui,sans-serif" font-size="11" font-weight="900">${text}</text></svg></div>`, iconSize:[38,46],iconAnchor:[19,44],popupAnchor:[0,-42],tooltipAnchor:[0,-42] });
}

export function makeDriverIcon(color: string): L.DivIcon {
  const safe=escapeStyleValue(color);
  return L.divIcon({className:"vi-3d-driver-marker",html:`<div style="width:34px;height:34px;border-radius:12px;background:linear-gradient(145deg,#fff 0%,${safe} 22%,${safe} 72%,#07131b 145%);border:2px solid rgba(255,255,255,.88);box-shadow:inset 0 2px 3px rgba(255,255,255,.42),0 9px 18px rgba(0,0,0,.38);display:grid;place-items:center" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m5 16 1.4-5.2A2.5 2.5 0 0 1 8.8 9h6.4a2.5 2.5 0 0 1 2.4 1.8L19 16"/><path d="M4 16h16v3H4zM7 19v2M17 19v2M7 14h.01M17 14h.01"/></svg></div>`,iconSize:[34,34],iconAnchor:[17,17],popupAnchor:[0,-20],tooltipAnchor:[0,-20]});
}

export function makeDotIcon({color,size,borderWidth=2,borderColor="#fff",shadow="0 8px 20px rgba(0,0,0,.35)",className="vi-dot-marker"}:{color:string;size:number;borderWidth?:number;borderColor?:string;shadow?:string;className?:string}):L.DivIcon {
  const s=Number.isFinite(size)&&size>0?size:18;
  return L.divIcon({className,html:`<div style="width:${s}px;height:${s}px;border-radius:42% 58% 54% 46%;transform:rotate(45deg);background:linear-gradient(145deg,#fff 0%,${escapeStyleValue(color)} 30%,${escapeStyleValue(color)} 72%,#07131b 150%);border:${borderWidth}px solid ${escapeStyleValue(borderColor)};box-shadow:inset 0 2px 3px rgba(255,255,255,.5),${escapeStyleValue(shadow)}" aria-hidden="true"></div>`,iconSize:[s,s],iconAnchor:[s/2,s/2],popupAnchor:[0,-s/2],tooltipAnchor:[0,-s/2]});
}

export function placeGlyph(type: PlaceType): string { return type; }
export function placeColor(type: PlaceType): string { return PLACE_COLORS[type].bottom; }
function escapeHtml(value:string){return value.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
function escapeStyleValue(value:string){return value.replace(/[;<>{}]/g,"");}
