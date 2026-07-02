import type React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Anchor,
  Briefcase,
  Car,
  CheckCircle2,
  Loader2,
  MapPin,
  Navigation,
  Plane,
  Shield,
  Ship,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import RoutePreviewMap from "./maps/RoutePreviewMap";
import { tariffZones, zoneCoordinates } from "../data/mobility/tariffRules";
import {
  getDropdownOptionsForIsland,
  type TariffDropdownOption,
} from "../lib/mobility/tariffDropdown";
import { cn } from "../lib/utils";
import {
  calculateQuote,
  createTripRequest,
  enrichLocation,
  subscribeToTrip,
} from "../lib/firestore/mobility";
import type {
  IslandCode,
  MobilityIsland,
  ServiceClass,
  Trip,
  TripType,
} from "../types";

type MobilityProps = {
  selectedIsland: IslandCode;
  user: any;
};

type TripLocationType =
  | "airport"
  | "ferry"
  | "beach"
  | "estate"
  | "custom"
  | "hotel"
  | "parcel";

type ZonePoint = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

const islandLabels: Record<IslandCode, string> = {
  st_thomas: "St. Thomas",
  st_john: "St. John",
  st_croix: "St. Croix",
  water_island: "Water Island",
};

const islandSubtitles: Record<IslandCode, string> = {
  st_thomas:
    "Official tariff-aware mobility for airports, ferries, estates, beaches, hotels, schools, hospitals, and cruise traffic.",
  st_john:
    "Ferry-first routing for Cruz Bay, Coral Bay, beaches, estates, resorts, and island transfers.",
  st_croix:
    "Islandwide tariff routing for Christiansted, Frederiksted, airport, estates, beaches, hotels, and shopping zones.",
  water_island:
    "Water Island mobility context for ferry landing, Honeymoon Beach, and local transfers.",
};

const quickRoutes: Record<
  IslandCode,
  Array<{ label: string; zoneId: string; tripType: TripType; icon: React.ElementType }>
> = {
  st_thomas: [
    { label: "Cyril E. King Airport", zoneId: "stt_airport", tripType: "airport", icon: Plane },
    { label: "Red Hook Ferry Terminal", zoneId: "stt_red_hook", tripType: "ferry_transfer", icon: Ship },
    { label: "Havensight / WICO", zoneId: "stt_havensight", tripType: "cruise", icon: Anchor },
    { label: "Crown Bay Marina & Port", zoneId: "stt_crown_bay", tripType: "cruise", icon: Anchor },
  ],
  st_john: [
    { label: "Cruz Bay Ferry Dock", zoneId: "stj_cruz_bay", tripType: "ferry_transfer", icon: Ship },
    { label: "Coral Bay", zoneId: "stj_coral_bay", tripType: "direct", icon: Navigation },
    { label: "Trunk Bay Beach", zoneId: "stj_trunk_bay", tripType: "direct", icon: Navigation },
    { label: "The Westin Resort", zoneId: "stj_westin", tripType: "direct", icon: Car },
  ],
  st_croix: [
    { label: "Henry E. Rohlsen Airport", zoneId: "stx_airport", tripType: "airport", icon: Plane },
    { label: "Christiansted Town", zoneId: "stx_christiansted", tripType: "direct", icon: Navigation },
    { label: "Frederiksted Town & Pier", zoneId: "stx_frederiksted", tripType: "cruise", icon: Anchor },
    { label: "Sunny Isle Shopping Center", zoneId: "stx_sunny_isle", tripType: "direct", icon: Car },
  ],
  water_island: [
    { label: "Water Island General", zoneId: "wat_general", tripType: "direct", icon: Navigation },
    { label: "Honeymoon Beach", zoneId: "wat_honeymoon_beach", tripType: "direct", icon: Navigation },
    { label: "Phillips Landing Ferry Dock", zoneId: "wat_phillips_landing", tripType: "ferry_transfer", icon: Ship },
  ],
};

function toMobilityIsland(island: IslandCode): MobilityIsland {
  if (island === "st_thomas") return "stt";
  if (island === "st_john") return "stj";
  if (island === "st_croix") return "stx";
  return "wat";
}

function toTripLocationType(zoneId: string): TripLocationType {
  const text = zoneId.toLowerCase();

  if (text.includes("airport")) return "airport";
  if (text.includes("ferry") || text.includes("red_hook") || text.includes("cruz_bay")) return "ferry";
  if (text.includes("beach") || text.includes("bay")) return "beach";
  if (text.includes("hotel") || text.includes("resort") || text.includes("ritz") || text.includes("westin")) return "hotel";
  if (text.includes("estate")) return "estate";

  return "custom";
}

function getOptionLabel(options: TariffDropdownOption[], value: string) {
  const found = options.find((option) => !option.isHeader && option.value === value);
  return found && !found.isHeader ? found.label : "";
}

function getZone(id: string) {
  return tariffZones.find((zone) => zone.id === id);
}

function getZonePoint(id: string): ZonePoint | null {
  const zone = getZone(id);
  const coords = zoneCoordinates[id];

  if (!zone || !coords) return null;

  return {
    id,
    name: zone.name,
    lat: coords.lat,
    lng: coords.lng,
  };
}

export default function Mobility({ selectedIsland, user }: MobilityProps) {
  const [activeIsland, setActiveIsland] = useState<IslandCode>(selectedIsland);
  const mobilityIsland = toMobilityIsland(activeIsland);

  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [luggage, setLuggage] = useState(0);
  const [serviceClass, setServiceClass] = useState<ServiceClass>("shared");
  const [tripType, setTripType] = useState<TripType>("direct");

  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<Trip["quote"] | null>(null);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [step, setStep] = useState<"request" | "quote" | "tracking">("request");

  const tariffOptions = useMemo(
    () => getDropdownOptionsForIsland(activeIsland),
    [activeIsland],
  );

  const pickupLabel = getOptionLabel(tariffOptions, pickup);
  const dropoffLabel = getOptionLabel(tariffOptions, dropoff);

  useEffect(() => {
    setActiveIsland(selectedIsland);
  }, [selectedIsland]);

  function resetForIsland(island: IslandCode) {
    setActiveIsland(island);
    setPickup("");
    setDropoff("");
    setPassengers(1);
    setLuggage(0);
    setServiceClass("shared");
    setTripType("direct");
    setQuote(null);
    setActiveTrip(null);
    setStep("request");
  }

  function selectQuickDropoff(zoneId: string, type: TripType) {
    setDropoff(zoneId);
    setTripType(type);
    setQuote(null);
    setStep("request");
  }

  async function handleGetQuote() {
    if (!pickup || !dropoff || loading) return;

    setLoading(true);

    try {
      const nextQuote = await Promise.race([
        calculateQuote({
          island: mobilityIsland,
          tripType,
          passengers,
          luggage,
          serviceClass,
          originZone: pickup,
          destinationZone: dropoff,
        }),
        new Promise<Trip["quote"]>((_, reject) => {
          window.setTimeout(() => reject(new Error("Quote timeout")), 8000);
        }),
      ]);

      setQuote({
        ...nextQuote,
        waitingFee: nextQuote.waitingFee ?? 0,
      });
      setStep("quote");
    } catch (error) {
      console.error("Quote failed:", error);

      const baseFare = 20;
      const luggageFee = luggage * 3;
      const premiumFee = serviceClass === "private" ? 17 : 0;

      setQuote({
        currency: "USD",
        baseFare,
        luggageFee,
        waitingFee: 0,
        premiumFee,
        total: baseFare + luggageFee + premiumFee,
      });

      setStep("quote");
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestRide() {
    if (!quote || !user) return;

    setLoading(true);

    try {
      const pickupPoint = getZonePoint(pickup);
      const dropoffPoint = getZonePoint(dropoff);

      const enrichedPickup = await enrichLocation({
        label: pickupLabel || pickup,
        type: toTripLocationType(pickup),
        lat: pickupPoint?.lat ?? 0,
        lng: pickupPoint?.lng ?? 0,
        island: mobilityIsland,
        estateName: pickupLabel || undefined,
        parcelId: undefined,
      });

      const enrichedDropoff = await enrichLocation({
        label: dropoffLabel || dropoff,
        type: toTripLocationType(dropoff),
        lat: dropoffPoint?.lat ?? 0,
        lng: dropoffPoint?.lng ?? 0,
        island: mobilityIsland,
        estateName: dropoffLabel || undefined,
        parcelId: undefined,
      });

      const tripId = await createTripRequest({
        riderId: user.uid,
        driverId: null,
        status: "requested",
        tripType,
        island: mobilityIsland,
        pickup: enrichedPickup,
        dropoff: enrichedDropoff,
        passengers,
        luggage,
        serviceClass,
        quote,
      });

      subscribeToTrip(tripId, (trip) => {
        setActiveTrip(trip);
        setStep("tracking");
      });
    } catch (error) {
      console.error("Request failed:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#061016] px-5 py-7 text-white sm:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-emerald-300">
              VI Guide
            </p>

            <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
              <h1 className="text-5xl font-black leading-none tracking-tight sm:text-6xl">
                Territory Mobility
              </h1>

              <IslandSelector selected={activeIsland} onSelect={resetForIsland} />
            </div>

            <p className="mt-4 max-w-3xl text-sm font-semibold leading-relaxed text-white/60 sm:text-base">
              {islandSubtitles[activeIsland]}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.055] px-5 py-4 shadow-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/40">
              System Status
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm font-black text-emerald-300">
              <Shield className="h-4 w-4" />
              All Systems Operational
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-5">
            <DispatchConsole
              tariffOptions={tariffOptions}
              pickup={pickup}
              dropoff={dropoff}
              setPickup={(value) => {
                setPickup(value);
                setQuote(null);
                setStep("request");
              }}
              setDropoff={(value) => {
                setDropoff(value);
                setQuote(null);
                setStep("request");
              }}
              passengers={passengers}
              setPassengers={setPassengers}
              luggage={luggage}
              setLuggage={setLuggage}
              serviceClass={serviceClass}
              setServiceClass={(value) => {
                setServiceClass(value);
                setQuote(null);
                setStep("request");
              }}
              loading={loading}
              canCalculate={Boolean(pickup && dropoff)}
              onCalculate={handleGetQuote}
            />

            <QuickRoutes activeIsland={activeIsland} onPick={selectQuickDropoff} />
          </div>

          <aside className="space-y-5">
            <RoutePreview
              pickupPoint={getZonePoint(pickup)}
              dropoffPoint={getZonePoint(dropoff)}
              activeIsland={activeIsland}
            />

            {step === "tracking" && activeTrip ? (
              <TrackingPanel
                trip={activeTrip}
                onCancel={() => {
                  setStep("request");
                  setActiveTrip(null);
                }}
              />
            ) : (
              <TripSummary
                quote={quote}
                pickup={pickup}
                dropoff={dropoff}
                pickupLabel={pickupLabel}
                dropoffLabel={dropoffLabel}
                passengers={passengers}
                luggage={luggage}
                serviceClass={serviceClass}
                tripType={tripType}
                loading={loading}
                canRequest={Boolean(user)}
                onRequest={handleRequestRide}
              />
            )}

            <SafetyCard />
          </aside>
        </div>
      </section>
    </main>
  );
}

function IslandSelector({
  selected,
  onSelect,
}: {
  selected: IslandCode;
  onSelect: (code: IslandCode) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative z-50">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex min-w-64 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.08] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white shadow-xl backdrop-blur-xl transition hover:bg-white/[0.14]"
      >
        <span className="flex items-center gap-3">
          <MapPin className="h-4 w-4 text-emerald-300" />
          {islandLabels[selected]}
        </span>
        <span className={cn("text-emerald-300 transition-transform", isOpen && "rotate-180")}>
          ▾
        </span>
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-full z-50 mt-3 w-72 rounded-3xl border border-white/10 bg-slate-950 p-2 shadow-2xl">
          {(Object.keys(islandLabels) as IslandCode[]).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                onSelect(code);
                setIsOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-2xl px-4 py-4 text-left text-sm font-black transition hover:bg-white/10",
                selected === code ? "bg-emerald-300 text-slate-950" : "text-white",
              )}
            >
              {islandLabels[code]}
              {selected === code ? <CheckCircle2 className="h-4 w-4" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DispatchConsole({
  tariffOptions,
  pickup,
  dropoff,
  setPickup,
  setDropoff,
  passengers,
  setPassengers,
  luggage,
  setLuggage,
  serviceClass,
  setServiceClass,
  loading,
  canCalculate,
  onCalculate,
}: {
  tariffOptions: TariffDropdownOption[];
  pickup: string;
  dropoff: string;
  setPickup: (value: string) => void;
  setDropoff: (value: string) => void;
  passengers: number;
  setPassengers: (value: number) => void;
  luggage: number;
  setLuggage: (value: number) => void;
  serviceClass: ServiceClass;
  setServiceClass: (value: ServiceClass) => void;
  loading: boolean;
  canCalculate: boolean;
  onCalculate: () => void;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
          Dispatch Console
        </p>
        <p className="mt-1 text-sm font-semibold text-white/45">
          Select official taxi zones, passengers, luggage, and service type.
        </p>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_auto_1fr] xl:items-center">
        <LocationSelect
          icon={<MapPin className="h-5 w-5" />}
          label="Pickup Zone"
          value={pickup}
          options={tariffOptions}
          onChange={setPickup}
        />

        <div className="hidden h-px w-14 bg-gradient-to-r from-emerald-300 to-sky-300 xl:block" />

        <LocationSelect
          icon={<Navigation className="h-5 w-5" />}
          label="Dropoff Zone"
          value={dropoff}
          options={tariffOptions}
          onChange={setDropoff}
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <CounterCard
          icon={<Users className="h-5 w-5" />}
          label="Passengers"
          value={passengers}
          min={1}
          max={12}
          setValue={setPassengers}
        />

        <CounterCard
          icon={<Briefcase className="h-5 w-5" />}
          label="Luggage"
          value={luggage}
          min={0}
          max={10}
          setValue={setLuggage}
        />

        <ServiceToggle serviceClass={serviceClass} setServiceClass={setServiceClass} />
      </div>

      <button
        type="button"
        onClick={onCalculate}
        disabled={!canCalculate || loading}
        className="mt-5 flex w-full items-center justify-center gap-3 rounded-[1.75rem] bg-emerald-300 px-6 py-5 text-xs font-black uppercase tracking-[0.28em] text-slate-950 shadow-2xl transition hover:bg-white active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Car className="h-5 w-5" />}
        Calculate Fare
      </button>
    </section>
  );
}

function LocationSelect({
  label,
  value,
  options,
  onChange,
  icon,
}: {
  label: string;
  value: string;
  options: TariffDropdownOption[];
  onChange: (value: string) => void;
  icon: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = options.find((option) => !option.isHeader && option.value === value);

  const filteredOptions = options.filter((option) => {
    if (option.isHeader) return true;

    const q = search.toLowerCase().trim();
    if (!q) return true;

    return (
      option.label.toLowerCase().includes(q) ||
      option.value.toLowerCase().includes(q)
    );
  });

  return (
    <div className="relative z-40">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="w-full rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4 text-left transition hover:bg-slate-900"
      >
        <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300">
          {icon}
          {label}
        </div>

        <p className="text-lg font-black text-white">
          {selected && !selected.isHeader ? selected.label : "Select official taxi zone"}
        </p>

        {selected && !selected.isHeader ? (
          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">
            {selected.value}
          </p>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-full z-[100] mt-3 max-h-96 w-full overflow-y-auto rounded-3xl border border-white/10 bg-slate-950 p-3 shadow-2xl">
          <input
            autoFocus
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search zone name or ID..."
            className="mb-3 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-white/35"
          />

          {filteredOptions.map((option, index) =>
            option.isHeader ? (
              <div
                key={`${option.label}-${index}`}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300/70"
              >
                {option.label}
              </div>
            ) : (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                  setSearch("");
                }}
                className="w-full rounded-2xl px-4 py-3 text-left transition hover:bg-white/10"
              >
                <p className="text-sm font-black text-white">{option.label}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">
                  {option.value}
                </p>
              </button>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}

function CounterCard({
  icon,
  label,
  value,
  min,
  max,
  setValue,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  min: number;
  max: number;
  setValue: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-emerald-300">
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
            {label}
          </p>
          <p className="mt-1 text-lg font-black">{value}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setValue(Math.max(min, value - 1))}
          className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 font-black"
        >
          -
        </button>
        <button
          type="button"
          onClick={() => setValue(Math.min(max, value + 1))}
          className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 font-black"
        >
          +
        </button>
      </div>
    </div>
  );
}

function ServiceToggle({
  serviceClass,
  setServiceClass,
}: {
  serviceClass: ServiceClass;
  setServiceClass: (value: ServiceClass) => void;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
        Service
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setServiceClass("shared")}
          className={cn(
            "rounded-xl px-3 py-3 text-xs font-black uppercase tracking-[0.14em]",
            serviceClass === "shared"
              ? "bg-emerald-300 text-slate-950"
              : "bg-white/10 text-white",
          )}
        >
          Shared
        </button>

        <button
          type="button"
          onClick={() => setServiceClass("private")}
          className={cn(
            "rounded-xl px-3 py-3 text-xs font-black uppercase tracking-[0.14em]",
            serviceClass === "private"
              ? "bg-emerald-300 text-slate-950"
              : "bg-white/10 text-white",
          )}
        >
          Private
        </button>
      </div>
    </div>
  );
}

function QuickRoutes({
  activeIsland,
  onPick,
}: {
  activeIsland: IslandCode;
  onPick: (zoneId: string, tripType: TripType) => void;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl">
      <div className="mb-4">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
          Popular Routes
        </p>
        <p className="mt-1 text-sm font-semibold text-white/45">
          Fast-start destination presets for {islandLabels[activeIsland]}.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {quickRoutes[activeIsland].map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.zoneId}
              type="button"
              onClick={() => onPick(item.zoneId, item.tripType)}
              className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-left transition hover:border-emerald-300/50 hover:bg-white/10"
            >
              <Icon className="h-5 w-5 text-emerald-300" />
              <p className="mt-4 text-sm font-black text-white">{item.label}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">
                {item.tripType.replace("_", " ")}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function RoutePreview({
  pickupPoint,
  dropoffPoint,
  activeIsland,
}: {
  pickupPoint: ZonePoint | null;
  dropoffPoint: ZonePoint | null;
  activeIsland: IslandCode;
}) {
  const hasRoute = Boolean(pickupPoint && dropoffPoint);

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] shadow-2xl">
      <div className="p-4">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
          Route Preview
        </p>
        <p className="mt-1 text-sm font-semibold text-white/55">
          {islandLabels[activeIsland]} official zone route
        </p>
      </div>

      <div className="h-72 px-4 pb-4">
        {hasRoute ? (
          <RoutePreviewMap
            pickup={{
              lat: pickupPoint!.lat,
              lng: pickupPoint!.lng,
            }}
            dropoff={{
              lat: dropoffPoint!.lat,
              lng: dropoffPoint!.lng,
            }}
          />
        ) : (
          <div className="grid h-full place-items-center rounded-[2rem] bg-slate-950/70 px-6 text-center">
            <p className="text-sm font-semibold text-white/45">
              Select pickup and dropoff zones to preview the route map.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function RouteDot({
  label,
  value,
  alignRight = false,
}: {
  label: string;
  value: string;
  alignRight?: boolean;
}) {
  return (
    <div className={cn("min-w-0", alignRight && "text-right")}>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
        {label}
      </p>
      <p className="mt-1 max-w-[150px] truncate text-sm font-black text-white">
        {value}
      </p>
    </div>
  );
}

function CoordinateTile({ label, point }: { label: string; point: ZonePoint | null }) {
  return (
    <div className="rounded-2xl bg-black/30 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-bold text-white/70">
        {point ? `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}` : "—"}
      </p>
    </div>
  );
}

function TripSummary({
  quote,
  pickup,
  dropoff,
  pickupLabel,
  dropoffLabel,
  passengers,
  luggage,
  serviceClass,
  tripType,
  loading,
  canRequest,
  onRequest,
}: {
  quote: Trip["quote"] | null;
  pickup: string;
  dropoff: string;
  pickupLabel: string;
  dropoffLabel: string;
  passengers: number;
  luggage: number;
  serviceClass: ServiceClass;
  tripType: TripType;
  loading: boolean;
  canRequest: boolean;
  onRequest: () => void;
}) {
  return (
    <motion.div
      key="summary"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[2rem] bg-white p-6 text-slate-950 shadow-2xl"
    >
      <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
        Trip Summary
      </p>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black">Trip Quote</h2>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            {serviceClass} · {tripType.replace("_", " ")}
          </p>
        </div>

        <p className="text-5xl font-black">${quote?.total ?? "—"}</p>
      </div>

      <div className="mt-6 space-y-3">
        <QuoteLine label="Pickup Zone" value={pickupLabel || pickup || "Not selected"} />
        <QuoteLine label="Pickup ID" value={pickup || "—"} />
        <QuoteLine label="Dropoff Zone" value={dropoffLabel || dropoff || "Not selected"} />
        <QuoteLine label="Dropoff ID" value={dropoff || "—"} />
        <QuoteLine label="Passengers" value={String(passengers)} />
        <QuoteLine label="Luggage" value={String(luggage)} />
        <QuoteLine label="Base Fare" value={quote ? `$${quote.baseFare}` : "Calculate fare"} />
        {quote && quote.luggageFee > 0 ? (
          <QuoteLine label="Luggage Fee" value={`$${quote.luggageFee}`} />
        ) : null}
        {quote && quote.waitingFee > 0 ? (
          <QuoteLine label="Waiting Fee" value={`$${quote.waitingFee}`} />
        ) : null}
        {quote && quote.premiumFee > 0 ? (
          <QuoteLine label="Premium" value={`$${quote.premiumFee}`} />
        ) : null}
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-800">
        <CheckCircle2 className="h-5 w-5" />
        <p className="text-xs font-black uppercase tracking-[0.16em]">
          Licensed driver network
        </p>
      </div>

      <button
        type="button"
        onClick={onRequest}
        disabled={!quote || loading || !canRequest}
        className="mt-5 w-full rounded-2xl bg-slate-950 px-4 py-4 text-xs font-black uppercase tracking-[0.2em] text-white disabled:opacity-40"
      >
        {loading ? "Requesting..." : canRequest ? "Request Ride" : "Login Required"}
      </button>
    </motion.div>
  );
}

function QuoteLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-3 text-sm">
      <span className="font-bold text-slate-400">{label}</span>
      <span className="text-right font-black">{value}</span>
    </div>
  );
}

function SafetyCard() {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl">
      <p className="flex items-center gap-2 text-sm font-black text-emerald-300">
        <Shield className="h-4 w-4" />
        Territory Certified
      </p>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-white/55">
        Every booking is built around official zones, transparent fare calculation,
        passenger count, luggage count, and licensed-driver dispatch readiness.
      </p>
    </div>
  );
}

function TrackingPanel({ trip, onCancel }: { trip: Trip; onCancel: () => void }) {
  return (
    <motion.div
      key="tracking"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[2rem] bg-white p-6 text-slate-950 shadow-2xl"
    >
      <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-emerald-100 text-emerald-700">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>

      <h2 className="mt-5 text-center text-3xl font-black">Finding Your Driver</h2>
      <p className="mt-2 text-center text-sm font-semibold text-slate-500">
        Matching with the best licensed operator nearby.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-slate-100 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Status
          </p>
          <p className="mt-2 text-sm font-black">{trip.status.replace("_", " ")}</p>
        </div>
        <div className="rounded-2xl bg-slate-100 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Trip
          </p>
          <p className="mt-2 text-sm font-black">#{trip.id.slice(-6)}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onCancel}
        className="mt-5 w-full rounded-2xl border border-rose-200 px-4 py-4 text-xs font-black uppercase tracking-[0.2em] text-rose-600"
      >
        Cancel Request
      </button>
    </motion.div>
  );
}