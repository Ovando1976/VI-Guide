import { Archive, Filter, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { IslandCode } from "../../types";
import {
  searchArchives,
  type HistoricArchiveRecord,
} from "../../lib/history/archiveSearch";

type Props = {
  selectedIsland?: IslandCode;
};

type RecordType =
  | "all"
  | "map"
  | "census"
  | "church"
  | "estate"
  | "military"
  | "deed"
  | "government";

const RECORD_TYPES: RecordType[] = [
  "all",
  "map",
  "estate",
  "census",
  "church",
  "military",
  "deed",
  "government",
];

export default function ArchivesPage({
  selectedIsland = "st_thomas",
}: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<RecordType>("all");

  const records = useMemo(() => {
    return searchArchives({
      island: selectedIsland,
      query,
      type,
    });
  }, [selectedIsland, query, type]);

  const translatedCount = records.filter(
    (record) => record.englishTranslation?.length
  ).length;

  const linkedCount = records.filter(
    (record) =>
      record.relatedEstateIds?.length || record.relatedEventIds?.length
  ).length;

  return (
    <main className="min-h-screen bg-stone-50 px-5 py-6 pb-32 text-stone-950">
      <section className="overflow-hidden rounded-[2rem] bg-stone-950 text-white shadow-2xl">
        <div className="bg-gradient-to-br from-sky-900 via-stone-950 to-black p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-300">
            Danish Archives
          </p>

          <h1 className="mt-3 text-4xl font-black leading-tight">
            Virgin Islands Historical Archives
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-stone-300">
            Explore estate records, church books, censuses, maps, military
            records, deeds, and Danish colonial archive material.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <StatCard label="Records" value={records.length} />
            <StatCard label="Translated" value={translatedCount} />
            <StatCard label="Linked" value={linkedCount} />
          </div>
        </div>
      </section>

      <section className="mt-5 space-y-3">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Fireburn, Crown Prince, Estate Anna's Hope..."
            className="w-full rounded-3xl bg-white py-5 pl-14 pr-5 text-sm font-bold text-stone-900 shadow-xl outline-none"
          />
        </div>

        <div className="rounded-3xl bg-white p-4 shadow-xl">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-sky-700" />
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-sky-700">
              Record Type
            </p>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {RECORD_TYPES.map((value) => (
              <button
                key={value}
                onClick={() => setType(value)}
                className={`shrink-0 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-[0.16em] ${
                  type === value
                    ? "bg-sky-950 text-white"
                    : "bg-stone-100 text-stone-600"
                }`}
                type="button"
              >
                {value.replaceAll("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 space-y-4">
        {records.length === 0 ? (
          <div className="rounded-[2rem] bg-white p-10 text-center shadow-xl">
            <Archive className="mx-auto h-10 w-10 text-stone-300" />
            <p className="mt-4 text-sm font-bold text-stone-500">
              No archive records match this search.
            </p>
          </div>
        ) : (
          records.map((record) => (
            <ArchiveCard
              key={record.id}
              record={record}
              onOpen={() => navigate(`/history/archive/${record.id}`)}
            />
          ))
        )}
      </section>
    </main>
  );
}

function ArchiveCard({
  record,
  onOpen,
}: {
  record: HistoricArchiveRecord;
  onOpen: () => void;
}) {
  const title = record.translatedTitle || record.title;

  return (
    <button
      onClick={onOpen}
      className="block w-full rounded-[2rem] bg-white p-5 text-left shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl"
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-sky-700">
            {record.recordType}
          </p>

          <h2 className="mt-2 text-xl font-black leading-tight text-stone-950">
            {title}
          </h2>

          {record.translatedTitle && record.translatedTitle !== record.title && (
            <p className="mt-2 line-clamp-2 text-xs italic leading-relaxed text-stone-500">
              Original: {record.title}
            </p>
          )}
        </div>

        <Archive className="h-6 w-6 shrink-0 text-stone-400" />
      </div>

      {record.translatedDescription && (
        <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-stone-600">
          {record.translatedDescription}
        </p>
      )}

      {record.tags?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {record.tags.slice(0, 6).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-stone-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-600"
            >
              {tag.replaceAll("-", " ")}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-bold text-stone-500">
        {record.yearLabel && <span>{record.yearLabel}</span>}
        {record.location && <span>{record.location}</span>}
      </div>
    </button>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl bg-white/10 p-3">
      <p className="text-2xl font-black">{value}</p>

      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-300">
        {label}
      </p>
    </div>
  );
}