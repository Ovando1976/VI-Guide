import type { ReactNode } from "react";
import { Loader2, MapPin, Navigation, Sparkles } from "lucide-react";

import IslandMap from "../../components/maps/IslandMap";
import type { RouteLineInput } from "../maps/IslandMap";
import type { IslandCode, Trip } from "../../types";

type RoutePoint = {
  coords: [number, number];
};

type FocusTarget = {
  center: [number, number];
  zoom: number;
  pitch?: number;
  bearing?: number;
};

type RideConfirmCardProps = {
  pickup: string;
  dropoff: string;
  quote?: Trip["quote"];
  loading: boolean;
  selectedIsland: IslandCode;
  routeLine?: unknown;
  pickupPoint?: RoutePoint | null;
  dropoffPoint?: RoutePoint | null;
  onBack: () => void;
  onConfirm: () => void;
};

const FALLBACK_FOCUS: FocusTarget = {
  center: [-64.927, 18.342],
  zoom: 11.4,
  pitch: 45,
  bearing: -12,
};

const ISLAND_FOCUS: Record<string, FocusTarget> = {
  st_thomas: FALLBACK_FOCUS,
  stt: FALLBACK_FOCUS,

  st_john: {
    center: [-64.755, 18.333],
    zoom: 11.6,
    pitch: 45,
    bearing: -12,
  },
  stj: {
    center: [-64.755, 18.333],
    zoom: 11.6,
    pitch: 45,
    bearing: -12,
  },

  st_croix: {
    center: [-64.75, 17.735],
    zoom: 10.8,
    pitch: 45,
    bearing: -12,
  },
  stx: {
    center: [-64.75, 17.735],
    zoom: 10.8,
    pitch: 45,
    bearing: -12,
  },

  water_island: {
    center: [-64.951, 18.318],
    zoom: 13,
    pitch: 45,
    bearing: -12,
  },
  wat: {
    center: [-64.951, 18.318],
    zoom: 13,
    pitch: 45,
    bearing: -12,
  },
};

function isValidPoint(point?: RoutePoint | null): point is RoutePoint {
  return Boolean(
    point &&
      Array.isArray(point.coords) &&
      point.coords.length === 2 &&
      Number.isFinite(point.coords[0]) &&
      Number.isFinite(point.coords[1]) &&
      point.coords[0] !== 0 &&
      point.coords[1] !== 0
  );
}

function getFocusTarget({
  selectedIsland,
  pickupPoint,
  dropoffPoint,
}: {
  selectedIsland: IslandCode;
  pickupPoint?: RoutePoint | null;
  dropoffPoint?: RoutePoint | null;
}): FocusTarget {
  const hasPickup = isValidPoint(pickupPoint);
  const hasDropoff = isValidPoint(dropoffPoint);

  if (hasPickup && hasDropoff) {
    const lngDistance = Math.abs(pickupPoint.coords[0] - dropoffPoint.coords[0]);
    const latDistance = Math.abs(pickupPoint.coords[1] - dropoffPoint.coords[1]);
    const distance = Math.max(lngDistance, latDistance);

    return {
      center: [
        (pickupPoint.coords[0] + dropoffPoint.coords[0]) / 2,
        (pickupPoint.coords[1] + dropoffPoint.coords[1]) / 2,
      ],
      zoom: distance > 0.08 ? 11.6 : distance > 0.035 ? 12.7 : 13.8,
      pitch: 50,
      bearing: -14,
    };
  }

  if (hasDropoff) {
    return {
      center: dropoffPoint.coords,
      zoom: 14.5,
      pitch: 50,
      bearing: -14,
    };
  }

  if (hasPickup) {
    return {
      center: pickupPoint.coords,
      zoom: 14.5,
      pitch: 50,
      bearing: -14,
    };
  }

  return ISLAND_FOCUS[selectedIsland] ?? FALLBACK_FOCUS;
}

function getFareValue(quote?: Trip["quote"]): unknown {
  if (!quote || typeof quote !== "object") return undefined;

  const record = quote as Record<string, unknown>;

  return (
    record.total ??
    record.totalFare ??
    record.fare ??
    record.amount ??
    record.price ??
    record.displayFare
  );
}

function formatFare(total: unknown): string {
  if (typeof total === "number" && Number.isFinite(total)) {
    return `$${total.toFixed(total % 1 === 0 ? 0 : 2)}`;
  }

  if (typeof total === "string" && total.trim()) {
    return total.trim().startsWith("$") ? total.trim() : `$${total.trim()}`;
  }

  return "Fare pending";
}

export default function RideConfirmCard({
  pickup,
  dropoff,
  quote,
  loading,
  selectedIsland,
  routeLine,
  pickupPoint,
  dropoffPoint,
  onBack,
  onConfirm,
}: RideConfirmCardProps) {
  const hasPickup = isValidPoint(pickupPoint);
  const hasDropoff = isValidPoint(dropoffPoint);
  const safeRouteLine = routeLine as RouteLineInput;
  const focusTarget = getFocusTarget({
    selectedIsland,
    pickupPoint,
    dropoffPoint,
  });

  const fareLabel = formatFare(getFareValue(quote));

  const routeStatus =
    hasPickup && hasDropoff
      ? "Route preview locked"
      : hasPickup || hasDropoff
        ? "Showing the available route point"
        : "Estate route will improve when coordinates are available";

  return (
    <section className="space-y-6 pb-44">
      <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-white p-6 text-ink shadow-2xl sm:p-8">
        <div className="grid h-16 w-16 place-items-center rounded-3xl bg-turquoise/10 text-turquoise">
          <Sparkles size={30} />
        </div>

        <h2 className="mt-5 text-4xl font-serif italic text-ink">
          Your ride is almost ready
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-stone-500">
          Review your pickup, destination, route, and fare before requesting a licensed island driver.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Line icon={<MapPin size={18} />} label="Pickup" value={pickup} />
          <Line icon={<Navigation size={18} />} label="Dropoff" value={dropoff} />
        </div>

        <div className="mt-6 overflow-hidden rounded-[2rem] border border-stone-100 bg-stone-50 shadow-inner">
          <div className="border-b border-stone-100 px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-turquoise">
                  Route Preview
                </p>
                <p className="mt-1 text-xs font-semibold text-stone-500">
                  Estate-aware route context for your driver.
                </p>
              </div>

              <span className="rounded-full bg-turquoise/10 px-3 py-2 text-[9px] font-black uppercase tracking-[0.18em] text-turquoise">
                {routeStatus}
              </span>
            </div>
          </div>

          <div className="relative h-[320px] overflow-hidden bg-[#081316] sm:h-[380px]">
            <IslandMap
              embedded
              interactive={false}
              focusTarget={focusTarget}
              pickup={hasPickup ? pickupPoint : null}
              dropoff={hasDropoff ? dropoffPoint : null}
              routeLine={safeRouteLine}
              showEstateBoundaries={false}
              showEstateLabels={false}
              showParcels={false}
              className="h-full w-full"
            />
          </div>
        </div>

        <div className="mt-6 rounded-3xl bg-sand/30 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-500">
            Fare Locked
          </p>
          <p className="mt-2 text-5xl font-serif italic">{fareLabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pb-24">
        <button
          type="button"
          onClick={onBack}
          className="rounded-3xl border border-white/10 bg-white/10 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-xl transition hover:bg-white/20 active:scale-95"
        >
          Back
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="rounded-3xl bg-turquoise py-5 text-[10px] font-black uppercase tracking-[0.3em] text-ink shadow-2xl transition hover:bg-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="mx-auto animate-spin" size={18} />
          ) : (
            "Request Driver"
          )}
        </button>
      </div>
    </section>
  );
}

function Line({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-3xl bg-sand/30 p-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-turquoise">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">
          {label}
        </p>
        <p className="truncate text-sm font-bold text-ink">{value}</p>
      </div>
    </div>
  );
}