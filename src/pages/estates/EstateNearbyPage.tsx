// src/pages/estates/EstateNearbyPage.tsx
import { ArrowLeft, MapPinned, Route, Waves, Landmark } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { estates } from "../../data/estates";
import { getEstateFeaturesByGeoid } from "../../data/estateFeatureLinks";
import { getQuarterFeatures } from "../../data/quarterFeatureLinks";
import { getEstateKnowledgeForEstate } from "../../data/estateKnowledgeLookup";

function clean(value: unknown): string {
  return String(value ?? "")
    .replace(/^Estate\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function islandName(value: unknown): string {
  const key = String(value ?? "").toLowerCase();

  if (key === "stt" || key === "st_thomas") return "St. Thomas";
  if (key === "stj" || key === "st_john") return "St. John";
  if (key === "stx" || key === "st_croix") return "St. Croix";
  if (key === "wat" || key === "water_island") return "Water Island";

  return "U.S. Virgin Islands";
}

export default function EstateNearbyPage() {
  const { geoid = "" } = useParams();
  const navigate = useNavigate();

  const estate = estates.find((item) => String(item.geoid) === geoid);

  if (!estate) {
    return (
      <main className="min-h-screen bg-stone-50 p-6 text-stone-950">
        <h1 className="text-3xl font-black">Estate not found</h1>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-4 rounded-2xl bg-stone-950 px-5 py-3 font-bold text-white"
        >
          Back
        </button>
      </main>
    );
  }

  const title = clean(estate.name);
  const islandLabel = islandName(estate.island);
  const quarter = estate.quarter || estate.quarterGroup || "Unknown Quarter";

  const estateFeatures = getEstateFeaturesByGeoid(String(estate.geoid));
  const quarterFeatures = getQuarterFeatures(
    String(estate.island),
    String(estate.quarterGroup || estate.quarter || "")
  );

  const knowledge = getEstateKnowledgeForEstate({
  geoid: String(estate.geoid),
  name: String(estate.name),
  });

  return (
    <main className="min-h-screen bg-stone-50 px-5 py-6 pb-[calc(140px+env(safe-area-inset-bottom))] text-stone-950">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-5 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black shadow"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <section className="rounded-[2rem] bg-stone-950 p-6 text-white shadow-2xl">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-300">
          Nearby Intelligence
        </p>

        <h1 className="mt-3 text-5xl font-black leading-tight">
          Near {title}
        </h1>

        <p className="mt-3 text-sm font-bold text-stone-300">
          {quarter} · {islandLabel}
        </p>

        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-stone-300">
          Connect this estate to nearby beaches, food, historic sites, events,
          taxi zones, routes, and local businesses.
        </p>
      </section>
      {knowledge ? (
  <section className="mt-5 rounded-[2rem] bg-white p-6 shadow-xl">
    <h2 className="text-2xl font-black">Connected Places</h2>

    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      {knowledge.relatedPlaces.map((place) => (
        <div key={place} className="rounded-2xl bg-emerald-50 p-4">
          <p className="text-sm font-black text-stone-900">{place}</p>
          <p className="mt-1 text-xs text-stone-600">Related place</p>
        </div>
      ))}

      {knowledge.relatedHistoricSites.map((site) => (
        <div key={site} className="rounded-2xl bg-amber-50 p-4">
          <p className="text-sm font-black text-stone-900">{site}</p>
          <p className="mt-1 text-xs text-stone-600">Historic site</p>
        </div>
      ))}
    </div>
  </section>
) : null}

      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        <NearbyCard
          icon={MapPinned}
          title="Estate Features"
          value={String(estateFeatures.length)}
          text="Dictionary and place records linked directly to this estate."
        />

        <NearbyCard
          icon={Landmark}
          title="Quarter Features"
          value={String(quarterFeatures.length)}
          text="Nearby records connected through the surrounding quarter."
        />

        <NearbyCard
          icon={Waves}
          title="Visitor Layer"
          value="Next"
          text="Beaches, food, events, routes, and businesses will connect here."
        />
      </section>

      <section className="mt-5 rounded-[2rem] bg-white p-6 shadow-xl">
        <h2 className="text-2xl font-black">What this unlocks</h2>

        <div className="mt-4 grid gap-3">
          <button
            type="button"
            onClick={() => navigate(`/mobility?destination=${encodeURIComponent(title)}`)}
            className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-left"
          >
            <Route className="h-5 w-5 text-emerald-700" />
            <span className="font-black">Plan a ride to {title}</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(`/estates/${estate.geoid}/archives`)}
            className="flex items-center gap-3 rounded-2xl bg-amber-50 p-4 text-left"
          >
            <Landmark className="h-5 w-5 text-amber-700" />
            <span className="font-black">Open archive connections</span>
          </button>
        </div>
      </section>
    </main>
  );
}

function NearbyCard({
  icon: Icon,
  title,
  value,
  text,
}: {
  icon: typeof MapPinned;
  title: string;
  value: string;
  text: string;
}) {
  return (
    <section className="rounded-[2rem] bg-white p-5 shadow-xl">
      <Icon className="h-6 w-6 text-emerald-700" />

      <p className="mt-4 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">
        {title}
      </p>

      <p className="mt-2 text-3xl font-black text-stone-950">{value}</p>

      <p className="mt-2 text-sm leading-relaxed text-stone-600">{text}</p>
    </section>
  );
}