import { MapPin, Sun } from "lucide-react";

import type { IslandCode } from "../../types";
import type { SearchTab } from "./mapTypes";

const ISLAND_HERO_IMAGES: Record<string, string> = {
  st_thomas: "/images/beaches/magens-bay.jpg",
  st_john: "/images/beaches/trunk-bay.jpg",
  st_croix: "/images/business/business-directory.jpg",
  water_island: "/images/beaches/brewers-bay.jpg",
};

type Props = {
  currentIsland: string;
  selectedIsland: IslandCode;
  counts: Record<SearchTab, number>;
};

export default function IslandHeroCard({
  currentIsland,
  selectedIsland,
  counts,
}: Props) {
  const image = ISLAND_HERO_IMAGES[selectedIsland] || ISLAND_HERO_IMAGES.st_thomas;

  return (
    <section className="relative overflow-hidden rounded-[1.7rem] border border-emerald-300/15 bg-[#062b2c] shadow-2xl">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${image}")` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/35 to-black/10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(52,211,153,0.45),transparent_20%)]" />

      <div className="relative min-h-[205px] p-6">
        <div className="absolute right-5 top-5 rounded-2xl border border-white/10 bg-slate-950/65 px-4 py-3 shadow-2xl backdrop-blur">
          <div className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-amber-300" />
            <div>
              <p className="text-lg font-black">82°F</p>
              <p className="text-xs text-white/65">Sunny</p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 left-6 right-6">
          <h2 className="font-serif text-4xl font-black tracking-tight text-white">
            {currentIsland}
          </h2>

          <p className="mt-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.28em] text-emerald-300">
            <MapPin className="h-4 w-4" />
            U.S. Virgin Islands
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <HeroStat value={counts.all} label="Places" />
            <HeroStat value={counts.estates} label="Estates" />
            <HeroStat value={counts.places} label="Points" />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 px-3 py-2 backdrop-blur">
      <p className="text-lg font-black">{value}</p>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/55">
        {label}
      </p>
    </div>
  );
}