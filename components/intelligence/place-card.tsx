"use client";

import Image from "next/image";
import { Bookmark, Map, MapPin, Navigation, Star } from "lucide-react";
import type { ReactNode } from "react";

import type { IntelligenceRecommendation } from "@/types/intelligence";

export interface PlaceCardProps {
  recommendation: IntelligenceRecommendation;
  onOpenMap(): void;
  onViewDetails(): void;
  onRide(): void;
  onSave(): void;
}

const ISLAND_NAMES = { stt: "St. Thomas", stj: "St. John", stx: "St. Croix" } as const;

export function PlaceCard({
  recommendation,
  onOpenMap,
  onViewDetails,
  onRide,
  onSave,
}: PlaceCardProps) {
  return (
    <article className="group overflow-hidden rounded-[22px] border border-white/10 bg-white/[.055] shadow-[0_16px_45px_rgba(0,0,0,.18)] transition duration-300 hover:-translate-y-0.5 hover:border-cyan-300/25">
      <div className="relative h-32 overflow-hidden bg-[#0b2933]">
        <Image
          src={recommendationImage(recommendation)}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, 400px"
          className="object-cover opacity-80 transition duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#081923] via-transparent to-black/10" />
        <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-[#071820]/80 px-2.5 py-1 text-[9px] font-black uppercase tracking-[.14em] text-cyan-100 backdrop-blur">
          {recommendation.kind.replaceAll("_", " ")}
        </span>
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 text-[10px] font-bold text-white/75">
          <MapPin size={12} /> {ISLAND_NAMES[recommendation.island]}
        </span>
      </div>

      <div className="p-4">
        <h3 className="text-base font-black tracking-tight text-white">{recommendation.title}</h3>
        <p className="mt-1.5 line-clamp-3 text-xs font-medium leading-5 text-white/55">
          {recommendation.summary}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {recommendation.reasons.slice(0, 2).map((reason) => (
            <span key={reason} className="inline-flex items-center gap-1 rounded-full bg-cyan-300/[.08] px-2 py-1 text-[9px] font-bold text-cyan-100/65">
              <Star size={9} /> {reason}
            </span>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <CardAction icon={<Map size={13} />} label="Open Map" onClick={onOpenMap} primary />
          <CardAction icon={<MapPin size={13} />} label="View Details" onClick={onViewDetails} />
          <CardAction icon={<Navigation size={13} />} label="Plan Ride" onClick={onRide} />
          <CardAction icon={<Bookmark size={13} />} label="Save" onClick={onSave} />
        </div>
      </div>
    </article>
  );
}

function CardAction({ icon, label, onClick, primary = false }: { icon: ReactNode; label: string; onClick(): void; primary?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-2 text-[10px] font-black transition active:scale-[.98] ${primary ? "bg-cyan-300 text-[#05242b] hover:bg-cyan-200" : "border border-white/10 bg-white/[.04] text-white/70 hover:border-cyan-300/25 hover:text-white"}`}>
      {icon} {label}
    </button>
  );
}

function recommendationImage(recommendation: IntelligenceRecommendation) {
  const kind = recommendation.kind.toLowerCase();
  if (kind.includes("beach")) {
    return recommendation.island === "stj"
      ? "/images/places/st-john/trunk-bay-beach-1.jpg"
      : recommendation.island === "stx"
        ? "/images/places/st-croix/cane-bay-beach-1.jpg"
        : "/images/places/st-thomas/magens-bay-beach-1.jpg";
  }
  const category = kind.includes("historic") || kind.includes("heritage") ? "historic" : kind.includes("museum") ? "museum" : "attraction";
  return `/images/places/fallbacks/${category}-${recommendation.island}.svg`;
}
