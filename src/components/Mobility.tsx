import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Briefcase,
  CalendarClock,
  Car,
  CheckCircle2,
  MapPin,
  Plane,
  Sailboat,
  Ship,
  Sparkles,
  Users,
} from "lucide-react";

import {
  calculateDemoFare,
  createDemoMobilityRequest,
  islandLabels,
  serviceLabels,
  type DemoMobilityIsland,
  type DemoMobilityServiceType,
} from "../lib/mobility/demoMobilityStore";

const serviceOptions: Array<{
  id: DemoMobilityServiceType;
  title: string;
  description: string;
  icon: typeof Car;
}> = [
  {
    id: "airport",
    title: "Airport Transfer",
    description: "Airport to hotel, villa, ferry, or beach.",
    icon: Plane,
  },
  {
    id: "cruise",
    title: "Cruise Pickup",
    description: "Cruise dock pickups and short island day plans.",
    icon: Ship,
  },
  {
    id: "ferry_transfer",
    title: "Ferry Transfer",
    description: "Red Hook, Cruz Bay, Crown Bay, and inter-island transfers.",
    icon: Sailboat,
  },
  {
    id: "beach_day",
    title: "Beach Day Ride",
    description: "Beach drop-off and return pickup coordination.",
    icon: MapPin,
  },
  {
    id: "dinner",
    title: "Dinner / Nightlife",
    description: "Evening rides to restaurants, bars, and events.",
    icon: Sparkles,
  },
  {
    id: "island_tour",
    title: "Island Tour",
    description: "Private or group sightseeing route request.",
    icon: Car,
  },
];

const quickPlaces = [
  "Cyril E. King Airport",
  "Havensight Cruise Port",
  "Crown Bay",
  "Red Hook Ferry Terminal",
  "Sapphire Beach",
  "Magens Bay",
  "Coral World",
  "Charlotte Amalie",
  "Cruz Bay Ferry Terminal",
  "Christiansted",
];

type MobilityProps = {
  selectedIsland?: unknown;
  user?: unknown;
};

export default function Mobility(_props: MobilityProps) {
  const navigate = useNavigate();

  const [serviceType, setServiceType] = useState<DemoMobilityServiceType>("airport");
  const [island, setIsland] = useState<DemoMobilityIsland>("st_thomas");
  const [pickup, setPickup] = useState("Cyril E. King Airport");
  const [dropoff, setDropoff] = useState("Red Hook Ferry Terminal");
  const [pickupTime, setPickupTime] = useState("Today · 4:30 PM");
  const [passengers, setPassengers] = useState(2);
  const [luggage, setLuggage] = useState(2);
  const [visitorName, setVisitorName] = useState("Demo Visitor");
  const [visitorPhone, setVisitorPhone] = useState("(340) 555-1010");
  const [notes, setNotes] = useState("Need a reliable transfer and clear pickup instructions.");
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const estimatedFare = useMemo(
    () => calculateDemoFare({ serviceType, passengers, luggage }),
    [serviceType, passengers, luggage]
  );

  function submitRequest() {
    const request = createDemoMobilityRequest({
      island,
      serviceType,
      pickup,
      dropoff,
      pickupTime,
      passengers,
      luggage,
      visitorName,
      visitorPhone,
      notes,
    });

    setSubmittedId(request.id);
  }

  return (
    <div className="min-h-screen pb-48 pt-24">
      <section className="mx-auto max-w-6xl px-4">
        <div className="overflow-hidden rounded-[2.5rem] bg-ink text-white shadow-2xl">
          <div className="grid gap-8 p-6 md:grid-cols-[1.05fr_0.95fr] md:p-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-turquoise/15 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-turquoise">
                <Car className="h-4 w-4" />
                VI Mobility
              </div>

              <h1 className="mt-6 text-4xl font-black leading-tight md:text-6xl">
                Taxi, ferry, cruise, and tour requests in one local flow.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-white/75">
                This is a coordination layer for licensed operators and local partners.
                Visitors request transportation, and dispatchers see organized,
                high-intent leads.
              </p>

              <div className="mt-7 grid grid-cols-3 gap-3">
                {[
                  ["Airport", "Transfers"],
                  ["Cruise", "Pickups"],
                  ["Ferry", "Timing"],
                ].map(([top, bottom]) => (
                  <div key={top} className="rounded-3xl bg-white/10 p-4">
                    <p className="text-2xl font-black">{top}</p>
                    <p className="mt-1 text-xs font-bold text-white/55">{bottom}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-turquoise">
                Demo quote
              </p>

              <div className="mt-5 rounded-[2rem] bg-white p-5 text-ink">
                <p className="text-sm font-black text-stone-500">
                  {serviceLabels[serviceType]}
                </p>

                <div className="mt-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-5xl font-black">${estimatedFare}</p>
                    <p className="mt-1 text-xs font-bold text-stone-500">
                      estimated demo fare
                    </p>
                  </div>

                  <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                </div>

                <div className="mt-5 space-y-3 text-sm font-bold text-stone-600">
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-700" />
                    {pickup} → {dropoff}
                  </p>
                  <p className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-700" />
                    {passengers} passenger{passengers === 1 ? "" : "s"}
                  </p>
                  <p className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-emerald-700" />
                    {luggage} bag{luggage === 1 ? "" : "s"}
                  </p>
                </div>

                <button
                  onClick={() => navigate("/mobility/dispatch")}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-4 text-sm font-black text-white active:scale-95"
                >
                  Open Dispatch Dashboard
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid border-t border-white/10 md:grid-cols-4">
            {[
              "Visitor request",
              "Tariff-aware estimate",
              "Operator dispatch",
              "Partner reporting",
            ].map((item) => (
              <div key={item} className="border-white/10 p-5 md:border-r">
                <p className="text-sm font-black text-white">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-6xl px-4">
        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2.25rem] bg-white p-5 shadow-xl ring-1 ring-black/5">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">
              Step 1
            </p>
            <h2 className="mt-2 text-3xl font-black">Choose service type</h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {serviceOptions.map((option) => {
                const Icon = option.icon;
                const active = serviceType === option.id;

                return (
                  <button
                    key={option.id}
                    onClick={() => setServiceType(option.id)}
                    className={[
                      "rounded-3xl p-4 text-left transition active:scale-95",
                      active
                        ? "bg-ink text-white shadow-xl"
                        : "bg-stone-50 text-ink hover:bg-white hover:shadow-lg",
                    ].join(" ")}
                  >
                    <Icon className={active ? "h-6 w-6 text-turquoise" : "h-6 w-6 text-emerald-700"} />
                    <p className="mt-3 font-black">{option.title}</p>
                    <p className={["mt-1 text-sm leading-6", active ? "text-white/65" : "text-stone-500"].join(" ")}>
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[2.25rem] bg-white p-5 shadow-xl ring-1 ring-black/5">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">
              Step 2
            </p>
            <h2 className="mt-2 text-3xl font-black">Request details</h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
                  Island
                </span>
                <select
                  value={island}
                  onChange={(event) => setIsland(event.target.value as DemoMobilityIsland)}
                  className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500"
                >
                  {Object.entries(islandLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
                  Pickup time
                </span>
                <input
                  value={pickupTime}
                  onChange={(event) => setPickupTime(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500"
                />
              </label>

              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
                  Pickup
                </span>
                <input
                  list="quick-mobility-places"
                  value={pickup}
                  onChange={(event) => setPickup(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500"
                />
              </label>

              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
                  Dropoff
                </span>
                <input
                  list="quick-mobility-places"
                  value={dropoff}
                  onChange={(event) => setDropoff(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500"
                />
              </label>

              <datalist id="quick-mobility-places">
                {quickPlaces.map((place) => (
                  <option key={place} value={place} />
                ))}
              </datalist>

              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
                  Passengers
                </span>
                <input
                  type="number"
                  min={1}
                  max={14}
                  value={passengers}
                  onChange={(event) => setPassengers(Number(event.target.value))}
                  className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500"
                />
              </label>

              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
                  Luggage
                </span>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={luggage}
                  onChange={(event) => setLuggage(Number(event.target.value))}
                  className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500"
                />
              </label>

              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
                  Name
                </span>
                <input
                  value={visitorName}
                  onChange={(event) => setVisitorName(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500"
                />
              </label>

              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
                  Phone
                </span>
                <input
                  value={visitorPhone}
                  onChange={(event) => setVisitorPhone(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
                  Notes
                </span>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="mt-2 w-full resize-none rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold leading-6 outline-none focus:border-emerald-500"
                />
              </label>
            </div>

            {submittedId && (
              <div className="mt-5 rounded-3xl bg-emerald-50 p-4">
                <p className="font-black text-emerald-950">Request created.</p>
                <p className="mt-1 text-sm text-emerald-900/75">
                  This transportation request is now visible in the dispatch dashboard.
                </p>
              </div>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
              <button
                onClick={submitRequest}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-4 text-sm font-black text-white shadow-xl active:scale-95"
              >
                Submit Mobility Request
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => navigate("/mobility/dispatch")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-4 text-sm font-black text-white shadow-xl active:scale-95"
              >
                Dispatch
                <CalendarClock className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
