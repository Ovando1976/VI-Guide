import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { dictionaryReviewEntries } from "../../data/dictionaryReviewEntries";
import type { DictionaryFeatureType } from "../../data/dictionaryReviewTypes";

const FEATURE_TYPES: Array<DictionaryFeatureType | "all"> = [
  "all",
  "estate",
  "quarter",
  "bay",
  "point",
  "hill",
  "cay_or_island",
  "gut_or_stream",
  "road",
  "settlement",
  "school",
  "church",
  "historic_site",
  "coordinate",
  "unknown",
];

export default function DictionaryReviewPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<DictionaryFeatureType | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return dictionaryReviewEntries.filter((entry) => {
      const matchesQuery =
        !q ||
        entry.cleanedName.toLowerCase().includes(q) ||
        entry.cleanedDescription.toLowerCase().includes(q);

      const matchesType = type === "all" || entry.featureType === type;

      return matchesQuery && matchesType;
    });
  }, [query, type]);

  const selected =
    filtered.find((entry) => entry.id === selectedId) ?? filtered[0] ?? null;

  return (
    <main className="min-h-screen bg-stone-50 px-5 py-6 pb-32 text-stone-950">
      <section className="rounded-[2rem] bg-stone-950 p-6 text-white shadow-2xl">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-300">
          Geographic Dictionary
        </p>

        <h1 className="mt-3 text-4xl font-black leading-tight">
          Review Console
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-stone-300">
          Review, clean, classify, and link every extracted dictionary entry to
          estates, quarters, and geographic features.
        </p>
      </section>

      <section className="mt-5 rounded-[2rem] bg-white p-4 shadow-xl">
        <div className="flex items-center gap-3 rounded-2xl bg-stone-100 px-4 py-3">
          <Search className="h-4 w-4 text-stone-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search entries, estates, bays, hills, roads..."
            className="w-full bg-transparent text-sm font-bold outline-none"
          />
        </div>

        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-stone-500" />

          {FEATURE_TYPES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setType(item)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.12em] ${
                type === item
                  ? "bg-stone-950 text-white"
                  : "bg-stone-100 text-stone-600"
              }`}
            >
              {item.replaceAll("_", " ")}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[420px_1fr]">
        <div className="max-h-[75vh] overflow-y-auto rounded-[2rem] bg-white p-3 shadow-xl">
          <p className="px-2 pb-3 text-xs font-black uppercase tracking-[0.2em] text-stone-500">
            {filtered.length} entries
          </p>

          <div className="grid gap-2">
            {filtered.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setSelectedId(entry.id)}
                className={`rounded-2xl p-4 text-left ${
                  selected?.id === entry.id
                    ? "bg-emerald-50 ring-2 ring-emerald-500"
                    : "bg-stone-50"
                }`}
              >
                <p className="text-sm font-black">{entry.cleanedName}</p>

                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                  {entry.featureType.replaceAll("_", " ")}
                </p>

                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-stone-500">
                  {entry.cleanedDescription}
                </p>
              </button>
            ))}
          </div>
        </div>

        {selected ? (
          <article className="rounded-[2rem] bg-white p-5 shadow-xl">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">
                  Selected Entry
                </p>

                <h2 className="mt-2 text-3xl font-black">
                  {selected.cleanedName}
                </h2>
              </div>

              <span className="rounded-full bg-stone-950 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white">
                {selected.status.replaceAll("_", " ")}
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Fact label="Feature Type" value={selected.featureType} />
              <Fact label="Island" value={selected.island ?? "Unknown"} />
              <Fact label="Quarter" value={selected.quarter ?? "Unknown"} />
              <Fact
                label="Parent Estate"
                value={selected.parentEstateName ?? "Not linked"}
              />
            </div>

            <section className="mt-5 rounded-3xl bg-stone-50 p-5">
              <h3 className="text-lg font-black">Cleaned Description</h3>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
                {selected.cleanedDescription}
              </p>
            </section>

            <section className="mt-5 rounded-3xl bg-amber-50 p-5">
              <h3 className="text-lg font-black text-amber-950">
                Original Extracted Name
              </h3>
              <p className="mt-2 text-sm font-bold text-amber-900">
                {selected.sourceName}
              </p>
            </section>
          </article>
        ) : null}
      </section>
    </main>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-stone-50 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
        {label}
      </p>
      <p className="mt-2 text-sm font-black text-stone-900">
        {value.replaceAll("_", " ")}
      </p>
    </div>
  );
}