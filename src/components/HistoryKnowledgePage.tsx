import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  BookOpen,
  Clock3,
  Database,
  FileText,
  Layers3,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  historicalAccountStThomasFacts,
  historicalAccountStThomasPages46To53,
  historicalAccountStThomasPages54To63,
} from "../data/history/sources";
import {
  historyKnowledge,
  type HistoricalKnowledgeRecord,
} from "../data/history/books/historyKnowledge";
import { stThomasEarlyTimeline } from "../data/history/timelines";

type ViewMode = "records" | "timeline";

const TYPE_LABELS: Partial<Record<HistoricalKnowledgeRecord["type"], string>> = {
  place: "Places",
  person: "People",
  company: "Companies",
  ship: "Ships",
  infrastructure: "Infrastructure",
  event: "Events",
  occupation: "Occupations",
  law: "Laws",
  industry: "Industries",
  document: "Documents",
  navigation: "Navigation",
  labor: "Labor",
  economic_shift: "Economic Shifts",
};

function typeLabel(type: HistoricalKnowledgeRecord["type"]) {
  return TYPE_LABELS[type] ?? type.replaceAll("_", " ");
}

function normalizeSearch(value: unknown) {
  return String(value ?? "").toLowerCase().trim();
}

export default function HistoryKnowledgePage() {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("records");
  const [type, setType] = useState<"all" | HistoricalKnowledgeRecord["type"]>(
    "all",
  );
  const [selected, setSelected] = useState<HistoricalKnowledgeRecord | null>(
    historyKnowledge[0] ?? null,
  );

  const types = useMemo(() => {
    return Array.from(new Set(historyKnowledge.map((item) => item.type))).sort();
  }, []);

  const filtered = useMemo(() => {
    const q = normalizeSearch(query);

    return historyKnowledge.filter((item) => {
      const matchesType = type === "all" || item.type === type;

      const haystack = [
        item.id,
        item.title,
        item.type,
        item.summary,
        item.significance,
        item.dateRange ?? "",
        item.source.title,
        item.source.publication,
        item.source.pages,
        ...item.relatedPlaces,
        ...item.searchTerms,
      ]
        .join(" ")
        .toLowerCase();

      return matchesType && (!q || haystack.includes(q));
    });
  }, [query, type]);

  const timeline = useMemo(() => {
    const q = normalizeSearch(query);

    return stThomasEarlyTimeline.filter((item) => {
      const haystack = [
        item.title,
        item.summary,
        item.year ?? "",
        item.yearRange ?? "",
        ...item.places,
        ...item.people,
        item.sourceTitle,
        item.sourcePage,
      ]
        .join(" ")
        .toLowerCase();

      return !q || haystack.includes(q);
    });
  }, [query]);

  const relatedRecords = useMemo(() => {
    if (!selected) return [];

    return selected.relatedIds
      .map((id) => historyKnowledge.find((item) => item.id === id))
      .filter(Boolean) as HistoricalKnowledgeRecord[];
  }, [selected]);

  useEffect(() => {
    if (view !== "records") return;
    if (!filtered.length) {
      setSelected(null);
      return;
    }

    if (!selected || !filtered.some((item) => item.id === selected.id)) {
      setSelected(filtered[0]);
    }
  }, [filtered, selected, view]);

  return (
    <main className="min-h-screen bg-[#05060a] pb-[calc(120px+env(safe-area-inset-bottom))] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(251,191,36,0.18),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(20,184,166,0.12),transparent_32%),linear-gradient(135deg,#020617,#080811_55%,#1c1206)] px-5 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-300 text-zinc-950 shadow-lg">
              <Database className="h-5 w-5" />
            </span>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.32em] text-amber-300">
                VI Guide Historical Knowledge Base
              </p>
              <p className="mt-1 text-xs font-semibold text-white/45">
                {historyKnowledge.length.toLocaleString()} records indexed
              </p>
            </div>
          </div>

          <h1 className="mt-5 font-serif text-4xl font-black leading-none tracking-[-0.05em] sm:text-6xl">
            Virgin Islands Historical Library
          </h1>

          <p className="mt-5 max-w-3xl text-sm leading-6 text-zinc-300 sm:text-base">
            Search structured historical records, timelines, people, places,
            companies, ships, archive references, port history, and early St.
            Thomas source facts.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <ModeButton
              active={view === "records"}
              icon={BookOpen}
              label="Records"
              onClick={() => setView("records")}
            />

            <ModeButton
              active={view === "timeline"}
              icon={Clock3}
              label="Timeline"
              onClick={() => setView("timeline")}
            />
          </div>
        </div>
      </section>

      <section className="sticky top-0 z-30 border-b border-white/10 bg-[#05060a]/92 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search history, estates, people, places, events..."
              className="w-full rounded-2xl border border-white/10 bg-white/[0.08] py-4 pl-11 pr-12 text-sm outline-none placeholder:text-zinc-500 focus:border-amber-300"
            />

            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-white/15"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-zinc-500">
            <p>
              Showing{" "}
              <span className="font-black text-amber-300">
                {view === "records"
                  ? filtered.length.toLocaleString()
                  : timeline.length.toLocaleString()}
              </span>{" "}
              {view}
            </p>

            {view === "records" ? (
              <p className="hidden sm:block">
                Filter:{" "}
                <span className="font-bold text-white/70">
                  {type === "all" ? "All" : typeLabel(type)}
                </span>
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {view === "timeline" ? (
        <section className="mx-auto max-w-5xl px-5 py-6">
          {timeline.length > 0 ? (
            <div className="space-y-4">
              {timeline.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-xl"
                >
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">
                    {item.year ?? item.yearRange}
                  </p>

                  <h2 className="mt-2 font-serif text-2xl font-black">
                    {item.title}
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-zinc-300">
                    {item.summary}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.places.map((place) => (
                      <Chip key={place} label={place} />
                    ))}
                  </div>

                  <p className="mt-4 text-xs text-zinc-500">
                    Source: {item.sourceTitle}, p. {item.sourcePage}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="No timeline records found" />
          )}
        </section>
      ) : (
        <section className="mx-auto grid max-w-6xl gap-5 px-5 py-6 lg:h-[calc(100dvh-300px)] lg:min-h-[560px] lg:grid-cols-[410px_minmax(0,1fr)]">
          <aside className="min-h-0 rounded-[2rem] border border-white/10 bg-white/[0.035] p-3 shadow-2xl">
            <div className="sticky top-0 z-10 rounded-[1.5rem] bg-[#0b0b11]/95 pb-3 backdrop-blur-xl">
              <div className="flex gap-2 overflow-x-auto pb-1">
                <FilterChip
                  active={type === "all"}
                  label="All"
                  onClick={() => setType("all")}
                />

                {types.map((itemType) => (
                  <FilterChip
                    key={itemType}
                    active={type === itemType}
                    label={typeLabel(itemType)}
                    onClick={() => setType(itemType)}
                  />
                ))}
              </div>
            </div>

            <div className="mt-3 max-h-[55dvh] space-y-3 overflow-y-auto pr-1 lg:max-h-[calc(100dvh-390px)]">
              {filtered.length > 0 ? (
                filtered.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelected(item)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selected?.id === item.id
                        ? "border-amber-300 bg-amber-300/10 shadow-[0_0_40px_rgba(251,191,36,0.12)]"
                        : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="line-clamp-2 text-sm font-black text-white">
                        {item.title}
                      </h2>
                      <span className="shrink-0 rounded-full bg-amber-300/10 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-amber-200">
                        {item.type.replace("_", " ")}
                      </span>
                    </div>

                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-400">
                      {item.summary}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {item.dateRange ? <MiniChip label={item.dateRange} /> : null}
                      {item.relatedPlaces.slice(0, 2).map((place) => (
                        <MiniChip key={place} label={place} />
                      ))}
                    </div>
                  </button>
                ))
              ) : (
                <EmptyState title="No records found" compact />
              )}
            </div>
          </aside>

          <article className="min-h-0 overflow-y-auto rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl lg:max-h-[calc(100dvh-300px)]">
            {!selected ? (
              <EmptyState title="Select a record" />
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-amber-300 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-950">
                    {selected.type.replace("_", " ")}
                  </span>

                  {selected.dateRange ? (
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-zinc-300">
                      {selected.dateRange}
                    </span>
                  ) : null}
                </div>

                <h2 className="mt-4 font-serif text-4xl font-black leading-tight tracking-[-0.04em]">
                  {selected.title}
                </h2>

                <DetailBlock title="Summary" text={selected.summary} />
                <DetailBlock title="Significance" text={selected.significance} />

                {selected.relatedPlaces.length > 0 ? (
                  <section className="mt-4 rounded-2xl bg-black/25 p-4">
                    <h3 className="font-semibold text-amber-200">
                      Related Places
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selected.relatedPlaces.map((place) => (
                        <Chip key={place} label={place} />
                      ))}
                    </div>
                  </section>
                ) : null}

                {relatedRecords.length > 0 ? (
                  <section className="mt-4 rounded-2xl bg-black/25 p-4">
                    <h3 className="font-semibold text-amber-200">
                      Linked Records
                    </h3>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {relatedRecords.map((record) => (
                        <button
                          key={record.id}
                          onClick={() => setSelected(record)}
                          className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left hover:bg-white/[0.08]"
                        >
                          <p className="text-sm font-semibold text-white">
                            {record.title}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {record.type.replace("_", " ")}
                          </p>
                        </button>
                      ))}
                    </div>
                  </section>
                ) : null}

                <section className="mt-4 rounded-2xl bg-black/25 p-4">
                  <div className="flex items-center gap-2">
                    <Archive className="h-4 w-4 text-amber-200" />
                    <h3 className="font-semibold text-amber-200">Source</h3>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    {selected.source.author},{" "}
                    <span className="italic">{selected.source.title}</span>,{" "}
                    {selected.source.publication},{" "}
                    {selected.source.year || "n.d."}, pp.{" "}
                    {selected.source.pages}.
                  </p>
                </section>
              </>
            )}
          </article>
        </section>
      )}
    </main>
  );
}

function ModeButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full px-5 py-3 text-xs font-black uppercase tracking-[0.16em] transition ${
        active
          ? "bg-amber-300 text-zinc-950 shadow-lg"
          : "bg-white/10 text-zinc-300 hover:bg-white/15"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-black transition ${
        active
          ? "bg-amber-300 text-zinc-950"
          : "bg-white/10 text-zinc-300 hover:bg-white/15"
      }`}
    >
      {label}
    </button>
  );
}

function DetailBlock({ title, text }: { title: string; text: string }) {
  return (
    <section className="mt-4 rounded-2xl bg-black/25 p-4">
      <h3 className="font-semibold text-amber-200">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-300">{text}</p>
    </section>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-300">
      {label}
    </span>
  );
}

function MiniChip({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold text-zinc-400">
      {label}
    </span>
  );
}

function EmptyState({
  title,
  compact = false,
}: {
  title: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`grid place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.03] text-center ${
        compact ? "p-6" : "min-h-[260px] p-10"
      }`}
    >
      <div>
        <Layers3 className="mx-auto h-8 w-8 text-white/30" />
        <p className="mt-3 text-sm font-black text-white">{title}</p>
        <p className="mt-1 text-xs text-zinc-500">
          Try another search term or category.
        </p>
      </div>
    </div>
  );
}