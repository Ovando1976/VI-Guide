import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Car,
  CheckCircle2,
  Clipboard,
  ClipboardCheck,
  Clock,
  DollarSign,
  Info,
  MapPin,
  Phone,
  Radio,
  RefreshCw,
  Route,
  Search,
  ShieldCheck,
  User,
  Users,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
  calculateMobilityCustomerQuote,
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

type QuoteMode =
  | "official_tariff"
  | "custom_dispatch_estimate"
  | "dispatcher_review"
  | "";

type RoadFlag = {
  place: string;
  severity: string;
  label: string;
  note: string;
  adjustment?: number;
};

type FareBreakdownItem = {
  label: string;
  amount: number;
};

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
  oversizedLuggage?: number;
  waitingMinutes?: number;
  roundTrip?: boolean;
  afterHours?: boolean;
  radioCall?: boolean;
  exclusiveRide?: boolean;
  visitorName: string;
  visitorPhone: string;
  visitorEmail?: string;
  notes?: string;
  estimatedFare: number;
  quoteMode: QuoteMode;
  isOfficialTariff?: boolean;
  tariffStatus?: string;
  tariffSource?: string;
  tariffComplianceNote?: string;
  tariffBreakdown?: FareBreakdownItem[];
  tariffRouteName?: string;
  tariffMatchedRuleId?: string;
  tariffMatchedSourceTable?: string;
  pricingPolicyNote?: string;
  roadFlags?: RoadFlag[];
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

const quoteModeLabels: Record<string, string> = {
  official_tariff: "Official Tariff",
  custom_dispatch_estimate: "Custom Estimate",
  dispatcher_review: "Dispatcher Review",
  "": "Not Recorded",
};

function titleize(value: unknown) {
  return String(value || "Unknown")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function islandLabel(value: unknown) {
  return islandLabels[String(value) as keyof typeof islandLabels] || titleize(value);
}

function serviceLabel(value: unknown) {
  return serviceLabels[String(value) as keyof typeof serviceLabels] || titleize(value);
}

function statusLabel(value: unknown) {
  return statusLabels[String(value) as keyof typeof statusLabels] || titleize(value);
}

function fareLabel(value: unknown) {
  const amount = Number(value || 0);
  return amount > 0 ? formatMoney(amount) : "Review";
}

function normalizeRide(raw: any): MobilityRide {
  const serviceType = raw.serviceType || "custom_ride";
  const island = raw.island || "st_thomas";
  const pickup = raw.pickup || "Unknown pickup";
  const dropoff = raw.dropoff || "Unknown dropoff";
  const passengers = Number(raw.passengers || 1);
  const luggage = Number(raw.luggage || 0);
  const oversizedLuggage = Number(raw.oversizedLuggage || 0);
  const waitingMinutes = Number(raw.waitingMinutes || 0);
  const roundTrip = Boolean(raw.roundTrip);
  const afterHours = Boolean(raw.afterHours);
  const radioCall = Boolean(raw.radioCall);
  const exclusiveRide = Boolean(raw.exclusiveRide);

  const hydratedQuote = calculateMobilityCustomerQuote({
    island,
    serviceType,
    pickup,
    dropoff,
    passengerCount: passengers,
    luggageCount: luggage,
    oversizedLuggageCount: oversizedLuggage,
    waitingMinutes,
    roundTrip,
    afterHours,
    radioCall,
    exclusiveRide,
  });

  const savedFare = Number(raw.estimatedFare || 0);
  const hydratedFare = Number(hydratedQuote.totalFare || 0);

  return {
    id: String(raw.id || raw.clientRequestId || `ride-${Date.now()}`),
    clientRequestId: raw.clientRequestId || "",
    serviceType,
    island,
    pickup,
    dropoff,
    pickupTime: raw.pickupTime || "ASAP / next available",
    passengers,
    luggage,
    oversizedLuggage,
    waitingMinutes,
    roundTrip,
    afterHours,
    radioCall,
    exclusiveRide,
    visitorName: raw.visitorName || "Unknown rider",
    visitorPhone: raw.visitorPhone || "",
    visitorEmail: raw.visitorEmail || "",
    notes: raw.notes || "",
    estimatedFare: savedFare || hydratedFare,
    quoteMode: raw.quoteMode || hydratedQuote.quoteMode || "dispatcher_review",
    isOfficialTariff:
      typeof raw.isOfficialTariff === "boolean"
        ? raw.isOfficialTariff
        : hydratedQuote.isOfficialTariff,
    tariffStatus: raw.tariffStatus || hydratedQuote.status || "",
    tariffSource: raw.tariffSource || hydratedQuote.sourceLabel || "",
    tariffComplianceNote:
      raw.tariffComplianceNote || hydratedQuote.complianceNote || "",
    tariffBreakdown: Array.isArray(raw.tariffBreakdown) && raw.tariffBreakdown.length
      ? raw.tariffBreakdown
      : hydratedQuote.breakdown || [],
    tariffRouteName: raw.tariffRouteName || hydratedQuote.routeName || "",
    tariffMatchedRuleId: raw.tariffMatchedRuleId || hydratedQuote.matchedRuleId || "",
    tariffMatchedSourceTable:
      raw.tariffMatchedSourceTable || hydratedQuote.matchedSourceTable || "",
    pricingPolicyNote: raw.pricingPolicyNote || hydratedQuote.pricingPolicyNote || "",
    roadFlags: Array.isArray(raw.roadFlags) && raw.roadFlags.length
      ? raw.roadFlags
      : hydratedQuote.roadFlags || [],
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

function quoteTone(ride: MobilityRide) {
  if (ride.quoteMode === "official_tariff" || ride.isOfficialTariff) {
    return {
      label: "Official tariff",
      icon: ShieldCheck,
      card: "bg-emerald-50 text-emerald-950",
      pill: "bg-emerald-100 text-emerald-800",
    };
  }

  if (ride.quoteMode === "custom_dispatch_estimate") {
    return {
      label: "Custom estimate",
      icon: AlertTriangle,
      card: "bg-amber-50 text-amber-950",
      pill: "bg-amber-100 text-amber-900",
    };
  }

  return {
    label: "Dispatcher review",
    icon: Info,
    card: "bg-stone-100 text-stone-700",
    pill: "bg-stone-100 text-stone-700",
  };
}

function dispatchNote(ride: MobilityRide) {
  const roadFlags = ride.roadFlags?.length
    ? ride.roadFlags
        .map((flag) => `- ${flag.place}: ${flag.label}. ${flag.note}`)
        .join("\n")
    : "None";

  const fareBreakdown = ride.tariffBreakdown?.length
    ? ride.tariffBreakdown
        .map((item) => `- ${item.label}: ${formatMoney(item.amount)}`)
        .join("\n")
    : "No fare breakdown recorded.";

  return `VI Guide Mobility Dispatch

STATUS
${statusLabel(ride.status)}

QUOTE
Mode: ${quoteModeLabels[ride.quoteMode] || titleize(ride.quoteMode)}
Fare: ${fareLabel(ride.estimatedFare)}
Tariff status: ${ride.tariffStatus || "Not recorded"}
Tariff route: ${ride.tariffRouteName || `${ride.pickup} → ${ride.dropoff}`}
Source: ${ride.tariffMatchedSourceTable || ride.tariffSource || "Not recorded"}

ROUTE
Island: ${islandLabel(ride.island)}
Service: ${serviceLabel(ride.serviceType)}
Pickup: ${ride.pickup}
Dropoff: ${ride.dropoff}
Pickup time: ${ride.pickupTime}

RIDER
Name: ${ride.visitorName}
Phone: ${ride.visitorPhone || "N/A"}
Email: ${ride.visitorEmail || "N/A"}
Passengers: ${ride.passengers}
Luggage: ${ride.luggage}
Oversized luggage: ${ride.oversizedLuggage || 0}

ADD-ONS
Round trip: ${ride.roundTrip ? "Yes" : "No"}
After-hours: ${ride.afterHours ? "Yes" : "No"}
Radio/phone call: ${ride.radioCall ? "Yes" : "No"}
Exclusive taxi: ${ride.exclusiveRide ? "Yes" : "No"}
Waiting minutes: ${ride.waitingMinutes || 0}

FARE BREAKDOWN
${fareBreakdown}

ROAD FLAGS
${roadFlags}

ASSIGNMENT
Driver: ${ride.assignedDriverName || "Unassigned"}
Driver phone: ${ride.assignedDriverPhone || "Unassigned"}
Vehicle: ${ride.assignedVehicle || "Unassigned"}

Rider notes:
${ride.notes || "None"}

Dispatcher notes:
${ride.dispatcherNotes || "None"}

Policy note:
${ride.pricingPolicyNote || ride.tariffComplianceNote || "Dispatcher should confirm before accepting."}`;
}

export default function MobilityDispatchDemo() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState<MobilityRide[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | MobilityRequestStatus>("all");
  const [islandFilter, setIslandFilter] = useState<"all" | MobilityIsland>("all");
  const [quoteFilter, setQuoteFilter] = useState<"all" | QuoteMode>("all");
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
          .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

        setRequests(normalized);
      },
      (err) => setError(errorMessage(err))
    );

    return () => unsubscribe();
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return requests.filter((ride) => {
      const statusMatch = statusFilter === "all" || ride.status === statusFilter;
      const islandMatch = islandFilter === "all" || ride.island === islandFilter;
      const quoteMatch = quoteFilter === "all" || ride.quoteMode === quoteFilter;

      const queryMatch =
        !needle ||
        `${ride.pickup} ${ride.dropoff} ${ride.visitorName} ${ride.visitorPhone} ${ride.assignedDriverName} ${ride.tariffRouteName}`
          .toLowerCase()
          .includes(needle);

      return statusMatch && islandMatch && quoteMatch && queryMatch;
    });
  }, [islandFilter, query, quoteFilter, requests, statusFilter]);

  const selectedRide =
    requests.find((ride) => ride.id === selectedId) || filtered[0] || requests[0];

  useEffect(() => {
    if (!selectedRide) return;

    if (!selectedId || selectedRide.id !== selectedId) {
      setSelectedId(selectedRide.id);
    }

    setDispatcherNotes(selectedRide.dispatcherNotes || "");
  }, [selectedRide?.id]);

  const stats = useMemo(
    () => ({
      total: requests.length,
      new: requests.filter((ride) => ride.status === "new").length,
      active: requests.filter((ride) =>
        ["quoted", "accepted", "driver_en_route", "arrived", "in_progress"].includes(
          ride.status
        )
      ).length,
      official: requests.filter(
        (ride) => ride.quoteMode === "official_tariff" || ride.isOfficialTariff
      ).length,
      custom: requests.filter((ride) => ride.quoteMode === "custom_dispatch_estimate").length,
      review: requests.filter(
        (ride) =>
          ride.quoteMode === "dispatcher_review" ||
          (!ride.quoteMode && !ride.estimatedFare)
      ).length,
      roadFlags: requests.filter((ride) => (ride.roadFlags || []).length > 0).length,
    }),
    [requests]
  );

  async function copyText(label: string, value: string) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

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

  const selectedTone = selectedRide ? quoteTone(selectedRide) : null;

  return (
    <div className="min-h-screen bg-[#f8f0da] pb-40 text-ink">
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-[2.75rem] bg-ink p-5 text-white shadow-2xl md:p-8 lg:p-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-turquoise/15 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-turquoise">
                <Radio className="h-4 w-4" />
                Taxi Association Command Center
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
                Dispatch rides with tariff intelligence.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 md:text-base">
                Manage official tariff rides, custom road-aware estimates,
                dispatcher-review requests, driver assignment, rider contact,
                and status workflow from one command board.
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
            <Notice tone="success" icon={ClipboardCheck}>
              Copied {copied}
            </Notice>
          ) : null}

          {error ? (
            <Notice tone="warning" icon={AlertTriangle}>
              {error}
            </Notice>
          ) : null}

          <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
            <StatCard label="Total" value={stats.total} icon={Car} />
            <StatCard label="New" value={stats.new} icon={RefreshCw} />
            <StatCard label="Active" value={stats.active} icon={Radio} />
            <StatCard label="Official" value={stats.official} icon={ShieldCheck} />
            <StatCard label="Custom" value={stats.custom} icon={DollarSign} />
            <StatCard label="Review" value={stats.review} icon={Info} />
            <StatCard label="Road Flags" value={stats.roadFlags} icon={AlertTriangle} />
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2.25rem] bg-white p-5 shadow-xl">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                Live queue
              </p>
              <h2 className="mt-1 text-3xl font-black">Ride requests</h2>
            </div>

            <div className="mt-4 space-y-3">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search rider, pickup, dropoff, driver..."
                  className="w-full rounded-2xl border border-stone-200 bg-white py-3 pl-11 pr-4 text-sm font-bold outline-none ring-emerald-700/20 focus:ring-4"
                />
              </label>

              <div className="grid gap-2 sm:grid-cols-3">
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
                      {statusLabel(status)}
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

                <select
                  value={quoteFilter}
                  onChange={(event) =>
                    setQuoteFilter(event.target.value as "all" | QuoteMode)
                  }
                  className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold outline-none"
                >
                  <option value="all">All quotes</option>
                  <option value="official_tariff">Official tariff</option>
                  <option value="custom_dispatch_estimate">Custom estimate</option>
                  <option value="dispatcher_review">Dispatcher review</option>
                </select>
              </div>
            </div>

            <div className="mt-5 max-h-[820px] space-y-3 overflow-auto pr-1">
              {filtered.length === 0 ? (
                <EmptyState />
              ) : (
                filtered.map((ride) => {
                  const tone = quoteTone(ride);
                  const ToneIcon = tone.icon;
                  const active = selectedRide?.id === ride.id;

                  return (
                    <button
                      key={ride.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(ride.id);
                        setDispatcherNotes(ride.dispatcherNotes || "");
                      }}
                      className={[
                        "w-full rounded-[2rem] p-4 text-left ring-1 transition active:scale-[0.99]",
                        active
                          ? "bg-emerald-700 text-white ring-emerald-700"
                          : "bg-stone-50 text-ink ring-stone-100 hover:bg-stone-100",
                      ].join(" ")}
                    >
                      <div className="flex flex-wrap gap-2">
                        <Badge active={active}>{statusLabel(ride.status)}</Badge>
                        <Badge active={active} muted>
                          {serviceLabel(ride.serviceType)}
                        </Badge>
                        <span
                          className={[
                            "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]",
                            active ? "bg-white/15 text-white" : tone.pill,
                          ].join(" ")}
                        >
                          <ToneIcon className="h-3 w-3" />
                          {tone.label}
                        </span>
                      </div>

                      <h3 className="mt-3 text-xl font-black">
                        {ride.pickup} → {ride.dropoff}
                      </h3>

                      <div
                        className={[
                          "mt-3 grid gap-2 text-xs font-bold sm:grid-cols-2",
                          active ? "text-white/70" : "text-stone-600",
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
                          <DollarSign className="h-4 w-4" />
                          {fareLabel(ride.estimatedFare)}
                        </p>
                        <p className="flex items-center gap-2">
                          <Car className="h-4 w-4" />
                          {ride.assignedDriverName || "Unassigned"}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          <section className="rounded-[2.25rem] bg-white p-5 shadow-xl">
            {selectedRide && selectedTone ? (
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

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-2xl bg-emerald-100 px-4 py-3 text-sm font-black text-emerald-900">
                      {statusLabel(selectedRide.status)}
                    </span>
                    <span className={`rounded-2xl px-4 py-3 text-sm font-black ${selectedTone.pill}`}>
                      {selectedTone.label}
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-4">
                  <InfoCard icon={DollarSign} label="Fare" value={fareLabel(selectedRide.estimatedFare)} />
                  <InfoCard icon={Route} label="Quote mode" value={quoteModeLabels[selectedRide.quoteMode] || titleize(selectedRide.quoteMode)} />
                  <InfoCard icon={Users} label="Passengers" value={String(selectedRide.passengers)} />
                  <InfoCard icon={Briefcase} label="Luggage" value={String(selectedRide.luggage)} />
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <InfoCard icon={MapPin} label="Pickup" value={selectedRide.pickup} />
                  <InfoCard icon={MapPin} label="Dropoff" value={selectedRide.dropoff} />
                  <InfoCard icon={Clock} label="Pickup time" value={selectedRide.pickupTime} />
                  <InfoCard icon={Car} label="Island / Service" value={`${islandLabel(selectedRide.island)} · ${serviceLabel(selectedRide.serviceType)}`} />
                </div>

                <section className={`mt-5 rounded-[2rem] p-4 ${selectedTone.card}`}>
                  <div className="flex items-start gap-3">
                    <selectedTone.icon className="mt-1 h-6 w-6 shrink-0" />
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em]">
                        Fare intelligence
                      </p>
                      <h3 className="mt-1 text-2xl font-black">
                        {fareLabel(selectedRide.estimatedFare)}
                      </h3>
                      <p className="mt-2 text-sm font-bold leading-6">
                        {selectedRide.pricingPolicyNote ||
                          selectedRide.tariffComplianceNote ||
                          "Dispatcher should confirm the final fare before accepting."}
                      </p>
                    </div>
                  </div>

                  {selectedRide.tariffBreakdown?.length ? (
                    <div className="mt-4 space-y-2">
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

                  {selectedRide.tariffMatchedSourceTable || selectedRide.tariffSource ? (
                    <p className="mt-3 text-xs font-bold leading-5 opacity-80">
                      Source:{" "}
                      {selectedRide.tariffMatchedSourceTable ||
                        selectedRide.tariffSource}
                    </p>
                  ) : null}
                </section>

                {selectedRide.roadFlags?.length ? (
                  <section className="mt-5 rounded-[2rem] bg-amber-50 p-4 text-amber-950">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
                      Road condition flags
                    </p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {selectedRide.roadFlags.map((flag) => (
                        <div
                          key={`${flag.place}-${flag.severity}`}
                          className="rounded-2xl bg-white p-3"
                        >
                          <p className="text-sm font-black">
                            {flag.place} · {flag.label}
                          </p>
                          <p className="mt-1 text-xs font-bold leading-5">
                            {flag.note}
                          </p>
                          {flag.adjustment ? (
                            <p className="mt-2 text-xs font-black text-amber-700">
                              Adjustment: {formatMoney(flag.adjustment)}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                <div className="mt-5 rounded-[2rem] bg-stone-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
                    Rider information
                  </p>

                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <InfoCard icon={User} label="Rider" value={selectedRide.visitorName} />
                    <InfoCard icon={Phone} label="Phone" value={selectedRide.visitorPhone || "N/A"} />
                    <InfoCard icon={Info} label="Email" value={selectedRide.visitorEmail || "N/A"} />
                  </div>

                  <p className="mt-3 rounded-2xl bg-white p-3 text-sm font-bold leading-6 text-stone-700">
                    {selectedRide.notes || "No rider notes."}
                  </p>
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
                    placeholder="Driver instructions, pickup detail, return ride, tariff confirmation, road access..."
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
                      Move to {statusLabel(nextMobilityStatus(selectedRide.status))}
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
                      {statusLabel(status)}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState />
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

function Notice({
  tone,
  icon: Icon,
  children,
}: {
  tone: "success" | "warning";
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div
      className={[
        "mt-5 rounded-[2rem] p-4",
        tone === "success"
          ? "bg-emerald-100 text-emerald-950"
          : "bg-amber-100 text-amber-950",
      ].join(" ")}
    >
      <p className="flex items-center gap-2 font-black">
        <Icon className="h-5 w-5" />
        {children}
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-[2rem] bg-white p-4 text-ink">
      <Icon className="h-6 w-6 text-emerald-700" />
      <p className="mt-4 text-4xl font-black">{value.toLocaleString()}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-stone-500">
        {label}
      </p>
    </div>
  );
}

function Badge({
  children,
  active = false,
  muted = false,
}: {
  children: ReactNode;
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
  icon: LucideIcon;
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

function EmptyState() {
  return (
    <div className="rounded-[2rem] bg-stone-50 p-8 text-center">
      <Car className="mx-auto h-10 w-10 text-emerald-700" />
      <p className="mt-3 text-xl font-black">No ride selected</p>
      <p className="mt-2 text-sm leading-6 text-stone-500">
        Submit a request from the rider flow to start dispatching.
      </p>
    </div>
  );
}
