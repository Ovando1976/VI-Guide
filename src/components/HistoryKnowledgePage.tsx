import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Archive,
  BookOpen,
  Camera,
  Clock3,
  Crown,
  Database,
  Layers3,
  Landmark,
  Map,
  MapPinned,
  Search,
  ShipWheel,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";

import {
  historyKnowledge,
  type HistoricalKnowledgeRecord,
} from "../data/history/books/historyKnowledge";
import { stThomasEarlyTimeline } from "../data/history/timelines";
import {
  danishWestIndiesGovernors,
  type DanishWestIndiesGovernorRecord,
} from "../data/history/danishWestIndiesGovernors";

type ViewMode = "hub" | "records" | "timeline" | "governors";

type HistoryKnowledgePageProps = {
  initialView?: ViewMode;
};

const governorRecords =
  danishWestIndiesGovernors as readonly DanishWestIndiesGovernorRecord[];

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

const historyModules = [
  {
    title: "Records",
    subtitle: "Search people, places, events, ships, laws, and archive records.",
    view: "records",
    icon: BookOpen,
  },
  {
    title: "Timeline",
    subtitle: "Explore early St. Thomas history by year and era.",
    view: "timeline",
    icon: Clock3,
  },
  {
    title: "Governors",
    subtitle: "Danish West Indies governors and administrations.",
    view: "governors",
    icon: Crown,
  },
  {
    title: "Archives",
    subtitle: "Danish records, NARA materials, maps, and historical documents.",
    path: "/history/archives",
    icon: Archive,
  },
  {
    title: "Historic Maps",
    subtitle: "Historic map layers, old place names, and Atlas evidence.",
    path: "/map?filter=history",
    icon: Map,
  },
  {
    title: "Historic Sites",
    subtitle: "Forts, churches, estates, ruins, and protected sites.",
    path: "/map?filter=history",
    icon: Landmark,
  },
  {
    title: "Dictionary",
    subtitle: "Search the Geographic Dictionary and place-name records.",
    path: "/dictionary",
    icon: BookOpen,
  },
  {
    title: "Gallery",
    subtitle: "Historic photos, documents, scans, and visual records.",
    path: "/history/gallery",
    icon: Camera,
  },
] as const;

function asArray<T>(value: readonly T[] | T[] | null | undefined): T[] {
  return Array.isArray(value) ? [...value] : [];
}

function normalizeSearch(value: unknown) {
  return String(value ?? "").toLowerCase().trim();
}

function typeLabel(type: HistoricalKnowledgeRecord["type"]) {
  return TYPE_LABELS[type] ?? String(type).replaceAll("_", " ");
}

export default function HistoryKnowledgePage({
  initialView = "hub",
}: HistoryKnowledgePageProps) {
  const navigate = useNavigate();

  const safeInitialView: ViewMode =
    ["hub", "records", "timeline", "governors"].includes(initialView)
      ? initialView
      : "hub";

  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>(safeInitialView);
  const [type, setType] = useState<"all" | HistoricalKnowledgeRecord["type"]>(
    "all",
  );
  const [selected, setSelected] = useState<HistoricalKnowledgeRecord | null>(
    historyKnowledge[0] ?? null,
  );
  const [governorOffice, setGovernorOffice] = useState("all");

  const types = useMemo(() => {
    return Array.from(new Set(historyKnowledge.map((item) => item.type))).sort();
  }, []);

  const governorOffices = useMemo(() => {
    return [
      "all",
      ...Array.from(new Set(governorRecords.map((item) => item.office))),
    ];
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
        item.source?.title ?? "",
        item.source?.publication ?? "",
        item.source?.pages ?? "",
        ...asArray(item.relatedPlaces),
        ...asArray(item.searchTerms),
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
        ...asArray(item.places),
        ...asArray(item.people),
        item.sourceTitle,
        item.sourcePage,
      ]
        .join(" ")
        .toLowerCase();

      return !q || haystack.includes(q);
    });
  }, [query]);

  const governors = useMemo(() => {
    const q = normalizeSearch(query);

    return governorRecords.filter((item) => {
      const officeMatch = governorOffice === "all" || item.office === governorOffice;

      const haystack = [
        item.name,
        item.office,
        item.jurisdiction,
        item.termText,
        item.termStart,
        item.termEnd,
        item.notes,
      ]
        .join(" ")
        .toLowerCase();

      return officeMatch && (!q || haystack.includes(q));
    });
  }, [query, governorOffice]);

  const relatedRecords = useMemo(() => {
    if (!selected) return [];

    return asArray(selected.relatedIds)
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
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-300 text-zinc-950 shadow-lg">
              <ShipWheel className="h-6 w-6" />
            </span>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.32em] text-amber-300">
                VI Guide History
              </p>
              <p className="mt-1 text-xs font-semibold text-white/45">
                {historyKnowledge.length.toLocaleString()} records ·{" "}
                {stThomasEarlyTimeline.length.toLocaleString()} timeline events ·{" "}
                {governorRecords.length.toLocaleString()} governors
              </p>
            </div>
          </div>

          <h1 className="mt-5 font-serif text-4xl font-black leading-none tracking-[-0.05em] sm:text-6xl">
            Virgin Islands Historical Atlas
          </h1>

          <p className="mt-5 max-w-3xl text-sm leading-6 text-zinc-300 sm:text-base">
            Search historical records, timelines, governors, people, places,
            companies, ships, archives, maps, and early St. Thomas source facts.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <ModeButton active={view === "hub"} icon={Database} label="Hub" onClick={() => setView("hub")} />
            <ModeButton active={view === "records"} icon={BookOpen} label="Records" onClick={() => setView("records")} />
            <ModeButton active={view === "timeline"} icon={Clock3} label="Timeline" onClick={() => setView("timeline")} />
            <ModeButton active={view === "governors"} icon={Crown} label="Governors" onClick={() => setView("governors")} />
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
              placeholder="Search history, estates, people, places, governors, events..."
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
        </div>
      </section>

      {view === "hub" ? <HistoryHub setView={setView} navigate={navigate} /> : null}
      {view === "timeline" ? <TimelineView timeline={timeline} /> : null}

      {view === "governors" ? (
        <GovernorsView
          governors={governors}
          governorOffice={governorOffice}
          governorOffices={governorOffices}
          setGovernorOffice={setGovernorOffice}
        />
      ) : null}

      {view === "records" ? (
        <RecordsView
          filtered={filtered}
          selected={selected}
          setSelected={setSelected}
          type={type}
          setType={setType}
          types={types}
          relatedRecords={relatedRecords}
        />
      ) : null}
    </main>
  );
}

function HistoryHub({
  setView,
  navigate,
}: {
  setView: (view: ViewMode) => void;
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {historyModules.map((module) => {
          const Icon = module.icon;

          return (
            <button
              key={module.title}
              type="button"
              onClick={() => {
                if ("view" in module) setView(module.view);
                if ("path" in module) navigate(module.path);
              }}
              className="group rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 text-left shadow-xl transition hover:-translate-y-1 hover:bg-white/10"
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-amber-300 transition group-hover:bg-amber-300 group-hover:text-zinc-950">
                <Icon className="h-6 w-6" />
              </div>

              <h2 className="mt-5 text-xl font-black">{module.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                {module.subtitle}
              </p>
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 shadow-xl">
          <p className="flex items-center gap-2 text-sm font-black text-amber-300">
            <Sparkles className="h-4 w-4" />
            Connected History Engine
          </p>
          <h2 className="mt-3 text-3xl font-black">Ask the island’s past</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/60">
            This section connects governors, estates, historic sites, dictionary
            entries, archive records, old maps, images, and the Territory Atlas
            into one searchable knowledge system.
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-xl">
          <p className="flex items-center gap-2 text-sm font-black text-amber-300">
            <MapPinned className="h-4 w-4" />
            Quick Links
          </p>

          <div className="mt-4 grid gap-2">
            <QuickButton label="Open Territory Atlas" onClick={() => navigate("/map")} icon={MapPinned} />
            <QuickButton label="Open Dictionary" onClick={() => navigate("/dictionary")} icon={BookOpen} />
            <QuickButton label="Ask Concierge" onClick={() => navigate("/concierge?context=history")} icon={Sparkles} />
          </div>
        </div>
      </div>
    </section>
  );
}

function TimelineView({ timeline }: { timeline: typeof stThomasEarlyTimeline }) {
  return (
    <section className="mx-auto max-w-5xl px-5 py-6">
      {timeline.length > 0 ? (
        <div className="space-y-4">
          {timeline.map((item) => (
            <article key={item.id} className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">
                {item.year ?? item.yearRange}
              </p>
              <h2 className="mt-2 font-serif text-2xl font-black">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-300">{item.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {asArray(item.places).map((place) => (
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
  );
}

function GovernorsView({
  governors,
  governorOffice,
  governorOffices,
  setGovernorOffice,
}: {
  governors: readonly DanishWestIndiesGovernorRecord[];
  governorOffice: string;
  governorOffices: string[];
  setGovernorOffice: (value: string) => void;
}) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-6">
      <div className="mb-5 flex justify-end">
        <select
          value={governorOffice}
          onChange={(event) => setGovernorOffice(event.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-black text-white outline-none"
        >
          {governorOffices.map((office) => (
            <option key={office} value={office}>
              {office === "all" ? "All offices" : office}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4">
        {governors.map((item) => (
          <article key={item.id} className="grid gap-4 rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 shadow-xl md:grid-cols-[80px_1fr]">
            <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-2xl bg-white/10">
              {item.portraitUrl ? (
                <img src={item.portraitUrl} alt={item.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <Crown className="h-7 w-7 text-amber-300" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black">{item.name}</h2>
                {item.acting ? (
                  <span className="rounded-full bg-amber-300 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-950">
                    Acting
                  </span>
                ) : null}
              </div>

              <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-amber-300">
                {item.office}
              </p>
              <p className="mt-3 text-sm font-bold text-white/75">{item.termText}</p>

              {item.notes ? (
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  {item.notes}
                </p>
              ) : null}

              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
                Source: {item.sourceTitle}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function RecordsView({
  filtered,
  selected,
  setSelected,
  type,
  setType,
  types,
  relatedRecords,
}: {
  filtered: HistoricalKnowledgeRecord[];
  selected: HistoricalKnowledgeRecord | null;
  setSelected: (record: HistoricalKnowledgeRecord) => void;
  type: "all" | HistoricalKnowledgeRecord["type"];
  setType: (type: "all" | HistoricalKnowledgeRecord["type"]) => void;
  types: HistoricalKnowledgeRecord["type"][];
  relatedRecords: HistoricalKnowledgeRecord[];
}) {
  return (
    <section className="mx-auto grid max-w-6xl gap-5 px-5 py-6 lg:h-[calc(100dvh-300px)] lg:min-h-[560px] lg:grid-cols-[410px_minmax(0,1fr)]">
      <aside className="min-h-0 rounded-[2rem] border border-white/10 bg-white/[0.035] p-3 shadow-2xl">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <FilterChip active={type === "all"} label="All" onClick={() => setType("all")} />
          {types.map((itemType) => (
            <FilterChip key={itemType} active={type === itemType} label={typeLabel(itemType)} onClick={() => setType(itemType)} />
          ))}
        </div>

        <div className="mt-3 max-h-[55dvh] space-y-3 overflow-y-auto pr-1 lg:max-h-[calc(100dvh-390px)]">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  selected?.id === item.id
                    ? "border-amber-300 bg-amber-300/10"
                    : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                }`}
              >
                <h2 className="line-clamp-2 text-sm font-black text-white">{item.title}</h2>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-400">{item.summary}</p>
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
            <span className="rounded-full bg-amber-300 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-950">
              {String(selected.type).replace("_", " ")}
            </span>

            <h2 className="mt-4 font-serif text-4xl font-black leading-tight tracking-[-0.04em]">
              {selected.title}
            </h2>

            <DetailBlock title="Summary" text={selected.summary} />
            <DetailBlock title="Significance" text={selected.significance} />

            {relatedRecords.length > 0 ? (
              <section className="mt-4 rounded-2xl bg-black/25 p-4">
                <h3 className="font-semibold text-amber-200">Linked Records</h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {relatedRecords.map((record) => (
                    <button
                      key={record.id}
                      onClick={() => setSelected(record)}
                      className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left hover:bg-white/[0.08]"
                    >
                      <p className="text-sm font-semibold text-white">{record.title}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {String(record.type).replace("_", " ")}
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
                {selected.source?.author},{" "}
                <span className="italic">{selected.source?.title}</span>,{" "}
                {selected.source?.publication}, {selected.source?.year || "n.d."}, pp.{" "}
                {selected.source?.pages}.
              </p>
            </section>
          </>
        )}
      </article>
    </section>
  );
}

function ModeButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex items-center gap-2 rounded-full px-5 py-3 text-xs font-black uppercase tracking-[0.16em] transition ${active ? "bg-amber-300 text-zinc-950 shadow-lg" : "bg-white/10 text-zinc-300 hover:bg-white/15"}`}>
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-black transition ${active ? "bg-amber-300 text-zinc-950" : "bg-white/10 text-zinc-300 hover:bg-white/15"}`}>
      {label}
    </button>
  );
}

function QuickButton({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-left text-sm font-bold text-white/75 transition hover:bg-white/15">
      <Icon className="h-4 w-4 text-amber-300" />
      {label}
    </button>
  );
}

function DetailBlock({ title, text }: { title: string; text?: string }) {
  return (
    <section className="mt-4 rounded-2xl bg-black/25 p-4">
      <h3 className="font-semibold text-amber-200">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-300">
        {text || "No details available yet."}
      </p>
    </section>
  );
}

function Chip({ label }: { label: string }) {
  return <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-300">{label}</span>;
}

function EmptyState({ title, compact = false }: { title: string; compact?: boolean }) {
  return (
    <div className={`grid place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.03] text-center ${compact ? "p-6" : "min-h-[260px] p-10"}`}>
      <div>
        <Layers3 className="mx-auto h-8 w-8 text-white/30" />
        <p className="mt-3 text-sm font-black text-white">{title}</p>
        <p className="mt-1 text-xs text-zinc-500">Try another search term or category.</p>
      </div>
    </div>
  );
}