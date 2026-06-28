import { FileText } from "lucide-react";

import type { SearchTab, SelectedMapItem } from "./mapTypes";
import { formatCoords } from "./mapUtils";

type Props = {
  counts: Record<SearchTab, number>;
  selectedItem: SelectedMapItem | null;
  currentIsland: string;
};

export default function MapStatusBar({ counts, selectedItem, currentIsland }: Props) {
  return (
    <footer className="absolute bottom-0 left-0 right-0 z-40 hidden h-[58px] items-center justify-between border-t border-white/10 bg-[#050b18]/82 px-6 pl-[480px] text-sm backdrop-blur-2xl md:flex">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.8)]" />
          <p className="font-bold text-white/80">Geographic Index Connected</p>
        </div>

        <div className="hidden items-center gap-2 text-white/55 sm:flex">
          <FileText className="h-4 w-4" />
          {counts.all.toLocaleString()} locations indexed
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-2 font-bold text-white/70">
        {selectedItem ? formatCoords(selectedItem.coords) : currentIsland}
      </div>
    </footer>
  );
}