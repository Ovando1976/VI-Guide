import { useMemo, useState } from "react";
import {
  BookOpen,
  Database,
  ExternalLink,
  MapPinned,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { geographicIndexItems } from "../../../data/core/geographicIndex";

type DictionaryRecord = Record<string, unknown>;

function textValue(value: unknown, fallback = "") {
  return String(value ?? fallback).trim();
}

function recordTitle(record: DictionaryRecord) {
  return (
    textValue(record.title) ||
    textValue(record.name) ||
    textValue(record.label) ||
    "Untitled dictionary entry"
  );
}

function recordIsland(record: DictionaryRecord) {
  return textValue(record.island || record.islandCode).replaceAll("_", " ");
}

function recordSearchText(record: DictionaryRecord) {
  return [
    record.id,
    record.title,
    record.name,
    record.label,
    record.type,
    record.category,
    record.island,
    record.description,
    record.summary,
    record.definition,
    record.source,
    record.searchText,
  ]
    .join(" ")
    .toLowerCase();
}

export default function HistoryDictionaryPanel() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const dictionaryRecords = useMemo(() => {
    return (geographicIndexItems as DictionaryRecord[]).filter((item) => {
      const type = textValue(item.type).toLowerCase();
      const source = textValue(item.source).toLowerCase();

      return (
        type.includes("dictionary") ||
        source.includes("dictionary") ||
        Boolean(item.definition)
      );
    });
  }, []);

  const filteredRecords = useMemo(() => {
    const q = query.trim().toLowerCase();

    return dictionaryRecords
      .filter((record) => !q || recordSearchText(record).includes(q))
      .slice(0, 30);
  }, [dictionaryRecords, query]);

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-2xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <Database className="mt-1 h-6 w-6 text-yellow-300" />
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-yellow-300">
              Dictionary
            </p>
            <h2 className="mt-1 text-3xl font-black text-white">
              Geographic Dictionary
            </h2>
            <p className="mt-4 max-w-4xl text-sm leading-7 text-white/65">
              Search old place names, bays, roads, estates, quarters, spelling
              variants, and historic geographic references.
            </p>
          </div>
        </div>

        <Metric label="Dictionary records" value={dictionaryRecords.length} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <DictionaryAction
          icon={BookOpen}
          title="Open Dictionary"
          text="Search old and modern place names, estates, bays, roads, quarters, and variants."
          onClick={() => navigate("/dictionary")}
        />
        <DictionaryAction
          icon={MapPinned}
          title="Atlas Links"
          text="Connect dictionary entries to map points, estates, historic sites, and archive evidence."
          onClick={() => navigate("/map")}
        />
        <DictionaryAction
          icon={Search}
          title="Search Records"
          text="Find dictionary-related people, places, events, estates, documents, and references."
          onClick={() => navigate("/history?view=records")}
        />
      </div>

      <div className="mt-7 rounded-3xl border border-white/10 bg-black/20 p-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search dictionary entries, old names, islands, estates..."
            className="w-full rounded-2xl border border-white/10 bg-white/[0.06] py-4 pl-11 pr-4 text-sm font-semibold text-white outline-none placeholder:text-white/35 focus:border-yellow-300/40"
          />
        </label>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredRecords.length > 0 ? (
            filteredRecords.map((record, index) => (
              <button
                key={textValue(record.id) || `${recordTitle(record)}-${index}`}
                type="button"
                onClick={() => navigate("/dictionary")}
                className="group rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-left transition hover:-translate-y-0.5 hover:border-yellow-300/40 hover:bg-white/[0.07]"
              >
                <div className="flex items-start justify-between gap-3">
                  <BookOpen className="mt-1 h-5 w-5 shrink-0 text-yellow-300" />
                  <ExternalLink className="h-4 w-4 text-white/25 transition group-hover:text-yellow-300" />
                </div>

                <h3 className="mt-3 line-clamp-2 text-sm font-black text-white">
                  {recordTitle(record)}
                </h3>

                <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/55">
                  {textValue(
                    record.description || record.summary || record.definition || record.type,
                    "Geographic dictionary record",
                  )}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Tag>{recordIsland(record)}</Tag>
                  <Tag>{textValue(record.type || record.category)}</Tag>
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-white/50">
              No dictionary records matched that search.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function DictionaryAction({
  icon: Icon,
  title,
  text,
  onClick,
}: {
  icon: typeof Database;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-3xl border border-white/10 bg-black/20 p-5 text-left transition hover:-translate-y-1 hover:border-yellow-300/40 hover:bg-white/[0.07]"
    >
      <div className="flex items-center justify-between gap-3">
        <Icon className="h-6 w-6 text-yellow-300" />
        <ExternalLink className="h-4 w-4 text-white/25 transition group-hover:text-yellow-300" />
      </div>
      <h3 className="mt-6 text-xl font-black text-white">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-white/55">{text}</p>
    </button>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-right md:min-w-[180px]">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-white">{value.toLocaleString()}</p>
    </div>
  );
}

function Tag({ children }: { children: string }) {
  if (!children) return null;

  return (
    <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/55">
      {children}
    </span>
  );
}
