"use client";

import type { EstateRecord, IslandCode } from "@/types/usvi";
import { ISLAND_META } from "@/lib/usvi";
import { queryTerritoryEntities } from "@/lib/territory/catalog";

type Props = {
  estates: EstateRecord[];
  island: IslandCode;
};

export function StatsStrip({ estates, island }: Props) {
  const islandEstates = estates.filter((estate) => estate.island === island);
  const islandPlaces = queryTerritoryEntities({
    island,
    positionedOnly: true,
  });
  const hero = ISLAND_META[island];

  const categories = new Set(
    islandPlaces.flatMap((place) =>
      place.categories.map((category) => category.toLowerCase())
    )
  );

  return (
    <section className="grid gap-4 xl:grid-cols-4">
      <PulseCard
        eyebrow="Territory pulse"
        title={hero.name}
        value={`${islandEstates.length}`}
        suffix="official estates"
        tone="teal"
      />

      <PulseCard
        eyebrow="Movement network"
        title="Connected places"
        value={`${islandPlaces.length}`}
        suffix="mapped places across the territory catalog"
        tone="sand"
      />

      <PulseCard
        eyebrow="Island context"
        title="Coverage mix"
        value={`${categories.size}`}
        suffix="place types in active map context"
        tone="lagoon"
      />

      <PulseCard
        eyebrow="Routing source"
        title="Estate geometry"
        value="Live"
        suffix="TIGERweb estate geography"
        tone="gold"
      />
    </section>
  );
}

function PulseCard({
  eyebrow,
  title,
  value,
  suffix,
  tone,
}: {
  eyebrow: string;
  title: string;
  value: string;
  suffix: string;
  tone: "teal" | "sand" | "lagoon" | "gold";
}) {
  const toneClass =
    tone === "teal"
      ? "bg-[linear-gradient(135deg,#043331_0%,#0b5d5b_100%)] text-white border-transparent"
      : tone === "sand"
      ? "bg-[#fff7e6] text-[#043331] border-[#f5d48b]"
      : tone === "lagoon"
      ? "bg-[linear-gradient(135deg,#ecfeff_0%,#ccfbf1_100%)] text-[#043331] border-[#99f6e4]"
      : "bg-[linear-gradient(135deg,#fff8db_0%,#fde68a_100%)] text-[#6b4a00] border-[#f5b942]";

  const eyebrowClass = tone === "teal" ? "text-white/60" : "text-slate-500";

  const valueClass = tone === "teal" ? "text-white" : "text-[#043331]";

  const suffixClass = tone === "teal" ? "text-white/75" : "text-slate-600";

  return (
    <div className={`rounded-[30px] border p-6 shadow-sm ${toneClass}`}>
      <div
        className={`text-[10px] font-black uppercase tracking-[0.28em] ${eyebrowClass}`}
      >
        {eyebrow}
      </div>

      <div className="mt-3 text-xl font-black italic tracking-tight">
        {title}
      </div>

      <div className={`mt-4 text-4xl font-black tracking-tight ${valueClass}`}>
        {value}
      </div>

      <div
        className={`mt-2 text-xs font-semibold uppercase tracking-[0.16em] ${suffixClass}`}
      >
        {suffix}
      </div>
    </div>
  );
}
