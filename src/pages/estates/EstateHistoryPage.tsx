// src/pages/estates/EstateHistoryPage.tsx
import { useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Archive,
  Compass,
  History,
  MapPinned,
  Route,
  type LucideIcon,
} from "lucide-react";

import { estates } from "../../data/estates";
import { estateHistories } from "../../data/estateHistories";
import { geographicIndexItems, type GeographicIndexItem } from "../../data/core/geographicIndex";
import { EstateExplorerMap } from "../../features/estates/components/estate-explorer-map";
import type { IslandCode } from "../../types";
import type { GeographyIslandCode } from "../../features/geography/types";

type EstateLike = (typeof estates)[number];
type EstateMapIsland = IslandCode | GeographyIslandCode | "all";
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

function getLoose(value: unknown, key: string): unknown {
  return (value as LooseRecord | null)?.[key];
}

function safeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
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

function toEstateMapIsland(
  value: string | null | undefined,
  fallback: string,
): EstateMapIsland {
  const candidate = value || fallback;

  if (
    candidate === "st_thomas" ||
    candidate === "st_john" ||
    candidate === "st_croix" ||
    candidate === "water_island" ||
    candidate === "stt" ||
    candidate === "stj" ||
    candidate === "stx" ||
    candidate === "wat" ||
    candidate === "unk" ||
    candidate === "all"
  ) {
    return candidate;
  }

  return "all";
}

function islandName(value: unknown): string {
  const key = String(value ?? "").toLowerCase();

  if (key === "stt" || key === "st_thomas") return "St. Thomas";
  if (key === "stj" || key === "st_john") return "St. John";
  if (key === "stx" || key === "st_croix") return "St. Croix";
  if (key === "wat" || key === "water_island") return "Water Island";

  return "U.S. Virgin Islands";
}

function getLat(estate: EstateLike): number | null {
  return (
    safeNumber(getLoose(getLoose(estate, "centroid"), "lat")) ??
    safeNumber(getLoose(getLoose(estate, "coordinates"), "lat")) ??
    safeNumber((getLoose(estate, "bbox") as unknown[] | undefined)?.[1])
  );
}

function getLng(estate: EstateLike): number | null {
  return (
    safeNumber(getLoose(getLoose(estate, "centroid"), "lng")) ??
    safeNumber(getLoose(getLoose(estate, "coordinates"), "lng")) ??
    safeNumber((getLoose(estate, "bbox") as unknown[] | undefined)?.[0])
  );
}

export default function EstateHistoryPage() {
  const { geoid = "" } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const estate = useMemo(() => findEstateByParam(geoid), [geoid]);

  if (!estate) {
    return (
      <main className="min-h-screen bg-stone-50 p-6 text-stone-950">
        <h1 className="text-3xl font-black">Estate not found</h1>

        <p className="mt-3 rounded-2xl bg-white p-4 text-sm text-stone-600 shadow">
          Requested estate: <span className="font-black text-stone-950">{decodeURIComponent(geoid || "missing")}</span>
        </p>

        <button
          type="button"
          onClick={() => navigate("/map")}
          className="mt-4 rounded-2xl bg-stone-950 px-5 py-3 font-bold text-white"
        >
          Back to Map
        </button>
      </main>
    );
  }

  const estateId = String(
    getLoose(estate, "geoid") ||
      getLoose(estate, "estateId") ||
      getLoose(estate, "id") ||
      normalize(getLoose(estate, "name")),
  );

  const history = estateHistories.find((item) =>
    [item.geoid, item.sourceName, item.name].some((value) =>
      isLooseMatch(value, estateId) || isLooseMatch(value, getLoose(estate, "name")),
    ),
  );

  const title = clean(getLoose(estate, "name")) || "Unnamed Estate";
  const island = String(getLoose(estate, "island") || getLoose(estate, "islandCode") || "st_thomas");
  const selectedIsland = toEstateMapIsland(params.get("island") || island, island);
  const islandLabel = islandName(island);
  const quarter = clean(getLoose(estate, "quarter")) || clean(getLoose(estate, "quarterGroup")) || "Unknown Quarter";

  const lat = getLat(estate);
  const lng = getLng(estate);
  const hasCoords = lat !== null && lng !== null;
  const encodedTitle = encodeURIComponent(title);
  const encodedId = encodeURIComponent(estateId);

  const summary =
    history?.summary ||
    `${title} is part of the historic estate geography of the U.S. Virgin Islands. Historical records for this estate are still being expanded from maps, census records, plantation documents, Danish archives, and local historical sources.`;

  return (
    <main className="min-h-screen bg-stone-50 px-5 py-6 pb-32 text-stone-950">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-5 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black shadow"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <section className="rounded-[2rem] bg-stone-950 p-6 text-white shadow-2xl">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-300">
          Estate History
        </p>

        <h1 className="mt-3 text-5xl font-black leading-tight">{title}</h1>

        <p className="mt-3 text-sm font-bold text-stone-300">
          {quarter} · {islandLabel}
        </p>
      </section>

      <section className="mt-5 overflow-hidden rounded-[2rem] bg-white shadow-xl">
        <div className="p-5">
          <h2 className="text-2xl font-black">Estate Location</h2>
          <p className="mt-2 text-sm text-stone-600">
            Explore the estate boundary and surrounding area.
          </p>
        </div>

        <EstateExplorerMap
          selectedIsland={selectedIsland}
          selectedEstateGeoid={estateId}
        />
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3">
        <FactCard label="Island" value={islandLabel} />
        <FactCard label="Quarter" value={quarter} />
        <FactCard label="Estate ID" value={estateId} />
        <FactCard
          label="Coordinates"
          value={hasCoords ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : "Not available"}
        />
      </section>

      <section className="mt-5 rounded-[2rem] bg-white p-5 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-800">
            <History className="h-6 w-6" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-black">Historical Profile</h2>

            <p className="mt-3 text-sm leading-relaxed text-stone-600">
              {summary}
            </p>

            {history?.source ? (
              <div className="mt-4 rounded-2xl bg-emerald-50 p-3">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                  Source
                </p>

                <p className="mt-1 text-sm font-bold text-stone-700">
                  {history.source}
                </p>

                {history.sourceName ? (
                  <p className="mt-1 text-xs text-stone-500">
                    Matched entry: {history.sourceName}
                  </p>
                ) : null}

                {typeof history.confidence === "number" && history.confidence > 0 ? (
                  <p className="mt-1 text-xs text-stone-500">
                    Match confidence: {history.confidence}
                  </p>
                ) : null}

                <p
                  className={`mt-3 inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                    history.verified
                      ? "bg-emerald-100 text-emerald-900"
                      : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {history.publicLabel || (history.verified ? "Verified" : "Needs review")}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-5 grid gap-3 text-sm">
          <Info label="Estate" value={title} />
          <Info label="Quarter" value={quarter} />
          <Info label="Island" value={islandLabel} />
          <Info label="Estate ID" value={estateId} />
        </div>
      </section>

      <section className="mt-5 rounded-[2rem] bg-white p-5 shadow-xl">
        <h2 className="text-2xl font-black">Why this estate matters</h2>

        <div className="mt-4 grid gap-3">
          <StoryCard
            icon={Compass}
            title="Geography"
            text={`${title} belongs to ${quarter} on ${islandLabel}. Estate boundaries help explain older roads, neighborhoods, place names, and local movement patterns.`}
          />

          <StoryCard
            icon={Archive}
            title="Archive pathway"
            text="The archive gallery can connect this estate to maps, census records, plantation-era documents, historic photographs, and Danish West Indies records as the database grows."
          />

          <StoryCard
            icon={MapPinned}
            title="Modern use"
            text="Visitors can use this estate record to plan routes, understand nearby landmarks, explore historical context, and connect map geography with real island experience."
          />
        </div>
      </section>

      <section className="mt-5 rounded-[2rem] bg-white p-5 shadow-xl">
        <h2 className="text-2xl font-black">What to explore next</h2>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() =>
              navigate(
                `/history/knowledge?estate=${encodedId}&island=${selectedIsland}&context=${encodedTitle}`,
              )
            }
            className="rounded-2xl bg-amber-100 p-4 text-xs font-black uppercase tracking-[0.16em] text-amber-950"
          >
            <Archive className="mx-auto mb-2 h-5 w-5" />
            Archives
          </button>

          <button
            type="button"
            onClick={() =>
              navigate(
                `/mobility?island=${selectedIsland}&destination=${encodedTitle}${
                  hasCoords ? `&lat=${lat}&lng=${lng}` : ""
                }`,
              )
            }
            className="rounded-2xl bg-emerald-100 p-4 text-xs font-black uppercase tracking-[0.16em] text-emerald-950"
          >
            <Route className="mx-auto mb-2 h-5 w-5" />
            Plan Ride
          </button>
        </div>

        {hasCoords ? (
          <button
            type="button"
            onClick={() =>
              window.open(
                `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
                "_blank",
                "noopener,noreferrer",
              )
            }
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-100 px-4 py-4 text-xs font-black uppercase tracking-[0.16em] text-sky-950"
          >
            <MapPinned className="h-4 w-4" />
            Open Directions
          </button>
        ) : null}
      </section>
    </main>
  );
}

function FactCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] bg-white p-4 shadow-xl">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-black text-stone-900">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-stone-50 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
        {label}
      </p>
      <p className="mt-1 break-words font-bold text-stone-800">{value}</p>
    </div>
  );
}

function StoryCard({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl bg-stone-50 p-4">
      <Icon className="h-5 w-5 text-emerald-700" />
      <h3 className="mt-3 text-base font-black">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">{text}</p>
    </div>
  );
}