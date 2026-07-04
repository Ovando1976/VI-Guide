import { useEffect, useMemo, useState } from "react";
import {
  Car,
  CheckCircle2,
  Clock,
  Clipboard,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
} from "lucide-react";

import { cn } from "../../lib/utils";
import {
  addDriverNotes,
  buildTripDispatchBrief,
  setDriverOnline,
  subscribeAssignedDriverTrips,
  subscribeDriverProfiles,
  updateTripStatus,
  type AdminMobilityTrip,
  type DriverProfile,
  type MobilityTripStatus,
} from "../../lib/firestore/mobilityAdmin";

const driverStatuses: Array<{ value: MobilityTripStatus; label: string }> = [
  { value: "accepted", label: "Accept" },
  { value: "driver_arriving", label: "On my way" },
  { value: "arrived", label: "Arrived" },
  { value: "in_progress", label: "Picked up" },
  { value: "completed", label: "Complete" },
  { value: "cancelled", label: "Issue / cancel" },
];

function tripPickup(trip: AdminMobilityTrip) {
  return trip.pickupLabel || trip.pickup?.label || "Pickup not set";
}

function tripDropoff(trip: AdminMobilityTrip) {
  return trip.dropoffLabel || trip.dropoff?.label || "Dropoff not set";
}

export default function DriverConsolePage() {
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [trips, setTrips] = useState<AdminMobilityTrip[]>([]);
  const [driverNotes, setDriverNotes] = useState("");

  useEffect(() => {
    return subscribeDriverProfiles((items) => {
      setDrivers(items);
      if (!selectedDriverId && items.length) {
        setSelectedDriverId(items[0].id);
      }
    });
  }, [selectedDriverId]);

  useEffect(() => {
    if (!selectedDriverId) return undefined;
    return subscribeAssignedDriverTrips(selectedDriverId, setTrips);
  }, [selectedDriverId]);

  const selectedDriver = useMemo(
    () => drivers.find((driver) => driver.id === selectedDriverId) || null,
    [drivers, selectedDriverId],
  );

  const activeTrip = useMemo(
    () =>
      trips.find(
        (trip) =>
          trip.status !== "completed" &&
          trip.status !== "cancelled" &&
          trip.status !== "closed",
      ) || trips[0] || null,
    [trips],
  );

  async function copyBrief(trip: AdminMobilityTrip) {
    await navigator.clipboard.writeText(buildTripDispatchBrief(trip));
  }

  async function saveDriverNote(trip: AdminMobilityTrip) {
    await addDriverNotes(trip.id, driverNotes || trip.driverNotes || "");
  }

  return (
    <main className="min-h-screen bg-[#05070b] px-5 py-7 text-white sm:px-8">
      <section className="mx-auto max-w-4xl">
        <header className="mb-6 rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_0%_0%,rgba(16,185,129,0.2),transparent_35%),rgba(255,255,255,0.055)] p-6 shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-emerald-300">
            VI Guide Driver
          </p>
          <h1 className="mt-3 font-serif text-5xl font-black tracking-[-0.05em]">
            Driver Console
          </h1>
          <p className="mt-3 text-sm font-semibold leading-7 text-white/55">
            Accept assigned trips, update trip status, copy dispatch notes, and coordinate pickup.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
            <select
              value={selectedDriverId}
              onChange={(event) => setSelectedDriverId(event.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-black text-white outline-none"
            >
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name} · {driver.island}
                </option>
              ))}
            </select>

            {selectedDriver ? (
              <button
                type="button"
                onClick={() => void setDriverOnline(selectedDriver.id, !selectedDriver.online)}
                className={cn(
                  "rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-[0.16em]",
                  selectedDriver.online
                    ? "bg-emerald-300 text-slate-950"
                    : "bg-white/10 text-white",
                )}
              >
                {selectedDriver.online ? "Online" : "Go Online"}
              </button>
            ) : null}
          </div>
        </header>

        {selectedDriver ? (
          <DriverIdentityCard driver={selectedDriver} tripCount={trips.length} />
        ) : null}

        {activeTrip ? (
          <section className="mt-5 rounded-[2rem] bg-[#fff6dc] p-6 text-slate-950 shadow-2xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">
              Assigned Trip
            </p>

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-3xl font-black">
                  {tripPickup(activeTrip)} → {tripDropoff(activeTrip)}
                </h2>
                <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  #{activeTrip.id.slice(-6)} · {String(activeTrip.status || "assigned").replace("_", " ")}
                </p>
              </div>

              <p className="text-5xl font-black">${activeTrip.quote?.total ?? "—"}</p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <TripMini label="Passengers" value={String(activeTrip.passengers || 1)} />
              <TripMini label="Luggage" value={String(activeTrip.luggage || 0)} />
              <TripMini label="Service" value={activeTrip.serviceClass || "shared"} />
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {driverStatuses.map((status) => (
                <button
                  key={status.value}
                  type="button"
                  onClick={() => void updateTripStatus(activeTrip.id, status.value)}
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white"
                >
                  {status.label}
                </button>
              ))}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => void copyBrief(activeTrip)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-950"
              >
                <Clipboard className="h-4 w-4" />
                Copy Brief
              </button>

              {activeTrip.customerPhone ? (
                <a
                  href={`tel:${activeTrip.customerPhone}`}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white"
                >
                  <Phone className="h-4 w-4" />
                  Call Customer
                </a>
              ) : null}

              <a
                href={`/map?island=${activeTrip.island}&pickup=${encodeURIComponent(String(activeTrip.pickup?.label || ""))}&dropoff=${encodeURIComponent(String(activeTrip.dropoff?.label || ""))}`}
                className="flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white"
              >
                <Navigation className="h-4 w-4" />
                Map
              </a>
            </div>

            <textarea
              value={driverNotes || activeTrip.driverNotes || ""}
              onChange={(event) => setDriverNotes(event.target.value)}
              placeholder="Driver notes..."
              className="mt-5 min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none"
            />

            <button
              type="button"
              onClick={() => void saveDriverNote(activeTrip)}
              className="mt-3 w-full rounded-2xl border border-slate-950 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-950"
            >
              Save Driver Notes
            </button>
          </section>
        ) : (
          <section className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.055] p-8 text-center">
            <Clock className="mx-auto h-8 w-8 text-emerald-300" />
            <h2 className="mt-4 text-2xl font-black">No assigned trips yet.</h2>
            <p className="mt-2 text-sm font-semibold text-white/45">
              Assigned dispatches will show here.
            </p>
          </section>
        )}
      </section>
    </main>
  );
}

function DriverIdentityCard({
  driver,
  tripCount,
}: {
  driver: DriverProfile;
  tripCount: number;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-black text-emerald-300">
            <ShieldCheck className="h-4 w-4" />
            {driver.verified ? "Verified Driver" : "Pending Verification"}
          </p>
          <h2 className="mt-2 text-3xl font-black">{driver.name}</h2>
          <p className="mt-1 text-sm font-semibold text-white/50">
            {driver.phone} · {driver.vehiclePlate || "No plate set"}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <TripMiniDark label="Trips" value={String(tripCount)} />
          <TripMiniDark label="Cap" value={String(driver.capacity || 4)} />
          <TripMiniDark label="Mode" value={driver.online ? "Online" : "Offline"} />
        </div>
      </div>
    </section>
  );
}

function TripMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-amber-950/10 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-black capitalize">{value}</p>
    </div>
  );
}

function TripMiniDark({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-950 p-3 text-center">
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/35">
        {label}
      </p>
      <p className="mt-1 text-sm font-black capitalize text-emerald-300">{value}</p>
    </div>
  );
}
