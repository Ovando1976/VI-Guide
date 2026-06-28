// src/pages/estates/EstateDetailPage.tsx
import { useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Archive,
  ChevronLeft,
  History,
  MapPinned,
  MessageCircle,
  Route,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { estates } from "../../data/estates";
import {
  geographicIndexItems,
  type GeographicIndexItem,
} from "../../data/core/geographicIndex";
import { getEstateCoordinatesByGeoid } from "../../data/estateCoordinateLinks";
import { getEstateKnowledgeForEstate } from "../../data/estateKnowledgeLookup";
import { EstateIntelligenceTabs } from "../../components/estates/EstateIntelligenceTabs";
import { buildEstateNarrative } from "../../lib/estates/estateNarrative";
import IslandMap from "../../components/maps/IslandMap";
import { getHistoryForEstate } from "../../data/history/historyLinks";

type EstateLike = (typeof estates)[number];
type LooseRecord = Record<string, unknown>;

function clean(value: unknown): string {
  return String(value ?? "")
    .replace(/^Estate\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(value: unknown): string {
  return clean(value)
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function compactId(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function safeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getLoose(value: unknown, key: string): unknown {
  return (value as LooseRecord | null)?.[key];
}

function islandLabel(value: unknown): string {
  const key = String(value ?? "").toLowerCase();

  if (key === "stt" || key === "st_thomas") return "St. Thomas";
  if (key === "stj" || key === "st_john") return "St. John";
  if (key === "stx" || key === "st_croix") return "St. Croix";
  if (key === "wat" || key === "water_island") return "Water Island";

  return "U.S. Virgin Islands";
}

function getDescription(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getEstateCandidates(estate: EstateLike): unknown[] {
  return [
    getLoose(estate, "id"),
    getLoose(estate, "estateId"),
    getLoose(estate, "geoid"),
    getLoose(estate, "name"),
    getLoose(estate, "normalizedName"),
    getLoose(estate, "quarter"),
    getLoose(estate, "quarterGroup"),
    ...(Array.isArray(getLoose(estate, "aliases"))
      ? (getLoose(estate, "aliases") as unknown[])
      : []),
  ];
}

function getIndexCandidates(item: GeographicIndexItem): unknown[] {
  return [
    getLoose(item, "id"),
    getLoose(item, "estateId"),
    getLoose(item, "geoid"),
    getLoose(item, "name"),
    getLoose(item, "estateName"),
    getLoose(item, "searchText"),
    getLoose(item, "quarter"),
    getLoose(item, "quarterGroup"),
  ];
}

function isLooseMatch(a: unknown, b: unknown): boolean {
  const an = normalize(a);
  const bn = normalize(b);
  const ac = compactId(a);
  const bc = compactId(b);

  if (!an || !bn || !ac || !bc) return false;

  return (
    an === bn ||
    ac === bc ||
    an.includes(bn) ||
    bn.includes(an) ||
    ac.includes(bc) ||
    bc.includes(ac)
  );
}

function findEstateFromIndex(rawParam: string): EstateLike | undefined {
  const indexMatch = geographicIndexItems.find((item) => {
    if (getLoose(item, "source") !== "estate") return false;

    return getIndexCandidates(item).some((value) =>
      isLooseMatch(value, rawParam),
    );
  });

  if (!indexMatch) return undefined;

  return estates.find((estate) =>
    getEstateCandidates(estate).some((estateValue) =>
      getIndexCandidates(indexMatch).some((indexValue) =>
        isLooseMatch(estateValue, indexValue),
      ),
    ),
  );
}

function findEstateByParam(rawParam: string): EstateLike | undefined {
  const decoded = decodeURIComponent(rawParam);

  const directMatch = estates.find((estate) =>
    getEstateCandidates(estate).some((value) => isLooseMatch(value, decoded)),
  );

  return directMatch ?? findEstateFromIndex(decoded);
}

function getEstateLat(estate: EstateLike): number | null {
  return (
    safeNumber(getLoose(getLoose(estate, "centroid"), "lat")) ??
    safeNumber(getLoose(getLoose(estate, "coordinates"), "lat")) ??
    safeNumber((getLoose(estate, "bbox") as unknown[] | undefined)?.[1])
  );
}

function getEstateLng(estate: EstateLike): number | null {
  return (
    safeNumber(getLoose(getLoose(estate, "centroid"), "lng")) ??
    safeNumber(getLoose(getLoose(estate, "coordinates"), "lng")) ??
    safeNumber((getLoose(estate, "bbox") as unknown[] | undefined)?.[0])
  );
}

export default function EstateDetailPage() {
  const { geoid = "" } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const estate = useMemo(() => findEstateByParam(geoid), [geoid]);

  if (!estate) {
    return (
      <main className="min-h-screen bg-[#020617] p-6 text-white">
        <button
          type="button"
          onClick={() => navigate("/map")}
          className="mb-6 flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Map
        </button>

        <section className="rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
          <h1 className="text-3xl font-black">Estate not found</h1>
          <p className="mt-3 text-sm text-white/60">
            This estate could not be matched by ID, name, alias, GEOID, or
            geographic index.
          </p>

          <p className="mt-4 rounded-2xl bg-black/30 p-4 text-xs text-white/50">
            Requested estate:{" "}
            <span className="font-bold text-white">{geoid || "missing"}</span>
          </p>
        </section>
      </main>
    );
  }

  const island =
    params.get("island") ||
    String(getLoose(estate, "island") || getLoose(estate, "islandCode") || "st_thomas");

  const title = clean(getLoose(estate, "name")) || "Unnamed Estate";
  const quarter =
    clean(getLoose(estate, "quarter")) ||
    clean(getLoose(estate, "quarterGroup")) ||
    "Unknown Quarter";

  const lat = getEstateLat(estate);
  const lng = getEstateLng(estate);
  const hasCoords = lat !== null && lng !== null;

  const estateId = String(
    getLoose(estate, "geoid") ||
      getLoose(estate, "estateId") ||
      getLoose(estate, "id") ||
      normalize(title),
  );

  const encodedTitle = encodeURIComponent(title);
  const encodedId = encodeURIComponent(estateId);

  const dictionaryCoords = getEstateCoordinatesByGeoid(
    String(getLoose(estate, "geoid") ?? estateId),
  );

  const googleMapsUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : "";

  const narrative = buildEstateNarrative({
    name: title,
    island: String(getLoose(estate, "island") || island),
    quarter,
    description: getDescription(getLoose(estate, "description")),
  });

  const knowledge = getEstateKnowledgeForEstate({
    geoid: String(getLoose(estate, "geoid") ?? estateId),
    name: String(getLoose(estate, "name") ?? title),
  });

  const linkedHistoryRecords = getHistoryForEstate({
    name: title,
    geoid: estateId,
    estateId,
  }).slice(0, 6);

  const primaryDescription = knowledge?.description || narrative.summary;
  const primaryHistory = knowledge?.historicSummary || narrative.significance;

  const timeline = narrative.timeline.map((event) => ({
    year: event.year,
    event: `${event.title}: ${event.description}`,
  }));

  return (
    <main className="min-h-screen bg-[#020617] px-4 py-5 pb-[calc(140px+env(safe-area-inset-bottom))] text-white sm:px-6">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_5%,rgba(16,185,129,0.18),transparent_28%),radial-gradient(circle_at_85%_10%,rgba(56,189,248,0.14),transparent_28%),linear-gradient(to_bottom,#020617,#07111f_45%,#020617)]" />

      <div className="relative mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => navigate("/map")}
          className="mb-5 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white/80 shadow-xl backdrop-blur-xl"
        >
          <ChevronLeft className="h-4 w-4" />
          Map
        </button>

        <section className="overflow-hidden rounded-[2.25rem] border border-white/10 bg-white/[0.06] shadow-[0_24px_90px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          <div className="grid gap-0 lg:grid-cols-[1fr_480px]">
            <div className="p-6 sm:p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.42em] text-emerald-300">
                Estate Intelligence
              </p>

              <h1 className="mt-3 font-serif text-5xl font-black leading-none tracking-[-0.05em] text-white sm:text-6xl">
                Estate {title}
              </h1>

              <div className="mt-5 flex flex-wrap gap-2">
                <Pill label={quarter} />
                <Pill label={islandLabel(island)} />
                <Pill label={`ID ${estateId}`} />
              </div>

              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/70">
                {primaryDescription}
              </p>

              {primaryHistory ? (
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/52">
                  {primaryHistory}
                </p>
              ) : null}
            </div>

            <div className="border-t border-white/10 bg-[#020617]/55 p-4 lg:border-l lg:border-t-0">
              <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-stone-950 shadow-2xl">
                <div className="border-b border-white/10 bg-white/[0.04] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">
                    Boundary Map
                  </p>
                  <p className="mt-1 text-sm text-white/60">
                    Focused terrain view of Estate {title}.
                  </p>
                </div>

                <IslandMap
                  embedded
                  embeddedMapHeight="360px"
                  interactive
                  focusTarget={{
                    center: hasCoords ? [lng, lat] : [-64.86, 18.08],
                    zoom: hasCoords ? 14.6 : 10.5,
                    pitch: 62,
                    bearing: -14,
                  }}
                  highlightEstate={title}
                  showEstateBoundaries
                  showEstateLabels
                  showParcels={false}
                  showParcelLabels={false}
                  showControls
                />
              </div>
            </div>
          </div>
        </section>
        {linkedHistoryRecords.length > 0 ? (
  <section className="mt-5 rounded-[2rem] border border-white/10 bg-white p-5 text-stone-950 shadow-xl">
    <h2 className="text-2xl font-black">Linked History Records</h2>

    <div className="mt-4 grid gap-3">
      {linkedHistoryRecords.map((record) => (
        <div key={record.id} className="rounded-2xl bg-stone-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            {record.dateRange || record.type}
          </p>
          <h3 className="mt-2 text-sm font-black">{record.title}</h3>
          <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-stone-600">
            {record.summary}
          </p>
          <p className="mt-3 text-[11px] font-bold text-stone-400">
            {record.source.title} · {record.source.pages}
          </p>
        </div>
      ))}
    </div>
  </section>
) : null}

        <section className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Action
            label="History"
            icon={History}
            onClick={() =>
              navigate(
                `/estates/${encodedId}/history?island=${island}&context=${encodedTitle}`,
              )
            }
          />

          <Action
            label="Archives"
            icon={Archive}
            onClick={() =>
              navigate(
                `/history/knowledge?estate=${encodedId}&island=${island}&context=${encodedTitle}`,
              )
            }
          />

          <Action
            label="Ask AI"
            icon={MessageCircle}
            onClick={() =>
              navigate(`/concierge?island=${island}&context=${encodedTitle}`)
            }
          />

          <Action
            label="Plan Ride"
            icon={Route}
            onClick={() =>
              navigate(
                `/mobility?island=${island}&destination=${encodedTitle}${
                  hasCoords ? `&lat=${lat}&lng=${lng}` : ""
                }`,
              )
            }
          />
        </section>

        <section className="mt-5 rounded-[2rem] border border-white/10 bg-white p-5 text-stone-950 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-800">
              <Sparkles className="h-6 w-6" />
            </div>

            <div>
              <h2 className="text-2xl font-black">What this estate unlocks</h2>
              <p className="mt-3 text-sm leading-relaxed text-stone-600">
                Visitors can learn where this estate is, what quarter it belongs
                to, what historic records may exist, what civic places are
                connected, what nearby places are worth visiting, and how to get
                there.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard label="Island" value={islandLabel(island)} />
            <InfoCard label="Quarter" value={quarter} />
            <InfoCard label="Estate ID" value={estateId} />
            <InfoCard
              label="Coordinates"
              value={
                hasCoords ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : "Unavailable"
              }
            />
          </div>

          {hasCoords ? (
            <div className="mt-5 rounded-3xl bg-emerald-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">
                Navigation
              </p>
              <p className="mt-2 text-sm font-bold text-stone-700">
                {lat.toFixed(5)}, {lng.toFixed(5)}
              </p>
              <button
                type="button"
                onClick={() =>
                  window.open(googleMapsUrl, "_blank", "noopener,noreferrer")
                }
                className="mt-4 flex items-center gap-2 rounded-2xl bg-sky-100 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-sky-950"
              >
                <MapPinned className="h-4 w-4" />
                Open Directions
              </button>
            </div>
          ) : null}
        </section>

        <EstateIntelligenceTabs
          knowledge={knowledge}
          timeline={timeline}
          fallbackSummary={primaryDescription}
          fallbackHistory={primaryHistory}
        />

        {dictionaryCoords.length > 0 ? (
          <section className="mt-5 rounded-[2rem] border border-white/10 bg-white p-5 text-stone-950 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-800">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black">Dictionary Coordinates</h2>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  Coordinate entries extracted from the Geographic Dictionary
                  and linked to this estate.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {dictionaryCoords.map((coord) => {
                const coordUrl = `https://www.google.com/maps/search/?api=1&query=${coord.lat},${coord.lng}`;

                return (
                  <div
                    key={`${coord.entryId}-${coord.lat}-${coord.lng}`}
                    className="rounded-2xl bg-stone-50 p-4"
                  >
                    <p className="text-sm font-black">{coord.sourceName}</p>
                    <p className="mt-1 text-xs font-bold text-stone-500">
                      {coord.lat.toFixed(6)}, {coord.lng.toFixed(6)}
                    </p>
                    <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-stone-600">
                      {coord.description}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        window.open(coordUrl, "_blank", "noopener,noreferrer")
                      }
                      className="mt-4 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-stone-800 shadow"
                    >
                      <MapPinned className="h-4 w-4" />
                      Open Coordinate
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function Pill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-black text-white/80">
      {label}
    </span>
  );
}

function Action({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[2rem] border border-white/10 bg-white p-5 text-left text-stone-950 shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl"
    >
      <Icon className="h-6 w-6 text-emerald-700" />
      <p className="mt-4 text-sm font-black uppercase tracking-[0.16em]">
        {label}
      </p>
    </button>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-stone-50 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-black text-stone-800">
        {value}
      </p>
    </div>
  );
}