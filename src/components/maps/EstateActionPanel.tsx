import {
  Archive,
  BookOpen,
  Building2,
  Compass,
  Database,
  Expand,
  History,
  Landmark,
  MapPinned,
  MessageCircle,
  Route,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import type { IslandCode } from "../../types";
import EstateMiniMap from "./EstateMiniMap";

type Props = {
  title: string;
  selectedIsland: IslandCode;
  coords?: [number, number];
  quarter?: string;
  geoid?: string;
  bbox?: [number, number, number, number];
  geometry?: GeoJSON.Geometry | null;
  onClose: () => void;
};

const ISLAND_LABELS: Record<string, string> = {
  st_thomas: "St. Thomas",
  st_john: "St. John",
  st_croix: "St. Croix",
  water_island: "Water Island",
  stt: "St. Thomas",
  stj: "St. John",
  stx: "St. Croix",
  wat: "Water Island",
};

const ISLAND_QUERY_ALIASES: Record<string, string> = {
  st_thomas: "st_thomas",
  st_john: "st_john",
  st_croix: "st_croix",
  water_island: "water_island",
  stt: "st_thomas",
  stj: "st_john",
  stx: "st_croix",
  wat: "water_island",
};

function cleanEstateTitle(value: unknown): string {
  return String(value ?? "Unknown Estate")
    .replace(/^estate\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeId(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/^estate\s+/i, "")
    .replace(/['’]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function islandLabel(island: IslandCode): string {
  return ISLAND_LABELS[island] || "U.S. Virgin Islands";
}

function islandQueryValue(island: IslandCode): string {
  return ISLAND_QUERY_ALIASES[island] || String(island);
}

function safeNumber(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default function EstateActionPanel({
  title,
  selectedIsland,
  coords,
  quarter,
  geoid,
  bbox,
  geometry,
  onClose,
}: Props) {
  const navigate = useNavigate();

  const displayTitle = cleanEstateTitle(title);
  const stableEstateId = String(geoid || normalizeId(displayTitle) || displayTitle).trim();

  const lat = safeNumber(coords?.[1]);
  const lng = safeNumber(coords?.[0]);
  const hasCoords = typeof lat === "number" && typeof lng === "number";

  const islandQuery = islandQueryValue(selectedIsland);

  const routes = useMemo(() => {
    const encodedEstateId = encodeURIComponent(stableEstateId);
    const encodedTitle = encodeURIComponent(displayTitle);
    const encodedIsland = encodeURIComponent(islandQuery);

    return {
      detail: `/estates/${encodedEstateId}?island=${encodedIsland}`,
      history: `/estates/${encodedEstateId}/history?island=${encodedIsland}&context=${encodedTitle}`,
      archives: `/estates/${encodedEstateId}/archives?island=${encodedIsland}&context=${encodedTitle}`,
      historyKnowledge: `/history/knowledge?estate=${encodedEstateId}&island=${encodedIsland}&context=${encodedTitle}`,
      nearby: `/estates/${encodedEstateId}/nearby?island=${encodedIsland}`,
      concierge: `/concierge?island=${encodedIsland}&context=${encodedTitle}`,
      mobility: `/mobility?island=${encodedIsland}&destination=${encodedTitle}${
        hasCoords ? `&lat=${lat}&lng=${lng}` : ""
      }`,
      directions:
        hasCoords && lat !== undefined && lng !== undefined
          ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
          : "",
    };
  }, [displayTitle, hasCoords, islandQuery, lat, lng, stableEstateId]);

  function go(path: string) {
    navigate(path);
  }

  return (
    <div className="max-h-[calc(100dvh-9rem)] overflow-hidden rounded-[2rem] border border-white/15 bg-white text-stone-950 shadow-[0_24px_90px_rgba(0,0,0,0.55)]">
      <div className="max-h-[calc(100dvh-9rem)] overflow-y-auto overscroll-contain">
        <div className="relative bg-[radial-gradient(circle_at_12%_0%,rgba(16,185,129,0.22),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(56,189,248,0.18),transparent_32%),linear-gradient(135deg,#ffffff,#ecfeff)] p-4 pb-5 sm:p-5">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full bg-white/85 text-stone-500 shadow-sm transition hover:bg-white hover:text-stone-900"
            aria-label="Close estate panel"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3 pr-12">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-800 shadow-inner">
              <Building2 className="h-6 w-6" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-700">
                  Estate Intelligence
                </p>

                <span className="flex items-center gap-1 rounded-full bg-emerald-950/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-emerald-800">
                  <Sparkles className="h-3 w-3" />
                  Estate OS
                </span>
              </div>

              <h2 className="mt-1 text-2xl font-black leading-tight tracking-[-0.04em] sm:text-3xl">
                Estate {displayTitle}
              </h2>

              <div className="mt-3 flex flex-wrap gap-2">
                <InfoPill icon={Landmark} label={quarter || "Unknown Quarter"} />
                <InfoPill icon={MapPinned} label={islandLabel(selectedIsland)} />
                {stableEstateId ? (
                  <InfoPill icon={BookOpen} label={`ID ${stableEstateId}`} />
                ) : null}
              </div>
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-stone-600">
            Explore this estate as a living geographic record: boundary, terrain,
            history, archive references, nearby places, mobility routes, parcel
            intelligence, and AI-assisted local context.
          </p>

          <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-stone-200 bg-[#020617] shadow-inner">
            <div className="flex items-center justify-between border-b border-white/10 bg-[#020617] px-4 py-3 text-white">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.24em] text-emerald-300">
                  Boundary Preview
                </p>
                <p className="mt-1 text-xs text-white/60">
                  Live mini-map preview. Open the full estate page for the larger
                  terrain map.
                </p>
              </div>

              <button
                type="button"
                onClick={() => go(routes.detail)}
                className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white/80 transition hover:bg-white/20"
                aria-label="Open full estate page"
              >
                <Expand className="h-4 w-4" />
              </button>
            </div>

            <EstateMiniMap
              estate={{
                geoid: stableEstateId,
                name: displayTitle,
                bbox,
                geometry,
                centroid: hasCoords ? { lat, lng } : undefined,
              }}
              height={190}
              interactive={false}
              showControls={false}
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <EstateActionButton
              icon={Compass}
              label="Overview"
              className="bg-stone-950 text-white"
              onClick={() => go(routes.detail)}
            />

            <EstateActionButton
              icon={History}
              label="History"
              className="bg-stone-100 text-stone-950"
              onClick={() => go(routes.history)}
            />

            <EstateActionButton
              icon={Archive}
              label="Archives"
              className="bg-amber-100 text-amber-950"
              onClick={() => go(routes.archives)}
            />

            <EstateActionButton
              icon={Database}
              label="Knowledge"
              className="bg-emerald-100 text-emerald-950"
              onClick={() => go(routes.historyKnowledge)}
            />

            <EstateActionButton
              icon={MapPinned}
              label="Nearby"
              className="bg-sky-100 text-sky-950"
              onClick={() => go(routes.nearby)}
            />

            <EstateActionButton
              icon={MessageCircle}
              label="Ask Island"
              className="bg-violet-100 text-violet-950"
              onClick={() => go(routes.concierge)}
            />

            <EstateActionButton
              icon={Route}
              label="Plan Ride"
              className="bg-emerald-100 text-emerald-950"
              onClick={() => go(routes.mobility)}
            />
          </div>

          {hasCoords ? (
            <button
              type="button"
              onClick={() =>
                window.open(routes.directions, "_blank", "noopener,noreferrer")
              }
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-50 px-4 py-4 text-xs font-black uppercase tracking-[0.16em] text-blue-950 transition hover:bg-blue-100"
            >
              <MapPinned className="h-4 w-4" />
              Open Directions
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function InfoPill({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-full bg-white/75 px-3 py-1.5 text-xs font-black text-stone-700 shadow-sm ring-1 ring-stone-950/5">
      <Icon className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
      <span className="truncate">{label}</span>
    </div>
  );
}

function EstateActionButton({
  icon: Icon,
  label,
  className,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  className: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-3 py-4 text-xs font-black uppercase tracking-[0.13em] transition hover:scale-[1.02] active:scale-[0.98] ${className}`}
    >
      <Icon className="mx-auto mb-2 h-4 w-4" />
      {label}
    </button>
  );
}