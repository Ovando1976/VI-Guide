import { FormEvent, useMemo, useState } from "react";
import {
  ArrowRight,
  Briefcase,
  Car,
  CheckCircle2,
  Clock,
  MapPin,
  Navigation,
  Phone,
  Plane,
  RefreshCw,
  Ship,
  Sparkles,
  Utensils,
  Users,
  Waves,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  estimateMobilityFare,
  formatMoney,
  islandLabels,
  mobilityServices,
  serviceLabels,
  type MobilityIsland,
  type MobilityServiceType,
  zonePresets,
} from "../lib/mobility/mobilityOs";

type MobilityProps = {
  selectedIsland?: unknown;
  user?: unknown;
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

function coerceIsland(value: unknown): MobilityIsland {
  if (
    value === "st_thomas" ||
    value === "st_john" ||
    value === "st_croix" ||
    value === "water_island"
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

  const [serviceType, setServiceType] =
    useState<MobilityServiceType>("airport_transfer");
  const [island, setIsland] = useState<MobilityIsland>(
    coerceIsland(selectedIsland)
  );
  const [pickup, setPickup] = useState("Cyril E. King Airport");
  const [dropoff, setDropoff] = useState("Red Hook Ferry Terminal");
  const [pickupTime, setPickupTime] = useState("ASAP / next available");
  const [passengers, setPassengers] = useState(2);
  const [luggage, setLuggage] = useState(2);
  const [visitorName, setVisitorName] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [notes, setNotes] = useState("Need ferry-aware timing.");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [submittedRequestId, setSubmittedRequestId] = useState("");

  const quote = useMemo(
    () =>
      estimateMobilityFare({
        serviceType,
        island,
        pickup,
        dropoff,
        passengers,
        luggage,
      }),
    [dropoff, island, luggage, passengers, pickup, serviceType]
  );

  const selectedService = useMemo(
    () => mobilityServices.find((service) => service.id === serviceType),
    [serviceType]
  );

  function selectService(nextService: MobilityServiceType) {
    setServiceType(nextService);

    const service = mobilityServices.find((item) => item.id === nextService);
    if (service?.defaultPickup) setPickup(service.defaultPickup);
    if (service?.defaultDropoff) setDropoff(service.defaultDropoff);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!pickup.trim() || !dropoff.trim() || !visitorName.trim() || !visitorPhone.trim()) {
      setSaveError("Pickup, dropoff, rider name, and phone are required.");
      return;
    }

    setSaving(true);
    setSaveError("");

    const clientRequestId = `mobility-${Date.now()}`;

    const payload: any = {
      clientRequestId,
      serviceType,
      island,
      pickup: pickup.trim(),
      dropoff: dropoff.trim(),
      pickupTime: pickupTime.trim(),
      passengers,
      luggage,
      visitorName: visitorName.trim(),
      visitorPhone: visitorPhone.trim(),
      notes: notes.trim(),
      estimatedFare: quote,
      status: "new",
      source: "mobility_rider_app",
      assignedDriverName: "",
      assignedDriverPhone: "",
      assignedVehicle: "",
      dispatcherNotes: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      const { createFirestoreMobilityRequest } = await import(
        "../lib/firestore/mobilityRequests"
      );

      const created = await createFirestoreMobilityRequest(payload);

      try {
        const previous = JSON.parse(
          window.localStorage.getItem("vi-demo-mobility-requests") || "[]"
        );
        window.localStorage.setItem(
          "vi-demo-mobility-requests",
          JSON.stringify([payload, ...previous].slice(0, 25))
        );
      } catch {
        // Local fallback is only for demos. Firestore is the source of truth.
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
      <div className="min-h-screen bg-[#f8f0da] px-4 pb-32 pt-8 text-ink">
        <div className="mx-auto max-w-5xl rounded-[2.75rem] bg-ink p-5 text-white shadow-2xl md:p-10">
          <div className="mx-auto max-w-2xl text-center">
            <CheckCircle2 className="mx-auto h-16 w-16 text-turquoise" />
            <h1 className="mt-5 text-4xl font-black md:text-6xl">
              Ride request sent.
            </h1>
            <p className="mt-4 text-sm leading-7 text-white/70 md:text-base">
              This request is now available to the admin inbox and dispatch
              board. This is the core taxi association demo flow.
            </p>

            <div className="mt-7 rounded-[2rem] bg-white p-5 text-left text-ink">
              <div className="flex flex-wrap gap-2">
                <Badge>{serviceLabels[serviceType]}</Badge>
                <Badge>{islandLabels[island]}</Badge>
                <Badge>{formatMoney(quote)} estimate</Badge>
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
    <div className="min-h-screen bg-[#f8f0da] pb-72 text-ink">
      <form onSubmit={handleSubmit} className="mx-auto max-w-7xl px-4 py-8 pb-72">
        <section className="overflow-hidden rounded-[2.75rem] bg-ink text-white shadow-2xl">
          <div className="grid gap-6 p-5 md:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:p-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-turquoise/15 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-turquoise">
                <Car className="h-4 w-4" />
                VI Guide Mobility OS
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
                Taxi association demo ride flow.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 md:text-base">
                Create a visitor transportation request, estimate the ride, and
                send it directly into the dispatch board and admin lead inbox.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {[
                  ["Rider request", "Pickup, dropoff, rider contact, timing."],
                  ["Dispatch board", "Assign driver and move ride status."],
                  ["Partner revenue", "Taxi operators can pay for request flow."],
                ].map(([title, text]) => (
                  <div key={title} className="rounded-[2rem] bg-white/10 p-4">
                    <p className="text-sm font-black">{title}</p>
                    <p className="mt-2 text-xs leading-5 text-white/60">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <aside className="rounded-[2.25rem] bg-white p-5 text-ink">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
                Live quote
              </p>

              <h2 className="mt-2 text-4xl font-black">{formatMoney(quote)}</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Demo fare estimate for {serviceLabels[serviceType]} on{" "}
                {islandLabels[island]}.
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

              <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-950">
                This request will save to Firestore and appear inside{" "}
                <span className="font-black">/admin/leads</span> and{" "}
                <span className="font-black">/mobility/dispatch</span>.
              </div>
            </aside>
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-5">
            <Panel title="1. Select ride type" eyebrow="Service template">
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

            <Panel title="2. Pickup and dropoff" eyebrow="Route">
              <div className="grid gap-3 md:grid-cols-2">
                <label>
                  <FieldLabel>Island</FieldLabel>
                  <select
                    value={island}
                    onChange={(event) => setIsland(event.target.value as MobilityIsland)}
                    className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold outline-none ring-emerald-700/20 focus:ring-4"
                  >
                    {Object.entries(islandLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
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
                <Field
                  label="Pickup"
                  value={pickup}
                  onChange={setPickup}
                  placeholder="Airport, hotel, villa, beach..."
                />
                <Field
                  label="Dropoff"
                  value={dropoff}
                  onChange={setDropoff}
                  placeholder="Ferry, beach, restaurant..."
                />
              </div>

              <div className="mt-4">
                <FieldLabel>Quick locations</FieldLabel>
                <div className="mt-2 flex flex-wrap gap-2">
                  {zonePresets[island].map((zone) => (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => {
                        if (!pickup || pickup === selectedService?.defaultPickup) {
                          setPickup(zone.name);
                        } else {
                          setDropoff(zone.name);
                        }
                      }}
                      className="rounded-2xl bg-stone-100 px-4 py-3 text-xs font-black text-stone-700 active:scale-95"
                    >
                      {zone.name}
                    </button>
                  ))}
                </div>
              </div>
            </Panel>
          </div>

          <div className="space-y-5">
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

            <div className="pb-20"><Panel title="4. Submit to dispatch" eyebrow="Taxi association demo">
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
            </Panel></div>
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
  children: React.ReactNode;
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

function FieldLabel({ children }: { children: React.ReactNode }) {
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
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

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
      {children}
    </span>
  );
}
