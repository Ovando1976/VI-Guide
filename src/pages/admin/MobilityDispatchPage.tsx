import { useEffect, useMemo, useState } from "react";
import {
  Clipboard,
  CreditCard,
  MapPin,
  Phone,
  RefreshCw,
  UserRoundCheck,
} from "lucide-react";

import { cn } from "../../lib/utils";
import {
  addDispatcherNotes,
  assignDriverToTrip,
  buildDriverSmsText,
  buildTripDispatchBrief,
  getTripDropoffLabel,
  getTripPickupLabel,
  subscribeAdminMobilityTrips,
  subscribeDriverProfiles,
  updateTripPaymentStatus,
  updateTripStatus,
  type AdminMobilityTrip,
  type DriverProfile,
  type MobilityTripStatus,
  type PaymentStatus,
} from "../../lib/firestore/mobilityAdmin";

const statusTabs: Array<{ id: "all" | MobilityTripStatus; label: string }> = [
  { id: "all", label: "All" },
  { id: "requested", label: "New" },
  { id: "assigned", label: "Assigned" },
  { id: "accepted", label: "Accepted" },
  { id: "driver_arriving", label: "En route" },
  { id: "arrived", label: "Arrived" },
  { id: "in_progress", label: "In progress" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

const nextStatuses: Array<{ value: MobilityTripStatus; label: string }> = [
  { value: "quoted", label: "Quoted" },
  { value: "assigned", label: "Assigned" },
  { value: "accepted", label: "Accepted" },
  { value: "driver_arriving", label: "Driver en route" },
  { value: "arrived", label: "Arrived" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "closed", label: "Closed" },
];

const paymentStatuses: Array<{ value: PaymentStatus; label: string }> = [
  { value: "unpaid", label: "Unpaid" },
  { value: "payment_sent", label: "Payment sent" },
  { value: "paid", label: "Paid" },
  { value: "cash", label: "Cash" },
  { value: "comped", label: "Comped" },
];

function fare(trip: AdminMobilityTrip) {
  return trip.quote?.total ? `$${trip.quote.total}` : "Pending";
}

export default function MobilityDispatchPage() {
  const [trips, setTrips] = useState<AdminMobilityTrip[]>([]);
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [activeStatus, setActiveStatus] = useState<"all" | MobilityTripStatus>("all");
  const [selectedTripId, setSelectedTripId] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const unsubscribeTrips = subscribeAdminMobilityTrips(setTrips);
    const unsubscribeDrivers = subscribeDriverProfiles(setDrivers);

    return () => {
      unsubscribeTrips();
      unsubscribeDrivers();
    };
  }, []);

  const filteredTrips = useMemo(() => {
    if (activeStatus === "all") return trips;
    return trips.filter((trip) => trip.status === activeStatus);
  }, [activeStatus, trips]);

  const selectedTrip = useMemo(
    () => trips.find((trip) => trip.id === selectedTripId) || filteredTrips[0] || null,
    [filteredTrips, selectedTripId, trips],
  );

  const counts = useMemo(() => {
    return trips.reduce<Record<string, number>>((acc, trip) => {
      const key = trip.status || "requested";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [trips]);

  async function copyBrief(trip: AdminMobilityTrip) {
    await navigator.clipboard.writeText(buildTripDispatchBrief(trip));
  }

  async function saveNotes(trip: AdminMobilityTrip) {
    await addDispatcherNotes(trip.id, notes || trip.dispatcherNotes || "");
  }

  return (
    <main className="min-h-screen bg-[#05070b] px-5 py-7 text-white sm:px-8">
      <section className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-emerald-300">
              VI Guide Admin
            </p>
            <h1 className="mt-3 font-serif text-5xl font-black tracking-[-0.05em] sm:text-7xl">
              Mobility Dispatch
            </h1>
            <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-white/55">
              Manage ride requests, assign verified local drivers, coordinate payment,
              and close trips from one board.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:w-[520px]">
            <Metric label="New" value={String(counts.requested || 0)} />
            <Metric
              label="Active"
              value={String(
                (counts.assigned || 0) +
                  (counts.accepted || 0) +
                  (counts.driver_arriving || 0) +
                  (counts.in_progress || 0),
              )}
            />
            <Metric label="Drivers" value={String(drivers.filter((driver) => driver.active).length)} />
          </div>
        </header>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-2">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveStatus(tab.id)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.14em]",
                activeStatus === tab.id
                  ? "border-emerald-300 bg-emerald-300 text-slate-950"
                  : "border-white/10 bg-white/[0.06] text-white/65",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_430px]">
          <section className="space-y-3">
            {filteredTrips.length ? (
              filteredTrips.map((trip) => (
                <button
                  key={trip.id}
                  type="button"
                  onClick={() => {
                    setSelectedTripId(trip.id);
                    setNotes(trip.dispatcherNotes || "");
                  }}
                  className={cn(
                    "w-full rounded-[1.75rem] border p-5 text-left shadow-xl transition",
                    selectedTrip?.id === trip.id
                      ? "border-emerald-300 bg-emerald-300/10"
                      : "border-white/10 bg-white/[0.055] hover:border-emerald-300/40",
                  )}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
                        #{trip.id.slice(-6)} · {String(trip.status || "requested").replace("_", " ")}
                      </p>
                      <h2 className="mt-2 text-2xl font-black">
                        {getTripPickupLabel(trip)} → {getTripDropoffLabel(trip)}
                      </h2>
                      <p className="mt-2 text-sm font-semibold text-white/50">
                        {trip.tripType?.replace("_", " ") || "direct"} · {trip.serviceClass || "shared"} · {trip.passengers || 1} passenger · {trip.luggage || 0} luggage
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-4 text-slate-950">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                        Fare
                      </p>
                      <p className="mt-1 text-3xl font-black">{fare(trip)}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <MiniPill icon={<UserRoundCheck />} label={trip.assignedDriverName || "Unassigned"} />
                    <MiniPill icon={<CreditCard />} label={trip.paymentStatus || "unpaid"} />
                    <MiniPill icon={<MapPin />} label={trip.island || "island"} />
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-8 text-center">
                <RefreshCw className="mx-auto h-8 w-8 text-emerald-300" />
                <p className="mt-4 text-lg font-black">No trips in this lane.</p>
                <p className="mt-2 text-sm font-semibold text-white/45">
                  New ride requests will appear here.
                </p>
              </div>
            )}
          </section>

          <aside className="space-y-5">
            {selectedTrip ? (
              <TripControlPanel
                trip={selectedTrip}
                drivers={drivers}
                notes={notes}
                setNotes={setNotes}
                onCopy={() => copyBrief(selectedTrip)}
                onSaveNotes={() => saveNotes(selectedTrip)}
              />
            ) : (
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-6">
                <p className="text-lg font-black">Select a trip</p>
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}

function TripControlPanel({
  trip,
  drivers,
  notes,
  setNotes,
  onCopy,
  onSaveNotes,
}: {
  trip: AdminMobilityTrip;
  drivers: DriverProfile[];
  notes: string;
  setNotes: (value: string) => void;
  onCopy: () => void;
  onSaveNotes: () => void;
}) {
  const availableDrivers = drivers.filter((driver) => driver.active);

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
        Dispatch Controls
      </p>

      <h2 className="mt-3 text-3xl font-black">
        {getTripPickupLabel(trip)} → {getTripDropoffLabel(trip)}
      </h2>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <ControlStat label="Fare" value={fare(trip)} />
        <ControlStat label="Status" value={String(trip.status || "requested").replace("_", " ")} />
        <ControlStat label="Payment" value={trip.paymentStatus || "unpaid"} />
        <ControlStat label="Driver" value={trip.assignedDriverName || "Unassigned"} />
      </div>

      <div className="mt-5 space-y-3">
        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
            Assign Driver
          </span>
          <select
            value={trip.assignedDriverId || ""}
            onChange={(event) => {
              const driver = availableDrivers.find((item) => item.id === event.target.value);
              if (driver) void assignDriverToTrip(trip.id, driver);
            }}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-black text-white outline-none"
          >
            <option value="">Unassigned</option>
            {availableDrivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.name} · {driver.online ? "online" : "offline"} · {driver.phone}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
              Trip Status
            </span>
            <select
              value={trip.status || "requested"}
              onChange={(event) =>
                void updateTripStatus(trip.id, event.target.value as MobilityTripStatus)
              }
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-black text-white outline-none"
            >
              {nextStatuses.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
              Payment
            </span>
            <select
              value={trip.paymentStatus || "unpaid"}
              onChange={(event) =>
                void updateTripPaymentStatus(trip.id, event.target.value as PaymentStatus)
              }
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-black text-white outline-none"
            >
              {paymentStatuses.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Dispatcher notes..."
          className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-white/30"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onSaveNotes}
            className="rounded-2xl bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-950"
          >
            Save Notes
          </button>

          <button
            type="button"
            onClick={onCopy}
            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-950"
          >
            <Clipboard className="h-4 w-4" />
            Copy Brief
          </button>
        </div>

        {trip.assignedDriverPhone ? (
          <a
            href={`sms:${trip.assignedDriverPhone}?&body=${buildDriverSmsText(trip)}`}
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white"
          >
            <Phone className="h-4 w-4" />
            Text Driver
          </a>
        ) : null}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.055] px-5 py-4">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-emerald-300">{value}</p>
    </div>
  );
}

function ControlStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-950 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
      <p className="mt-2 truncate text-sm font-black capitalize">{value}</p>
    </div>
  );
}

function MiniPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-2xl bg-black/25 px-3 py-2 text-xs font-black text-white/70">
      <span className="text-emerald-300 [&_svg]:h-4 [&_svg]:w-4">{icon}</span>
      <span className="truncate capitalize">{label.replace("_", " ")}</span>
    </div>
  );
}
