import { useMemo, useState } from "react";
import {
  Archive,
  Bookmark,
  Compass,
  Copy,
  ExternalLink,
  History,
  Info,
  MapPin,
  MessageCircle,
  Plus,
  Share2,
  Sparkles,
  X,
} from "lucide-react";
import { hydrateAtlasSelection } from "../../data/canonical/atlasProfileResolver";

type SelectionLike = {
  id?: string | number;
  geoid?: string | number;
  title?: string;
  name?: string;
  label?: string;
  description?: string;
  summary?: string;
  historicalContext?: string;
  modernContext?: string;
  sourceConfidence?: "high" | "medium" | "low";
  sourceNotes?: string[];
  sourceRefs?: string[];
  relatedFeatures?: string[];
  type?: string;
  source?: string;
  island?: string;
  estate?: string;
  quarter?: string;
  quarterGroup?: string;
  parcel?: string;
  address?: string;
  lat?: number;
  lng?: number;
  coords?: [number, number] | number[];
  isEstate?: boolean;
  isParcel?: boolean;
  isPoint?: boolean;
  properties?: Record<string, unknown>;
};

type Props = {
  selection?: SelectionLike | null;
  islandLabel?: string;
  onClose?: () => void;
  onDirections?: (selection: SelectionLike) => void;
  onAskAI?: (selection: SelectionLike) => void;
  onAddStop?: (selection: SelectionLike) => void;
  onSave?: (selection: SelectionLike) => void;
  onOpenEstate?: (selection: SelectionLike) => void;
  onOpenHistory?: (selection: SelectionLike) => void;
  onOpenArchives?: (selection: SelectionLike) => void;
};

type InspectorTab = "overview" | "history" | "archives" | "dictionary";

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function titleOf(selection: SelectionLike) {
  return (
    clean(selection.title) ||
    clean(selection.name) ||
    clean(selection.label) ||
    clean(selection.estate) ||
    "Selected location"
  );
}

function sourceLabel(selection: SelectionLike) {
  if (selection.isEstate || selection.type === "estate") return "Estate Layer";
  if (selection.isParcel || selection.type === "parcel") return "Parcel Layer";
  if (selection.source === "point-marker") return "Map Point";
  return clean(selection.source) || "Atlas Source";
}

function getLat(selection: SelectionLike) {
  if (typeof selection.lat === "number") return selection.lat;
  if (Array.isArray(selection.coords) && typeof selection.coords[1] === "number") {
    return selection.coords[1];
  }
  return null;
}

function getLng(selection: SelectionLike) {
  if (typeof selection.lng === "number") return selection.lng;
  if (Array.isArray(selection.coords) && typeof selection.coords[0] === "number") {
    return selection.coords[0];
  }
  return null;
}

function prop(selection: SelectionLike, key: string) {
  return selection.properties?.[key];
}

function firstValue(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }

  return "";
}

function getDescription(selection: SelectionLike) {
  return firstValue(
    selection.description,
    prop(selection, "description"),
    selection.summary,
    prop(selection, "summary"),
    prop(selection, "canonicalSummary"),
    "This atlas record is part of the VI Guide territory source. More verified notes can be added as the estate, dictionary, archive, and place records are reviewed."
  );
}

function getSummary(selection: SelectionLike) {
  return firstValue(
    selection.summary,
    prop(selection, "summary"),
    prop(selection, "canonicalSummary"),
    selection.description,
  );
}

function getHistory(selection: SelectionLike) {
  return firstValue(
    selection.historicalContext,
    prop(selection, "historicalContext"),
    selection.description,
    prop(selection, "description"),
    "Historical notes have not been fully reviewed for this record yet."
  );
}

function getModernContext(selection: SelectionLike) {
  return firstValue(
    selection.modernContext,
    prop(selection, "modernContext"),
    "Modern context is being connected from atlas places, parcels, mobility routes, and nearby features."
  );
}

function getSourceNotes(selection: SelectionLike): string[] {
  const direct = selection.sourceNotes;
  const fromProps = prop(selection, "sourceNotes");

  if (Array.isArray(direct)) return direct.map(clean).filter(Boolean);
  if (Array.isArray(fromProps)) return fromProps.map(clean).filter(Boolean);

  return [];
}

function getSourceRefs(selection: SelectionLike): string[] {
  const direct = selection.sourceRefs;
  const fromProps = prop(selection, "sourceRefs");

  if (Array.isArray(direct)) return direct.map(clean).filter(Boolean);
  if (Array.isArray(fromProps)) return fromProps.map(clean).filter(Boolean);

  return [];
}

function getRelatedPlaces(selection: SelectionLike): string[] {
  const direct = selection.relatedFeatures;
  const fromProps = prop(selection, "relatedFeatures");

  if (Array.isArray(direct)) return direct.map(clean).filter(Boolean);
  if (Array.isArray(fromProps)) return fromProps.map(clean).filter(Boolean);

  return [];
}

function formatCoord(value: number | null) {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(5)
    : "—";
}

function copyGps(selection: SelectionLike) {
  const lat = getLat(selection);
  const lng = getLng(selection);

  if (lat === null || lng === null) return;

  navigator.clipboard?.writeText(`${lat}, ${lng}`).catch(() => {
    // Clipboard may be blocked in some mobile browser contexts.
  });
}

function shareSelection(selection: SelectionLike) {
  const title = titleOf(selection);
  const lat = getLat(selection);
  const lng = getLng(selection);
  const text =
    lat !== null && lng !== null
      ? `${title} — ${lat.toFixed(5)}, ${lng.toFixed(5)}`
      : title;

  if (navigator.share) {
    navigator.share({ title, text }).catch(() => {});
    return;
  }

  navigator.clipboard?.writeText(text).catch(() => {});
}

export function pointToSelection(point: {
  id?: string;
  title?: string;
  name?: string;
  label?: string;
  description?: string;
  type?: string;
  source?: string;
  island?: string;
  lat?: number;
  lng?: number;
  properties?: Record<string, unknown>;
}) {
  return hydrateAtlasSelection({
    id: point.id ?? point.title ?? point.name ?? "point",
    title: point.title || point.name || point.label || "Selected place",
    name: point.name || point.title || point.label || "Selected place",
    description: point.description,
    type: point.type || "place",
    source: point.source || "point-marker",
    island: point.island,
    lat: point.lat,
    lng: point.lng,
    coords:
      typeof point.lng === "number" && typeof point.lat === "number"
        ? [point.lng, point.lat]
        : undefined,
    isPoint: true,
    properties: point.properties ?? {},
  });
}

export default function AtlasInspector({
  selection,
  islandLabel = "U.S. Virgin Islands",
  onClose,
  onDirections,
  onAskAI,
  onAddStop,
  onSave,
  onOpenEstate,
  onOpenHistory,
  onOpenArchives,
}: Props) {
  const [activeTab, setActiveTab] = useState<InspectorTab>("overview");

  const hydrated = useMemo(
    () => (selection ? hydrateAtlasSelection(selection as any) : null),
    [selection],
  ) as SelectionLike | null;

  if (!hydrated) return null;

  const title = titleOf(hydrated);
  const lat = getLat(hydrated);
  const lng = getLng(hydrated);
  const relatedPlaces = getRelatedPlaces(hydrated);
  const sourceNotes = getSourceNotes(hydrated);
  const sourceRefs = getSourceRefs(hydrated);
  const confidence = clean(hydrated.sourceConfidence || prop(hydrated, "sourceConfidence")) || "medium";

  const metaRows = [
    ["Island", clean(hydrated.island) || islandLabel],
    ["Quarter", clean(hydrated.quarter || hydrated.quarterGroup || prop(hydrated, "quarter") || prop(hydrated, "quarterGroup")) || "—"],
    ["Estate", clean(hydrated.estate || prop(hydrated, "ESTATE") || prop(hydrated, "estate") || title) || "—"],
    ["Parcel", clean(hydrated.parcel || prop(hydrated, "parcel") || prop(hydrated, "parcelId") || prop(hydrated, "PARCEL_NO")) || "—"],
    ["Address", clean(hydrated.address || prop(hydrated, "address") || prop(hydrated, "ADDRESS") || prop(hydrated, "displayAddress")) || "—"],
    ["Source", sourceLabel(hydrated)],
  ];

  return (
    <aside className="absolute bottom-4 right-4 top-[150px] z-[850] flex w-[min(410px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#080d1f]/95 text-white shadow-2xl backdrop-blur-xl">
      <div className="relative h-40 shrink-0 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-[url('/images/beaches/magens-bay.jpg')] bg-cover bg-center opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080d1f] via-[#080d1f]/30 to-transparent" />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-white/15"
          aria-label="Close inspector"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="absolute bottom-4 left-5 rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.28em] text-emerald-200">
          {hydrated.type || "Atlas"}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5">
        <div className="pt-5">
          <h2 className="text-3xl font-black leading-tight">{title}</h2>

          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-white/60">
            <MapPin className="h-4 w-4" />
            <span>{islandLabel}</span>
            <span>•</span>
            <span>{sourceLabel(hydrated)}</span>
          </p>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => onDirections?.(hydrated)}
            className="rounded-2xl bg-white/10 p-3 text-xs font-black transition hover:bg-emerald-400 hover:text-slate-950"
          >
            <Compass className="mx-auto mb-2 h-5 w-5" />
            Route
          </button>

          <button
            type="button"
            onClick={() => onSave?.(hydrated)}
            className="rounded-2xl bg-white/10 p-3 text-xs font-black transition hover:bg-emerald-400 hover:text-slate-950"
          >
            <Bookmark className="mx-auto mb-2 h-5 w-5" />
            Save
          </button>

          <button
            type="button"
            onClick={() => shareSelection(hydrated)}
            className="rounded-2xl bg-white/10 p-3 text-xs font-black transition hover:bg-emerald-400 hover:text-slate-950"
          >
            <Share2 className="mx-auto mb-2 h-5 w-5" />
            Share
          </button>

          <button
            type="button"
            onClick={() => onAskAI?.(hydrated)}
            className="rounded-2xl bg-white/10 p-3 text-xs font-black transition hover:bg-emerald-400 hover:text-slate-950"
          >
            <MessageCircle className="mx-auto mb-2 h-5 w-5" />
            AI
          </button>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto">
          {[
            ["overview", "Overview"],
            ["history", "History"],
            ["archives", "Archives"],
            ["dictionary", "Dictionary"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id as InspectorTab)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition ${
                activeTab === id
                  ? "bg-emerald-400 text-slate-950"
                  : "bg-white/10 text-white hover:bg-white/15"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <section className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-black">
              <Info className="h-4 w-4 text-emerald-300" />
              Overview
            </div>

            <p className="text-sm font-medium leading-7 text-white/72">
              {getDescription(hydrated)}
            </p>

            {getModernContext(hydrated) ? (
              <div className="mt-4 rounded-2xl bg-black/20 p-3">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-white/40">
                  Modern context
                </p>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  {getModernContext(hydrated)}
                </p>
              </div>
            ) : null}

            <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-2xl border border-white/10 text-sm">
              <div className="border-b border-r border-white/10 p-3">
                <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-white/40">
                  Latitude
                </p>
                <p className="mt-1 font-black">{formatCoord(lat)}</p>
              </div>
              <div className="border-b border-white/10 p-3">
                <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-white/40">
                  Longitude
                </p>
                <p className="mt-1 font-black">{formatCoord(lng)}</p>
              </div>
              <div className="border-r border-white/10 p-3">
                <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-white/40">
                  ID
                </p>
                <p className="mt-1 font-black">{clean(hydrated.geoid || hydrated.id) || "—"}</p>
              </div>
              <div className="p-3">
                <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-white/40">
                  Type
                </p>
                <p className="mt-1 font-black">{hydrated.type || "place"}</p>
              </div>
            </div>

            <div className="mt-4 divide-y divide-white/10 rounded-2xl border border-white/10">
              {metaRows.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                  <span className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-white/35">
                    {label}
                  </span>
                  <span className="text-right font-black text-white/80">{value}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "history" && (
          <section className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-black">
              <History className="h-4 w-4 text-emerald-300" />
              History
            </div>

            <p className="text-sm font-medium leading-7 text-white/72">
              {getHistory(hydrated)}
            </p>

            <button
              type="button"
              onClick={() => onOpenHistory?.(hydrated)}
              className="mt-4 w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
            >
              Open History Page
            </button>
          </section>
        )}

        {activeTab === "archives" && (
          <section className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-black">
              <Archive className="h-4 w-4 text-emerald-300" />
              Archives & Sources
            </div>

            <p className="text-sm leading-6 text-white/70">
              Source confidence: <span className="font-black text-emerald-200">{confidence}</span>
            </p>

            {sourceNotes.length ? (
              <div className="mt-4 space-y-2">
                {sourceNotes.map((note, index) => (
                  <div key={`${note}-${index}`} className="rounded-2xl bg-black/20 p-3 text-sm leading-6 text-white/70">
                    {note}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-white/60">
                No detailed archive notes are attached yet.
              </p>
            )}

            {sourceRefs.length ? (
              <div className="mt-4">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">
                  Source refs
                </p>
                <div className="mt-2 space-y-2">
                  {sourceRefs.map((ref, index) => (
                    <div key={`${ref}-${index}`} className="rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-white/65">
                      {ref}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => onOpenArchives?.(hydrated)}
              className="mt-4 w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
            >
              Open Archives
            </button>
          </section>
        )}

        {activeTab === "dictionary" && (
          <section className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-black">
              <Sparkles className="h-4 w-4 text-emerald-300" />
              Dictionary Links
            </div>

            {relatedPlaces.length ? (
              <div className="space-y-3">
                {relatedPlaces.map((place) => (
                  <div key={place} className="rounded-2xl bg-white/5 p-3">
                    <p className="font-black">{place}</p>
                    <p className="mt-1 text-xs font-semibold text-white/45">
                      Linked atlas knowledge place
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-6 text-white/60">
                No related dictionary entries have been attached to this record yet.
              </p>
            )}
          </section>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onOpenEstate?.(hydrated)}
            className="rounded-2xl bg-emerald-400 px-3 py-3 text-xs font-black text-slate-950 transition hover:bg-emerald-300"
          >
            Full Card
          </button>

          <button
            type="button"
            onClick={() => onOpenHistory?.(hydrated)}
            className="rounded-2xl bg-white/10 px-3 py-3 text-xs font-black transition hover:bg-white/15"
          >
            History
          </button>

          <button
            type="button"
            onClick={() => onOpenArchives?.(hydrated)}
            className="rounded-2xl bg-white/10 px-3 py-3 text-xs font-black transition hover:bg-white/15"
          >
            Archives
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onAddStop?.(hydrated)}
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black transition hover:bg-white/15"
          >
            <Plus className="h-4 w-4" />
            Add Stop
          </button>

          <button
            type="button"
            onClick={() => copyGps(hydrated)}
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black transition hover:bg-white/15"
          >
            <Copy className="h-4 w-4" />
            Copy GPS
          </button>
        </div>

        <button
          type="button"
          onClick={() => onDirections?.(hydrated)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm font-black text-emerald-100 transition hover:bg-emerald-400 hover:text-slate-950"
        >
          <ExternalLink className="h-4 w-4" />
          Open Directions
        </button>
      </div>
    </aside>
  );
}
