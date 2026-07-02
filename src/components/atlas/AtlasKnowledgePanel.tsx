import { useMemo, useState } from "react";
import {
  Archive,
  BookOpen,
  Building2,
  Clock,
  Compass,
  History,
  Landmark,
  MapPin,
  MessageCircle,
  Navigation,
  Sparkles,
  Waves,
} from "lucide-react";

import type { AtlasSelection } from "../maps/IslandMap";
import type { GeographicIndexItem } from "../../data/core/geographicIndex";
import { buildAtlasKnowledge } from "../../lib/atlas/atlasKnowledgeEngine";

type Props = {
  selection: AtlasSelection;
  islandLabel: string;
  onAskAI: (selection: AtlasSelection) => void;
  onOpenEstate?: (selection: AtlasSelection) => void;
  onOpenHistory?: (selection: AtlasSelection) => void;
  onOpenArchives?: (selection: AtlasSelection) => void;
};

type TabId = "overview" | "history" | "archives" | "dictionary" | "nearby" | "ai";

const tabs: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "history", label: "History" },
  { id: "archives", label: "Archives" },
  { id: "dictionary", label: "Dictionary" },
  { id: "nearby", label: "Nearby" },
  { id: "ai", label: "AI" },
];

function clean(value: unknown): string {
  return String(value ?? "")
    .replace(/^Estate\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sourceLabel(selection: AtlasSelection) {
  if (selection.source === "estate-layer") return "Estate Layer";
  if (selection.source === "parcel-layer") return "Parcel Layer";
  return "Map Point";
}

function getOverview(selection: AtlasSelection, description?: string) {
  if (description?.trim()) return description;
  if (selection.description?.trim()) return selection.description;

  if (selection.type === "estate") {
    return "Estate boundary connected to the VI Guide Atlas. This location can connect to parcels, history records, dictionary entries, nearby places, routes, and AI context.";
  }

  if (selection.type === "parcel") {
    return "Parcel record connected to the VI Guide Atlas. This parcel can connect to estate context, address data, nearby places, and public geographic layers.";
  }

  return "Selected Atlas location connected to VI Guide geographic intelligence.";
}

export default function AtlasKnowledgePanel({
  selection,
  islandLabel,
  onAskAI,
  onOpenEstate,
  onOpenHistory,
  onOpenArchives,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const knowledge = useMemo(() => buildAtlasKnowledge(selection), [selection]);

  const estateKnowledge = knowledge.estateKnowledge;
  const historyRecords = knowledge.historyRecords;
  const dictionaryMatches = knowledge.dictionaryMatches;
  const nearbyItems = knowledge.nearbyItems;
  const relatedArchives = knowledge.relatedArchives;
  const relatedPlaces = knowledge.relatedPlaces;
  const relatedHistoricSites = knowledge.relatedHistoricSites;
  const aiContext = knowledge.aiContext;

  return (
    <section className="mt-5">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 rounded-2xl px-3 py-2 text-[11px] font-black transition ${
              activeTab === tab.id
                ? "bg-emerald-400 text-slate-950"
                : "bg-white/10 text-white hover:bg-white/15"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-3 rounded-3xl border border-white/10 bg-white/[0.035] p-4">
        {activeTab === "overview" && (
          <div>
            <SectionTitle icon={<Compass className="h-4 w-4" />} title="Overview" />

            <p className="mt-3 text-sm leading-relaxed text-white/65">
              {getOverview(selection, estateKnowledge?.description)}
            </p>

            {estateKnowledge?.historicSummary ? (
              <p className="mt-3 text-sm leading-relaxed text-white/50">
                {estateKnowledge.historicSummary}
              </p>
            ) : null}

            <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-2xl border border-white/10">
              <MiniStat value={selection.lat.toFixed(5)} label="Latitude" />
              <MiniStat value={selection.lng.toFixed(5)} label="Longitude" />
              <MiniStat value={knowledge.estateId} label="ID" />
              <MiniStat value={selection.type} label="Type" />
            </div>

            <div className="mt-4 space-y-2">
              <InfoRow label="Island" value={selection.island || islandLabel} />
              <InfoRow label="Quarter" value={knowledge.quarter || "—"} />
              <InfoRow label="Estate" value={knowledge.estateName || selection.title} />
              <InfoRow label="Parcel" value={knowledge.parcelId || "—"} />
              <InfoRow label="Address" value={knowledge.address || "—"} />
              <InfoRow label="Source" value={sourceLabel(selection)} />
            </div>

            {relatedPlaces.length > 0 ? (
              <div className="mt-4">
                <SmallHeading title="Related Places" />
                {relatedPlaces.slice(0, 4).map((place, index) => (
                  <ArchiveItem
                    key={`${String(place)}-${index}`}
                    title={String(place)}
                    subtitle="Linked estate knowledge place"
                  />
                ))}
              </div>
            ) : null}
          </div>
        )}

        {activeTab === "history" && (
          <div>
            <SectionTitle icon={<History className="h-4 w-4" />} title="History" />

            {historyRecords.length > 0 ? (
              <div className="mt-3 space-y-3">
                {historyRecords.map((record) => (
                  <TimelineItem
                    key={record.id}
                    label={record.dateRange || record.type || "History Record"}
                    text={`${record.title}: ${record.summary}`}
                  />
                ))}
              </div>
            ) : (
              <>
                <TimelineItem
                  label="Estate context"
                  text={`Connect ${selection.title} to estate knowledge, historic timelines, Danish records, ownership history, and related places.`}
                />
                <TimelineItem
                  label="Historic graph"
                  text="No direct history graph records were found yet. Future archive records will surface here automatically."
                />
              </>
            )}

            {selection.type === "estate" ? (
              <button
                type="button"
                onClick={() => onOpenHistory?.(selection)}
                className="mt-4 w-full rounded-2xl bg-white/10 px-4 py-3 text-sm font-black transition hover:bg-white/15"
              >
                Open Full History
              </button>
            ) : null}
          </div>
        )}

        {activeTab === "archives" && (
          <div>
            <SectionTitle icon={<Archive className="h-4 w-4" />} title="Archives" />

            {relatedArchives.length > 0 ? (
              relatedArchives.slice(0, 6).map((archive, index) => (
                <ArchiveItem
                  key={`${String(archive)}-${index}`}
                  title={String(archive)}
                  subtitle="Related estate archive reference"
                />
              ))
            ) : (
              <>
                <ArchiveItem
                  title="Danish archive references"
                  subtitle="Estate records, maps, letters, and colonial documents."
                />
                <ArchiveItem
                  title="NARA / RG records"
                  subtitle="Public archival records can attach here."
                />
                <ArchiveItem
                  title="Images and maps"
                  subtitle="Historic maps, scanned documents, and image evidence."
                />
              </>
            )}

            {selection.type === "estate" ? (
              <button
                type="button"
                onClick={() => onOpenArchives?.(selection)}
                className="mt-4 w-full rounded-2xl bg-white/10 px-4 py-3 text-sm font-black transition hover:bg-white/15"
              >
                Open Archives
              </button>
            ) : null}
          </div>
        )}

        {activeTab === "dictionary" && (
          <div>
            <SectionTitle icon={<BookOpen className="h-4 w-4" />} title="Dictionary" />

            <InfoRow label="Entry" value={knowledge.cleanName} />
            <InfoRow label="Island" value={selection.island || islandLabel} />
            <InfoRow label="Quarter" value={knowledge.quarter || "—"} />

            {dictionaryMatches.length > 0 ? (
              <div className="mt-4 space-y-3">
                {dictionaryMatches.map((item) => (
                  <ArchiveItem
                    key={item.id}
                    title={item.displayName || item.name}
                    subtitle={
                      item.description ||
                      item.source ||
                      item.type ||
                      "Geographic index match"
                    }
                  />
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-white/60">
                No dictionary matches found yet for this selected Atlas entity.
              </p>
            )}
          </div>
        )}

        {activeTab === "nearby" && (
          <div>
            <SectionTitle icon={<Navigation className="h-4 w-4" />} title="Nearby" />

            {relatedHistoricSites.length > 0 ? (
              <div className="mb-3">
                <SmallHeading title="Related Historic Sites" />
                {relatedHistoricSites.slice(0, 3).map((site, index) => (
                  <NearbyItem
                    key={`${String(site)}-${index}`}
                    icon={<Landmark className="h-4 w-4" />}
                    title={String(site)}
                    subtitle="Estate knowledge relationship"
                  />
                ))}
              </div>
            ) : null}

            {nearbyItems.length > 0 ? (
              nearbyItems.map(({ item, km }) => (
                <NearbyItem
                  key={item.id}
                  icon={iconForItem(item)}
                  title={item.displayName || item.name}
                  subtitle={`${item.type || item.category || item.source || "Atlas item"} • ${km.toFixed(2)} km away`}
                />
              ))
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-white/60">
                No nearby indexed places found within 3 km.
              </p>
            )}
          </div>
        )}

        {activeTab === "ai" && (
          <div>
            <SectionTitle icon={<Sparkles className="h-4 w-4" />} title="AI Context" />

            <p className="mt-3 text-sm leading-relaxed text-white/65">
              Ask VI Guide about {selection.title}, nearby places, routes, historic records,
              dictionary entries, parcels, businesses, and trip planning.
            </p>

            <div className="mt-4 rounded-2xl bg-white/5 p-3">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-200">
                Loaded Context
              </p>
              <p className="mt-2 text-xs leading-relaxed text-white/55">
                Estate: {aiContext.estateName || selection.title}
                <br />
                Quarter: {aiContext.quarter || "—"}
                <br />
                History records: {aiContext.historyCount}
                <br />
                Dictionary matches: {aiContext.dictionaryCount}
                <br />
                Nearby indexed places: {aiContext.nearbyCount}
                <br />
                Archive references: {aiContext.archiveCount}
              </p>
            </div>

            <div className="mt-4 grid gap-2">
              <PromptButton label="Explain this place" onClick={() => onAskAI(selection)} />
              <PromptButton label="Show nearby history" onClick={() => onAskAI(selection)} />
              <PromptButton label="Build a route" onClick={() => onAskAI(selection)} />
            </div>

            <button
              type="button"
              onClick={() => onAskAI(selection)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
            >
              <MessageCircle className="h-4 w-4" />
              Ask AI
            </button>
          </div>
        )}
      </div>

      {selection.type === "estate" ? (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onOpenEstate?.(selection)}
            className="rounded-2xl bg-emerald-400 px-3 py-3 text-xs font-black text-slate-950"
          >
            Full Card
          </button>

          <button
            type="button"
            onClick={() => onOpenHistory?.(selection)}
            className="rounded-2xl bg-white/10 px-3 py-3 text-xs font-black text-white transition hover:bg-white/15"
          >
            History
          </button>

          <button
            type="button"
            onClick={() => onOpenArchives?.(selection)}
            className="rounded-2xl bg-white/10 px-3 py-3 text-xs font-black text-white transition hover:bg-white/15"
          >
            Archives
          </button>
        </div>
      ) : null}
    </section>
  );
}

function iconForItem(item: GeographicIndexItem) {
  const text = `${item.type || ""} ${item.category || ""} ${item.source || ""}`.toLowerCase();

  if (text.includes("beach") || text.includes("bay")) {
    return <Waves className="h-4 w-4" />;
  }

  if (text.includes("business") || text.includes("restaurant") || text.includes("food")) {
    return <Building2 className="h-4 w-4" />;
  }

  if (text.includes("historic") || text.includes("history")) {
    return <Landmark className="h-4 w-4" />;
  }

  return <MapPin className="h-4 w-4" />;
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-black text-white">
      <span className="text-emerald-300">{icon}</span>
      {title}
    </div>
  );
}

function SmallHeading({ title }: { title: string }) {
  return (
    <p className="mb-2 mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
      {title}
    </p>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-b border-r border-white/10 p-3">
      <p className="truncate text-sm font-black">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
        {label}
      </p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-white/5 pb-2 last:border-b-0 last:pb-0">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/35">
        {label}
      </p>
      <p className="max-w-[190px] text-right text-xs font-bold text-white/75">
        {value}
      </p>
    </div>
  );
}

function TimelineItem({ label, text }: { label: string; text: string }) {
  return (
    <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/60 p-3">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-200">
        <Clock className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-white/60">{text}</p>
    </div>
  );
}

function ArchiveItem({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mt-3 rounded-2xl bg-white/5 p-3">
      <p className="text-sm font-black text-white">{title}</p>
      <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-white/45">
        {subtitle}
      </p>
    </div>
  );
}

function NearbyItem({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white/5 p-3">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-emerald-200">
        {icon}
      </div>
      <div>
        <p className="text-sm font-black text-white">{title}</p>
        <p className="text-xs text-white/45">{subtitle}</p>
      </div>
    </div>
  );
}

function PromptButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl bg-white/10 px-4 py-3 text-left text-sm font-bold text-white/80 transition hover:bg-white/15"
    >
      {label}
    </button>
  );
}