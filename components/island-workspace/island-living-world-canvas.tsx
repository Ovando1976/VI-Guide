"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Layers3,
  Loader2,
  MapPinned,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useUnifiedWorkspace } from "@/components/workspace/unified-workspace-controller";
import { queryTerritoryMapPlaces } from "@/lib/territory";
import type { IntelligenceIsland } from "@/types/intelligence";
import type {
  IslandWorkspaceProjection,
  IslandWorkspaceRecommendation,
} from "@/types/island-workspace";
import type {
  TerritoryMapLens,
  TerritoryMapPlace,
  TerritoryMapSelection,
} from "@/types/territory-map";
import type { EstateRecord, IslandCode } from "@/types/usvi";

const EstateMap = dynamic(
  () => import("@/components/estate-map").then((module) => module.EstateMap),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-[620px] place-items-center bg-[#0a2a31] text-cyan-100/55 md:h-[690px]">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.14em]">
          <Loader2 size={16} className="animate-spin" /> Loading Living Map
        </div>
      </div>
    ),
  },
);

const PUBLIC_LENSES = new Set<TerritoryMapLens>([
  "places",
  "beaches",
  "stays",
  "historic",
]);

const ISLANDS: Array<{ value: IntelligenceIsland; label: string; short: string }> = [
  { value: "stt", label: "St. Thomas", short: "STT" },
  { value: "stj", label: "St. John", short: "STJ" },
  { value: "stx", label: "St. Croix", short: "STX" },
];

const FALLBACK_IMAGE: Record<IntelligenceIsland, { src: string; alt: string }> = {
  stt: {
    src: "/images/usvi-harbor-hero.jpg",
    alt: "Charlotte Amalie harbor and the hills of St. Thomas",
  },
  stj: {
    src: "/images/places/st-john/trunk-bay-overlook-1.jpg",
    alt: "Trunk Bay overlook and St. John coastline",
  },
  stx: {
    src: "/images/places/st-croix/cane-bay-beach-1.jpg",
    alt: "Cane Bay coast on St. Croix",
  },
};

export function IslandLivingWorldCanvas({
  island,
  projection,
  onIslandChange,
}: {
  island: IntelligenceIsland;
  projection: IslandWorkspaceProjection | null;
  onIslandChange: (island: IntelligenceIsland) => void;
}) {
  const workspace = useUnifiedWorkspace();
  const [estates, setEstates] = useState<EstateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const [selectedEstateGeoid, setSelectedEstateGeoid] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = window.setTimeout(() => controller.abort(), 12_000);

    async function loadEstates() {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await fetch("/api/estates", {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to load island geography.");
        }
        const loaded = Array.isArray(payload?.estates)
          ? (payload.estates as EstateRecord[])
          : [];
        if (!loaded.length) throw new Error("No estate records were returned.");
        if (active) setEstates(loaded);
      } catch (error) {
        if (!active) return;
        setLoadError(
          controller.signal.aborted
            ? "Island geography took too long to load."
            : error instanceof Error
              ? error.message
              : "Failed to load island geography.",
        );
      } finally {
        window.clearTimeout(timeout);
        if (active) setLoading(false);
      }
    }

    void loadEstates();
    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [retryNonce]);

  const islandEstates = useMemo(
    () => estates.filter((estate) => estate.island === island),
    [estates, island],
  );
  const places = useMemo(
    () => queryTerritoryMapPlaces({ island: island as IslandCode }),
    [island],
  );
  const activeLens = toPublicLens(workspace.state.lens);
  const selectedPlace = workspace.state.selection;
  const focusedPlaceId = useMemo(
    () => resolveFocusedPlaceId(projection?.recommendations[0], places),
    [places, projection],
  );

  useEffect(() => {
    if (!projection) return;
    const nextLens = inferProjectionLens(projection);
    if (nextLens !== activeLens) workspace.setLens(nextLens);
  }, [activeLens, projection?.runId]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectPlace = useCallback(
    (selection: TerritoryMapSelection | null) => {
      workspace.selectPlace(selection);
    },
    [workspace],
  );

  return (
    <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[#062a35] shadow-[0_30px_90px_rgba(0,0,0,.28)]">
      <div className="grid gap-4 border-b border-white/8 bg-[#061d26] p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/15 bg-cyan-200/[.06] px-3 py-2 text-[9px] font-black uppercase tracking-[.15em] text-cyan-100/70">
              <Layers3 size={13} /> World Canvas · live geography
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/15 bg-emerald-200/[.05] px-3 py-2 text-[9px] font-black uppercase tracking-[.13em] text-emerald-100/65">
              <ShieldCheck size={12} /> Application-owned map truth
            </span>
          </div>
          <p className="mt-4 text-[9px] font-black uppercase tracking-[.17em] text-amber-200/60">
            {projection
              ? `${projection.intent.replaceAll("_", " ")} · ${projection.confidence} confidence · ${projection.presentation.focus} focus`
              : "Intent-first island computing"}
          </p>
          <h2 className="mt-1 max-w-4xl text-2xl font-black tracking-[-.035em] sm:text-3xl">
            {projection?.headline ??
              "The Living Map is now the operating surface for Island."}
          </h2>
          <p className="mt-2 max-w-3xl text-xs font-semibold leading-5 text-white/48 sm:text-sm sm:leading-6">
            {projection?.summary ??
              "Tap a place or estate to keep spatial context synchronized with Island. Recommendations can focus the map, but only canonical territory records provide coordinates and place data."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <div className="flex rounded-full border border-white/10 bg-black/15 p-1">
            {ISLANDS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onIslandChange(option.value)}
                aria-label={`Show ${option.label}`}
                className={`min-h-8 rounded-full px-3 text-[9px] font-black transition ${
                  island === option.value
                    ? "bg-cyan-200 text-[#04252e]"
                    : "text-white/42 hover:text-white/70"
                }`}
              >
                {option.short}
              </button>
            ))}
          </div>
          <Link
            href={`/map?island=${island}`}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[.05] px-3 text-[9px] font-black uppercase tracking-[.1em] text-white/60 hover:bg-white/[.09]"
          >
            <MapPinned size={13} className="text-cyan-200" /> Full Living Map
          </Link>
        </div>
      </div>

      <div className="island-context-map relative bg-[#0a2a31]">
        {loadError ? (
          <MapFailure
            island={island}
            message={loadError}
            onRetry={() => setRetryNonce((value) => value + 1)}
          />
        ) : (
          <>
            {loading ? (
              <div className="absolute inset-x-0 top-0 z-[1200] flex items-center justify-center gap-2 bg-[#03141b]/72 px-3 py-2 text-[9px] font-black uppercase tracking-[.13em] text-cyan-100/65 backdrop-blur">
                <Loader2 size={12} className="animate-spin" /> Synchronizing estate geography
              </div>
            ) : null}
            <EstateMap
              island={island as IslandCode}
              estates={islandEstates}
              places={places}
              activeLens={activeLens}
              focusedPlaceId={focusedPlaceId ?? selectedPlace?.id ?? null}
              selectedEstateGeoid={selectedEstateGeoid}
              fromGeoid={workspace.state.pickupGeoid ?? ""}
              toGeoid={workspace.state.destinationGeoid ?? ""}
              routeGeoJson={null}
              routeFocusNonce={0}
              onSelectEstate={(estate) => {
                setSelectedEstateGeoid(estate.geoid);
                workspace.selectPlace(null);
              }}
              onSelectPlace={selectPlace}
              onSelectFrom={() => undefined}
              onSelectTo={() => undefined}
              onChangeLens={(lens) => {
                if (PUBLIC_LENSES.has(lens)) workspace.setLens(lens);
              }}
            />
          </>
        )}
      </div>

      <style>{`
        .island-context-map .premium-territory-map {
          border: 0 !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        }
        .island-context-map .premium-territory-map > [class*="bottom-24"] {
          display: none !important;
        }
        .island-context-map .leaflet-popup button {
          display: none !important;
        }
        @media (max-width: 700px) {
          .island-context-map .premium-territory-map > div:has(> .leaflet-container),
          .island-context-map .leaflet-container {
            height: min(68dvh, 640px) !important;
            min-height: 520px !important;
          }
          .island-context-map .premium-territory-map > [class*="top-[94px]"] {
            right: .55rem !important;
            top: 5.3rem !important;
          }
          .island-context-map .premium-territory-map > [class*="top-[142px]"] {
            left: .55rem !important;
            right: .55rem !important;
            top: 8.2rem !important;
            max-width: calc(100% - 1.1rem) !important;
          }
        }
      `}</style>

      {selectedPlace ? (
        <SelectedMapContext selection={selectedPlace} island={island} />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/8 bg-[#061d26] px-4 py-3 sm:px-5">
          <p className="text-[10px] font-semibold text-white/35">
            Tap a mapped place to make it the next Island request's selected-place context.
          </p>
          <span className="text-[9px] font-black uppercase tracking-[.12em] text-cyan-100/45">
            {places.length} positioned records · {activeLens}
          </span>
        </div>
      )}
    </section>
  );
}

function MapFailure({
  island,
  message,
  onRetry,
}: {
  island: IntelligenceIsland;
  message: string;
  onRetry: () => void;
}) {
  const image = FALLBACK_IMAGE[island];
  return (
    <div className="relative grid min-h-[560px] place-items-center overflow-hidden p-6 text-center">
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes="100vw"
        className="object-cover opacity-30"
      />
      <div className="absolute inset-0 bg-[#03141b]/70" />
      <div className="relative max-w-md rounded-[24px] border border-amber-200/15 bg-[#071f29]/92 p-5 backdrop-blur-xl">
        <AlertTriangle size={20} className="mx-auto text-amber-200" />
        <h3 className="mt-3 text-lg font-black">Living Map unavailable</h3>
        <p className="mt-2 text-xs leading-5 text-white/45">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full bg-cyan-200 px-4 text-[10px] font-black uppercase tracking-[.1em] text-[#04242d]"
        >
          <RefreshCw size={13} /> Retry geography
        </button>
      </div>
    </div>
  );
}

function SelectedMapContext({
  selection,
  island,
}: {
  selection: TerritoryMapSelection;
  island: IntelligenceIsland;
}) {
  const detailHref = selectionDetailHref(selection);
  const fullMapHref = selectionMapHref(selection, island);
  return (
    <div className="grid gap-3 border-t border-white/8 bg-[#061d26] p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.13em] text-cyan-200/55">
          <MapPinned size={12} /> Selected map context
        </div>
        <h3 className="mt-1 truncate text-base font-black text-white/85">{selection.name}</h3>
        <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-white/38">
          {selection.description ??
            `${selection.type} at ${selection.lat.toFixed(5)}, ${selection.lng.toFixed(5)}. This selection is synchronized into the next Island request.`}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 sm:justify-end">
        <Link
          href={detailHref}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[.05] px-3 text-[9px] font-black text-white/60"
        >
          View details <ArrowRight size={12} />
        </Link>
        <Link
          href={fullMapHref}
          className="inline-flex min-h-10 items-center gap-2 rounded-full bg-cyan-200 px-3 text-[9px] font-black text-[#04242d]"
        >
          Open full map <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}

function toPublicLens(lens: TerritoryMapLens): TerritoryMapLens {
  return PUBLIC_LENSES.has(lens) ? lens : "places";
}

function inferProjectionLens(projection: IslandWorkspaceProjection): TerritoryMapLens {
  const text = [
    projection.intent,
    projection.presentation.focus,
    projection.recommendations[0]?.kind,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (/beach/.test(text)) return "beaches";
  if (/stay|hotel|lodg|accommodation/.test(text)) return "stays";
  if (/history|historic|heritage/.test(text)) return "historic";
  return "places";
}

function resolveFocusedPlaceId(
  recommendation: IslandWorkspaceRecommendation | undefined,
  places: TerritoryMapPlace[],
) {
  if (!recommendation) return null;
  const candidates = new Set<string>([
    recommendation.id,
    recommendation.provenance.sourceId,
    canonicalMapId(recommendation.id),
    canonicalMapId(`${recommendation.kind}:${recommendation.provenance.sourceId}`),
  ]);
  const match = places.find((place) => place.id && candidates.has(place.id));
  return match?.id ?? null;
}

function canonicalMapId(value: string) {
  return value
    .replace(/^places:/, "place:")
    .replace(/^beaches:/, "beach:")
    .replace(/^stays:/, "stay:");
}

function selectionDetailHref(selection: TerritoryMapSelection) {
  const slug = selection.id.replace(/^[^:]+:/, "");
  if (selection.type === "beach") return `/beaches/${slug}`;
  if (selection.type === "stay") return `/accommodations/${slug}`;
  if (selection.type === "historic") return `/historic/${slug}`;
  return `/places/${slug}`;
}

function selectionMapHref(
  selection: TerritoryMapSelection,
  island: IntelligenceIsland,
) {
  const params = new URLSearchParams({
    island,
    place: selection.id,
    placeName: selection.name,
    placeType: selection.type,
    placeLat: String(selection.lat),
    placeLng: String(selection.lng),
  });
  if (selection.description) {
    params.set("placeDescription", selection.description.slice(0, 500));
  }
  return `/map?${params.toString()}`;
}
