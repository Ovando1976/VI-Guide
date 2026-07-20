"use client";

type Lens = "beaches" | "places" | "stays" | "historic" | "drivers" | "demand";

type Props = {
  activeLens: Lens;
  onChangeLens: (lens: Lens) => void;
  lensOrder?: Lens[];
};

const META: Record<Lens, { label: string; description: string }> = {
  places: {
    label: "Places",
    description: "Dining, services, and island anchors",
  },
  beaches: {
    label: "Beaches",
    description: "Shorelines and swim destinations",
  },
  stays: { label: "Stays", description: "Hotels, villas, and resorts" },
  historic: { label: "Historic", description: "Heritage sites and corridors" },
  drivers: { label: "Drivers", description: "Available movement capacity" },
  demand: { label: "Demand", description: "Trip pressure and busy corridors" },
};

const DEFAULT_ORDER: Lens[] = [
  "places",
  "beaches",
  "stays",
  "historic",
  "drivers",
  "demand",
];

export function TerritoryLensStrip({
  activeLens,
  onChangeLens,
  lensOrder,
}: Props) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-3">
      <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {(lensOrder ?? DEFAULT_ORDER).map((lens) => {
          const active = activeLens === lens;
          return (
            <button
              key={lens}
              type="button"
              aria-pressed={active}
              onClick={() => onChangeLens(lens)}
              className={`min-w-[170px] flex-1 rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                active
                  ? "border-cyan-300/35 bg-cyan-300/[0.12]"
                  : "border-transparent bg-white/[0.035] hover:bg-white/[0.07]"
              }`}
            >
              <div
                className={`text-xs font-extrabold ${active ? "text-cyan-100" : "text-white/85"}`}
              >
                {META[lens].label}
              </div>
              <div className="mt-1 text-xs text-white/45">
                {META[lens].description}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
