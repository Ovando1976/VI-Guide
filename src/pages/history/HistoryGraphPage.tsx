import { useMemo, useState } from "react";
import {
  BookOpen,
  Building2,
  CalendarDays,
  Landmark,
  Network,
  Search,
  UserRound,
} from "lucide-react";

import {
  getHistoryGraphForEntity,
  historyGraphNodes,
} from "../../data/history/generated/historyGraph";
import type { HistoryEntityKind } from "../../data/history/entities";

const KIND_LABELS: Record<HistoryEntityKind | "all", string> = {
  all: "All",
  person: "People",
  place: "Places",
  organization: "Organizations",
  event: "Events",
  document: "Documents",
};

function iconForKind(kind: HistoryEntityKind) {
  if (kind === "person") return UserRound;
  if (kind === "place") return Landmark;
  if (kind === "organization") return Building2;
  if (kind === "event") return CalendarDays;
  return BookOpen;
}

function sourceLabel(record: {
  source: { title: string; pages: string | number };
}) {
  return `${record.source.title}, ${record.source.pages}`;
}

export default function HistoryGraphPage() {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<HistoryEntityKind | "all">("all");
  const [selectedId, setSelectedId] = useState(
    historyGraphNodes[0]?.id ?? "",
  );

  const selectedGraph = useMemo(
    () => getHistoryGraphForEntity(selectedId),
    [selectedId],
  );

  const filteredNodes = useMemo(() => {
    const q = query.trim().toLowerCase();

    return historyGraphNodes.filter((node) => {
      const matchesKind = kind === "all" || node.kind === kind;
      const haystack = [node.name, node.kind, ...node.aliases]
        .join(" ")
        .toLowerCase();

      return matchesKind && (!q || haystack.includes(q));
    });
  }, [query, kind]);

  const kinds: Array<HistoryEntityKind | "all"> = [
    "all",
    "person",
    "place",
    "organization",
    "event",
    "document",
  ];

  return (
    <main className="min-h-screen bg-[#070816] px-4 py-5 pb-[calc(120px+env(safe-area-inset-bottom))] text-white sm:px-6">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(245,158,11,0.18),transparent_28%),radial-gradient(circle_at_80%_8%,rgba(14,165,233,0.14),transparent_32%),linear-gradient(to_bottom,#070816,#111827_42%,#050816)]" />

      <section className="relative mx-auto max-w-7xl">
        <div className="rounded-[2.25rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-2xl sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-amber-200">
                <Network className="h-4 w-4" />
                VI Guide History Engine
              </div>

              <h1 className="mt-4 font-serif text-4xl font-black leading-none tracking-[-0.05em] sm:text-6xl">
                Historical Knowledge Graph
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-6 text-white/65">
                Browse people, places, organizations, events, and source-linked
                records connected through the Virgin Islands historical archive.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 rounded-[1.5rem] border border-white/10 bg-black/20 p-3 text-center sm:min-w-[360px]">
              <Stat label="Entities" value={historyGraphNodes.length} />
              <Stat
                label="Linked Records"
                value={selectedGraph.records.length}
              />
              <Stat label="Edges" value={selectedGraph.edges.length} />
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[380px_1fr]">
          <aside className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-4 shadow-xl backdrop-blur-2xl lg:sticky lg:top-5 lg:max-h-[calc(100vh-2.5rem)]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search graph entities..."
                className="w-full rounded-2xl border border-white/10 bg-black/25 py-3 pl-11 pr-4 text-sm font-bold text-white outline-none placeholder:text-white/30 focus:border-amber-300/70"
              />
            </label>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {kinds.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setKind(item)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${
                    kind === item
                      ? "bg-amber-300 text-stone-950"
                      : "bg-white/10 text-white/65 hover:bg-white/15"
                  }`}
                >
                  {KIND_LABELS[item]}
                </button>
              ))}
            </div>

            <div className="mt-4 max-h-[62vh] space-y-2 overflow-y-auto pr-1">
              {filteredNodes.map((node) => {
                const Icon = iconForKind(node.kind);
                const graph = getHistoryGraphForEntity(node.id);

                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setSelectedId(node.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selectedId === node.id
                        ? "border-amber-300 bg-amber-300/10"
                        : "border-white/10 bg-black/20 hover:bg-white/[0.08]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/10 text-amber-200">
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-black">
                          {node.name}
                        </p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-white/35">
                          {node.kind} · {graph.records.length} records
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-xl backdrop-blur-2xl sm:p-6">
            {!selectedGraph.entity ? (
              <p className="text-white/60">Select an entity.</p>
            ) : (
              <>
                <EntityHeader entity={selectedGraph.entity} />

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <Info label="Kind" value={selectedGraph.entity.kind} />
                  <Info
                    label="Confidence"
                    value={`${Math.round(
                      selectedGraph.entity.confidence * 100,
                    )}%`}
                  />
                  <Info
                    label="Linked Records"
                    value={String(selectedGraph.records.length)}
                  />
                </div>

                {selectedGraph.entity.description ? (
                  <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-5">
                    <p className="text-sm leading-6 text-white/65">
                      {selectedGraph.entity.description}
                    </p>
                  </div>
                ) : null}

                {selectedGraph.entity.aliases.length > 0 ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {selectedGraph.entity.aliases.map((alias) => (
                      <span
                        key={alias}
                        className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white/60"
                      >
                        {alias}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="mt-6">
                  <h2 className="font-serif text-3xl font-black">
                    Linked Historical Records
                  </h2>

                  <div className="mt-4 grid gap-3">
                    {selectedGraph.records.map((record) => (
                      <article
                        key={record.id}
                        className="rounded-3xl border border-white/10 bg-black/20 p-5"
                      >
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-200">
                          {record.dateRange || record.type}
                        </p>

                        <h3 className="mt-2 text-lg font-black">
                          {record.title}
                        </h3>

                        <p className="mt-3 line-clamp-4 text-sm leading-6 text-white/60">
                          {record.summary}
                        </p>

                        <p className="mt-4 text-xs font-bold text-white/35">
                          {sourceLabel(record)}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function EntityHeader({
  entity,
}: {
  entity: (typeof historyGraphNodes)[number];
}) {
  const Icon = iconForKind(entity.kind);

  return (
    <div className="flex items-start gap-4">
      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-3xl bg-amber-300 text-stone-950">
        <Icon className="h-7 w-7" />
      </div>

      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">
          {entity.kind}
        </p>
        <h2 className="mt-2 font-serif text-4xl font-black leading-none tracking-[-0.04em]">
          {entity.name}
        </h2>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3">
      <p className="text-xl font-black">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
        {label}
      </p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-black/20 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200">
        {label}
      </p>
      <p className="mt-2 text-sm font-black capitalize text-white/80">
        {value}
      </p>
    </div>
  );
}
