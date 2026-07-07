import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Car,
  Clock,
  Compass,
  Hotel,
  MapPinned,
  Route,
  Ship,
  ShoppingBag,
  Utensils,
  Waves,
} from "lucide-react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import RoadRoutePolyline from "./maps/RoadRoutePolyline";

type PlannerStop = {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  type: "arrival" | "beach" | "food" | "shopping" | "history" | "return";
  position: LatLngTuple;
};

const ST_THOMAS_CENTER: LatLngTuple = [18.342, -64.93];

const DEFAULT_STOPS: PlannerStop[] = [
  {
    id: "havensight",
    title: "Havensight Cruise Pier",
    subtitle: "Arrival / pickup point",
    time: "8:00 AM",
    type: "arrival",
    position: [18.3357, -64.9207],
  },
  {
    id: "magens",
    title: "Magens Bay Beach",
    subtitle: "Beach stop",
    time: "9:00 AM",
    type: "beach",
    position: [18.3627, -64.9307],
  },
  {
    id: "charlotte-amalie",
    title: "Charlotte Amalie",
    subtitle: "Food, shopping, history",
    time: "12:30 PM",
    type: "food",
    position: [18.3419, -64.9307],
  },
  {
    id: "return-pier",
    title: "Return to Cruise Pier",
    subtitle: "Return buffer",
    time: "3:30 PM",
    type: "return",
    position: [18.3357, -64.9207],
  },
];

const quickTypes = [
  { id: "beach", label: "Beach", icon: Waves },
  { id: "food", label: "Food", icon: Utensils },
  { id: "shopping", label: "Shopping", icon: ShoppingBag },
  { id: "history", label: "History", icon: Compass },
  { id: "family", label: "Family", icon: CalendarDays },
  { id: "snorkeling", label: "Snorkeling", icon: Waves },
];

function routeUrl(stops: PlannerStop[]) {
  const coords = stops
    .map((stop) => `${stop.position[1]},${stop.position[0]}`)
    .join(";");

  return `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false`;
}

function FitPlannerMap({ stops, routeLine }: { stops: PlannerStop[]; routeLine: LatLngTuple[] }) {
  const map = useMap();

  useEffect(() => {
    const points = routeLine.length ? routeLine : stops.map((stop) => stop.position);
    if (!points.length) return;

    map.fitBounds(points, {
      padding: [36, 36],
      maxZoom: 14,
    });
  }, [map, routeLine, stops]);

  return null;
}

export default function CruisePlanner() {
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["beach", "food"]);
  const [roadRoute, setRoadRoute] = useState<LatLngTuple[]>([]);
  const [routeStatus, setRouteStatus] = useState<"loading" | "road" | "fallback">("loading");

  const stops = useMemo(() => DEFAULT_STOPS, []);

  const fallbackRoute = useMemo(
    () => stops.map((stop) => stop.position),
    [stops]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadRoadRoute() {
      setRouteStatus("loading");

      try {
        const response = await fetch(routeUrl(stops));

        if (!response.ok) {
          throw new Error(`Routing failed: ${response.status}`);
        }

        const data = await response.json();
        const coordinates = data?.routes?.[0]?.geometry?.coordinates;

        if (!Array.isArray(coordinates) || coordinates.length < 2) {
          throw new Error("No route geometry returned.");
        }

        const nextRoute: LatLngTuple[] = coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng]
        );

        if (!cancelled) {
          setRoadRoute(nextRoute);
          setRouteStatus("road");
        }
      } catch {
        if (!cancelled) {
          setRoadRoute([]);
          setRouteStatus("fallback");
        }
      }
    }

    loadRoadRoute();

    return () => {
      cancelled = true;
    };
  }, [stops]);

  const displayedRoute = roadRoute.length ? roadRoute : fallbackRoute;

  const toggleType = (id: string) => {
    setSelectedTypes((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  return (
    <main className="min-h-screen bg-[#f8f0da] pb-36 text-ink">
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-[2.5rem] bg-white p-6 shadow-xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                <Ship className="h-4 w-4" />
                Cruise day planner
              </div>

              <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight md:text-5xl">
                What do you want to do?
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-bold leading-7 text-stone-500">
                Build a safe one-day island plan with a road-following route,
                timing buffer, stays help, and transportation options.
              </p>
            </div>

            <button
              type="button"
              onClick={() => window.location.assign("/hotels")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-turquoise px-6 py-4 text-sm font-black text-ink shadow-xl active:scale-95"
            >
              Book Stay / Charter
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {quickTypes.map((type) => {
              const Icon = type.icon;
              const selected = selectedTypes.includes(type.id);

              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => toggleType(type.id)}
                  className={`flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-black shadow-sm active:scale-95 ${
                    selected
                      ? "bg-[#075a7c] text-white"
                      : "bg-white text-ink ring-1 ring-stone-200"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>

        <section className="mt-6 rounded-[2.5rem] bg-white p-5 shadow-xl md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
                Route preview
              </p>
              <h2 className="mt-2 font-serif text-3xl md:text-4xl">
                Map of Your First Day
              </h2>
              <p className="mt-2 text-sm font-bold text-stone-500">
                {routeStatus === "road"
                  ? "Road-following route loaded."
                  : routeStatus === "loading"
                    ? "Loading road-following route..."
                    : "Road route unavailable, showing fallback preview."}
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-stone-600">
              <Route className="h-4 w-4 text-emerald-700" />
              {routeStatus === "road" ? "Road route" : "Preview route"}
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-[1.75rem] shadow-inner">
            <MapContainer
              center={ST_THOMAS_CENTER}
              zoom={12}
              scrollWheelZoom={false}
              className="h-[360px] w-full md:h-[430px]"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <FitPlannerMap stops={stops} routeLine={displayedRoute} />

              <RoadRoutePolyline points={displayedRoute} />

              <RoadRoutePolyline points={displayedRoute} />

              {stops.map((stop, index) => (
                <Marker key={stop.id} position={stop.position}>
                  <Popup>
                    <strong>{index + 1}. {stop.title}</strong>
                    <br />
                    {stop.time} · {stop.subtitle}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </section>

        <section className="mt-6 rounded-[2.5rem] bg-white p-5 shadow-xl md:p-6">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
            A safe one-day island plan with return buffer.
          </p>
          <h2 className="mt-2 font-serif text-3xl md:text-4xl">Cruise Day</h2>

          <div className="mt-6 space-y-4">
            {stops.map((stop, index) => (
              <article
                key={stop.id}
                className="grid gap-4 rounded-[1.75rem] bg-stone-50 p-4 md:grid-cols-[70px_1fr_auto]"
              >
                <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-700 text-lg font-black text-white">
                  {index + 1}
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                    {stop.time}
                  </p>
                  <h3 className="mt-1 text-xl font-black">{stop.title}</h3>
                  <p className="mt-1 text-sm font-bold text-stone-500">
                    {stop.subtitle}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-stone-400">
                  <Clock className="h-4 w-4" />
                  Planned
                </div>
              </article>
            ))}
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <button
              type="button"
              onClick={() => window.location.assign("/mobility")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-950 px-5 py-4 text-sm font-black text-white active:scale-95"
            >
              <Car className="h-4 w-4" />
              Request Ride
            </button>

            <button
              type="button"
              onClick={() => window.location.assign("/map")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#ffcf32] px-5 py-4 text-sm font-black text-ink active:scale-95"
            >
              <MapPinned className="h-4 w-4" />
              Open Map
            </button>

            <button
              type="button"
              onClick={() => window.location.assign("/hotels")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-turquoise px-5 py-4 text-sm font-black text-ink active:scale-95"
            >
              <Hotel className="h-4 w-4" />
              Stay / Charter Help
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
