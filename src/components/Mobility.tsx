import { useMemo, useState } from "react";
import {
  Anchor,
  ArrowLeft,
  Briefcase,
  Car,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Navigation,
  Plane,
  Search,
  Shield,
  Ship,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { canonicalDiscoveries as discoveries } from "../data/canonical/discoveriesCanonical";
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

type SearchTarget = "pickup" | "dropoff" | null;

type LocationOption = {
  id: string;
  label: string;
  type: string;
  island: IslandCode;
  lat: number;
  lng: number;
  description?: string;
  estateName?: string;
  parcelId?: string;
};

const islandLabels: Record<IslandCode, string> = {
  st_thomas: "St. Thomas",
  st_john: "St. John",
  st_croix: "St. Croix",
  water_island: "Water Island",
};

function toMobilityIsland(island: IslandCode): MobilityIsland {
  if (island === "st_thomas") return "stt";
  if (island === "st_john") return "stj";
  if (island === "st_croix") return "stx";
  return "wat";
}

function normalizeIsland(value: unknown): IslandCode {
  const text = String(value ?? "").toLowerCase().trim();

  if (text === "stt" || text.includes("thomas")) return "st_thomas";
  if (text === "stj" || text.includes("john")) return "st_john";
  if (text === "stx" || text.includes("croix")) return "st_croix";
  if (text.includes("water")) return "water_island";

  if (
    text === "st_thomas" ||
    text === "st_john" ||
    text === "st_croix" ||
    text === "water_island"
  ) {
    return text;
  }

  return "st_thomas";
}

function displayType(value: unknown) {
  const text = String(value ?? "").toLowerCase();

  if (text.includes("beach")) return "Beach";
  if (text.includes("restaurant") || text.includes("food")) return "Food";
  if (text.includes("event")) return "Event";
  if (text.includes("historic") || text.includes("history")) return "History";
  if (text.includes("ferry")) return "Ferry";
  if (text.includes("cruise")) return "Cruise";
  if (text.includes("transport")) return "Transport";
  if (text.includes("business")) return "Business";
  if (text.includes("estate")) return "Estate";
  if (text.includes("attraction")) return "Attraction";

  return "Place";
}

function getLatLng(record: (typeof discoveries)[number]) {
  const lat = record.lat;
  const lng = record.lng;

  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng };
}

function buildLocationOptions(island: IslandCode): LocationOption[] {
  const options = discoveries
    .filter((record) => normalizeIsland(record.island) === island)
    .map((record) => {
      const coords = getLatLng(record);
      if (!coords) return null;

      const type = displayType(record.category ?? record.type);

      const option: LocationOption = {
        id: String(record.id),
        label:
          record.title || "Untitled Place",
        type,
        island,
        lat: coords.lat,
        lng: coords.lng,
        description:
          record.description || "",
        estateName: undefined,
        parcelId: undefined,
      };

      return option;
    })
    .filter((item): item is LocationOption => item !== null);

  return options.sort((a, b) => a.label.localeCompare(b.label));
}

function scoreLocation(item: LocationOption, query: string) {
  const q = query.toLowerCase().trim();
  const label = item.label.toLowerCase();
  const type = item.type.toLowerCase();
  const description = String(item.description ?? "").toLowerCase();

  if (!q) return 0;

  let score = 0;
  if (label === q) score += 1000;
  if (label.startsWith(q)) score += 500;
  if (label.includes(q)) score += 250;
  if (type.includes(q)) score += 100;
  if (description.includes(q)) score += 60;

  return score;
}

function estimateDistanceMiles(
  a: LocationOption | null,
  b: LocationOption | null,
) {
  if (!a || !b) return null;

  const r = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * r * Math.asin(Math.sqrt(h));
}

export default function Mobility({ selectedIsland, user }: MobilityProps) {
  const mobilityIsland = toMobilityIsland(selectedIsland);

  const [step, setStep] = useState<"request" | "quote" | "tracking">("request");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [pickupContext, setPickupContext] = useState<LocationOption | null>(null);
  const [dropoffContext, setDropoffContext] = useState<LocationOption | null>(null);
  const [passengers, setPassengers] = useState(1);
  const [luggage, setLuggage] = useState(0);
  const [serviceClass, setServiceClass] = useState<ServiceClass>("shared");
  const [tripType, setTripType] = useState<TripType>("direct");
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<Trip["quote"] | null>(null);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [searchingFor, setSearchingFor] = useState<SearchTarget>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const locationOptions = useMemo(
    () => buildLocationOptions(selectedIsland),
    [selectedIsland],
  );

  const searchResults = useMemo(() => {
    const q = searchQuery.trim();

    if (q.length < 2) {
      return locationOptions.slice(0, 8);
    }

    return locationOptions
      .map((item) => ({ item, score: scoreLocation(item, q) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((entry) => entry.item);
  }, [locationOptions, searchQuery]);

  const distanceMiles = useMemo(
    () => estimateDistanceMiles(pickupContext, dropoffContext),
    [pickupContext, dropoffContext],
  );

  const estimatedMinutes = distanceMiles ? Math.max(8, Math.round(distanceMiles * 4)) : null;

  function selectLocation(option: LocationOption) {
    if (searchingFor === "pickup") {
      setPickup(option.label);
      setPickupContext(option);
    }

    if (searchingFor === "dropoff") {
      setDropoff(option.label);
      setDropoffContext(option);
    }

    setSearchingFor(null);
    setSearchQuery("");
  }

  function openSearch(target: SearchTarget) {
    setSearchingFor(target);
    setSearchQuery(target === "pickup" ? pickup : dropoff);
  }

  function quickTrip(type: TripType, label: string) {
    setTripType(type);
    setDropoff(label);

    const match = locationOptions.find((item) =>
      item.label.toLowerCase().includes(label.toLowerCase().split(" ")[0]),
    );

    if (match) setDropoffContext(match);
  }

  async function handleGetQuote() {
    if (!pickup || !dropoff) return;

    setLoading(true);

    try {
      const q = await calculateQuote({
        island: mobilityIsland,
        tripType,
        passengers,
        luggage,
        serviceClass,
        originZone: pickup,
        destinationZone: dropoff,
      });

      setQuote(q);
      setStep("quote");
    } catch (error) {
      console.error("Quote failed:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestRide() {
    if (!quote || !user) return;

    setLoading(true);

    try {
      const enrichedPickup = await enrichLocation({
        label: pickup,
        type: "custom",
        lat: pickupContext?.lat || 0,
        lng: pickupContext?.lng || 0,
        island: mobilityIsland,
        estateName: pickupContext?.estateName,
        parcelId: pickupContext?.parcelId,
      });

      const enrichedDropoff = await enrichLocation({
        label: dropoff,
        type: "custom",
        lat: dropoffContext?.lat || 0,
        lng: dropoffContext?.lng || 0,
        island: mobilityIsland,
        estateName: dropoffContext?.estateName,
        parcelId: dropoffContext?.parcelId,
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
    <main className="min-h-screen bg-[#061016] pb-32 text-white">
      <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_15%_10%,rgba(16,185,129,0.22),transparent_32%),radial-gradient(circle_at_90%_0%,rgba(56,189,248,0.2),transparent_35%),linear-gradient(135deg,#020617,#061016_55%,#052e2b)] px-5 py-7 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_380px]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-emerald-300">
              VI Guide Mobility
            </p>

            <h1 className="mt-3 text-5xl font-black leading-none tracking-tight sm:text-7xl">
              Territory Mobility
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/65 sm:text-base">
              Official taxi flow, estate-aware pickup, ferry transfers, cruise-day routing,
              live ride requests, and AI-ready island transportation.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatusTile label="Island" value={islandLabels[selectedIsland]} />
              <StatusTile label="Ferry" value="On Time" />
              <StatusTile label="Taxi Demand" value="Moderate" />
              <StatusTile label="Weather" value="84°" />
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-xl">
            <p className="flex items-center gap-2 text-sm font-black text-emerald-300">
              <Sparkles className="h-4 w-4" />
              AI Route Intelligence
            </p>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-white/65">
              <p>• Estate and discovery search is now local and instant.</p>
              <p>• Firebase is only used for live quotes and ride requests.</p>
              <p>• Route context is ready for official fare and driver matching.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-5">
          <TripTypePanel tripType={tripType} setTripType={setTripType} quickTrip={quickTrip} />

          <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl backdrop-blur-xl">
            <div className="grid gap-3">
              <LocationInput
                icon={<MapPin className="h-5 w-5" />}
                label="Pickup"
                value={pickup}
                placeholder="Estate, hotel, beach, business, ferry dock..."
                context={pickupContext}
                onFocus={() => openSearch("pickup")}
                onChange={setPickup}
              />

              <div className="mx-6 h-8 w-px bg-gradient-to-b from-emerald-300 to-sky-300" />

              <LocationInput
                icon={<Navigation className="h-5 w-5" />}
                label="Destination"
                value={dropoff}
                placeholder="Where to?"
                context={dropoffContext}
                onFocus={() => openSearch("dropoff")}
                onChange={setDropoff}
              />
            </div>

            <AnimatePresence>
              {searchingFor ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  className="absolute inset-x-0 top-full z-50 mt-3 overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 shadow-2xl"
                >
                  <div className="flex items-center gap-3 border-b border-white/10 p-4">
                    <Search className="h-5 w-5 text-emerald-300" />
                    <input
                      autoFocus
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search estates, beaches, restaurants, attractions..."
                      className="flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/35"
                    />
                    <button
                      type="button"
                      onClick={() => setSearchingFor(null)}
                      className="grid h-9 w-9 place-items-center rounded-full bg-white/10"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto p-2">
                    {searchResults.length > 0 ? (
                      searchResults.map((item) => (
                        <button
                          key={`${item.type}-${item.id}`}
                          type="button"
                          onClick={() => selectLocation(item)}
                          className="flex w-full items-center gap-4 rounded-2xl p-4 text-left transition hover:bg-white/10"
                        >
                          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-300/10 text-emerald-300">
                            <MapPin className="h-5 w-5" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-white">
                              {item.label}
                            </p>
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                              {item.type} · {islandLabels[item.island]}
                            </p>
                          </div>

                          <ArrowLeft className="h-4 w-4 rotate-180 text-white/25" />
                        </button>
                      ))
                    ) : (
                      <div className="p-10 text-center text-sm font-semibold text-white/45">
                        No matching locations found.
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <CounterCard icon={<Users className="h-5 w-5" />} label="Passengers" value={passengers} min={1} max={12} setValue={setPassengers} />
            <CounterCard icon={<Briefcase className="h-5 w-5" />} label="Luggage" value={luggage} min={0} max={10} setValue={setLuggage} />
          </div>

          <div className="grid gap-3 rounded-[2rem] border border-white/10 bg-white/[0.055] p-3 shadow-2xl sm:grid-cols-2">
            <ServiceButton active={serviceClass === "shared"} label="Shared Taxi" sublabel="Official rate" onClick={() => setServiceClass("shared")} />
            <ServiceButton active={serviceClass === "private"} label="Private SUV" sublabel="Premium ride" onClick={() => setServiceClass("private")} />
          </div>

          <button
            type="button"
            onClick={handleGetQuote}
            disabled={!pickup || !dropoff || loading}
            className="flex w-full items-center justify-center gap-3 rounded-[2rem] bg-emerald-300 px-6 py-5 text-xs font-black uppercase tracking-[0.28em] text-slate-950 shadow-2xl transition hover:bg-white active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Car className="h-5 w-5" />}
            Calculate Fare
          </button>
        </div>

        <aside className="space-y-5">
          <RoutePreview
            pickup={pickupContext}
            dropoff={dropoffContext}
            distanceMiles={distanceMiles}
            estimatedMinutes={estimatedMinutes}
          />

          <AnimatePresence mode="wait">
            {step === "quote" && quote ? (
              <QuotePanel
                quote={quote}
                pickup={pickup}
                dropoff={dropoff}
                serviceClass={serviceClass}
                tripType={tripType}
                loading={loading}
                onBack={() => setStep("request")}
                onRequest={handleRequestRide}
                canRequest={Boolean(user)}
              />
            ) : step === "tracking" && activeTrip ? (
              <TrackingPanel trip={activeTrip} onCancel={() => {
                setStep("request");
                setActiveTrip(null);
              }} />
            ) : (
              <InfoPanel />
            )}
          </AnimatePresence>
        </aside>
      </section>
    </main>
  );
}

function StatusTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4 shadow-xl">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">{label}</p>
      <p className="mt-2 text-lg font-black">{value}</p>
    </div>
  );
}

function TripTypePanel({
  tripType,
  setTripType,
  quickTrip,
}: {
  tripType: TripType;
  setTripType: (value: TripType) => void;
  quickTrip: (type: TripType, label: string) => void;
}) {
  const items = [
    { type: "airport" as TripType, label: "Airport", icon: Plane, action: () => quickTrip("airport", "Airport") },
    { type: "ferry_transfer" as TripType, label: "Ferry", icon: Ship, action: () => quickTrip("ferry_transfer", "Ferry") },
    { type: "cruise" as TripType, label: "Cruise", icon: Anchor, action: () => quickTrip("cruise", "Havensight") },
    { type: "direct" as TripType, label: "Point to Point", icon: Navigation, action: () => setTripType("direct") },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-4">
      {items.map(({ type, label, icon: Icon, action }) => (
        <button
          key={type}
          type="button"
          onClick={action}
          className={cn(
            "rounded-[2rem] border p-5 text-left shadow-xl transition hover:-translate-y-1",
            tripType === type
              ? "border-emerald-300 bg-emerald-300 text-slate-950"
              : "border-white/10 bg-white/[0.055] text-white hover:bg-white/10",
          )}
        >
          <Icon className="h-6 w-6" />
          <p className="mt-4 text-xs font-black uppercase tracking-[0.2em]">{label}</p>
        </button>
      ))}
    </div>
  );
}

function LocationInput({
  icon,
  label,
  value,
  placeholder,
  context,
  onFocus,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  placeholder: string;
  context: LocationOption | null;
  onFocus: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4">
      <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300">
        {icon}
        {label}
      </div>

      <input
        value={value}
        onFocus={onFocus}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-lg font-black text-white outline-none placeholder:text-white/30"
      />

      {context ? (
        <p className="mt-2 text-xs font-semibold text-white/45">
          {context.type} · {context.lat.toFixed(4)}, {context.lng.toFixed(4)}
        </p>
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
    <div className="flex items-center justify-between rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-xl">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-emerald-300">
          {icon}
        </div>
        <p className="text-sm font-black">{label}</p>
      </div>

      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setValue(Math.max(min, value - 1))} className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 font-black">-</button>
        <span className="w-5 text-center font-black">{value}</span>
        <button type="button" onClick={() => setValue(Math.min(max, value + 1))} className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 font-black">+</button>
      </div>
    </div>
  );
}

function ServiceButton({
  active,
  label,
  sublabel,
  onClick,
}: {
  active: boolean;
  label: string;
  sublabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[1.5rem] p-5 text-left transition",
        active ? "bg-white text-slate-950" : "bg-slate-950/70 text-white",
      )}
    >
      <p className="text-sm font-black">{label}</p>
      <p className={cn("mt-1 text-xs font-bold", active ? "text-slate-500" : "text-white/45")}>{sublabel}</p>
    </button>
  );
}

function RoutePreview({
  pickup,
  dropoff,
  distanceMiles,
  estimatedMinutes,
}: {
  pickup: LocationOption | null;
  dropoff: LocationOption | null;
  distanceMiles: number | null;
  estimatedMinutes: number | null;
}) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] shadow-2xl">
      <div className="h-56 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.35),transparent_24%),radial-gradient(circle_at_70%_65%,rgba(56,189,248,0.3),transparent_25%),linear-gradient(135deg,#020617,#064e3b)] p-5">
        <div className="flex h-full flex-col justify-between">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">Route Preview</p>

          <div className="rounded-2xl bg-black/35 p-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-emerald-300" />
              <div className="h-px flex-1 bg-white/30" />
              <span className="h-3 w-3 rounded-full bg-sky-300" />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <p className="truncate text-white/70">{pickup?.label ?? "Pickup pending"}</p>
              <p className="truncate text-right text-white/70">{dropoff?.label ?? "Destination pending"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-white/10 border-t border-white/10">
        <div className="p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Distance</p>
          <p className="mt-2 text-xl font-black">{distanceMiles ? `${distanceMiles.toFixed(1)} mi` : "—"}</p>
        </div>
        <div className="p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Time</p>
          <p className="mt-2 text-xl font-black">{estimatedMinutes ? `${estimatedMinutes} min` : "—"}</p>
        </div>
      </div>
    </div>
  );
}

function InfoPanel() {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 shadow-2xl">
      <p className="flex items-center gap-2 text-sm font-black text-emerald-300">
        <Shield className="h-4 w-4" />
        Official Mobility Layer
      </p>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-white/60">
        <p>Choose pickup and destination to calculate an official fare.</p>
        <p>Search includes exported discovery records, beaches, businesses, historic sites, attractions, and transit points.</p>
      </div>
    </div>
  );
}

function QuotePanel({
  quote,
  pickup,
  dropoff,
  serviceClass,
  tripType,
  loading,
  canRequest,
  onBack,
  onRequest,
}: {
  quote: Trip["quote"];
  pickup: string;
  dropoff: string;
  serviceClass: ServiceClass;
  tripType: TripType;
  loading: boolean;
  canRequest: boolean;
  onBack: () => void;
  onRequest: () => void;
}) {
  return (
    <motion.div
      key="quote"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      className="rounded-[2rem] border border-white/10 bg-white p-6 text-slate-950 shadow-2xl"
    >
      <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Estimated Fare</p>
      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black">Trip Quote</h2>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            {serviceClass} · {tripType.replace("_", " ")}
          </p>
        </div>
        <p className="text-5xl font-black">${quote.total}</p>
      </div>

      <div className="mt-6 space-y-3">
        <QuoteLine label="Pickup" value={pickup} />
        <QuoteLine label="Dropoff" value={dropoff} />
        <QuoteLine label="Base Fare" value={`$${quote.baseFare}`} />
        {quote.luggageFee > 0 ? <QuoteLine label="Luggage" value={`$${quote.luggageFee}`} /> : null}
        {quote.premiumFee > 0 ? <QuoteLine label="Premium" value={`$${quote.premiumFee}`} /> : null}
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-800">
        <CheckCircle2 className="h-5 w-5" />
        <p className="text-xs font-black uppercase tracking-[0.16em]">Licensed driver network</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button type="button" onClick={onBack} className="rounded-2xl border border-slate-200 px-4 py-4 text-xs font-black uppercase tracking-[0.2em]">
          Back
        </button>
        <button
          type="button"
          onClick={onRequest}
          disabled={loading || !canRequest}
          className="rounded-2xl bg-slate-950 px-4 py-4 text-xs font-black uppercase tracking-[0.2em] text-white disabled:opacity-40"
        >
          {loading ? "Requesting..." : canRequest ? "Request Ride" : "Login Required"}
        </button>
      </div>
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

function TrackingPanel({ trip, onCancel }: { trip: Trip; onCancel: () => void }) {
  return (
    <motion.div
      key="tracking"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[2rem] border border-white/10 bg-white p-6 text-slate-950 shadow-2xl"
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
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Status</p>
          <p className="mt-2 text-sm font-black">{trip.status.replace("_", " ")}</p>
        </div>
        <div className="rounded-2xl bg-slate-100 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Trip</p>
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