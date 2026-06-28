import { ChevronRight } from "lucide-react";
import type { NavigateFunction } from "react-router-dom";

import type { IslandCode } from "../../../types";
import type { GeographicIndexItem } from "../../../data/core/geographicIndex";
import {
  getImage,
  getSourceLabel,
  islandLabel,
  resultPath,
} from "../conciergeUtils";

export function ConciergeResultCard({
  item,
  urlIsland,
  navigate,
}: {
  item: GeographicIndexItem;
  urlIsland: IslandCode;
  navigate: NavigateFunction;
}) {
  return (
    <button
      type="button"
      onClick={() => navigate(resultPath(item, urlIsland))}
      className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white p-3 text-left text-slate-950 transition hover:shadow-xl"
    >
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
        <img
          src={getImage(item)}
          alt=""
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black">{item.name}</p>

        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
          {getSourceLabel(item)} · {islandLabel(item.island)}
        </p>

        {item.description ? (
          <p className="mt-1 line-clamp-2 text-xs text-slate-500">
            {item.description}
          </p>
        ) : null}
      </div>

      <ChevronRight size={16} className="text-slate-300" />
    </button>
  );
}
