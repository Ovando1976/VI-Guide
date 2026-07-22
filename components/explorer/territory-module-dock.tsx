"use client";

import Link from "next/link";
import {
  BedDouble,
  Compass,
  History,
  MapPinned,
  Navigation,
  Route,
  Sparkles,
  Waves,
  type LucideIcon,
} from "lucide-react";

import type { TerritoryMapLens } from "@/types/territory-map";
import type { IslandCode } from "@/types/usvi";

type ModuleCountKey = "estates" | "places" | "beaches" | "stays" | "historic";
type ModuleCount = { total: number; mapped: number };

type Props = {
  island: IslandCode;
  activeLens: TerritoryMapLens;
  counts: Record<ModuleCountKey, ModuleCount>;
  tripCount: number;
  onChangeLens: (lens: TerritoryMapLens) => void;
  onOpenConcierge: () => void;
};

type LensModule = {
  id: string;
  label: string;
  detail: string;
  icon: LucideIcon;
  lens: Extract<TerritoryMapLens, "places" | "beaches" | "stays" | "historic">;
  countKey: ModuleCountKey;
};

const LENS_MODULES: LensModule[] = [
  { id: "places", label: "Explore", detail: "Local places", icon: Compass, lens: "places", countKey: "places" },
  { id: "beaches", label: "Beaches", detail: "Shores & bays", icon: Waves, lens: "beaches", countKey: "beaches" },
  { id: "stays", label: "Stays", detail: "Hotels & villas", icon: BedDouble, lens: "stays", countKey: "stays" },
  { id: "historic", label: "History", detail: "Sites & stories", icon: History, lens: "historic", countKey: "historic" },
];

export function TerritoryModuleDock({
  island,
  activeLens,
  counts,
  tripCount,
  onChangeLens,
  onOpenConcierge,
}: Props) {
  return (
    <section
      aria-label="Map discovery tools"
      className="rounded-[28px] border border-[#d8e7e3] bg-white/95 p-4 text-[#12312f] shadow-[0_16px_42px_rgba(18,49,47,.07)]"
    >
      <div className="mb-4 flex items-center justify-between gap-3 px-1">
        <div>
          <div className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#b16a18]">
            Explore your island
          </div>
          <h2 className="mt-1 text-base font-extrabold text-[#12312f]">
            Choose what you want to discover
          </h2>
        </div>
        <span className="hidden text-[10px] font-bold text-[#61716e] sm:block">
          {island.toUpperCase()} · {counts.estates.mapped} estates
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0 xl:grid-cols-8">
        <ModuleLink href="#territory-workspace" icon={MapPinned} label="Estates" detail={`${counts.estates.mapped} mapped`} />

        {LENS_MODULES.map((module) => (
          <ModuleButton
            key={module.id}
            icon={module.icon}
            label={module.label}
            detail={moduleCountLabel(counts[module.countKey])}
            active={activeLens === module.lens}
            onClick={() => onChangeLens(module.lens)}
          />
        ))}

        <ModuleLink href="/plan" icon={Route} label="My trip" detail={tripCount ? `${tripCount} saved` : "Build itinerary"} />
        <ModuleLink href={`/mobility?island=${island}`} icon={Navigation} label="Ride" detail="Plan & book" />
        <ModuleButton icon={Sparkles} label="Concierge" detail="Ask with context" onClick={onOpenConcierge} accent />
      </div>
    </section>
  );
}

function moduleCountLabel(count: ModuleCount) {
  return count.total === count.mapped
    ? `${count.total} available`
    : `${count.mapped} mapped · ${count.total} total`;
}

function ModuleButton({
  icon: Icon,
  label,
  detail,
  active = false,
  accent = false,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  detail: string;
  active?: boolean;
  accent?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active || undefined}
      onClick={onClick}
      className={`group min-w-[132px] rounded-2xl border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25b7ad] sm:min-w-0 ${
        active
          ? "border-[#0f766e] bg-[#e8f7f4] shadow-[0_8px_22px_rgba(15,118,110,.12)]"
          : accent
            ? "border-[#ead29b] bg-[#fff8e8] hover:bg-[#fff3cf]"
            : "border-[#dce8e5] bg-[#fbfdfc] hover:-translate-y-0.5 hover:border-[#9fd4cc] hover:bg-[#eff9f6]"
      }`}
    >
      <Icon className={active ? "text-[#0f766e]" : accent ? "text-[#c58a1c]" : "text-[#56827c]"} size={18} />
      <span className="mt-2 block truncate text-xs font-extrabold text-[#12312f]">{label}</span>
      <span className="mt-0.5 block truncate text-[9px] font-semibold text-[#61716e]">{detail}</span>
    </button>
  );
}

function ModuleLink({ href, icon: Icon, label, detail }: { href: string; icon: LucideIcon; label: string; detail: string }) {
  return (
    <Link
      href={href}
      className="group min-w-[132px] rounded-2xl border border-[#dce8e5] bg-[#fbfdfc] p-3 text-left transition hover:-translate-y-0.5 hover:border-[#9fd4cc] hover:bg-[#eff9f6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25b7ad] sm:min-w-0"
    >
      <Icon className="text-[#56827c]" size={18} />
      <span className="mt-2 block truncate text-xs font-extrabold text-[#12312f]">{label}</span>
      <span className="mt-0.5 block truncate text-[9px] font-semibold text-[#61716e]">{detail}</span>
    </Link>
  );
}
