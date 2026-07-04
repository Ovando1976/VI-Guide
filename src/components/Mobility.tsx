import type React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Anchor,
  Briefcase,
  Car,
  CheckCircle2,
  FileText,
  Loader2,
  MapPin,
  MapPinned,
  Navigation,
  Plane,
  Shield,
  Ship,
  Sparkles,
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

type QuickRoute = {
  label: string;
  zoneId: string;
  tripType: TripType;
  icon: React.ElementType;
  note: string;
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

const islandHeroHints: Record<IslandCode, string[]> = {
  st_thomas: ["Airport", "Red Hook", "Havensight", "Crown Bay"],
  st_john: ["Cruz Bay", "Coral Bay", "Trunk Bay", "Westin"],
  st_croix: ["Airport", "Christiansted", "Frederiksted", "Sunny Isle"],
  water_island: ["Ferry Landing", "Honeymoon Beach", "Phillips Landing"],
};

const quickRoutes: Record<IslandCode, QuickRoute[]> = {
  st_thomas: [
    {
      label: "Cyril E. King Airport",
      zoneId: "stt_airport",
      tripType: "airport",
      icon: Plane,
      note: "Airport arrival or departure",
    },
    {
      label: "Red Hook Ferry Terminal",
      zoneId: "stt_red_hook",
      tripType: "ferry_transfer",
      icon: Ship,
      note: "Ferry transfer to St. John",
    },
    {
      label: "Havensight / WICO",
      zoneId: "stt_havensight",
      tripType: "cruise",
      icon: Anchor,
      note: "Cruise dock and shopping",
    },
    {
      label: "Crown Bay Marina & Port",
      zoneId: "stt_crown_bay",
      tripType: "cruise",
      icon: Anchor,
      note: "Cruise, marina, and ferry access",
    },
  ],
  st_john: [
    {
      label: "Cruz Bay Ferry Dock",
      zoneId: "stj_cruz_bay",
      tripType: "ferry_transfer",
      icon: Ship,
      note: "Main ferry arrival zone",
    },
    {
      label: "Coral Bay",
      zoneId: "stj_coral_bay",
      tripType: "direct",
      icon: Navigation,
      note: "East-end island transfer",
    },
    {
      label: "Trunk Bay Beach",
      zoneId: "stj_trunk_bay",
      tripType: "direct",
      icon: Navigation,
      note: "Beach and visitor route",
    },
    {
      label: "The Westin Resort",
      zoneId: "stj_westin",
      tripType: "direct",
      icon: Car,
      note: "Hotel and resort transfer",
    },
  ],
  st_croix: [
    {
      label: "Henry E. Rohlsen Airport",
      zoneId: "stx_airport",
      tripType: "airport",
      icon: Plane,
      note: "Airport pickup or dropoff",
    },
    {
      label: "Christiansted Town",
      zoneId: "stx_christiansted",
      tripType: "direct",
      icon: Navigation,
      note: "Town, harbor, and dining",
    },
    {
      label: "Frederiksted Town & Pier",
      zoneId: "stx_frederiksted",
      tripType: "cruise",
      icon: Anchor,
      note: "Pier, town, and cruise traffic",
    },
    {
      label: "Sunny Isle Shopping Center",
      zoneId: "stx_sunny_isle",
      tripType: "direct",
      icon: Car,
      note: "Shopping and central island",
    },
  ],
  water_island: [
    {
      label: "Water Island General",
      zoneId: "wat_general",
      tripType: "direct",
      icon: Navigation,
      note: "General local transfer",
    },
    {
      label: "Honeymoon Beach",
      zoneId: "wat_honeymoon_beach",
      tripType: "direct",
      icon: Navigation,
      note: "Beach route",
    },
    {
      label: "Phillips Landing Ferry Dock",
      zoneId: "wat_phillips_landing",
      tripType: "ferry_transfer",
      icon: Ship,
      note: "Ferry landing route",
    },
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
  if (text.includes("ferry") || text.includes("red_hook") || text.includes("cruz_bay")) {
    return "ferry";
  }
  if (text.includes("beach") || text.includes("bay")) return "beach";
  if (
    text.includes("hotel") ||
    text.includes("resort") ||
    text.includes("ritz") ||
    text.includes("westin")
  ) {
    return "hotel";
  }
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

function validTripType(value: string | null): value is TripType {
  return (
    value === "direct" ||
    value === "airport" ||
    value === "ferry_transfer" ||
    value === "cruise"
  );
}

function validService(value: string | null): value is ServiceClass {
  return value === "shared" || value === "private";
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const pickupParam = params.get("pickup");
    const dropoffParam = params.get("dropoff");
    const tripTypeParam = params.get("tripType");
    const serviceParam = params.get("service");
    const passengerParam = Number(params.get("passengers") || "");
    const luggageParam = Number(params.get("luggage") || "");

    if (pickupParam) setPickup(pickupParam);
    if (dropoffParam) setDropoff(dropoffParam);
    if (validTripType(tripTypeParam)) setTripType(tripTypeParam);
    if (validService(serviceParam)) setServiceClass(serviceParam);

    if (Number.isFinite(passengerParam) && passengerParam > 0) {
      setPassengers(Math.min(12, Math.max(1, passengerParam)));
    }

    if (Number.isFinite(luggageParam) && luggageParam >= 0) {
      setLuggage(Math.min(10, Math.max(0, luggageParam)));
    }

    if (pickupParam || dropoffParam) {
      setQuote(null);
      setStep("request");
    }
  }, []);

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

  function setPickupZone(value: string) {
    setPickup(value);
    setQuote(null);
    setStep("request");
  }

  function setDropoffZone(value: string) {
    setDropoff(value);
    setQuote(null);
    setStep("request");
  }

  function selectQuickRoute(zoneId: string, type: TripType, mode: "pickup" | "dropoff") {
    if (mode === "pickup") setPickup(zoneId);
    if (mode === "dropoff") setDropoff(zoneId);

    setTripType(type);
    setQuote(null);
    setStep("request");
  }

  function swapRoute() {
    setPickup(dropoff);
    setDropoff(pickup);
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
    if (!quote) return;

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
        riderId: user?.uid || "guest",
        customerName: user?.displayName || user?.email || "Guest rider",
        customerEmail: user?.email || "",
        customerPhone: user?.phoneNumber || "",
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
    <main className="min-h-screen overflow-x-hidden bg-[#05070b] pb-28 text-white xl:pb-0">
      <section className="relative border-b border-white/10 bg-[radial-gradient(circle_at_16%_0%,rgba(16,185,129,0.24),transparent_32%),radial-gradient(circle_at_82%_10%,rgba(14,165,233,0.16),transparent_34%),linear-gradient(135deg,#020617,#061016_52%,#03120d)] px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.32em] text-emerald-300">
                VI Guide Mobility
              </p>

              <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
                <h1 className="font-serif text-5xl font-black leading-none tracking-[-0.055em] sm:text-7xl">
                  Territory Mobility
                </h1>

                <IslandSelector selected={activeIsland} onSelect={resetForIsland} />
              </div>

              <p className="mt-5 max-w-3xl text-sm font-semibold leading-7 text-white/62 sm:text-base">
                {islandSubtitles[activeIsland]}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {islandHeroHints[activeIsland].map((hint) => (
                  <span
                    key={hint}
                    className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/55"
                  >
                    {hint}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:w-[520px]">
              <StatusMetric label="Status" value="Operational" />
              <StatusMetric label="Mode" value={serviceClass} />
              <StatusMetric label="Quote" value={quote ? `$${quote.total}` : "Ready"} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_430px]">
        <div className="space-y-5">
          <DispatchConsole
            tariffOptions={tariffOptions}
            pickup={pickup}
            dropoff={dropoff}
            setPickup={setPickupZone}
            setDropoff={setDropoffZone}
            onSwap={swapRoute}
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
            tripType={tripType}
            setTripType={(value) => {
              setTripType(value);
              setQuote(null);
              setStep("request");
            }}
            loading={loading}
            canCalculate={Boolean(pickup && dropoff)}
            onCalculate={handleGetQuote}
          />

          <QuickRoutes
            activeIsland={activeIsland}
            onPickPickup={(zoneId, type) => selectQuickRoute(zoneId, type, "pickup")}
            onPickDropoff={(zoneId, type) => selectQuickRoute(zoneId, type, "dropoff")}
          />
        </div>

        <aside className="space-y-5">
          <RoutePreview
            pickupPoint={getZonePoint(pickup)}
            dropoffPoint={getZonePoint(dropoff)}
            activeIsland={activeIsland}
          />

          <LocalRouteNotes
            activeIsland={activeIsland}
            pickupLabel={pickupLabel}
            dropoffLabel={dropoffLabel}
            pickup={pickup}
            dropoff={dropoff}
            tripType={tripType}
            serviceClass={serviceClass}
            quote={quote}
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
              activeIsland={activeIsland}
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
              canRequest={true}
              onRequest={handleRequestRide}
            />
          )}

          <MobilityHandoffPanel
            activeIsland={activeIsland}
            pickup={pickup}
            dropoff={dropoff}
            pickupLabel={pickupLabel}
            dropoffLabel={dropoffLabel}
            quote={quote}
            passengers={passengers}
            luggage={luggage}
            serviceClass={serviceClass}
            tripType={tripType}
          />

          <SafetyCard />
        </aside>
      </section>

      <MobileFareBar
        pickupLabel={pickupLabel}
        dropoffLabel={dropoffLabel}
        pickup={pickup}
        dropoff={dropoff}
        quote={quote}
        canCalculate={Boolean(pickup && dropoff)}
        loading={loading}
        onCalculate={handleGetQuote}
      />
    </main>
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
        {(["shared", "private"] as ServiceClass[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setServiceClass(value)}
            className={cn(
              "rounded-xl px-3 py-3 text-xs font-black uppercase tracking-[0.14em]",
              serviceClass === value
                ? "bg-emerald-300 text-slate-950"
                : "bg-white/10 text-white",
            )}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  );
}

function TripTypeToggle({
  tripType,
  setTripType,
}: {
  tripType: TripType;
  setTripType: (value: TripType) => void;
}) {
  const items: Array<{ value: TripType; label: string }> = [
    { value: "direct", label: "Direct" },
    { value: "airport", label: "Airport" },
    { value: "ferry_transfer", label: "Ferry" },
    { value: "cruise", label: "Cruise" },
  ];

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
        Trip Type
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {items.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setTripType(item.value)}
            className={cn(
              "rounded-xl px-3 py-3 text-[10px] font-black uppercase tracking-[0.12em]",
              tripType === item.value
                ? "bg-emerald-300 text-slate-950"
                : "bg-white/10 text-white",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function QuickRoutes({
  activeIsland,
  onPickPickup,
  onPickDropoff,
}: {
  activeIsland: IslandCode;
  onPickPickup: (zoneId: string, tripType: TripType) => void;
  onPickDropoff: (zoneId: string, tripType: TripType) => void;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl">
      <div className="mb-4">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
          Popular Routes
        </p>
        <p className="mt-1 text-sm font-semibold text-white/45">
          Fast-start pickup or destination presets for {islandLabels[activeIsland]}.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {quickRoutes[activeIsland].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.zoneId}
              className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-left transition hover:border-emerald-300/50 hover:bg-white/10"
            >
              <Icon className="h-5 w-5 text-emerald-300" />
              <p className="mt-4 text-sm font-black text-white">{item.label}</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-white/45">
                {item.note}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onPickPickup(item.zoneId, item.tripType)}
                  className="rounded-xl bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white"
                >
                  Pickup
                </button>
                <button
                  type="button"
                  onClick={() => onPickDropoff(item.zoneId, item.tripType)}
                  className="rounded-xl bg-emerald-300 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-950"
                >
                  Dropoff
                </button>
              </div>
            </div>
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


function LocalRouteNotes({
  activeIsland,
  pickupLabel,
  dropoffLabel,
  pickup,
  dropoff,
  tripType,
  serviceClass,
  quote,
}: {
  activeIsland: IslandCode;
  pickupLabel: string;
  dropoffLabel: string;
  pickup: string;
  dropoff: string;
  tripType: TripType;
  serviceClass: ServiceClass;
  quote: Trip["quote"] | null;
}) {
  const pickupText = pickupLabel || pickup || "Pickup not selected";
  const dropoffText = dropoffLabel || dropoff || "Dropoff not selected";
  const routeReady = Boolean(pickup && dropoff);

  const notes = [
    routeReady
      ? `Official ${islandLabels[activeIsland]} taxi-zone estimate.`
      : `Choose both official zones to create a dispatch-ready estimate.`,
    tripType === "ferry_transfer"
      ? "Good for ferry timing, dock pickup, and inter-island handoff planning."
      : tripType === "cruise"
        ? "Good for cruise day routing, port return timing, and visitor coordination."
        : tripType === "airport"
          ? "Good for airport arrival, luggage count, and hotel or villa transfer planning."
          : "Good for hotel, villa, beach, estate, and local point-to-point routing.",
    serviceClass === "private"
      ? "Private service selected for direct pickup and fewer shared-route assumptions."
      : "Shared service selected for a basic local fare estimate.",
  ];

  return (
    <section className="rounded-[2rem] border border-amber-200/20 bg-[#f5e8c8] p-5 text-[#182018] shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">
            Local Route Notes
          </p>
          <h3 className="mt-2 text-2xl font-black tracking-tight">
            {pickupText} → {dropoffText}
          </h3>
        </div>

        <MapPin className="h-6 w-6 text-emerald-800" />
      </div>

      <div className="mt-4 space-y-3">
        {notes.map((note) => (
          <div
            key={note}
            className="flex gap-3 rounded-2xl border border-amber-900/10 bg-white/45 p-3"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800" />
            <p className="text-sm font-bold leading-6 text-slate-800">{note}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <LocalMiniStat label="Trip" value={tripType.replace("_", " ")} />
        <LocalMiniStat label="Service" value={serviceClass} />
        <LocalMiniStat label="Fare" value={quote ? `$${quote.total}` : "Pending"} />
      </div>
    </section>
  );
}

function LocalMiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-amber-950/10 p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-black capitalize text-slate-950">
        {value}
      </p>
    </div>
  );
}

function MobileFareBar({
  pickupLabel,
  dropoffLabel,
  pickup,
  dropoff,
  quote,
  canCalculate,
  loading,
  onCalculate,
}: {
  pickupLabel: string;
  dropoffLabel: string;
  pickup: string;
  dropoff: string;
  quote: Trip["quote"] | null;
  canCalculate: boolean;
  loading: boolean;
  onCalculate: () => void;
}) {
  const routeText =
    pickup || dropoff
      ? `${pickupLabel || pickup || "Pickup"} → ${dropoffLabel || dropoff || "Dropoff"}`
      : "Select pickup and dropoff";

  return (
    <div className="fixed inset-x-3 bottom-3 z-[80] rounded-[1.5rem] border border-white/10 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-xl xl:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-black text-white">{routeText}</p>
          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">
            {quote ? `Estimated fare $${quote.total}` : "Fare not calculated"}
          </p>
        </div>

        <button
          type="button"
          onClick={onCalculate}
          disabled={!canCalculate || loading}
          className="shrink-0 rounded-2xl bg-emerald-300 px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-slate-950 disabled:opacity-40"
        >
          {loading ? "..." : quote ? `$${quote.total}` : "Fare"}
        </button>
      </div>
    </div>
  );
}


function MobilityHandoffPanel({
  activeIsland,
  pickup,
  dropoff,
  pickupLabel,
  dropoffLabel,
  quote,
  passengers,
  luggage,
  serviceClass,
  tripType,
}: {
  activeIsland: IslandCode;
  pickup: string;
  dropoff: string;
  pickupLabel: string;
  dropoffLabel: string;
  quote: Trip["quote"] | null;
  passengers: number;
  luggage: number;
  serviceClass: ServiceClass;
  tripType: TripType;
}) {
  const [copied, setCopied] = useState(false);

  const hasRoute = Boolean(pickup || dropoff);
  const pickupText = pickupLabel || pickup || "Not selected";
  const dropoffText = dropoffLabel || dropoff || "Not selected";

  const brief = [
    "VI Guide Mobility Brief",
    "",
    `Island: ${islandLabels[activeIsland]}`,
    `Pickup: ${pickupText}`,
    `Dropoff: ${dropoffText}`,
    `Trip type: ${tripType.replace("_", " ")}`,
    `Service: ${serviceClass}`,
    `Passengers: ${passengers}`,
    `Luggage: ${luggage}`,
    `Quoted fare: ${quote ? `$${quote.total}` : "Not calculated"}`,
  ].join("\n");

  const mapHref =
    `/map?island=${activeIsland}` +
    `&pickup=${encodeURIComponent(pickup)}` +
    `&dropoff=${encodeURIComponent(dropoff)}`;

  const conciergeHref =
    `/concierge?agentId=concierge&topic=mobility` +
    `&context=${encodeURIComponent(brief)}`;

  async function copyBrief() {
    try {
      await navigator.clipboard.writeText(brief);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-emerald-300/20 bg-[radial-gradient(circle_at_0%_0%,rgba(16,185,129,0.18),transparent_34%),rgba(255,255,255,0.055)] p-5 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
            Island Handoff
          </p>
          <h3 className="mt-2 text-2xl font-black tracking-tight">
            Connect this ride to your island plan.
          </h3>
        </div>

        <Sparkles className="h-6 w-6 text-emerald-300" />
      </div>

      <div className="mt-4 grid gap-3">
        <a
          href={mapHref}
          className={cn(
            "flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-sm font-black text-white transition hover:border-emerald-300/50 hover:bg-white/10",
            !hasRoute && "pointer-events-none opacity-45",
          )}
        >
          <span className="flex items-center gap-3">
            <MapPinned className="h-5 w-5 text-emerald-300" />
            Open on Island Map
          </span>
          <span>→</span>
        </a>

        <a
          href={conciergeHref}
          className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-sm font-black text-white transition hover:border-emerald-300/50 hover:bg-white/10"
        >
          <span className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-emerald-300" />
            Ask Concierge
          </span>
          <span>→</span>
        </a>

        <button
          type="button"
          onClick={() => void copyBrief()}
          className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-left text-sm font-black text-white transition hover:border-emerald-300/50 hover:bg-white/10"
        >
          <span className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-emerald-300" />
            {copied ? "Dispatch Brief Copied" : "Copy Dispatch Brief"}
          </span>
          <span>↗</span>
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
          Current route
        </p>
        <p className="mt-2 text-sm font-bold leading-6 text-white/75">
          {pickupText} → {dropoffText}
        </p>
      </div>
    </section>
  );
}

function TripSummary({
  activeIsland,
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
  activeIsland: IslandCode;
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
  const pickupText = pickupLabel || pickup || "Pickup not selected";
  const dropoffText = dropoffLabel || dropoff || "Dropoff not selected";
  const dispatchBrief = [
    "VI Guide Ride Request",
    "",
    `Island: ${islandLabels[activeIsland]}`,
    `Pickup: ${pickupText}`,
    `Dropoff: ${dropoffText}`,
    `Trip type: ${tripType.replace("_", " ")}`,
    `Service: ${serviceClass}`,
    `Passengers: ${passengers}`,
    `Luggage: ${luggage}`,
    `Estimated fare: ${quote ? `$${quote.total}` : "Not calculated"}`,
    "",
    "Please help coordinate this ride request.",
  ].join("\n");

  const conciergeHref =
    `/concierge?agentId=concierge&topic=mobility` +
    `&context=${encodeURIComponent(dispatchBrief)}`;

  return (
    <motion.div
      key="summary"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[2rem] border border-amber-200/70 bg-[#fff6dc] p-6 text-slate-950 shadow-2xl"
    >
      <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">
        Island Fare Summary
      </p>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black">Local Trip Quote</h2>
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
          USVI Taxi-Zone Dispatch
        </p>
      </div>

      {canRequest ? (
        <button
          type="button"
          onClick={onRequest}
          disabled={!quote || loading}
          className="mt-5 w-full rounded-2xl bg-slate-950 px-4 py-4 text-xs font-black uppercase tracking-[0.2em] text-white disabled:opacity-40"
        >
          {loading ? "Requesting..." : "Send to Dispatch"}
        </button>
      ) : (
        <a
          href={conciergeHref}
          className={cn(
            "mt-5 block w-full rounded-2xl px-4 py-4 text-center text-xs font-black uppercase tracking-[0.2em]",
            quote
              ? "bg-slate-950 text-white"
              : "pointer-events-none bg-slate-400 text-white opacity-50",
          )}
        >
          Send to Dispatch
        </a>
      )}
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
        USVI Taxi-Zone Ready
      </p>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-white/55">
        Built for official USVI taxi-zone estimates, hotel concierge planning,
        airport and ferry transfers, cruise-day coordination, and visitor route handoffs.
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
      className="rounded-[2rem] border border-amber-200/70 bg-[#fff6dc] p-6 text-slate-950 shadow-2xl"
    >
      <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-emerald-100 text-emerald-700">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>

      <h2 className="mt-5 text-center text-3xl font-black">Request Sent to Dispatch</h2>
      <p className="mt-2 text-center text-sm font-semibold text-slate-500">
        Your ride request is now in the admin dispatch board for driver assignment.
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
        Close Request View
      </button>
    </motion.div>
  );
}

function StatusMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.055] px-5 py-4 shadow-2xl backdrop-blur-xl">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
        {label}
      </p>
      <p className="mt-2 truncate text-sm font-black capitalize text-emerald-300">
        {value}
      </p>
    </div>
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
  onSwap,
  passengers,
  setPassengers,
  luggage,
  setLuggage,
  serviceClass,
  setServiceClass,
  tripType,
  setTripType,
  loading,
  canCalculate,
  onCalculate,
}: {
  tariffOptions: TariffDropdownOption[];
  pickup: string;
  dropoff: string;
  setPickup: (value: string) => void;
  setDropoff: (value: string) => void;
  onSwap: () => void;
  passengers: number;
  setPassengers: (value: number) => void;
  luggage: number;
  setLuggage: (value: number) => void;
  serviceClass: ServiceClass;
  setServiceClass: (value: ServiceClass) => void;
  tripType: TripType;
  setTripType: (value: TripType) => void;
  loading: boolean;
  canCalculate: boolean;
  onCalculate: () => void;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
            Dispatch Console
          </p>
          <p className="mt-1 text-sm font-semibold text-white/45">
            Select official taxi zones, trip type, passengers, luggage, and service.
          </p>
        </div>

        <button
          type="button"
          onClick={onSwap}
          disabled={!pickup && !dropoff}
          className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black text-white disabled:opacity-40"
        >
          Swap route
        </button>
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

      <div className="mt-5 grid gap-4 lg:grid-cols-4">
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

        <TripTypeToggle tripType={tripType} setTripType={setTripType} />
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
    return option.label.toLowerCase().includes(q) || option.value.toLowerCase().includes(q);
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
``