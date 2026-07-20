"use client";

import Link from "next/link";
import {
  BedDouble,
  Compass,
  Fish,
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
  {
    id: "places",
    label: "Explore",
    detail: "Local places",
    icon: Compass,
    lens: "places",
    countKey: "places",
  },
  {
    id: "beaches",
    label: "Beaches",
    detail: "Shores & bays",
    icon: Waves,
    lens: "beaches",
    countKey: "beaches",
  },
  {
    id: "stays",
    label: "Stays",
    detail: "Hotels & villas",
    icon: BedDouble,
    lens: "stays",
    countKey: "stays",
  },
  {
    id: "historic",
    label: "History",
    detail: "Sites & stories",
    icon: History,
    lens: "historic",
    countKey: "historic",
  },
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
      aria-label="Connected VI Guide modules"
      className="rounded-[26px] border border-white/10 bg-white/[0.04] p-3"
    >
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <div>
          <div className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-cyan-100/45">
            Connected workspace
          </div>
          <h2 className="mt-1 text-sm font-extrabold text-white">
            Explore, plan, and move without losing context
          </h2>
        </div>
        <span className="hidden text-[10px] font-bold text-white/35 sm:block">
          {counts.estates.mapped} estates · {island.toUpperCase()}
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0 xl:grid-cols-9">
        <ModuleLink
          href="#territory-workspace"
          icon={MapPinned}
          label="Estates"
          detail={`${counts.estates.mapped} mapped`}
        />

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

        <ModuleLink
          href="/fishing"
          icon={Fish}
          label="Fishing"
          detail="Rules & closures"
        />

        <ModuleLink
          href="/plan"
          icon={Route}
          label="My trip"
          detail={tripCount ? `${tripCount} saved` : "Build itinerary"}
        />
        <ModuleLink
          href={`/mobility?island=${island}`}
          icon={Navigation}
          label="Ride"
          detail="Plan & book"
        />
        <ModuleButton
          icon={Sparkles}
          label="Concierge"
          detail="Ask with context"
          onClick={onOpenConcierge}
          accent
        />
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
      className={`group min-w-[132px] rounded-2xl border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:min-w-0 ${
        active
          ? "border-cyan-200/35 bg-cyan-200/[0.12]"
          : accent
            ? "border-amber-300/25 bg-amber-300/[0.09] hover:bg-amber-300/[0.14]"
            : "border-white/10 bg-black/10 hover:border-white/20 hover:bg-white/[0.06]"
      }`}
    >
      <Icon
        className={
          active ? "text-cyan-200" : accent ? "text-amber-300" : "text-white/55"
        }
        size={18}
      />
      <span className="mt-2 block truncate text-xs font-extrabold text-white">
        {label}
      </span>
      <span className="mt-0.5 block truncate text-[9px] font-semibold text-white/40">
        {detail}
      </span>
    </button>
  );
}

function ModuleLink({
  href,
  icon: Icon,
  label,
  detail,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="group min-w-[132px] rounded-2xl border border-white/10 bg-black/10 p-3 text-left transition hover:border-white/20 hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:min-w-0"
    >
      <Icon className="text-white/55" size={18} />
      <span className="mt-2 block truncate text-xs font-extrabold text-white">
        {label}
      </span>
      <span className="mt-0.5 block truncate text-[9px] font-semibold text-white/40">
        {detail}
      </span>
    </Link>
  );
}
