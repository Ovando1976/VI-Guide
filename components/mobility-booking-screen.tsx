"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  MapPinned,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";
import { BookingPanel } from "@/components/booking-panel";
import type { RideMode } from "@/types/mobility";
import type { EstateRecord, IslandCode } from "@/types/usvi";

const RIDE_MODES: RideMode[] = [
  "standard",
  "premium",
  "shared",
  "safari",
  "airport",
  "ferry-transfer",
  "tour",
  "delivery",
  "executive",
];

const ISLAND_VISUALS = {
  stt: {
    label: "St. Thomas",
    image: "/images/usvi-harbor-hero.jpg",
    alt: "St. Thomas harbor and island hills",
  },
  stj: {
    label: "St. John",
    image: "/images/places/st-john/trunk-bay-overlook-1.jpg",
    alt: "St. John coastline and green island hills",
  },
  stx: {
    label: "St. Croix",
    image: "/images/places/st-croix/cane-bay-beach-1.jpg",
    alt: "Cane Bay coastline on St. Croix",
  },
} as const satisfies Record<IslandCode, { label: string; image: string; alt: string }>;

function isRideMode(value: string | null): value is RideMode {
  return Boolean(value && RIDE_MODES.includes(value as RideMode));
}

function isIslandCode(value: string | null): value is IslandCode {
  return value === "stt" || value === "stj" || value === "stx";
}

function numberInRange(value: string | null, minimum: number, maximum: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return minimum;
  return Math.max(minimum, Math.min(maximum, Math.round(parsed)));
}

function queryCoordinate(
  searchParams: ReturnType<typeof useSearchParams>,
  key: "fromLat" | "fromLng" | "toLat" | "toLng",
) {
  const raw = searchParams.get(key);
  if (raw === null) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function normalizedPlaceName(value: string | null) {
  return value?.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() ?? "";
}

function nearestEstate(
  estates: EstateRecord[],
  lat: number | null,
  lng: number | null,
) {
  if (lat === null || lng === null || !estates.length) return null;
  return estates.reduce<EstateRecord | null>((closest, estate) => {
    if (!closest) return estate;
    const candidateDistance =
      Math.pow(estate.internalPoint.lat - lat, 2) +
      Math.pow(estate.internalPoint.lng - lng, 2);
    const closestDistance =
      Math.pow(closest.internalPoint.lat - lat, 2) +
      Math.pow(closest.internalPoint.lng - lng, 2);
    return candidateDistance < closestDistance ? estate : closest;
  }, null);
}

function estateFromHandoff(
  estates: EstateRecord[],
  geoid: string | null,
  name: string | null,
  lat: number | null,
  lng: number | null,
) {
  const exact = geoid
    ? estates.find((estate) => estate.geoid === geoid)
    : null;
  if (exact) return exact;

  const requestedName = normalizedPlaceName(name);
  if (requestedName) {
    const named = estates.find((estate) => {
      const estateName = normalizedPlaceName(estate.baseName);
      return estateName === requestedName ||
        estateName.includes(requestedName) ||
        requestedName.includes(estateName);
    });
    if (named) return named;
  }

  return nearestEstate(estates, lat, lng);
}

export function MobilityBookingScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [estates, setEstates] = useState<EstateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  const [fromGeoid, setFromGeoid] = useState(
    () => searchParams.get("from") ?? "",
  );
  const [toGeoid, setToGeoid] = useState(
    () => searchParams.get("to") ?? "",
  );
  const [mode, setMode] = useState<RideMode>(() => {
    const requested = searchParams.get("mode");
    return isRideMode(requested) ? requested : "standard";
  });
  const [passengers, setPassengers] = useState(() =>
    numberInRange(searchParams.get("passengers"), 1, 12),
  );
  const [luggage, setLuggage] = useState(() =>
    numberInRange(searchParams.get("luggage"), 0, 12),
  );

  const [activeIsland, setActiveIsland] = useState<IslandCode>(() => {
    const requested = searchParams.get("island");
    return isIslandCode(requested) ? requested : "stt";
  });

  useEffect(() => {
    const controller = new AbortController();

    async function loadEstates() {
      try {
        setLoading(true);
        setErrorMessage(null);
        const response = await fetch("/api/estates", {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error ?? "Unable to load estate data.");
        }

        const loaded = Array.isArray(payload?.estates) ? payload.estates : [];
        if (!loaded.length) throw new Error("No estate records were returned.");
        setEstates(loaded);
      } catch (error) {
        if (controller.signal.aborted) return;
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load estates.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadEstates();
    return () => controller.abort();
  }, [reloadNonce]);

  useEffect(() => {
    const requested = searchParams.get("island");
    if (isIslandCode(requested)) return;
    const remembered = window.localStorage.getItem("vi-guide.active-island");
    if (isIslandCode(remembered)) setActiveIsland(remembered);
  }, [searchParams]);

  const availableEstates = useMemo(
    () => estates.filter((estate) => estate.island === activeIsland),
    [activeIsland, estates],
  );

  useEffect(() => {
    if (!availableEstates.length) return;

    const requestedFrom = estateFromHandoff(
      availableEstates,
      searchParams.get("from"),
      searchParams.get("pickupName") ?? searchParams.get("pickup"),
      queryCoordinate(searchParams, "fromLat"),
      queryCoordinate(searchParams, "fromLng"),
    );
    const requestedTo = estateFromHandoff(
      availableEstates,
      searchParams.get("to"),
      searchParams.get("destinationName") ?? searchParams.get("destination"),
      queryCoordinate(searchParams, "toLat"),
      queryCoordinate(searchParams, "toLng"),
    );

    if (requestedFrom) setFromGeoid(requestedFrom.geoid);
    if (requestedTo && requestedTo.geoid !== requestedFrom?.geoid) {
      setToGeoid(requestedTo.geoid);
    }
  }, [availableEstates, searchParams]);

  useEffect(() => {
    if (!estates.length) return;
    const endpoint = estates.find(
      (estate) => estate.geoid === fromGeoid || estate.geoid === toGeoid,
    );
    if (endpoint && endpoint.island !== activeIsland) {
      setActiveIsland(endpoint.island);
    }
  }, [activeIsland, estates, fromGeoid, toGeoid]);

  useEffect(() => {
    const hasRouteHandoff = [
      "from",
      "to",
      "pickup",
      "pickupName",
      "destination",
      "destinationName",
      "fromLat",
      "fromLng",
      "toLat",
      "toLng",
    ].some((key) => searchParams.has(key));
    if (!estates.length || hasRouteHandoff) return;
    try {
      const raw = window.localStorage.getItem("vi-guide.trip-draft");
      if (!raw) return;
      const draft = JSON.parse(raw) as {
        island?: string;
        from?: string;
        to?: string;
        mode?: string;
        passengers?: number;
        luggage?: number;
      };
      const draftIsland = draft.island ?? null;
      if (!isIslandCode(draftIsland) || draftIsland !== activeIsland) return;
      const islandEstates = estates.filter((estate) => estate.island === activeIsland);
      if (draft.from && islandEstates.some((estate) => estate.geoid === draft.from)) {
        setFromGeoid(draft.from);
      }
      if (draft.to && islandEstates.some((estate) => estate.geoid === draft.to)) {
        setToGeoid(draft.to);
      }
      const draftMode = draft.mode ?? null;
      if (isRideMode(draftMode)) setMode(draftMode);
      if (typeof draft.passengers === "number") {
        setPassengers(Math.max(1, Math.min(12, Math.round(draft.passengers))));
      }
      if (typeof draft.luggage === "number") {
        setLuggage(Math.max(0, Math.min(12, Math.round(draft.luggage))));
      }
    } catch {
      window.localStorage.removeItem("vi-guide.trip-draft");
    }
  }, [activeIsland, estates, searchParams]);

  const fromEstate =
    availableEstates.find((estate) => estate.geoid === fromGeoid) ?? null;
  const toEstate =
    availableEstates.find((estate) => estate.geoid === toGeoid) ?? null;
  const requestedDestinationName =
    (
      searchParams.get("destinationName") ??
      searchParams.get("destination")
    )?.trim() || null;
  const islandVisual = ISLAND_VISUALS[activeIsland];

  function selectFrom(geoid: string) {
    setFromGeoid(geoid);
    if (geoid && geoid === toGeoid) setToGeoid("");
  }

  function selectTo(geoid: string) {
    setToGeoid(geoid);
    if (geoid && geoid === fromGeoid) setFromGeoid("");
  }

  function changeIsland(nextIsland: IslandCode) {
    setActiveIsland(nextIsland);
    window.localStorage.setItem("vi-guide.active-island", nextIsland);
    window.localStorage.removeItem("vi-guide.trip-draft");
    setFromGeoid("");
    setToGeoid("");
    const params = new URLSearchParams(searchParams.toString());
    params.set("island", nextIsland);
    params.delete("from");
    params.delete("to");
    router.replace(`/mobility?${params.toString()}`, { scroll: false });
  }

  function swapRoute() {
    setFromGeoid(toGeoid);
    setToGeoid(fromGeoid);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,.14),transparent_30%),linear-gradient(180deg,#f8f4ea_0%,#fff_48%,#f4f7f5_100%)] px-4 py-5 text-[#043331] md:px-6 pb-36 pt-5 md:px-6 lg:pb-40 lg:pt-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <ViPublicHeader
          actionHref="/concierge?prompt=Help%20me%20plan%20transportation%20for%20my%20Virgin%20Islands%20trip"
          actionLabel="Ask VI Concierge"
          actionIcon={Sparkles}
          secondaryHref="/"
          secondaryLabel="Home"
        />

        <section className="relative min-h-[500px] overflow-hidden rounded-[36px] text-white shadow-[0_28px_90px_rgba(4,51,49,.24)]">
          <Image
            src={islandVisual.image}
            alt={islandVisual.alt}
            fill
            priority
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,45,43,.96)_0%,rgba(3,45,43,.84)_50%,rgba(3,45,43,.28)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-[linear-gradient(180deg,transparent,rgba(2,29,28,.48))]" />

          <div className="relative grid min-h-[500px] gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.2fr_.8fr] lg:items-end lg:px-10 lg:py-10">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-[.2em] text-[#f7d778] backdrop-blur">
                  <Sparkles className="h-4 w-4" /> VI Guide private mobility
                </span>
                <span className="rounded-full border border-white/15 bg-black/20 px-3 py-2 text-[9px] font-black uppercase tracking-[.18em] text-white/75 backdrop-blur">
                  {islandVisual.label} context
                </span>
              </div>
              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-[-.055em] sm:text-5xl lg:text-6xl">
                Book the ride. Know the fare. Track every mile.
              </h1>
              <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-white/70 sm:text-base">
                A premium island ride experience built around official USVI taxi pricing, licensed dispatch, secure payment, and live trip visibility.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="#book"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#f5c451] px-5 text-[10px] font-black uppercase tracking-[.16em] text-[#5f3d00] shadow-lg"
                >
                  Start your ride <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={`/map?island=${activeIsland}`}
                  className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/18 bg-white/10 px-5 text-[10px] font-black uppercase tracking-[.16em] text-white backdrop-blur"
                >
                  <MapPinned className="h-4 w-4" /> Choose from map
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <TrustCard icon={BadgeCheck} title="Official pricing" copy="Published tariff only. No surge pricing." />
              <TrustCard icon={ShieldCheck} title="Verified dispatch" copy="Licensed association, driver, and vehicle checks." />
              <TrustCard icon={Clock3} title="Live trip control" copy="Payment handoff, driver tracking, and rider updates." />
            </div>
          </div>
        </section>

        <section className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-[#0b5d5b]/10 bg-white/90 p-4 shadow-sm backdrop-blur sm:p-5">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-teal-700">
              Choose your island
            </div>
            <div className="mt-1 text-lg font-black tracking-[-.03em]">
              One mobility experience across the territory
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto" aria-label="Choose island">
            {(["stt", "stj", "stx"] as IslandCode[]).map((island) => (
              <button
                key={island}
                type="button"
                onClick={() => changeIsland(island)}
                aria-pressed={activeIsland === island}
                className={`shrink-0 rounded-full border px-5 py-3 text-[10px] font-black uppercase tracking-[0.16em] transition ${
                  activeIsland === island
                    ? "border-[#043331] bg-[#043331] text-white shadow-lg"
                    : "border-slate-200 bg-[#f8f4ea] text-[#043331] hover:border-[#0f766e]"
                }`}
              >
                {island === "stt" ? "St. Thomas" : island === "stj" ? "St. John" : "St. Croix"}
              </button>
            ))}
          </div>
        </section>

        {loading ? (
          <div className="h-[680px] animate-pulse rounded-[36px] bg-white" />
        ) : errorMessage ? (
          <section className="rounded-[28px] border border-rose-200 bg-rose-50 p-7">
            <h2 className="text-xl font-black text-rose-900">
              Mobility data is unavailable
            </h2>
            <p className="mt-2 text-sm text-rose-700">{errorMessage}</p>
            <button
              type="button"
              onClick={() => setReloadNonce((value) => value + 1)}
              className="mt-5 rounded-full bg-rose-900 px-4 py-2.5 text-xs font-black uppercase tracking-[0.16em] text-white"
            >
              Try again
            </button>
          </section>
        ) : (
          <div className="space-y-4" id="book">
            {requestedDestinationName ? (
              <section
                className="rounded-[24px] border border-teal-200 bg-teal-50 p-4 text-teal-950 shadow-sm sm:p-5"
                aria-live="polite"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-teal-700 text-white">
                    <MapPinned className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-[.18em] text-teal-700">
                      Destination from VI Concierge
                    </div>
                    <h2 className="mt-1 text-lg font-black tracking-[-.03em]">
                      {requestedDestinationName}
                    </h2>
                    <p className="mt-1 text-xs font-semibold leading-5 text-teal-800">
                      {toEstate
                        ? `Official tariff estate: ${toEstate.baseName}. Review the pickup and route below.`
                        : "Choose the official destination estate below so VI Guide can apply the published tariff without guessing the location."}
                    </p>
                  </div>
                </div>
              </section>
            ) : null}
            <BookingPanel
              estates={availableEstates}
              fromEstate={fromEstate}
              toEstate={toEstate}
              fromGeoid={fromGeoid}
              toGeoid={toGeoid}
              mode={mode}
              passengers={passengers}
              luggage={luggage}
              island={activeIsland}
              onSelectFrom={selectFrom}
              onSelectTo={selectTo}
              onChangeMode={setMode}
              onChangePassengers={(value) =>
                setPassengers(Math.max(1, Math.min(12, value || 1)))
              }
              onChangeLuggage={(value) =>
                setLuggage(Math.max(0, Math.min(12, value || 0)))
              }
              onSwapRoute={swapRoute}
            />
          </div>
        )}
      </div>
    </main>
  );
}

function TrustCard({
  icon: Icon,
  title,
  copy,
}: {
  icon: typeof ShieldCheck;
  title: string;
  copy: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[22px] border border-white/12 bg-white/[.08] p-4 backdrop-blur">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/10 text-[#f7d778]">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <div className="text-sm font-black">{title}</div>
        <div className="mt-1 text-xs font-semibold leading-5 text-white/55">{copy}</div>
      </div>
    </div>
  );
}
