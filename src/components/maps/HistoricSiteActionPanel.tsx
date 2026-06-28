import {
  Archive,
  BookOpen,
  Car,
  Compass,
  ImageIcon,
  Landmark,
  MapPinned,
  MessageCircle,
  Route,
  Sparkles,
  Star,
  X,
  type LucideIcon,
} from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { getHistoricSiteOffer } from "../../data/revenue/historicSiteOffers";
import type { IslandCode } from "../../types";

type LngLat = [number, number];

type Props = {
  title: string;
  selectedIsland: IslandCode;
  coords: LngLat;
  description?: string;
  imageUrl?: string;
  siteId?: string;
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

function islandLabel(island: IslandCode) {
  return ISLAND_LABELS[island] || "USVI";
}

function islandQueryValue(island: IslandCode) {
  return ISLAND_QUERY_ALIASES[island] || String(island);
}

function cleanTitle(value: unknown) {
  return String(value ?? "Historic Site").replace(/\s+/g, " ").trim();
}

function normalizeId(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safeNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function coordinateLabel(lat: number, lng: number) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "Coordinates pending";
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export default function HistoricSiteActionPanel({
  title,
  selectedIsland,
  coords,
  description,
  imageUrl,
  siteId,
  onClose,
}: Props) {
  const navigate = useNavigate();

  const displayTitle = cleanTitle(title);
  const encodedTitle = encodeURIComponent(displayTitle);
  const normalizedIsland = islandQueryValue(selectedIsland);
  const encodedIsland = encodeURIComponent(normalizedIsland);

  const lat = safeNumber(coords?.[1]);
  const lng = safeNumber(coords?.[0]);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0);

  const historicSiteId = siteId || normalizeId(displayTitle);
  const encodedSiteId = encodeURIComponent(historicSiteId);

  const offer = getHistoricSiteOffer(siteId);

  const routes = useMemo(
    () => ({
      explore: `/explore?island=${encodedIsland}&q=${encodedTitle}`,
      archives: `/estates/${encodedSiteId}/archives?island=${encodedIsland}&context=${encodedTitle}`,
      historyKnowledge: `/history/knowledge?estate=${encodedSiteId}&island=${encodedIsland}&context=${encodedTitle}`,
      concierge: `/concierge?island=${encodedIsland}&context=${encodedTitle}`,
      bookTour: `/concierge?island=${encodedIsland}&context=${encodedTitle}&intent=book-tour`,
      mobility: `/mobility?island=${encodedIsland}&destination=${encodedTitle}${
        hasCoords ? `&lat=${lat}&lng=${lng}` : ""
      }`,
    }),
    [encodedIsland, encodedSiteId, encodedTitle, hasCoords, lat, lng],
  );

  return (
    <div className="max-h-[calc(100vh-1.5rem)] overflow-hidden rounded-[1.6rem] bg-white text-stone-950 shadow-2xl">
      <div className="max-h-[calc(100vh-1.5rem)] overflow-y-auto overscroll-contain pb-4">
        <div className="relative h-[260px] overflow-hidden bg-stone-950 sm:h-[320px]">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={displayTitle}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="grid h-full place-items-center text-emerald-300">
              <ImageIcon className="h-10 w-10" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

          <button
            type="button"
            onClick={onClose}
            aria-label="Close historic site panel"
            className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/65"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="absolute left-5 top-5 grid h-12 w-12 place-items-center rounded-full bg-emerald-400 text-[#022c22] shadow-xl">
            <MapPinned className="h-6 w-6" />
          </div>

          <div className="absolute bottom-6 left-5 right-5 text-white">
            <p className="mb-2 inline-flex rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200 backdrop-blur">
              Historic Site
            </p>

            <h2 className="font-serif text-3xl font-black tracking-tight sm:text-4xl">
              {displayTitle}
            </h2>

            <p className="mt-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.26em] text-emerald-300">
              <MapPinned className="h-4 w-4" />
              {islandLabel(selectedIsland)}
            </p>
          </div>
        </div>

        <div className="relative z-10 -mt-5 rounded-t-[1.75rem] bg-white p-5">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-800">
              <Landmark className="h-6 w-6" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">
                {islandLabel(selectedIsland)}
              </p>

              <h2 className="mt-1 font-serif text-2xl font-black">
                {displayTitle}
              </h2>

              {description ? (
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  {description}
                </p>
              ) : (
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  This historic site is ready for archive matching, map linking,
                  history knowledge enrichment, and visitor route planning.
                </p>
              )}

              <p className="mt-3 text-xs font-bold text-stone-500">
                {coordinateLabel(lat, lng)}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Action
              icon={BookOpen}
              label="History Knowledge"
              className="bg-emerald-100 text-emerald-950"
              onClick={() => navigate(routes.historyKnowledge)}
            />

            <Action
              icon={Archive}
              label="Estate Archives"
              className="bg-amber-100 text-amber-950"
              onClick={() => navigate(routes.archives)}
            />
          </div>

          {offer ? (
            <div className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
                    <Sparkles className="h-3.5 w-3.5" />
                    Featured Experience
                  </p>

                  <h3 className="mt-2 font-serif text-xl font-black text-emerald-950">
                    {offer.tourTitle}
                  </h3>

                  <p className="mt-1 text-sm font-semibold text-emerald-800">
                    Starting at ${offer.tourPrice}
                  </p>
                </div>

                <div className="rounded-2xl bg-white px-3 py-2 text-right shadow-sm">
                  <p className="flex items-center justify-end gap-1 text-xs font-black text-amber-600">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    4.9
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-stone-500">
                    Visitor Favorite
                  </p>
                </div>
              </div>

              <p className="mt-3 text-xs font-semibold text-emerald-900/80">
                Most popular historic tour · Taxi pickup and nearby lunch can be bundled.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {offer.suggestedUpsells.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-900 shadow-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <button
                type="button"
                onClick={() => navigate(routes.bookTour)}
                className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-950 px-4 py-4 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-emerald-900 active:scale-[0.99]"
              >
                <Car className="h-5 w-5" />
                Book {offer.tourTitle} • ${offer.tourPrice}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => navigate(routes.bookTour)}
              className="mt-5 flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-950 px-4 py-4 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-emerald-900 active:scale-[0.99]"
            >
              <Car className="h-5 w-5" />
              Book Tour
            </button>
          )}

          <div className="mt-3 rounded-3xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700">
                  Need a ride?
                </p>
                <p className="mt-1 text-sm font-black text-blue-950">
                  Taxi estimate: $12–18
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate(routes.mobility)}
                className="rounded-2xl bg-blue-950 px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-white transition hover:bg-blue-900 active:scale-[0.99]"
              >
                Book Ride
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <Action
              icon={Compass}
              label="Explore"
              className="bg-stone-950 text-white"
              onClick={() => navigate(routes.explore)}
            />

            <Action
              icon={MessageCircle}
              label="Ask Island"
              className="bg-violet-100 text-violet-950"
              onClick={() => navigate(routes.concierge)}
            />

            <Action
              icon={Route}
              label="Plan Ride"
              className="bg-emerald-100 text-emerald-950"
              onClick={() => navigate(routes.mobility)}
            />

            <Action
              icon={Archive}
              label="Archive Search"
              className="bg-stone-100 text-stone-950"
              onClick={() => navigate(`/history/archives?q=${encodedTitle}`)}
            />
          </div>

          <button
            type="button"
            disabled={!hasCoords}
            onClick={() => {
              if (!hasCoords) return;

              window.open(
                `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
                "_blank",
                "noopener,noreferrer",
              );
            }}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-100 px-4 py-4 text-xs font-black uppercase tracking-[0.16em] text-stone-950 transition hover:bg-stone-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <MapPinned className="h-4 w-4" />
            Open Directions
          </button>

          {siteId ? (
            <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
              Site ID: {siteId}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Action({
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
      className={`rounded-2xl px-4 py-4 text-xs font-black uppercase tracking-[0.13em] transition hover:brightness-95 active:scale-[0.98] ${className}`}
    >
      <Icon className="mx-auto mb-2 h-4 w-4" />
      {label}
    </button>
  );
}