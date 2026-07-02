import { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, GitBranch, MapPin, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  dictionaryGraph,
  getConnectedDictionaryNodes,
  getRelationshipsForNode,
} from "../../data/dictionaryGraph";
import { searchAllGeography } from "../../lib/search/geographicSearch";
import type { GeographicIndexItem } from "../../data/core/geographicIndex";

function labelType(type?: string | null) {
  return String(type || "unknown").replaceAll("_", " ");
}

function islandName(value?: string | null) {
  if (value === "st_thomas" || value === "stt" || value === "STT") return "St. Thomas";
  if (value === "st_john" || value === "stj" || value === "STJ") return "St. John";
  if (value === "st_croix" || value === "stx" || value === "STX") return "St. Croix";
  if (value === "water_island" || value === "wat" || value === "WAT") return "Water Island";
  return value || "Unknown";
}

function findGraphNode(item: GeographicIndexItem | null) {
  if (!item) return null;

  return (
    dictionaryGraph.nodes.find((node) => node.id === item.id) ??
    dictionaryGraph.nodes.find(
      (node) => node.label.toLowerCase() === item.name.toLowerCase()
    ) ??
    null
  );
}

export default function DictionaryPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const results = useMemo(
    () =>
      searchAllGeography(query, {
        source: "all",
        island: "all",
        limit: 300,
      }),
    [query]
  );

  const selected =
    results.find((item) => item.id === selectedId) ?? results[0] ?? null;

  const graphNode = findGraphNode(selected);
  const connected = graphNode ? getConnectedDictionaryNodes(graphNode.id) : [];
  const relationships = graphNode ? getRelationshipsForNode(graphNode.id) : [];

  return (
    <main className="min-h-screen bg-stone-50 px-5 py-6 pb-32 text-stone-950">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate("/concierge")}
            className="flex items-center gap-2 rounded-2xl bg-stone-950 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-emerald-300 shadow-xl transition hover:bg-stone-800 active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            Concierge
          </button>

          <button
            type="button"
            onClick={() => navigate("/map")}
            className="rounded-2xl bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-stone-700 shadow-xl transition hover:bg-stone-100 active:scale-95"
          >
            Map
          </button>
        </div>

        <section className="rounded-[2rem] bg-stone-950 p-6 text-white shadow-2xl">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-300">
            AI Geographic Dictionary
          </p>

          <h1 className="mt-3 text-4xl font-black leading-tight">
            Virgin Islands Geographic Index
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-300">
            Search estates, beaches, historic sites, civic places, dictionary
            entries, and Danish archive records from one connected index.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Nodes" value={(dictionaryGraph as any).stats.nodes} />
            <Stat label="Links" value={(dictionaryGraph as any).stats.relationships} />
            <Stat label="Entries" value={(dictionaryGraph as any).stats.dictionaryEntries} />
            <Stat label="Places" value={(dictionaryGraph as any).stats.standalonePlaces} />
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-4 shadow-xl">
          <div className="flex items-center gap-3 rounded-2xl bg-stone-100 px-4 py-3">
            <Search className="h-4 w-4 text-stone-500" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSelectedId(null);
              }}
              placeholder="Search Annaberg, Bordeaux, Cane Bay, archives, historic sites..."
              className="w-full bg-transparent text-sm font-bold outline-none"
            />
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[420px_1fr]">
          <aside className="max-h-[75vh] overflow-y-auto rounded-[2rem] bg-white p-3 shadow-xl">
            <p className="px-2 pb-3 text-xs font-black uppercase tracking-[0.2em] text-stone-500">
              {results.length} results
            </p>

            <div className="grid gap-2">
              {results.length > 0 ? (
                results.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`rounded-2xl p-4 text-left transition ${
                      selected?.id === item.id
                        ? "bg-emerald-50 ring-2 ring-emerald-500"
                        : "bg-stone-50 hover:bg-stone-100"
                    }`}
                  >
                    <p className="text-sm font-black">{item.name}</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                      {labelType(item.source)} · {labelType(item.type || item.category)}
                    </p>
                    <p className="mt-2 text-xs font-bold text-stone-500">
                      {islandName(item.island)}
                      {item.estateName ? ` · ${item.estateName}` : ""}
                    </p>
                  </button>
                ))
              ) : (
                <p className="rounded-2xl bg-stone-50 p-4 text-sm font-bold text-stone-500">
                  No geographic results found.
                </p>
              )}
            </div>
          </aside>

          {selected ? (
            <article className="rounded-[2rem] bg-white p-5 shadow-xl">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">
                    Selected Record
                  </p>

                  <h2 className="mt-2 text-4xl font-black leading-tight">
                    {selected.name}
                  </h2>

                  <p className="mt-2 text-sm font-bold text-stone-500">
                    {labelType(selected.source)} ·{" "}
                    {labelType(selected.type || selected.category)}
                  </p>
                </div>

                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-800">
                  <BookOpen className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Fact label="Island" value={islandName(selected.island)} />
                <Fact label="Source" value={labelType(selected.source)} />
                <Fact label="Connections" value={String(connected.length)} />
              </div>

              {selected.coordinates ? (
                <section className="mt-5 rounded-3xl bg-sky-50 p-5">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-1 h-5 w-5 text-sky-800" />
                    <div>
                      <h3 className="text-lg font-black text-sky-950">Coordinate</h3>
                      <p className="mt-1 text-sm font-bold text-sky-900">
                        {selected.coordinates.lat.toFixed(6)},{" "}
                        {selected.coordinates.lng.toFixed(6)}
                      </p>
                    </div>
                  </div>
                </section>
              ) : null}

              {selected.description ? (
                <section className="mt-5 rounded-3xl bg-stone-50 p-5">
                  <h3 className="text-lg font-black">Description</h3>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
                    {selected.description}
                  </p>
                </section>
              ) : null}

              <section className="mt-5">
                <div className="mb-3 flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-emerald-700" />
                  <h3 className="text-lg font-black">Connected Knowledge</h3>
                </div>

                {connected.length > 0 ? (
                  <div className="grid gap-3">
                    {connected.slice(0, 40).map((node) => {
                      const rel = relationships.find(
                        (item) =>
                          item.sourceId === node.id || item.targetId === node.id
                      );

                      return (
                        <button
                          key={node.id}
                          type="button"
                          onClick={() => setQuery(node.label)}
                          className="rounded-2xl bg-stone-50 p-4 text-left hover:bg-emerald-50"
                        >
                          <p className="text-sm font-black">{node.label}</p>
                          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                            {rel ? labelType(rel.type) : "related"} ·{" "}
                            {labelType(node.type)}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-2xl bg-stone-50 p-4 text-sm font-bold text-stone-500">
                    No graph connections yet.
                  </p>
                )}
              </section>
            </article>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <p className="text-2xl font-black">{value.toLocaleString()}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-stone-300">
        {label}
      </p>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-stone-50 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
        {label}
      </p>
      <p className="mt-2 text-sm font-black text-stone-900">{value}</p>
    </div>
  );
}