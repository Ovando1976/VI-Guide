import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Briefcase,
  Car,
  CheckCircle2,
  Clipboard,
  ClipboardCheck,
  Clock,
  MapPin,
  Phone,
  Radio,
  RefreshCw,
  Search,
  User,
  Users,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  subscribeToFirestoreMobilityRequests,
  updateFirestoreMobilityRequestStatus,
} from "../lib/firestore/mobilityRequests";
import {
  assignMobilityDriver,
  updateMobilityDispatchNotes,
} from "../lib/firestore/mobilityDispatchActions";
import {
  formatDateTime,
  formatMoney,
  islandLabels,
  mobilityDrivers,
  nextMobilityStatus,
  serviceLabels,
  statusLabels,
  type MobilityIsland,
  type MobilityRequestStatus,
  type MobilityServiceType,
} from "../lib/mobility/mobilityOs";

type MobilityRide = {
  id: string;
  clientRequestId?: string;
  serviceType: MobilityServiceType;
  island: MobilityIsland;
  pickup: string;
  dropoff: string;
  pickupTime: string;
  passengers: number;
  luggage: number;
  visitorName: string;
  visitorPhone: string;
  notes?: string;
  estimatedFare: number;
  tariffStatus?: string;
  tariffSource?: string;
  tariffComplianceNote?: string;
  tariffBreakdown?: Array<{ label: string; amount: number }>;
  status: MobilityRequestStatus;
  source?: string;
  assignedDriverId?: string;
  assignedDriverName?: string;
  assignedDriverPhone?: string;
  assignedVehicle?: string;
  dispatcherNotes?: string;
  createdAt?: number | string;
  updatedAt?: number | string;
};

const dispatchStatuses: MobilityRequestStatus[] = [
  "new",
  "quoted",
  "accepted",
  "driver_en_route",
  "arrived",
  "in_progress",
  "completed",
  "cancelled",
];

function normalizeRide(raw: any): MobilityRide {
  return {
    id: String(raw.id || raw.clientRequestId || `ride-${Date.now()}`),
    clientRequestId: raw.clientRequestId || "",
    serviceType: raw.serviceType || "custom_ride",
    island: raw.island || "st_thomas",
    pickup: raw.pickup || "Unknown pickup",
    dropoff: raw.dropoff || "Unknown dropoff",
    pickupTime: raw.pickupTime || "ASAP / next available",
    passengers: Number(raw.passengers || 1),
    luggage: Number(raw.luggage || 0),
    visitorName: raw.visitorName || "Unknown rider",
    visitorPhone: raw.visitorPhone || "",
    notes: raw.notes || "",
    estimatedFare: Number(raw.estimatedFare || 0),
    tariffStatus: raw.tariffStatus || "",
    tariffSource: raw.tariffSource || "",
    tariffComplianceNote: raw.tariffComplianceNote || "",
    tariffBreakdown: Array.isArray(raw.tariffBreakdown) ? raw.tariffBreakdown : [],
    status: raw.status || "new",
    source: raw.source || "",
    assignedDriverId: raw.assignedDriverId || "",
    assignedDriverName: raw.assignedDriverName || "",
    assignedDriverPhone: raw.assignedDriverPhone || "",
    assignedVehicle: raw.assignedVehicle || "",
    dispatcherNotes: raw.dispatcherNotes || "",
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function safeTel(phone?: string) {
  if (!phone) return "";
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

function dispatchNote(ride: MobilityRide) {
  return `VI Guide Mobility Request

Status: ${statusLabels[ride.status]}
Service: ${serviceLabels[ride.serviceType]}
Island: ${islandLabels[ride.island]}

Pickup: ${ride.pickup}
Dropoff: ${ride.dropoff}
Pickup time: ${ride.pickupTime}

Rider: ${ride.visitorName}
Phone: ${ride.visitorPhone}
Passengers: ${ride.passengers}
Luggage: ${ride.luggage}
Estimated fare: ${ride.estimatedFare ? formatMoney(ride.estimatedFare) : "Dispatcher review required"}
Tariff status: ${ride.tariffStatus || "Not recorded"}
Tariff note: ${ride.tariffComplianceNote || "No tariff note recorded"}

Assigned driver: ${ride.assignedDriverName || "Unassigned"}
Vehicle: ${ride.assignedVehicle || "Unassigned"}
Driver phone: ${ride.assignedDriverPhone || "Unassigned"}

Rider notes: ${ride.notes || "None"}
Dispatcher notes: ${ride.dispatcherNotes || "None"}`;
}

export default function MobilityDispatchDemo() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState<MobilityRide[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | MobilityRequestStatus>("all");
  const [islandFilter, setIslandFilter] = useState<"all" | MobilityIsland>("all");
  const [query, setQuery] = useState("");
  const [manualDriverName, setManualDriverName] = useState("");
  const [manualDriverPhone, setManualDriverPhone] = useState("");
  const [manualVehicle, setManualVehicle] = useState("");
  const [dispatcherNotes, setDispatcherNotes] = useState("");
  const [saving, setSaving] = useState("");
  const [copied, setCopied] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToFirestoreMobilityRequests(
      (items: any[]) => {
        const normalized = items
          .map(normalizeRide)
          .sort(
            (a, b) =>
              Number(b.createdAt || 0) - Number(a.createdAt || 0)
          );

        setRequests(normalized);

        if (!selectedId && normalized[0]) {
          setSelectedId(normalized[0].id);
          setDispatcherNotes(normalized[0].dispatcherNotes || "");
        }
      },
      (err) => setError(errorMessage(err))
    );

    return () => unsubscribe();
  }, [selectedId]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return requests.filter((ride) => {
      const statusMatch = statusFilter === "all" || ride.status === statusFilter;
      const islandMatch = islandFilter === "all" || ride.island === islandFilter;
      const queryMatch =
        !needle ||
        `${ride.pickup} ${ride.dropoff} ${ride.visitorName} ${ride.visitorPhone} ${ride.assignedDriverName}`
          .toLowerCase()
          .includes(needle);

      return statusMatch && islandMatch && queryMatch;
    });
  }, [islandFilter, query, requests, statusFilter]);

  const selectedRide =
    requests.find((ride) => ride.id === selectedId) || filtered[0] || requests[0];

  const stats = useMemo(
    () => ({
      total: requests.length,
      new: requests.filter((ride) => ride.status === "new").length,
      active: requests.filter((ride) =>
        ["quoted", "accepted", "driver_en_route", "arrived", "in_progress"].includes(
          ride.status
        )
      ).length,
      completed: requests.filter((ride) => ride.status === "completed").length,
    }),
    [requests]
  );

  async function copyText(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(""), 1600);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function moveStatus(ride: MobilityRide, status: MobilityRequestStatus) {
    setSaving(`status-${ride.id}`);

    try {
      await updateFirestoreMobilityRequestStatus(
        ride.id,
        status as any,
        ride.status as any
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving("");
    }
  }

  async function assignDriver(
    ride: MobilityRide,
    driver?: {
      id?: string;
      name: string;
      phone: string;
      vehicle: string;
    }
  ) {
    const chosen = driver || {
      name: manualDriverName,
      phone: manualDriverPhone,
      vehicle: manualVehicle,
    };

    if (!chosen.name.trim()) {
      setError("Driver name is required.");
      return;
    }

    setSaving(`assign-${ride.id}`);

    try {
      await assignMobilityDriver({
        requestId: ride.id,
        assignedDriverId: chosen.id || "",
        assignedDriverName: chosen.name.trim(),
        assignedDriverPhone: chosen.phone.trim(),
        assignedVehicle: chosen.vehicle.trim(),
        dispatcherNotes,
        status:
          ride.status === "new" || ride.status === "quoted"
            ? "accepted"
            : ride.status,
      });

      setManualDriverName("");
      setManualDriverPhone("");
      setManualVehicle("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving("");
    }
  }

  async function saveNotes(ride: MobilityRide) {
    setSaving(`notes-${ride.id}`);

    try {
      await updateMobilityDispatchNotes({
        requestId: ride.id,
        dispatcherNotes,
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving("");
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f0da] pb-32 text-ink">
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-[2.75rem] bg-ink p-5 text-white shadow-2xl md:p-8 lg:p-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-turquoise/15 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-turquoise">
                <Radio className="h-4 w-4" />
                Taxi Association Dispatch
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
                Mobility dispatch command board.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 md:text-base">
                Manage ride requests, assign drivers, call riders, copy dispatch
                notes, and move every request through the operating workflow.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/mobility")}
                className="rounded-2xl bg-turquoise px-5 py-3 text-sm font-black text-ink active:scale-95"
              >
                New Ride Request
              </button>
              <button
                onClick={() => navigate("/admin/leads")}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-ink active:scale-95"
              >
                Admin Leads
              </button>
            </div>
          </div>

          {copied ? (
            <div className="mt-5 rounded-[2rem] bg-emerald-100 p-4 text-emerald-950">
              <p className="flex items-center gap-2 font-black">
                <ClipboardCheck className="h-5 w-5" />
                Copied {copied}
              </p>
            </div>
          ) : null}

          {error ? (
            <div className="mt-5 rounded-[2rem] bg-amber-100 p-4 text-amber-950">
              <p className="font-black">Dispatch notice</p>
              <p className="mt-1 text-sm font-bold leading-6">{error}</p>
            </div>
          ) : null}

          <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["Total Requests", stats.total, Car],
              ["New", stats.new, RefreshCw],
              ["Active", stats.active, Radio],
              ["Completed", stats.completed, CheckCircle2],
            ].map(([label, value, Icon]) => {
              const StatIcon = Icon as typeof Car;

              return (
                <div key={String(label)} className="rounded-[2rem] bg-white p-4 text-ink">
                  <StatIcon className="h-6 w-6 text-emerald-700" />
                  <p className="mt-4 text-4xl font-black">{String(value)}</p>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-stone-500">
                    {String(label)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[0.88fr_1.12fr]">
          <section className="rounded-[2.25rem] bg-white p-5 shadow-xl">
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                  Request queue
                </p>
                <h2 className="mt-1 text-3xl font-black">Live rides</h2>
              </div>

              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search rider, pickup, dropoff, driver..."
                  className="w-full rounded-2xl border border-stone-200 bg-white py-3 pl-11 pr-4 text-sm font-bold outline-none ring-emerald-700/20 focus:ring-4"
                />
              </label>

              <div className="grid gap-2 sm:grid-cols-2">
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as "all" | MobilityRequestStatus)
                  }
                  className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold outline-none"
                >
                  <option value="all">All statuses</option>
                  {dispatchStatuses.map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </select>

                <select
                  value={islandFilter}
                  onChange={(event) =>
                    setIslandFilter(event.target.value as "all" | MobilityIsland)
                  }
                  className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold outline-none"
                >
                  <option value="all">All islands</option>
                  {Object.entries(islandLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 max-h-[760px] space-y-3 overflow-auto pr-1">
              {filtered.length === 0 ? (
                <div className="rounded-[2rem] bg-stone-50 p-6 text-center">
                  <Car className="mx-auto h-8 w-8 text-emerald-700" />
                  <p className="mt-3 text-lg font-black">No ride requests yet</p>
                  <p className="mt-1 text-sm leading-6 text-stone-500">
                    Submit a request from /mobility to populate the dispatch
                    board.
                  </p>
                </div>
              ) : (
                filtered.map((ride) => (
                  <button
                    key={ride.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(ride.id);
                      setDispatcherNotes(ride.dispatcherNotes || "");
                    }}
                    className={[
                      "w-full rounded-[2rem] p-4 text-left ring-1 transition active:scale-[0.99]",
                      selectedRide?.id === ride.id
                        ? "bg-emerald-700 text-white ring-emerald-700"
                        : "bg-stone-50 text-ink ring-stone-100 hover:bg-stone-100",
                    ].join(" ")}
                  >
                    <div className="flex flex-wrap gap-2">
                      <Badge active={selectedRide?.id === ride.id}>
                        {statusLabels[ride.status]}
                      </Badge>
                      <Badge active={selectedRide?.id === ride.id} muted>
                        {serviceLabels[ride.serviceType]}
                      </Badge>
                    </div>

                    <h3 className="mt-3 text-xl font-black">
                      {ride.pickup} → {ride.dropoff}
                    </h3>

                    <div
                      className={[
                        "mt-3 grid gap-2 text-xs font-bold sm:grid-cols-2",
                        selectedRide?.id === ride.id
                          ? "text-white/70"
                          : "text-stone-600",
                      ].join(" ")}
                    >
                      <p className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {ride.visitorName}
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {ride.pickupTime}
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {ride.visitorPhone || "No phone"}
                      </p>
                      <p className="flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        {ride.assignedDriverName || "Unassigned"}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[2.25rem] bg-white p-5 shadow-xl">
            {selectedRide ? (
              <>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                      Selected request
                    </p>
                    <h2 className="mt-1 text-3xl font-black">
                      {selectedRide.pickup} → {selectedRide.dropoff}
                    </h2>
                    <p className="mt-2 text-sm font-bold text-stone-500">
                      Created {formatDateTime(selectedRide.createdAt)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-emerald-100 px-4 py-3 text-sm font-black text-emerald-900">
                    {statusLabels[selectedRide.status]}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-4">
                  <InfoCard icon={User} label="Rider" value={selectedRide.visitorName} />
                  <InfoCard icon={Phone} label="Phone" value={selectedRide.visitorPhone || "N/A"} />
                  <InfoCard icon={Users} label="Passengers" value={String(selectedRide.passengers)} />
                  <InfoCard icon={Briefcase} label="Luggage" value={String(selectedRide.luggage)} />
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <InfoCard icon={MapPin} label="Pickup" value={selectedRide.pickup} />
                  <InfoCard icon={MapPin} label="Dropoff" value={selectedRide.dropoff} />
                  <InfoCard icon={Clock} label="Pickup time" value={selectedRide.pickupTime} />
                  <InfoCard
                    icon={Car}
                    label="Estimate"
                    value={formatMoney(selectedRide.estimatedFare)}
                  />
                </div>

                <div className="mt-5 rounded-[2rem] bg-stone-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
                    Rider notes
                  </p>
                  <p className="mt-2 text-sm font-bold leading-6 text-stone-700">
                    {selectedRide.notes || "No rider notes."}
                  </p>
                </div>

                <div className="mt-5 rounded-[2rem] bg-emerald-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                    Tariff compliance
                  </p>
                  <p className="mt-2 text-sm font-bold leading-6 text-emerald-950">
                    {selectedRide.tariffComplianceNote ||
                      "No tariff compliance note recorded for this request."}
                  </p>

                  {selectedRide.tariffBreakdown?.length ? (
                    <div className="mt-3 space-y-2">
                      {selectedRide.tariffBreakdown.map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-xs font-black"
                        >
                          <span className="text-stone-600">{item.label}</span>
                          <span className="text-emerald-700">
                            {formatMoney(item.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="mt-5 rounded-[2rem] bg-ink p-4 text-white">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-turquoise">
                    Assigned driver
                  </p>

                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <DriverField label="Driver" value={selectedRide.assignedDriverName || "Unassigned"} />
                    <DriverField label="Phone" value={selectedRide.assignedDriverPhone || "N/A"} />
                    <DriverField label="Vehicle" value={selectedRide.assignedVehicle || "N/A"} />
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {mobilityDrivers
                    .filter((driver) => driver.island === selectedRide.island)
                    .map((driver) => (
                      <button
                        key={driver.id}
                        type="button"
                        onClick={() =>
                          assignDriver(selectedRide, {
                            id: driver.id,
                            name: driver.name,
                            phone: driver.phone,
                            vehicle: driver.vehicle,
                          })
                        }
                        className="rounded-[2rem] bg-stone-50 p-4 text-left ring-1 ring-stone-100 transition hover:bg-stone-100 active:scale-[0.99]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <Car className="h-5 w-5 text-emerald-700" />
                          <span
                            className={[
                              "rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em]",
                              driver.status === "available"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-900",
                            ].join(" ")}
                          >
                            {driver.status}
                          </span>
                        </div>
                        <p className="mt-3 text-lg font-black">{driver.name}</p>
                        <p className="mt-1 text-sm font-bold text-stone-600">
                          {driver.vehicle}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-stone-500">
                          {driver.notes}
                        </p>
                      </button>
                    ))}
                </div>

                <div className="mt-5 rounded-[2rem] bg-stone-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
                    Manual driver assignment
                  </p>

                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <input
                      value={manualDriverName}
                      onChange={(event) => setManualDriverName(event.target.value)}
                      placeholder="Driver name"
                      className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold outline-none"
                    />
                    <input
                      value={manualDriverPhone}
                      onChange={(event) => setManualDriverPhone(event.target.value)}
                      placeholder="Driver phone"
                      className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold outline-none"
                    />
                    <input
                      value={manualVehicle}
                      onChange={(event) => setManualVehicle(event.target.value)}
                      placeholder="Vehicle"
                      className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => assignDriver(selectedRide)}
                    disabled={saving === `assign-${selectedRide.id}`}
                    className="mt-3 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white disabled:opacity-60 active:scale-95"
                  >
                    Assign Manual Driver
                  </button>
                </div>

                <div className="mt-5 rounded-[2rem] bg-stone-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
                    Dispatcher notes
                  </p>
                  <textarea
                    value={dispatcherNotes}
                    onChange={(event) => setDispatcherNotes(event.target.value)}
                    rows={4}
                    className="mt-3 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold outline-none"
                    placeholder="Driver instructions, pickup detail, return ride, ferry timing..."
                  />
                  <button
                    type="button"
                    onClick={() => saveNotes(selectedRide)}
                    disabled={saving === `notes-${selectedRide.id}`}
                    className="mt-3 rounded-2xl bg-ink px-5 py-3 text-sm font-black text-white disabled:opacity-60 active:scale-95"
                  >
                    Save Dispatch Notes
                  </button>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {selectedRide.visitorPhone ? (
                    <a
                      href={safeTel(selectedRide.visitorPhone)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-xs font-black text-white active:scale-95"
                    >
                      <Phone className="h-4 w-4" />
                      Call Rider
                    </a>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => copyText("dispatch note", dispatchNote(selectedRide))}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-xs font-black text-ink ring-1 ring-stone-200 active:scale-95"
                  >
                    <Clipboard className="h-4 w-4" />
                    Copy Dispatch Note
                  </button>

                  {nextMobilityStatus(selectedRide.status) !== selectedRide.status ? (
                    <button
                      type="button"
                      onClick={() =>
                        moveStatus(
                          selectedRide,
                          nextMobilityStatus(selectedRide.status)
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-2xl bg-turquoise px-4 py-3 text-xs font-black text-ink active:scale-95"
                    >
                      <ArrowRight className="h-4 w-4" />
                      Move to {statusLabels[nextMobilityStatus(selectedRide.status)]}
                    </button>
                  ) : null}

                  {selectedRide.status !== "cancelled" ? (
                    <button
                      type="button"
                      onClick={() => moveStatus(selectedRide, "cancelled")}
                      className="inline-flex items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-xs font-black text-white active:scale-95"
                    >
                      <XCircle className="h-4 w-4" />
                      Cancel
                    </button>
                  ) : null}
                </div>

                <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {dispatchStatuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => moveStatus(selectedRide, status)}
                      disabled={saving === `status-${selectedRide.id}`}
                      className={[
                        "rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-[0.16em] disabled:opacity-60 active:scale-95",
                        selectedRide.status === status
                          ? "bg-emerald-700 text-white"
                          : "bg-stone-100 text-stone-700",
                      ].join(" ")}
                    >
                      {statusLabels[status]}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-[2rem] bg-stone-50 p-8 text-center">
                <Car className="mx-auto h-10 w-10 text-emerald-700" />
                <p className="mt-3 text-xl font-black">No ride selected</p>
                <p className="mt-2 text-sm leading-6 text-stone-500">
                  Submit a request from the rider flow to start dispatching.
                </p>
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

function Badge({
  children,
  active = false,
  muted = false,
}: {
  children: React.ReactNode;
  active?: boolean;
  muted?: boolean;
}) {
  return (
    <span
      className={[
        "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]",
        active
          ? muted
            ? "bg-white/15 text-white/80"
            : "bg-white text-ink"
          : muted
            ? "bg-stone-100 text-stone-600"
            : "bg-emerald-100 text-emerald-800",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Car;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[2rem] bg-stone-50 p-4">
      <Icon className="h-5 w-5 text-emerald-700" />
      <p className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-ink">{value}</p>
    </div>
  );
}

function DriverField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </div>
  );
}
