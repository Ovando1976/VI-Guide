import { useMemo, useState } from "react";
import {
  ArrowRight,
  Car,
  CheckCircle2,
  MapPin,
  Ship,
  Sparkles,
  Users,
} from "lucide-react";

type IslandCode = "st_thomas" | "st_john" | "st_croix";
type ServiceClass = "shared" | "private";

type MobilityProps = {
  selectedIsland?: string;
  user?: unknown;
};

type TripPoint = {
  id: string;
  name: string;
  island: IslandCode;
  kind: "airport" | "ferry" | "cruise" | "beach" | "town";
  zone: string;
};

const ISLAND_LABELS: Record<IslandCode, string> = {
  st_thomas: "St. Thomas",
  st_john: "St. John",
  st_croix: "St. Croix",
};

const POINTS: TripPoint[] = [
  {
    id: "stt_airport",
    name: "Cyril E. King Airport",
    island: "st_thomas",
    kind: "airport",
    zone: "Airport",
  },
  {
    id: "red_hook",
    name: "Red Hook Ferry Terminal",
    island: "st_thomas",
    kind: "ferry",
    zone: "Red Hook",
  },
  {
    id: "havensight",
    name: "Havensight Cruise Pier",
    island: "st_thomas",
    kind: "cruise",
    zone: "Havensight",
  },
  {
    id: "charlotte_amalie",
    name: "Charlotte Amalie",
    island: "st_thomas",
    kind: "town",
    zone: "Town",
  },
  {
    id: "magens_bay",
    name: "Magens Bay",
    island: "st_thomas",
    kind: "beach",
    zone: "Northside",
  },
  {
    id: "stj_cruz_bay",
    name: "Cruz Bay Ferry Terminal",
    island: "st_john",
    kind: "ferry",
    zone: "Cruz Bay",
  },
  {
    id: "trunk_bay",
    name: "Trunk Bay",
    island: "st_john",
    kind: "beach",
    zone: "North Shore",
  },
  {
    id: "stx_airport",
    name: "Henry E. Rohlsen Airport",
    island: "st_croix",
    kind: "airport",
    zone: "Airport",
  },
  {
    id: "christiansted",
    name: "Christiansted",
    island: "st_croix",
    kind: "town",
    zone: "Christiansted",
  },
  {
    id: "frederiksted",
    name: "Frederiksted",
    island: "st_croix",
    kind: "town",
    zone: "Frederiksted",
  },
];

const TEST_ROUTES: Array<[string, string]> = [
  ["stt_airport", "red_hook"],
  ["stt_airport", "trunk_bay"],
  ["havensight", "magens_bay"],
  ["stx_airport", "christiansted"],
  ["christiansted", "frederiksted"],
  ["stj_cruz_bay", "trunk_bay"],
];

function pointById(id: string): TripPoint {
  return POINTS.find((point) => point.id === id) ?? POINTS[0]!;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function routeLabel(originId: string, destinationId: string) {
  return `${pointById(originId).name} → ${pointById(destinationId).name}`;
}

function estimateFare(args: {
  origin: TripPoint;
  destination: TripPoint;
  passengers: number;
  luggage: number;
  serviceClass: ServiceClass;
}) {
  const { origin, destination, passengers, luggage, serviceClass } = args;

  let base = 12;

  if (origin.island !== destination.island) {
    base = 48;
  } else if (origin.kind === "airport" || destination.kind === "airport") {
    base = 22;
  } else if (origin.kind === "cruise" || destination.kind === "cruise") {
    base = 18;
  } else if (origin.zone !== destination.zone) {
    base = 16;
  }

  const passengerCharge = Math.max(0, passengers - 1) * 6;
  const luggageCharge = luggage * 2;
  const privateCharge = serviceClass === "private" ? 35 : 0;
  const connectorCharge = origin.island !== destination.island ? 18 : 0;

  return base + passengerCharge + luggageCharge + privateCharge + connectorCharge;
}

function defaultOriginForIsland(selectedIsland?: string) {
  if (selectedIsland === "st_john") return "stj_cruz_bay";
  if (selectedIsland === "st_croix") return "stx_airport";
  return "stt_airport";
}

export default function Mobility({ selectedIsland }: MobilityProps) {
  const [originId, setOriginId] = useState(() =>
    defaultOriginForIsland(selectedIsland)
  );
  const [destinationId, setDestinationId] = useState("red_hook");
  const [passengers, setPassengers] = useState(2);
  const [luggage, setLuggage] = useState(1);
  const [serviceClass, setServiceClass] = useState<ServiceClass>("shared");

  const origin = pointById(originId);
  const destination = pointById(destinationId);
  const isInterIsland = origin.island !== destination.island;

  const quote = useMemo(() => {
    return estimateFare({
      origin,
      destination,
      passengers,
      luggage,
      serviceClass,
    });
  }, [origin, destination, passengers, luggage, serviceClass]);

  return (
    <main className="min-h-screen bg-[#f7edcf] px-4 py-8 text-slate-950 sm:px-6 lg:px-10">
      <section className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-amber-100 bg-white shadow-2xl shadow-amber-950/10">
        <div className="bg-[#020617] px-6 py-10 text-white sm:px-10 lg:px-12">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-amber-300 px-3 py-1 text-xs font-black uppercase tracking-[0.35em] text-slate-950">
              USVI Mobility
            </span>
            <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-bold text-white/70">
              Safe rebuild layer 1
            </span>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Transportation system restored.
              </h1>
              <p className="mt-5 max-w-3xl text-base font-medium leading-8 text-slate-300 sm:text-lg">
                The route is stable again. This layer adds a local trip planner,
                fare preview, ferry connector detection, and clickable test
                routes without touching Firebase or the map yet.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-300 text-slate-950">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.24em] text-amber-200">
                    Live quote preview
                  </p>
                  <p className="text-3xl font-black">{money(quote)}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Estimate only. Official tariff tables and dispatch return after
                this screen proves stable.
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
          <section className="border-b border-slate-200 bg-[#fff9e8] p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-10">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-200">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-800">
                  Plan a trip
                </p>
                <h2 className="text-2xl font-black">Where are you going?</h2>
              </div>
            </div>

            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-black text-slate-700">
                  Pickup
                </span>
                <select
                  value={originId}
                  onChange={(event) => setOriginId(event.target.value)}
                  className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-4 text-base font-bold shadow-sm outline-none focus:border-amber-500"
                >
                  {POINTS.map((point) => (
                    <option key={point.id} value={point.id}>
                      {point.name} — {ISLAND_LABELS[point.island]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-black text-slate-700">
                  Dropoff
                </span>
                <select
                  value={destinationId}
                  onChange={(event) => setDestinationId(event.target.value)}
                  className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-4 text-base font-bold shadow-sm outline-none focus:border-amber-500"
                >
                  {POINTS.map((point) => (
                    <option key={point.id} value={point.id}>
                      {point.name} — {ISLAND_LABELS[point.island]}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-black text-slate-700">
                    Passengers
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={passengers}
                    onChange={(event) =>
                      setPassengers(Math.max(1, Number(event.target.value) || 1))
                    }
                    className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-4 text-base font-bold shadow-sm outline-none focus:border-amber-500"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-black text-slate-700">
                    Bags
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={luggage}
                    onChange={(event) =>
                      setLuggage(Math.max(0, Number(event.target.value) || 0))
                    }
                    className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-4 text-base font-bold shadow-sm outline-none focus:border-amber-500"
                  />
                </label>
              </div>

              <div>
                <span className="mb-2 block text-sm font-black text-slate-700">
                  Service
                </span>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setServiceClass("shared")}
                    className={`rounded-2xl border px-4 py-4 text-left font-black transition ${
                      serviceClass === "shared"
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-amber-200 bg-white text-slate-900"
                    }`}
                  >
                    Shared taxi
                    <span className="mt-1 block text-sm font-semibold opacity-70">
                      Lower cost route
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setServiceClass("private")}
                    className={`rounded-2xl border px-4 py-4 text-left font-black transition ${
                      serviceClass === "private"
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-amber-200 bg-white text-slate-900"
                    }`}
                  >
                    Private transfer
                    <span className="mt-1 block text-sm font-semibold opacity-70">
                      Dedicated vehicle
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 sm:p-8 lg:p-10">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white">
                <Car className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-800">
                  Route preview
                </p>
                <h2 className="text-2xl font-black">Compare route</h2>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    Pickup
                  </p>
                  <p className="mt-2 text-lg font-black">{origin.name}</p>
                  <p className="text-sm font-semibold text-slate-500">
                    {ISLAND_LABELS[origin.island]} · {origin.zone}
                  </p>
                </div>

                <div className="hidden h-11 w-11 place-items-center rounded-full bg-amber-200 sm:grid">
                  <ArrowRight className="h-5 w-5" />
                </div>

                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    Dropoff
                  </p>
                  <p className="mt-2 text-lg font-black">{destination.name}</p>
                  <p className="text-sm font-semibold text-slate-500">
                    {ISLAND_LABELS[destination.island]} · {destination.zone}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <Users className="mb-3 h-5 w-5 text-amber-700" />
                  <p className="text-sm font-bold text-slate-500">Passengers</p>
                  <p className="text-xl font-black">{passengers}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <Ship className="mb-3 h-5 w-5 text-amber-700" />
                  <p className="text-sm font-bold text-slate-500">Connector</p>
                  <p className="text-xl font-black">
                    {isInterIsland ? "Ferry" : "Local"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <CheckCircle2 className="mb-3 h-5 w-5 text-amber-700" />
                  <p className="text-sm font-bold text-slate-500">Estimate</p>
                  <p className="text-xl font-black">{money(quote)}</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-800">
                  Dispatch status
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  Trip request saving is intentionally disabled in this layer.
                  Next layer should connect this quote to the existing Firebase
                  trip request service.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled
              className="mt-6 w-full rounded-2xl bg-slate-950 px-5 py-4 text-base font-black text-white opacity-60"
            >
              Request service coming next
            </button>
          </section>
        </div>

        <section className="border-t border-slate-200 bg-[#fff7df] p-6 sm:p-8 lg:p-10">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-800">
              Test routes
            </p>
            <h2 className="text-2xl font-black">Tap a route to test the planner</h2>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {TEST_ROUTES.map(([fromId, toId]) => (
              <button
                key={`${fromId}-${toId}`}
                type="button"
                onClick={() => {
                  setOriginId(fromId);
                  setDestinationId(toId);
                }}
                className="rounded-2xl border border-amber-200 bg-white px-5 py-4 text-left text-sm font-black shadow-sm transition hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md"
              >
                {routeLabel(fromId, toId)}
              </button>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
