import {
  Archive,
  Compass,
  Map,
  MapPin,
  Menu,
  ShieldCheck,
  Star,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";

import type { MainTab } from "./mapTypes";
import { go } from "./mapUtils";

type Props = {
  mainTab: MainTab;
  setMainTab: (tab: MainTab) => void;
  currentIsland: string;
};

export default function MapTopNav({ mainTab, setMainTab, currentIsland }: Props) {
  const tabs: Array<[MainTab, string, LucideIcon]> = [
    ["map", "Map", Map],
    ["properties", "Properties", Archive],
    ["insights", "Insights", Compass],
    ["favorites", "Favorites", Star],
  ];

  return (
    <header className="absolute left-4 right-4 top-4 z-50 hidden items-center gap-4 xl:flex">
      <button className="flex items-center gap-2 rounded-full border border-white/10 bg-[#050b18]/82 px-4 py-3 text-sm font-black shadow-2xl backdrop-blur-2xl">
        <MapPin className="h-4 w-4 text-emerald-300" />
        {currentIsland}
        <ChevronDown className="h-4 w-4 text-white/55" />
      </button>

      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#050b18]/82 shadow-2xl backdrop-blur-2xl">
        <Menu className="h-5 w-5 text-white/70" />
      </div>

      <nav className="ml-auto rounded-[1.65rem] border border-white/10 bg-[#050b18]/82 p-2 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center gap-2">
          {tabs.map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setMainTab(key)}
              className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition ${
                mainTab === key
                  ? "bg-emerald-400 text-[#022c22] shadow-[0_0_35px_rgba(52,211,153,0.35)]"
                  : "text-white/62 hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      <button
        type="button"
        onClick={() => go("/admin/leads")}
        className="flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-emerald-300 shadow-2xl backdrop-blur-2xl transition hover:bg-emerald-400 hover:text-[#022c22]"
      >
        <ShieldCheck className="h-4 w-4" />
        Admin Leads
      </button>
    </header>
  );
}