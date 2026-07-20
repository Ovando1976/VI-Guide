"use client";

import L from "leaflet";
import type { TerritoryMapPlaceType as PlaceType } from "@/types/territory-map";

export type DriverStatus = "available" | "assigned" | "repositioning";
type PlaceIconSet = { normal: L.DivIcon; selected: L.DivIcon };

const COLORS: Record<PlaceType, { light: string; main: string; dark: string }> = {
  place: { light: "#ffb15c", main: "#f97316", dark: "#9a3412" },
  beach: { light: "#67e8f9", main: "#06b6d4", dark: "#0e7490" },
  historic: { light: "#d8b4fe", main: "#8b5cf6", dark: "#5b21b6" },
  stay: { light: "#93c5fd", main: "#3b82f6", dark: "#1d4ed8" },
};
const DRIVER_COLORS: Record<DriverStatus, string> = { available: "#2dd4bf", assigned: "#60a5fa", repositioning: "#fbbf24" };
const PATHS: Record<PlaceType, string> = {
  place: '<path d="m8.1 12 3.9-3.5 3.9 3.5v4.7h-2.3v-3.1h-3.2v3.1H8.1V12Z"/><path d="m6.8 12.1 5.2-4.7 5.2 4.7"/>',
  beach: '<path d="M5.8 14.8c1.3-.9 2.5-.9 3.8 0 1.3.9 2.5.9 3.8 0 1.3-.9 2.5-.9 3.8 0"/><path d="M6.8 11.6C8.6 8.7 10.3 7.3 12 7.3s3.4 1.4 5.2 4.3c-1.8-.6-3.5-.6-5.2 0-1.7-.6-3.4-.6-5.2 0Z"/>',
  historic: '<path d="m6.5 10 5.5-3 5.5 3M7.3 10.7h9.4M8.2 11v4.8M12 11v4.8M15.8 11v4.8M6.8 16.8h10.4"/>',
  stay: '<path d="M6.5 16.5V9.8c0-.8.6-1.4 1.4-1.4h3c.8 0 1.4.6 1.4 1.4v6.7M12.3 11h3.8c.8 0 1.4.6 1.4 1.4v4.1M5.5 16.5h13"/><path d="M8.3 11h1.8M8.3 13.5h1.8M14.6 13.5h1"/>',
};

export const pickupIcon = makePinIcon("#14b8a6", "P");
export const destinationIcon = makePinIcon("#f59e0b", "D");
export const estateDetailIcon = makeDotIcon({ color: "#d69b4b", size: 20, borderWidth: 2 });
export const driverIcons: Record<DriverStatus, L.DivIcon> = {
  available: makeDriverIcon(DRIVER_COLORS.available), assigned: makeDriverIcon(DRIVER_COLORS.assigned), repositioning: makeDriverIcon(DRIVER_COLORS.repositioning),
};
export const placeIcons: Record<PlaceType, PlaceIconSet> = {
  place: { normal: makePlaceIcon("place", false), selected: makePlaceIcon("place", true) },
  beach: { normal: makePlaceIcon("beach", false), selected: makePlaceIcon("beach", true) },
  historic: { normal: makePlaceIcon("historic", false), selected: makePlaceIcon("historic", true) },
  stay: { normal: makePlaceIcon("stay", false), selected: makePlaceIcon("stay", true) },
};

export function getPlaceIcon(type: PlaceType, selected = false) { return selected ? placeIcons[type].selected : placeIcons[type].normal; }
export function getDriverIcon(status: DriverStatus) { return driverIcons[status]; }

function pictogram(type: PlaceType) {
  return `<g transform="translate(0 0)" fill="none" stroke="#fff" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round">${PATHS[type]}</g>`;
}

export function makePlaceIcon(type: PlaceType, selected: boolean): L.DivIcon {
  const c = COLORS[type];
  if (!selected) {
    const size = 30, id = `badge-${type}`;
    return L.divIcon({
      className: `vi-map-jewel vi-map-jewel--${type}`,
      html: `<div style="width:${size}px;height:${size}px;filter:drop-shadow(0 5px 5px rgba(0,0,0,.48))" aria-hidden="true"><svg viewBox="0 0 24 24" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="${id}" x1="3" y1="2" x2="21" y2="23"><stop stop-color="${c.light}"/><stop offset=".46" stop-color="${c.main}"/><stop offset="1" stop-color="${c.dark}"/></linearGradient></defs><circle cx="12" cy="12" r="10.4" fill="url(#${id})" stroke="rgba(255,255,255,.92)" stroke-width="1.2"/><circle cx="12" cy="12" r="8.1" fill="rgba(4,16,24,.18)" stroke="rgba(255,255,255,.16)"/><ellipse cx="9" cy="6.4" rx="4" ry="1.6" fill="#fff" opacity=".22" transform="rotate(-18 9 6.4)"/>${pictogram(type)}</svg></div>`,
      iconSize:[size,size],iconAnchor:[size/2,size/2],popupAnchor:[0,-18],tooltipAnchor:[0,-18],
    });
  }
  const width=42,height=50,id=`pin-${type}`;
  return L.divIcon({
    className:`vi-map-jewel vi-map-jewel--${type} is-selected`,
    html:`<div style="width:${width}px;height:${height}px;filter:drop-shadow(0 10px 8px rgba(0,0,0,.52));transform:translateY(-3px)" aria-hidden="true"><svg viewBox="0 0 42 50" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="${id}" x1="5" y1="2" x2="35" y2="46"><stop stop-color="${c.light}"/><stop offset=".46" stop-color="${c.main}"/><stop offset="1" stop-color="${c.dark}"/></linearGradient></defs><path d="M21 1.5C10 1.5 3 9.4 3 19.5 3 32.1 21 48 21 48s18-15.9 18-28.5C39 9.4 32 1.5 21 1.5Z" fill="url(#${id})" stroke="#fff" stroke-width="1.8"/><circle cx="21" cy="19.5" r="12.8" fill="rgba(4,16,24,.20)" stroke="rgba(255,255,255,.34)"/><g transform="translate(9 7.5)">${pictogram(type)}</g><ellipse cx="15" cy="7.5" rx="5.5" ry="2" fill="#fff" opacity=".22" transform="rotate(-20 15 7.5)"/></svg></div>`,
    iconSize:[width,height],iconAnchor:[width/2,height-2],popupAnchor:[0,-height+8],tooltipAnchor:[0,-height+8],
  });
}

export function makePinIcon(color:string,label:string):L.DivIcon {
  const safe=escapeStyleValue(color),text=escapeHtml(label.slice(0,2));
  return L.divIcon({className:"vi-route-jewel",html:`<div style="width:34px;height:40px;filter:drop-shadow(0 8px 6px rgba(0,0,0,.5))" aria-hidden="true"><svg viewBox="0 0 34 40"><path d="M17 1.5C7.8 1.5 2 8.1 2 16.5 2 27 17 39 17 39s15-12 15-22.5C32 8.1 26.2 1.5 17 1.5Z" fill="${safe}" stroke="#fff" stroke-width="1.7"/><circle cx="17" cy="16" r="9.5" fill="rgba(4,16,24,.25)"/><text x="17" y="20" text-anchor="middle" fill="#fff" font-family="system-ui" font-size="10" font-weight="900">${text}</text></svg></div>`,iconSize:[34,40],iconAnchor:[17,38],popupAnchor:[0,-36],tooltipAnchor:[0,-36]});
}
export function makeDriverIcon(color:string):L.DivIcon { return makeDotIcon({color,size:22,borderWidth:2,className:"vi-driver-jewel"}); }
export function makeDotIcon({color,size,borderWidth=2,borderColor="#fff",shadow="0 6px 14px rgba(0,0,0,.45)",className="vi-dot-marker"}:{color:string;size:number;borderWidth?:number;borderColor?:string;shadow?:string;className?:string}):L.DivIcon {const s=Number.isFinite(size)&&size>0?size:18;return L.divIcon({className,html:`<div style="width:${s}px;height:${s}px;border-radius:50%;background:radial-gradient(circle at 32% 24%,#fff 0 5%,${escapeStyleValue(color)} 28%,${escapeStyleValue(color)} 63%,#07131b 140%);border:${borderWidth}px solid ${escapeStyleValue(borderColor)};box-shadow:${escapeStyleValue(shadow)}" aria-hidden="true"></div>`,iconSize:[s,s],iconAnchor:[s/2,s/2],popupAnchor:[0,-s/2],tooltipAnchor:[0,-s/2]});}
export function placeGlyph(type:PlaceType):string{return type;}
export function placeColor(type:PlaceType):string{return COLORS[type].main;}
function escapeHtml(value:string){return value.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
function escapeStyleValue(value:string){return value.replace(/[;<>{}]/g,"");}
