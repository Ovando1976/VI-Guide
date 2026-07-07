import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Briefcase,
  Car,
  CheckCircle2,
  Clock,
  Info,
  MapPin,
  Navigation,
  Phone,
  Plane,
  RefreshCw,
  ShieldCheck,
  Ship,
  Sparkles,
  Utensils,
  Users,
  Waves,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  calculateOfficialTaxiFare,
  formatMoney,
  getTaxiTariffPlaces,
  islandLabels,
  mobilityServices,
  serviceLabels,
  type MobilityIsland,
  type MobilityServiceType,
} from "../lib/mobility/mobilityOs";
import MobilityRoadPreviewMap from "./mobility/MobilityRoadPreviewMap";

type MobilityProps = {
  selectedIsland?: unknown;
  user?: unknown;
};

type OfficialRoute = {
  label: string;
  island: MobilityIsland;
  serviceType: MobilityServiceType;
  pickup: string;
  dropoff: string;
  passengers: number;
  luggage: number;
  notes: string;
};

const iconMap: Record<string, LucideIcon> = {
  plane: Plane,
  ship: Ship,
  navigation: Navigation,
  waves: Waves,
  utensils: Utensils,
  users: Users,
  car: Car,
};

const supportedIslands: MobilityIsland[] = [
  "st_thomas",
  "st_john",
  "st_croix",
];

const officialRouteDefaults: Record<MobilityIsland, { pickup: string; dropoff: string }> = {
  st_thomas: {
    pickup: "Cyril E. King Airport",
    dropoff: "Red Hook",
  },
  st_john: {
    pickup: "Cruz Bay",
    dropoff: "Trunk Bay",
  },
  st_croix: {
    pickup: "Airport",
    dropoff: "Christiansted",
  },
  water_island: {
    pickup: "Water Island Ferry",
    dropoff: "Honeymoon Beach",
  },
};

const demoRoutes: OfficialRoute[] = [
  {
    label: "STT Airport → Red Hook",
    island: "st_thomas",
    serviceType: "airport_transfer",
    pickup: "Cyril E. King Airport",
    dropoff: "Red Hook",
    passengers: 2,
    luggage: 2,
    notes: "Need ferry-aware transfer timing.",
  },
  {
    label: "Havensight → Magens Bay",
    island: "st_thomas",
    serviceType: "cruise_pickup",
    pickup: "Havensight (WICO)",
    dropoff: "Magens Bay",
    passengers: 4,
    luggage: 0,
    notes: "Cruise beach day pickup.",
  },
  {
    label: "Charlotte Amalie → Red Hook",
    island: "st_thomas",
    serviceType: "ferry_transfer",
    pickup: "Charlotte Amalie",
    dropoff: "Red Hook",
    passengers: 2,
    luggage: 1,
    notes: "Heading to ferry terminal.",
  },
  {
    label: "Cruz Bay → Trunk Bay",
    island: "st_john",
    serviceType: "beach_trip",
    pickup: "Cruz Bay",
    dropoff: "Trunk Bay",
    passengers: 2,
    luggage: 2,
    notes: "Beach day request.",
  },
  {
    label: "Cruz Bay → Coral Bay",
    island: "st_john",
    serviceType: "private_group",
    pickup: "Cruz Bay",
    dropoff: "Coral Bay",
    passengers: 3,
    luggage: 1,
    notes: "Private group transfer.",
  },
  {
    label: "STX Airport → Christiansted",
    island: "st_croix",
    serviceType: "airport_transfer",
    pickup: "Airport",
    dropoff: "Christiansted",
    passengers: 2,
    luggage: 2,
    notes: "Airport arrival transfer.",
  },
  {
    label: "Frederiksted → Christiansted",
    island: "st_croix",
    serviceType: "cruise_pickup",
    pickup: "Frederiksted",
    dropoff: "Christiansted",
    passengers: 4,
    luggage: 0,
    notes: "Cruise visitor transfer.",
  },
];

function coerceIsland(value: unknown): MobilityIsland {
  if (
    value === "st_thomas" ||
    value === "st_john" ||
    value === "st_croix"
  ) {
    return value;
  }

  return "st_thomas";
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export default function Mobility({ selectedIsland }: MobilityProps) {
  const navigate = useNavigate();

  const initialIsland = coerceIsland(selectedIsland);

  const [serviceType, setServiceType] =
    useState<MobilityServiceType>("airport_transfer");
  const [island, setIsland] = useState<MobilityIsland>(initialIsland);
  const [pickup, setPickup] = useState(officialRouteDefaults[initialIsland].pickup);
  const [dropoff, setDropoff] = useState(officialRouteDefaults[initialIsland].dropoff);
  const [pickupTime, setPickupTime] = useState("ASAP / next available");
  const [passengers, setPassengers] = useState(2);
  const [luggage, setLuggage] = useState(2);
  const [oversizedLuggage, setOversizedLuggage] = useState(0);
  const [waitingMinutes, setWaitingMinutes] = useState(0);
  const [roundTrip, setRoundTrip] = useState(false);
  const [afterHours, setAfterHours] = useState(false);
  const [radioCall, setRadioCall] = useState(false);
  const [exclusiveRide, setExclusiveRide] = useState(false);
  const [visitorName, setVisitorName] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [notes, setNotes] = useState("Need ferry-aware timing.");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [submittedRequestId, setSubmittedRequestId] = useState("");

  const tariffPlaces = useMemo(() => getTaxiTariffPlaces(island), [island]);

  useEffect(() => {
    const defaults = officialRouteDefaults[island];

    if (tariffPlaces.length === 0) return;

    if (!tariffPlaces.includes(pickup)) {
      setPickup(defaults.pickup);
    }

    if (!tariffPlaces.includes(dropoff)) {
      setDropoff(defaults.dropoff);
    }
  }, [island, tariffPlaces]);

  const tariffQuote = useMemo(
    () =>
      calculateOfficialTaxiFare({
        island,
        pickup,
        dropoff,
        passengerCount: passengers,
        luggageCount: luggage,
        oversizedLuggageCount: oversizedLuggage,
        waitingMinutes,
        roundTrip,
        afterHours,
        radioCall,
        exclusiveRide: exclusiveRide || serviceType === "private_group",
      }),
    [
      afterHours,
      dropoff,
      exclusiveRide,
      island,
      luggage,
      oversizedLuggage,
      passengers,
      pickup,
      radioCall,
      roundTrip,
      serviceType,
      waitingMinutes,
    ]
  );

  const quote = tariffQuote.totalFare ?? 0;
  const isOfficialMatch = tariffQuote.status === "official_match";

  function applyRoute(route: OfficialRoute) {
    setIsland(route.island);
    setServiceType(route.serviceType);
    setPickup(route.pickup);
    setDropoff(route.dropoff);
    setPassengers(route.passengers);
    setLuggage(route.luggage);
    setNotes(route.notes);
    setOversizedLuggage(0);
    setWaitingMinutes(0);
    setRoundTrip(false);
    setAfterHours(false);
    setRadioCall(false);
    setExclusiveRide(route.serviceType === "private_group");
  }

  function changeIsland(nextIsland: MobilityIsland) {
    const defaults = officialRouteDefaults[nextIsland];
    setIsland(nextIsland);
    setPickup(defaults.pickup);
    setDropoff(defaults.dropoff);
  }

  function selectService(nextService: MobilityServiceType) {
    setServiceType(nextService);

    if (nextService === "private_group") {
      setExclusiveRide(true);
    }

    if (nextService === "airport_transfer") {
      if (island === "st_thomas") {
        setPickup("Cyril E. King Airport");
        setDropoff("Red Hook");
      } else if (island === "st_croix") {
        setPickup("Airport");
        setDropoff("Christiansted");
      } else if (island === "st_john") {
        setPickup("Cruz Bay");
        setDropoff("Trunk Bay");
      }
      return;
    }

    if (nextService === "cruise_pickup") {
      if (island === "st_thomas") {
        setPickup("Havensight (WICO)");
        setDropoff("Magens Bay");
      } else if (island === "st_croix") {
        setPickup("Frederiksted");
        setDropoff("Christiansted");
      }
      return;
    }

    if (nextService === "ferry_transfer") {
      if (island === "st_thomas") {
        setPickup("Cyril E. King Airport");
        setDropoff("Red Hook");
      } else if (island === "st_john") {
        setPickup("Cruz Bay");
        setDropoff("Coral Bay");
      }
      return;
    }

    const defaults = officialRouteDefaults[island];
    setPickup(defaults.pickup);
    setDropoff(defaults.dropoff);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!pickup.trim() || !dropoff.trim() || !visitorName.trim() || !visitorPhone.trim()) {
      setSaveError("Pickup, dropoff, rider name, and rider phone are required.");
      return;
    }

    setSaving(true);
    setSaveError("");

    const now = Date.now();
    const clientRequestId = `mobility-${now}`;

    const payload: Record<string, unknown> = {
      clientRequestId,
      serviceType,
      island,
      pickup: pickup.trim(),
      dropoff: dropoff.trim(),
      pickupTime: pickupTime.trim(),
      passengers,
      luggage,
      oversizedLuggage,
      waitingMinutes,
      roundTrip,
      afterHours,
      radioCall,
      exclusiveRide: exclusiveRide || serviceType === "private_group",
      visitorName: visitorName.trim(),
      visitorPhone: visitorPhone.trim(),
      visitorEmail: visitorEmail.trim(),
      notes: notes.trim(),
      estimatedFare: quote,
      tariffStatus: tariffQuote.status,
      tariffSource: tariffQuote.sourceLabel,
      tariffComplianceNote: tariffQuote.complianceNote,
      tariffBreakdown: tariffQuote.breakdown,
      tariffRouteName: tariffQuote.routeName,
      tariffMatchedRuleId: tariffQuote.matchedRuleId || "",
      tariffMatchedSourceTable: tariffQuote.matchedSourceTable || "",
      status: "new",
      source: "mobility_rider_app",
      assignedDriverName: "",
      assignedDriverPhone: "",
      assignedVehicle: "",
      dispatcherNotes: "",
      createdAt: now,
      updatedAt: now,
    };

    try {
      const { createFirestoreMobilityRequest } = await import(
        "../lib/firestore/mobilityRequests"
      );

      const created = await createFirestoreMobilityRequest(payload as any);

      try {
        const previous = JSON.parse(
          window.localStorage.getItem("vi-demo-mobility-requests") || "[]"
        );
        window.localStorage.setItem(
          "vi-demo-mobility-requests",
          JSON.stringify([payload, ...previous].slice(0, 25))
        );
      } catch {
        // Firestore is the source of truth. Local storage is only a demo fallback.
      }

      const id =
        typeof created === "string"
          ? created
          : created && typeof created === "object" && "id" in created
            ? String((created as { id?: unknown }).id)
            : clientRequestId;

      setSubmittedRequestId(id);
    } catch (error) {
      setSaveError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  if (submittedRequestId) {
    return (
      <div className="min-h-screen bg-[#f8f0da] px-4 pb-80 pt-8 text-ink">

        <MobilityRoadPreviewMap
          title="Road preview"
          subtitle="Preview the requested ride route on real roads before matching or dispatch."
        />


        <div className="mx-auto max-w-5xl rounded-[2.75rem] bg-ink p-5 text-white shadow-2xl md:p-10">
          <div className="mx-auto max-w-2xl text-center">
            <CheckCircle2 className="mx-auto h-16 w-16 text-turquoise" />
            <h1 className="mt-5 text-4xl font-black md:text-6xl">
              Ride request sent.
            </h1>
            <p className="mt-4 text-sm leading-7 text-white/70 md:text-base">
              The request is now available in the dispatch board and admin lead
              inbox with the tariff status, fare basis, and rider details.
            </p>

            <div className="mt-7 rounded-[2rem] bg-white p-5 text-left text-ink">
              <div className="flex flex-wrap gap-2">
                <Badge>{serviceLabels[serviceType]}</Badge>
                <Badge>{islandLabels[island]}</Badge>
                <Badge>
                  {isOfficialMatch ? formatMoney(quote) : "Dispatcher Review"}
                </Badge>
              </div>

              <h2 className="mt-4 text-2xl font-black">
                {pickup} → {dropoff}
              </h2>

              <div className="mt-4 grid gap-3 text-sm font-bold text-stone-600 md:grid-cols-2">
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-700" />
                  {pickupTime}
                </p>
                <p className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-700" />
                  {passengers} passenger{passengers === 1 ? "" : "s"}
                </p>
                <p className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-emerald-700" />
                  {luggage} luggage
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-emerald-700" />
                  {visitorPhone}
                </p>
              </div>

              <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-950">
                {tariffQuote.complianceNote}
              </div>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={() => navigate("/mobility/dispatch")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-turquoise px-5 py-4 text-sm font-black text-ink active:scale-95"
              >
                Open Dispatch Board
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => navigate("/admin/leads")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-black text-ink active:scale-95"
              >
                Admin Leads
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => setSubmittedRequestId("")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-sm font-black text-white active:scale-95"
              >
                Create Another
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f0da] pb-96 text-ink">
      <form onSubmit={handleSubmit} className="mx-auto max-w-7xl px-4 py-8 pb-96">
        <section className="overflow-hidden rounded-[2.75rem] bg-ink text-white shadow-2xl">
          <div className="grid gap-6 p-5 md:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:p-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-turquoise/15 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-turquoise">
                <Car className="h-4 w-4" />
                VI Guide Mobility OS
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
                Mobility ride request.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 md:text-base">
                Select an island, pickup, dropoff, rider details, and add-on charges. The request saves to
                dispatch with the fare basis attached.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {[
                  ["Route-first", "Customer chooses from published places."],
                  ["Dispatch-ready", "Requests flow into the taxi operator board."],
                  ["No fake pricing", "Unmatched routes require dispatcher review."],
                ].map(([title, text]) => (
                  <div key={title} className="rounded-[2rem] bg-white/10 p-4">
                    <p className="text-sm font-black">{title}</p>
                    <p className="mt-2 text-xs leading-5 text-white/60">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <aside className="rounded-[2.25rem] bg-white p-5 text-ink">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
                    Live quote
                  </p>

                  <h2 className="mt-2 text-4xl font-black">
                    {isOfficialMatch ? formatMoney(quote) : "Review"}
                  </h2>
                </div>

                <span
                  className={[
                    "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]",
                    isOfficialMatch
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-900",
                  ].join(" ")}
                >
                  {isOfficialMatch ? "Official match" : "Dispatcher review"}
                </span>
              </div>

              <p className="mt-2 text-sm leading-6 text-stone-600">
                {isOfficialMatch
                  ? `Tariff-based fare for ${serviceLabels[serviceType]} on ${islandLabels[island]}.`
                  : "This route is not matched to a loaded tariff row yet."}
              </p>

              <div className="mt-5 space-y-3">
                <SummaryRow label="Pickup" value={pickup || "Not set"} />
                <SummaryRow label="Dropoff" value={dropoff || "Not set"} />
                <SummaryRow label="Time" value={pickupTime || "Not set"} />
                <SummaryRow
                  label="Load"
                  value={`${passengers} passenger${
                    passengers === 1 ? "" : "s"
                  } · ${luggage} luggage`}
                />
              </div>

              <div className="mt-5 rounded-2xl bg-stone-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">
                  Tariff compliance
                </p>
                <p className="mt-2 text-sm font-bold leading-6 text-stone-700">
                  {tariffQuote.complianceNote}
                </p>

                {tariffQuote.breakdown.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {tariffQuote.breakdown.map((item) => (
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
            </aside>
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.92fr]">
          <div className="space-y-5">
            <Panel title="1. Choose pickup and dropoff" eyebrow="Customer route">
              <div className="grid gap-3 md:grid-cols-2">
                <label>
                  <FieldLabel>Island</FieldLabel>
                  <select
                    value={island}
                    onChange={(event) => changeIsland(event.target.value as MobilityIsland)}
                    className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold outline-none ring-emerald-700/20 focus:ring-4"
                  >
                    {supportedIslands.map((value) => (
                      <option key={value} value={value}>
                        {islandLabels[value]}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <FieldLabel>Pickup time</FieldLabel>
                  <input
                    value={pickupTime}
                    onChange={(event) => setPickupTime(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold outline-none ring-emerald-700/20 focus:ring-4"
                  />
                </label>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label>
                  <FieldLabel>Pickup place</FieldLabel>
                  <select
                    value={pickup}
                    onChange={(event) => setPickup(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold outline-none ring-emerald-700/20 focus:ring-4"
                  >
                    {tariffPlaces.map((place) => (
                      <option key={`pickup-${place}`} value={place}>
                        {place}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <FieldLabel>Dropoff place</FieldLabel>
                  <select
                    value={dropoff}
                    onChange={(event) => setDropoff(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold outline-none ring-emerald-700/20 focus:ring-4"
                  >
                    {tariffPlaces.map((place) => (
                      <option key={`dropoff-${place}`} value={place}>
                        {place}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-950">
                Pickup and dropoff are loaded from the published tariff tables.
                Unmatched destinations are handled as dispatcher review instead
                of invented fares.
              </div>

              <div className="mt-4">
                <FieldLabel>Common demo routes</FieldLabel>
                <div className="mt-2 flex flex-wrap gap-2">
                  {demoRoutes
                    .filter((route) => route.island === island)
                    .map((route) => (
                      <button
                        key={route.label}
                        type="button"
                        onClick={() => applyRoute(route)}
                        className="rounded-2xl bg-stone-100 px-4 py-3 text-xs font-black text-stone-700 active:scale-95"
                      >
                        {route.label}
                      </button>
                    ))}
                </div>
              </div>
            </Panel>

            <Panel title="2. Select ride type" eyebrow="Service template">
              <div className="grid gap-3 md:grid-cols-2">
                {mobilityServices.map((service) => {
                  const Icon = iconMap[service.icon] || Car;
                  const active = serviceType === service.id;

                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => selectService(service.id)}
                      className={[
                        "rounded-[2rem] p-4 text-left ring-1 transition active:scale-[0.99]",
                        active
                          ? "bg-emerald-700 text-white ring-emerald-700"
                          : "bg-white text-ink ring-stone-200 hover:-translate-y-0.5",
                      ].join(" ")}
                    >
                      <Icon
                        className={[
                          "h-6 w-6",
                          active ? "text-turquoise" : "text-emerald-700",
                        ].join(" ")}
                      />
                      <p className="mt-3 text-lg font-black">{service.title}</p>
                      <p
                        className={[
                          "mt-1 text-sm leading-6",
                          active ? "text-white/70" : "text-stone-600",
                        ].join(" ")}
                      >
                        {service.subtitle}
                      </p>
                    </button>
                  );
                })}
              </div>
            </Panel>
          </div>

          <div className="space-y-5 pb-64">
            <Panel title="3. Rider details" eyebrow="Contact and load">
              <div className="grid gap-3 md:grid-cols-2">
                <Field
                  label="Rider name"
                  value={visitorName}
                  onChange={setVisitorName}
                  placeholder="Visitor or group name"
                />
                <Field
                  label="Rider phone"
                  value={visitorPhone}
                  onChange={setVisitorPhone}
                  placeholder="(340) 555-0101"
                  type="tel"
                />
              </div>

              <div className="mt-3">
                <Field
                  label="Rider email"
                  value={visitorEmail}
                  onChange={setVisitorEmail}
                  placeholder="Optional email"
                  type="email"
                />
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <NumberField
                  label="Passengers"
                  value={passengers}
                  onChange={setPassengers}
                  min={1}
                  max={20}
                />
                <NumberField
                  label="Luggage"
                  value={luggage}
                  onChange={setLuggage}
                  min={0}
                  max={20}
                />
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <NumberField
                  label="Oversized luggage"
                  value={oversizedLuggage}
                  onChange={setOversizedLuggage}
                  min={0}
                  max={20}
                />
                <NumberField
                  label="Waiting minutes"
                  value={waitingMinutes}
                  onChange={setWaitingMinutes}
                  min={0}
                  max={240}
                />
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Toggle
                  label="Round trip"
                  checked={roundTrip}
                  onChange={setRoundTrip}
                />
                <Toggle
                  label="After-hours"
                  checked={afterHours}
                  onChange={setAfterHours}
                />
                <Toggle
                  label="Radio / phone call"
                  checked={radioCall}
                  onChange={setRadioCall}
                />
                <Toggle
                  label="Exclusive taxi"
                  checked={exclusiveRide || serviceType === "private_group"}
                  onChange={setExclusiveRide}
                />
              </div>

              <label className="mt-3 block">
                <FieldLabel>Notes</FieldLabel>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold outline-none ring-emerald-700/20 focus:ring-4"
                  placeholder="Ferry timing, elderly guest, accessibility, return pickup..."
                />
              </label>
            </Panel>

            <Panel title="4. Review and send" eyebrow="Dispatch submission">
              <div
                className={[
                  "mb-4 rounded-2xl p-4 text-sm font-bold leading-6",
                  isOfficialMatch
                    ? "bg-emerald-50 text-emerald-950"
                    : "bg-amber-100 text-amber-950",
                ].join(" ")}
              >
                <div className="flex items-start gap-2">
                  {isOfficialMatch ? (
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                  ) : (
                    <Info className="mt-0.5 h-5 w-5 shrink-0" />
                  )}
                  <p>
                    {isOfficialMatch
                      ? `Ready to submit with tariff-based fare ${formatMoney(quote)}.`
                      : "This request can be submitted, but dispatch must review the fare before confirming."}
                  </p>
                </div>
              </div>

              {saveError ? (
                <div className="mb-4 rounded-2xl bg-amber-100 p-3 text-sm font-bold leading-6 text-amber-950">
                  {saveError}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-4 text-sm font-black text-white disabled:opacity-60 active:scale-95"
              >
                {saving ? "Sending to Dispatch..." : "Send Ride Request"}
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => navigate("/mobility/dispatch")}
                  className="rounded-2xl bg-stone-100 px-5 py-3 text-sm font-black text-ink active:scale-95"
                >
                  Open Dispatch Board
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/admin/leads")}
                  className="rounded-2xl bg-stone-100 px-5 py-3 text-sm font-black text-ink active:scale-95"
                >
                  Admin Leads
                </button>
              </div>
            </Panel>
          </div>
        </section>
      </form>
    </div>
  );
}

function Panel({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[2.25rem] bg-white p-5 shadow-xl">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-black">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
      {children}
    </span>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold outline-none ring-emerald-700/20 focus:ring-4"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <input
        value={value}
        min={min}
        max={max}
        type="number"
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold outline-none ring-emerald-700/20 focus:ring-4"
      />
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={[
        "rounded-2xl px-4 py-3 text-left text-xs font-black uppercase tracking-[0.16em] ring-1 active:scale-95",
        checked
          ? "bg-emerald-700 text-white ring-emerald-700"
          : "bg-white text-stone-600 ring-stone-200",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-stone-50 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-ink">{value}</p>
    </div>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
      {children}
    </span>
  );
}
