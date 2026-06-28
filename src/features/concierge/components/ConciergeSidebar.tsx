import {
  BookOpen,
  Car,
  MapPin,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { NavigateFunction } from "react-router-dom";

import type { IslandCode } from "../../../types";
import type { GeographicIndexItem } from "../../../data/core/geographicIndex";
import type { Listing } from "../conciergeTypes";
import { getTitle, islandLabel } from "../conciergeUtils";

export function ConciergeSidebar({
  routeName,
  urlIsland,
  contextListing,
  bookingSite,
  suggestions,
  navigate,
  onSuggestion,
}: {
  routeName: string;
  urlIsland: IslandCode;
  contextListing?: Listing | null;
  bookingSite?: GeographicIndexItem | null;
  suggestions: string[];
  navigate: NavigateFunction;
  onSuggestion: (text: string) => void;
}) {
  return (
    <aside className="border-b border-white/10 bg-slate-950/45 p-6 lg:border-b-0 lg:border-r">
      <div className="flex items-center gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-300 to-cyan-400 text-slate-950 shadow-xl">
          <Sparkles className="h-7 w-7" />
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
            Ambient AI
          </p>
          <h1 className="text-2xl font-black">Concierge</h1>
        </div>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">
          Current Context
        </p>

        <p className="mt-3 text-lg font-black text-white">{routeName}</p>

        <p className="mt-1 text-sm text-cyan-200">{islandLabel(urlIsland)}</p>

        {contextListing || bookingSite ? (
          <p className="mt-3 text-sm leading-relaxed text-white/60">
            Viewing: {contextListing ? getTitle(contextListing) : bookingSite?.name}
          </p>
        ) : null}
      </div>

      <div className="mt-5 space-y-2">
        {suggestions.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onSuggestion(item)}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm font-bold text-white/75 transition hover:bg-white/10 active:scale-95"
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-2">
        <SideAction icon={BookOpen} label="Dictionary" onClick={() => navigate("/dictionary")} />
        <SideAction icon={MapPin} label="Open Map" onClick={() => navigate(`/map?island=${urlIsland}`)} />
        <SideAction icon={Car} label="Plan Ride" onClick={() => navigate(`/mobility?island=${urlIsland}`)} />
      </div>
    </aside>
  );
}

function SideAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm font-black text-white/75 transition hover:bg-white/10"
    >
      <Icon className="h-4 w-4 text-emerald-300" />
      {label}
    </button>
  );
}
