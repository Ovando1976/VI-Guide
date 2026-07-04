import { useMemo, useState } from "react";
import {
  Archive,
  Database,
  ExternalLink,
  FileSearch,
  Image as ImageIcon,
  MapPinned,
  Search,
  ScrollText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  historicMapRecords,
  islandName,
  statusLabel,
  type HistoricMapRecord,
} from "../../../data/history/historicMaps";
import { historyKnowledge } from "../../../data/history/books/historyKnowledge";

function textValue(value: unknown, fallback = "") {
  return String(value ?? fallback).trim();
}

function mapSearchText(map: HistoricMapRecord) {
  const raw = map as Record<string, unknown>;

  return [
    raw.id,
    raw.title,
    raw.name,
    raw.description,
    raw.island,
    raw.year,
    raw.date,
    raw.status,
    raw.archiveId,
    raw.collection,
    raw.source,
    raw.sourceTitle,
    raw.translatedTitle,
  ]
    .join(" ")
    .toLowerCase();
}

function mapTitle(map: HistoricMapRecord) {
  const raw = map as Record<string, unknown>;
  return (
    textValue(raw.title) ||
    textValue(raw.translatedTitle) ||
    textValue(raw.name) ||
    "Untitled historic map"
  );
}

function mapSubtitle(map: HistoricMapRecord) {
  const raw = map as Record<string, unknown>;

  return [
    textValue(raw.year || raw.date || raw.dateLabel),
    textValue(raw.archiveId || raw.sourceId || raw.collection),
  ]
    .filter(Boolean)
    .join(" · ");
}

export default function HistoricArchivesPanel() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const archiveFacts = useMemo(() => {
    return historyKnowledge
      .filter((item) => {
        const haystack = [
          item.type,
          item.title,
          item.summary,
          item.source?.title,
          item.source?.publication,
        ]
          .join(" ")
          .toLowerCase();

        return (
          haystack.includes("archive") ||
          haystack.includes("record") ||
          haystack.includes("document") ||
          haystack.includes("map")
        );
      })
      .slice(0, 6);
  }, []);

  const filteredMaps = useMemo(() => {
    const q = query.trim().toLowerCase();

    return historicMapRecords
      .filter((map) => !q || mapSearchText(map).includes(q))
      .slice(0, 18);
  }, [query]);

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-2xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <Archive className="mt-1 h-6 w-6 text-yellow-300" />
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-yellow-300">
              Archives
            </p>
            <h2 className="mt-1 text-3xl font-black text-white">
              Archive Collections
            </h2>
            <p className="mt-4 max-w-4xl text-sm leading-7 text-white/65">
              Browse cleaned source collections, map inventories, research
              packets, and searchable archive facts without exposing the raw
              download pipeline.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-right md:min-w-[260px]">
          <Metric label="Historic maps" value={historicMapRecords.length} />
          <Metric label="Archive facts" value={archiveFacts.length} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <ArchiveAction
          icon={MapPinned}
          title="Map Inventory"
          text="Browse translated map metadata and review-ready map records."
          onClick={() => navigate("/history?view=maps")}
        />
        <ArchiveAction
          icon={Database}
          title="Historical Records"
          text="Search people, places, estates, ships, laws, and source facts."
          onClick={() => navigate("/history?view=records")}
        />
        <ArchiveAction
          icon={ScrollText}
          title="Research Packets"
          text="Review source summaries, citations, and estate-history evidence."
          onClick={() => navigate("/history?view=records")}
        />
      </div>

      <div className="mt-7 rounded-3xl border border-white/10 bg-black/20 p-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search archive maps, IDs, years, islands, collections..."
            className="w-full rounded-2xl border border-white/10 bg-white/[0.06] py-4 pl-11 pr-4 text-sm font-semibold text-white outline-none placeholder:text-white/35 focus:border-yellow-300/40"
          />
        </label>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredMaps.map((map, index) => {
            const raw = map as Record<string, unknown>;
            const status = textValue(raw.status);

            return (
              <button
                key={textValue(raw.id) || `${mapTitle(map)}-${index}`}
                type="button"
                onClick={() => navigate("/history?view=maps")}
                className="group rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-left transition hover:-translate-y-0.5 hover:border-yellow-300/40 hover:bg-white/[0.07]"
              >
                <div className="flex items-start justify-between gap-3">
                  <ImageIcon className="mt-1 h-5 w-5 shrink-0 text-yellow-300" />
                  <ExternalLink className="h-4 w-4 text-white/25 transition group-hover:text-yellow-300" />
                </div>

                <h3 className="mt-3 line-clamp-2 text-sm font-black text-white">
                  {mapTitle(map)}
                </h3>

                <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/55">
                  {textValue(raw.description || raw.summary, "Historic map record")}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Tag>{islandName(map.island)}</Tag>
                  {status ? <Tag>{statusLabel(map.status)}</Tag> : null}
                  {mapSubtitle(map) ? <Tag>{mapSubtitle(map)}</Tag> : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {archiveFacts.length > 0 ? (
        <div className="mt-7 rounded-3xl border border-yellow-300/15 bg-yellow-300/10 p-5">
          <div className="flex items-start gap-3">
            <FileSearch className="mt-1 h-5 w-5 text-yellow-300" />
            <div>
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-yellow-200">
                Linked archive facts
              </h3>
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {archiveFacts.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate("/history?view=records")}
                    className="rounded-2xl border border-yellow-300/15 bg-black/20 p-3 text-left hover:bg-black/30"
                  >
                    <p className="line-clamp-1 text-sm font-black text-white">
                      {item.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-yellow-50/65">
                      {item.summary}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ArchiveAction({
  icon: Icon,
  title,
  text,
  onClick,
}: {
  icon: typeof Archive;
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
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
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
