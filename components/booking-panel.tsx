"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Anchor,
  ArrowLeftRight,
  ArrowRight,
  BriefcaseBusiness,
  Bus,
  CarFront,
  Check,
  ChevronDown,
  Clock3,
  CreditCard,
  Crown,
  Loader2,
  Luggage,
  MapPin,
  Minus,
  Plane,
  Plus,
  Route,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import type { FareBreakdown, RideMode } from "@/types/mobility";
import type { EstateRecord, IslandCode } from "@/types/usvi";

const PASSENGER_CONSENT_VERSION = "pilot-2026-07-23";
const ESTATE_NAME_COLLATOR = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});

const RoutePreviewMap = dynamic(
  () =>
    import("@/components/route-preview-map").then(
      (module) => module.RoutePreviewMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] animate-pulse rounded-[28px] bg-slate-100" />
    ),
  },
);

type Props = {
  estates: EstateRecord[];
  fromEstate: EstateRecord | null;
  toEstate: EstateRecord | null;
  fromGeoid: string;
  toGeoid: string;
  mode: RideMode;
  passengers: number;
  luggage: number;
  island: IslandCode;
  onSelectFrom: (geoid: string) => void;
  onSelectTo: (geoid: string) => void;
  onChangeMode: (mode: RideMode) => void;
  onChangePassengers: (value: number) => void;
  onChangeLuggage: (value: number) => void;
  onSwapRoute: () => void;
};

type ModeOption = {
  value: RideMode;
  label: string;
  blurb: string;
  accent: string;
  icon: LucideIcon;
};

const PRIMARY_MODES: ModeOption[] = [
  {
    value: "standard",
    label: "Standard",
    blurb: "Everyday island travel",
    accent: "Best for local rides",
    icon: CarFront,
  },
  {
    value: "shared",
    label: "Shared",
    blurb: "Shared taxi request",
    accent: "Official tariff applies",
    icon: Bus,
  },
  {
    value: "premium",
    label: "Premium",
    blurb: "Extra comfort request",
    accent: "Priority preference",
    icon: Sparkles,
  },
];

const MORE_MODES: ModeOption[] = [
  {
    value: "airport",
    label: "Airport",
    blurb: "Terminal pickup support",
    accent: "Arrival-ready dispatch",
    icon: Plane,
  },
  {
    value: "ferry-transfer",
    label: "Ferry",
    blurb: "Port and ferry connection",
    accent: "Harbor transfer",
    icon: Anchor,
  },
  {
    value: "executive",
    label: "Executive",
    blurb: "Executive vehicle request",
    accent: "Premium fleet preference",
    icon: Crown,
  },
];

export function BookingPanel({
  estates,
  fromEstate,
  toEstate,
  fromGeoid,
  toGeoid,
  mode,
  passengers,
  luggage,
  island,
  onSelectFrom,
  onSelectTo,
  onChangeMode,
  onChangePassengers,
  onChangeLuggage,
  onSwapRoute,
}: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [resultTone, setResultTone] = useState<"success" | "error" | null>(null);
  const [fare, setFare] = useState<FareBreakdown | null>(null);
  const [pilotActive, setPilotActive] = useState(false);
  const [pilotMessage, setPilotMessage] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState("");
  const [connectionDeadline, setConnectionDeadline] = useState("");
  const [pickupInstructions, setPickupInstructions] = useState("");
  const [destinationInstructions, setDestinationInstructions] = useState("");
  const [connectionKind, setConnectionKind] = useState<
    "flight" | "ferry" | "cruise" | "appointment"
  >("ferry");
  const [acceptedOperatorDisclosure, setAcceptedOperatorDisclosure] =
    useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [showMoreModes, setShowMoreModes] = useState(
    MORE_MODES.some((item) => item.value === mode),
  );
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  const [furthestStep, setFurthestStep] = useState<1 | 2 | 3 | 4>(1);

  useEffect(() => {
    const controller = new AbortController();
    setAcceptedOperatorDisclosure(false);
    setAcceptedLegal(false);

    if (!fromEstate || !toEstate) {
      setFare(null);
      setPilotActive(false);
      setPilotMessage(null);
      setQuoteError(null);
      return () => controller.abort();
    }

    setQuoteLoading(true);
    setQuoteError(null);
    fetch("/api/bookings/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        originEstateGeoid: fromEstate.geoid,
        destinationEstateGeoid: toEstate.geoid,
        mode,
        passengers,
        luggage,
      }),
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "Official taxi rate unavailable.");
        }
        setFare(payload.fare as FareBreakdown);
        setPilotActive(payload.pilotActive === true);
        setPilotMessage(
          typeof payload.pilotMessage === "string" ? payload.pilotMessage : null,
        );
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setFare(null);
        setPilotActive(false);
        setPilotMessage(null);
        setQuoteError(
          error instanceof Error
            ? error.message
            : "Official taxi rate unavailable.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setQuoteLoading(false);
      });

    return () => controller.abort();
  }, [fromEstate, toEstate, mode, passengers, luggage]);

  const routeReady = Boolean(fromEstate && toEstate);

  useEffect(() => {
    if (routeReady) return;
    setActiveStep(1);
    setFurthestStep(1);
  }, [routeReady]);

  const canRequest = Boolean(
    routeReady &&
      fare &&
      pilotActive &&
      acceptedOperatorDisclosure &&
      acceptedLegal &&
      !submitting,
  );
  const selectedMode =
    [...PRIMARY_MODES, ...MORE_MODES].find((item) => item.value === mode) ??
    PRIMARY_MODES[0];
  const recommendedMode = useMemo<RideMode>(() => {
    const routeText = `${fromEstate?.baseName ?? ""} ${toEstate?.baseName ?? ""}`.toLowerCase();
    if (routeText.includes("airport")) return "airport";
    if (routeText.includes("ferry") || routeText.includes("red hook")) {
      return "ferry-transfer";
    }
    if (passengers >= 5) return "shared";
    return "standard";
  }, [fromEstate, passengers, toEstate]);

  function advanceToStep(step: 2 | 3 | 4) {
    setActiveStep(step);
    setFurthestStep((current) => Math.max(current, step) as 1 | 2 | 3 | 4);
  }

  async function requestRide() {
    if (!fromEstate || !toEstate) return;
    if (!acceptedOperatorDisclosure || !acceptedLegal) {
      setResultTone("error");
      setResultMessage(
        "Review and accept the passenger disclosures before continuing to payment.",
      );
      return;
    }

    try {
      setSubmitting(true);
      setResultMessage(null);
      setResultTone(null);
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originEstateGeoid: fromEstate.geoid,
          destinationEstateGeoid: toEstate.geoid,
          mode,
          passengers,
          luggage,
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
          connectionDeadline: connectionDeadline
            ? new Date(connectionDeadline).toISOString()
            : null,
          connectionKind: connectionDeadline ? connectionKind : null,
          paymentMethod: "online_card",
          pickupInstructions,
          destinationInstructions,
          acceptedOperatorDisclosure: true,
          acceptedTerms: true,
          acceptedPrivacy: true,
          consentVersion: PASSENGER_CONSENT_VERSION,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Booking request failed.");
      }

      setResultTone("success");
      setResultMessage(
        "Ride request created. Opening secure payment and tracking…",
      );
      router.push(`/checkout/${payload.bookingId}`);
    } catch (error) {
      setResultTone("error");
      setResultMessage(
        error instanceof Error ? error.message : "Unexpected booking error.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      id="book"
      className="overflow-hidden rounded-[38px] border border-[#0b5d5b]/10 bg-[#f7f4ec] shadow-[0_30px_90px_rgba(4,51,49,.14)]"
    >
      <header className="relative overflow-hidden bg-[linear-gradient(135deg,#032d2b_0%,#075b57_50%,#18a99e_100%)] px-5 py-7 text-white sm:px-7 lg:px-9 lg:py-9">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-[.2em] text-[#f7d778] backdrop-blur">
              <ShieldCheck className="h-4 w-4" /> Guided booking
            </div>
            <h2 className="mt-4 text-4xl font-black tracking-[-.05em] sm:text-5xl">
              Your ride, one clear step at a time.
            </h2>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/68 sm:text-base">
              Complete one decision at a time. Your selections stay visible and editable before payment.
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2" aria-label="Booking progress">
            {[
              [1, "Route"],
              [2, "Ride"],
              [3, "Guests"],
              [4, "Review"],
            ].map(([step, label]) => {
              const stepNumber = step as 1 | 2 | 3 | 4;
              const isActive = activeStep === stepNumber;
              const isComplete = furthestStep > stepNumber;
              return (
                <button
                  key={step}
                  type="button"
                  onClick={() => setActiveStep(stepNumber)}
                  disabled={stepNumber > furthestStep}
                  aria-current={isActive ? "step" : undefined}
                  className={`rounded-2xl border px-3 py-3 text-center transition ${
                    isActive
                      ? "border-[#f5c451] bg-[#f5c451] text-[#043331]"
                      : isComplete
                        ? "border-emerald-300/40 bg-emerald-300/15 text-white"
                        : "border-white/10 bg-white/[.07] text-white/65 disabled:cursor-not-allowed disabled:opacity-60"
                  }`}
                >
                  <div className="text-[8px] font-black uppercase tracking-[.16em]">
                    {isComplete ? "✓" : `0${step}`}
                  </div>
                  <div className="mt-1 text-[10px] font-black uppercase tracking-[.1em]">
                    {label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="p-4 sm:p-6 lg:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="text-xs font-bold text-slate-500">
            {fromEstate?.baseName || "Pickup"} <span className="mx-2 text-slate-300">→</span> {toEstate?.baseName || "Destination"}
          </div>
          <div className="flex flex-wrap gap-2">
            <SummaryChip label={selectedMode.label} />
            <SummaryChip label={`${passengers} passenger${passengers === 1 ? "" : "s"}`} />
            <SummaryChip label={`${luggage} bag${luggage === 1 ? "" : "s"}`} />
          </div>
        </div>

        <div className="mx-auto max-w-4xl space-y-6">
          {activeStep === 1 ? (
          <Panel>
            <SectionTitle
              step="01"
              title="Where are you going?"
              subtitle="Select pickup and destination estates to build the route."
            />
            <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-end">
              <Field label="Pickup estate" icon={MapPin}>
                <EstateSelect
                  value={fromGeoid}
                  placeholder="Choose pickup estate"
                  estates={estates}
                  onChange={onSelectFrom}
                />
              </Field>
              <button
                type="button"
                onClick={onSwapRoute}
                disabled={!fromGeoid && !toGeoid}
                className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 bg-white text-[#0f766e] shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 disabled:opacity-40"
                aria-label="Swap pickup and destination"
              >
                <ArrowLeftRight className="h-5 w-5" />
              </button>
              <Field label="Destination estate" icon={Route}>
                <EstateSelect
                  value={toGeoid}
                  placeholder="Choose destination estate"
                  estates={estates}
                  onChange={onSelectTo}
                />
              </Field>
            </div>
            <div
              className={`mt-5 overflow-hidden rounded-[28px] transition-all ${
                routeReady ? "max-h-[520px]" : "max-h-[330px]"
              }`}
            >
              <RoutePreviewMap
                island={island}
                fromEstate={fromEstate}
                toEstate={toEstate}
              />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Pickup instructions (optional)" icon={MapPin}>
                <textarea
                  value={pickupInstructions}
                  onChange={(event) => setPickupInstructions(event.target.value.slice(0, 280))}
                  rows={3}
                  placeholder="Villa name, lobby, gate, landmark, or where to wait"
                  className="w-full resize-none rounded-[18px] border border-slate-200 bg-[#f8f4ea] px-4 py-3 text-sm font-semibold leading-5 text-[#043331] outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                />
              </Field>
              <Field label="Drop-off instructions (optional)" icon={Route}>
                <textarea
                  value={destinationInstructions}
                  onChange={(event) => setDestinationInstructions(event.target.value.slice(0, 280))}
                  rows={3}
                  placeholder="Terminal, entrance, dock, hotel, or meeting point"
                  className="w-full resize-none rounded-[18px] border border-slate-200 bg-[#f8f4ea] px-4 py-3 text-sm font-semibold leading-5 text-[#043331] outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                />
              </Field>
            </div>
            <p className="mt-2 text-right text-[9px] font-bold uppercase tracking-[.12em] text-slate-400">Instructions are shared only with dispatch and your assigned driver.</p>
            <StepActions
              continueLabel="Choose ride type"
              continueDisabled={!routeReady}
              onContinue={() => advanceToStep(2)}
            />
          </Panel>
          ) : null}

          {activeStep === 2 ? (
          <Panel>
            <SectionTitle
              step="02"
              title="How would you like to ride?"
              subtitle="We recommend the best fit while keeping the regulated fare unchanged."
            />
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {PRIMARY_MODES.map((item) => (
                <ModeCard
                  key={item.value}
                  item={item}
                  active={mode === item.value}
                  recommended={recommendedMode === item.value}
                  onClick={() => onChangeMode(item.value)}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowMoreModes((value) => !value)}
              className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-teal-800"
            >
              More ride options
              <ChevronDown
                className={`h-4 w-4 transition ${showMoreModes ? "rotate-180" : ""}`}
              />
            </button>
            {showMoreModes ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {MORE_MODES.map((item) => (
                  <ModeCard
                    key={item.value}
                    item={item}
                    active={mode === item.value}
                    recommended={recommendedMode === item.value}
                    onClick={() => onChangeMode(item.value)}
                  />
                ))}
              </div>
            ) : null}
            <div className="mt-5 flex items-center gap-3 rounded-[22px] border border-emerald-200 bg-emerald-50 p-4" aria-live="polite">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-700 text-white">
                <Check className="h-5 w-5" />
              </span>
              <div>
                <div className="text-[9px] font-black uppercase tracking-[.16em] text-emerald-700">Ride selected</div>
                <div className="mt-1 text-sm font-black text-emerald-950">{selectedMode.label} · {selectedMode.blurb}</div>
              </div>
            </div>
            <StepActions
              backLabel="Back to route"
              continueLabel="Add passengers"
              onBack={() => setActiveStep(1)}
              onContinue={() => advanceToStep(3)}
            />
          </Panel>
          ) : null}

          {activeStep === 3 ? (
          <div id="passenger-details" className="scroll-mt-24">
          <Panel>
            <SectionTitle
              step="03"
              title="Who and what are you bringing?"
              subtitle="Passenger and luggage details help dispatch match the right vehicle."
            />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Stepper
                icon={Users}
                label="Passengers"
                helper="Children count as passengers."
                value={passengers}
                minimum={1}
                maximum={12}
                onChange={onChangePassengers}
              />
              <Stepper
                icon={Luggage}
                label="Luggage"
                helper="Include checked bags and large carry-ons."
                value={luggage}
                minimum={0}
                maximum={12}
                onChange={onChangeLuggage}
              />
            </div>
            <div className="mt-5 grid gap-4 rounded-[24px] border border-teal-100 bg-teal-50/70 p-4 sm:grid-cols-2">
              <Field label="Requested pickup time" icon={Clock3}>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                  className="w-full rounded-[18px] border border-teal-100 bg-white px-4 py-3 text-sm font-bold text-[#043331] outline-none focus:border-teal-500"
                />
              </Field>
              <Field label="Connection to protect (optional)" icon={Anchor}>
                <div className="grid grid-cols-[auto_1fr] gap-2">
                  <select
                    value={connectionKind}
                    onChange={(event) =>
                      setConnectionKind(event.target.value as typeof connectionKind)
                    }
                    className="rounded-[18px] border border-teal-100 bg-white px-3 py-3 text-sm font-bold text-[#043331] outline-none focus:border-teal-500"
                  >
                    <option value="ferry">Ferry</option>
                    <option value="flight">Flight</option>
                    <option value="cruise">Cruise</option>
                    <option value="appointment">Other</option>
                  </select>
                  <input
                    type="datetime-local"
                    value={connectionDeadline}
                    onChange={(event) => setConnectionDeadline(event.target.value)}
                    className="min-w-0 rounded-[18px] border border-teal-100 bg-white px-3 py-3 text-sm font-bold text-[#043331] outline-none focus:border-teal-500"
                  />
                </div>
              </Field>
            </div>
            <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">
              Pickup requests and connection details are saved for dispatch. A driver match confirms availability; entering a time alone is not a guarantee.
            </p>
            <div className="mt-5 rounded-[22px] border border-teal-200 bg-teal-50 p-4" aria-live="polite">
              <div className="text-[9px] font-black uppercase tracking-[.16em] text-teal-700">Passenger details ready</div>
              <div className="mt-1 text-sm font-black text-teal-950">
                {passengers} passenger{passengers === 1 ? "" : "s"} · {luggage} bag{luggage === 1 ? "" : "s"}
              </div>
            </div>
            <StepActions
              backLabel="Back to ride"
              continueLabel="Review official fare"
              onBack={() => setActiveStep(2)}
              onContinue={() => advanceToStep(4)}
            />
          </Panel>
          </div>
          ) : null}

        {activeStep === 4 ? (
        <aside id="trip-review" className="scroll-mt-24 space-y-5">
          <section className="overflow-hidden rounded-[30px] border border-[#0b5d5b]/10 bg-white shadow-sm">
            <div className="bg-[#043331] p-5 text-white">
              <div className="text-[9px] font-black uppercase tracking-[.2em] text-[#f5c451]">
                Step 04 · Trip review
              </div>
              <div className="mt-3 text-2xl font-black tracking-[-.04em]">
                {fromEstate?.baseName || "Choose pickup"}
                <span className="mx-2 text-white/35">→</span>
                {toEstate?.baseName || "Choose destination"}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <ReviewChip label={mode.replace("-", " ")} />
                <ReviewChip
                  label={
                    mode === "shared" || mode === "safari"
                      ? "shared · possible wait + stops"
                      : "direct ride requested"
                  }
                />
                <ReviewChip
                  label={`${passengers} passenger${passengers === 1 ? "" : "s"}`}
                />
                <ReviewChip label={`${luggage} bag${luggage === 1 ? "" : "s"}`} />
              </div>
            </div>

            <div className="p-5">
              {fare ? (
                <FareReview
                  fare={fare}
                  submitting={submitting}
                  canRequest={canRequest}
                  acceptedOperatorDisclosure={acceptedOperatorDisclosure}
                  acceptedLegal={acceptedLegal}
                  pilotActive={pilotActive}
                  pilotMessage={pilotMessage}
                  onOperatorDisclosureChange={setAcceptedOperatorDisclosure}
                  onLegalChange={setAcceptedLegal}
                  onRequest={requestRide}
                />
              ) : quoteLoading ? (
                <div className="py-8 text-center">
                  <Loader2 className="mx-auto h-7 w-7 animate-spin text-teal-700" />
                  <div className="mt-3 text-sm font-black text-[#043331]">
                    Loading official fare…
                  </div>
                </div>
              ) : quoteError ? (
                <div className="rounded-[22px] border border-amber-200 bg-amber-50 p-4">
                  <div className="text-[9px] font-black uppercase tracking-[.16em] text-amber-700">
                    Dispatch review required
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-amber-950">
                    {quoteError}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-amber-800">
                    No estimated or surge fare has been substituted.
                  </p>
                </div>
              ) : (
                <div className="rounded-[22px] bg-[#f8f4ea] p-5">
                  <div className="text-sm font-black text-[#043331]">
                    Choose pickup and destination to see your route and official fare.
                  </div>
                  <div className="mt-3 space-y-2">
                    <ServicePromise icon={ShieldCheck} text="Published tariff only" />
                    <ServicePromise icon={Route} text="No distance estimate substitution" />
                    <ServicePromise icon={Clock3} text="Dispatch review for missing routes" />
                  </div>
                </div>
              )}
            </div>
          </section>
          <button
            type="button"
            onClick={() => setActiveStep(3)}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-300 bg-white px-5 text-[9px] font-black uppercase tracking-[.14em] text-[#043331]"
          >
            <ArrowLeftRight className="h-4 w-4" /> Back to passengers
          </button>
        </aside>
        ) : null}
        </div>
      </div>

      <div className="sticky bottom-3 z-30 mx-4 mb-4 rounded-[22px] border border-white/60 bg-[#043331]/95 p-3 text-white shadow-[0_18px_50px_rgba(4,51,49,.3)] backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[8px] font-black uppercase tracking-[.15em] text-[#f5c451]">{fare ? "Official fare · no surge" : "Complete your route"}</p>
            <p className="mt-1 truncate text-sm font-black">{fare ? `$${fare.total.toFixed(2)} · ${fromEstate?.baseName} to ${toEstate?.baseName}` : "Choose pickup and destination"}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (canRequest) void requestRide();
              else document.getElementById("trip-review")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            disabled={submitting}
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[#f5c451] px-4 text-[9px] font-black uppercase tracking-[.13em] text-[#5f3d00] disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {canRequest ? "Continue" : "Review"}
          </button>
        </div>
      </div>

      {resultMessage ? (
        <div
          className={`border-t px-6 py-4 text-sm font-semibold ${
            resultTone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {resultMessage}
        </div>
      ) : null}
    </section>
  );
}

function StepActions({
  backLabel,
  continueLabel,
  continueDisabled = false,
  onBack,
  onContinue,
}: {
  backLabel?: string;
  continueLabel: string;
  continueDisabled?: boolean;
  onBack?: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
      {onBack ? (
        <button type="button" onClick={onBack} className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-[9px] font-black uppercase tracking-[.14em] text-[#043331]">
          {backLabel}
        </button>
      ) : <span />}
      <button type="button" onClick={onContinue} disabled={continueDisabled} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#043331] px-6 text-[9px] font-black uppercase tracking-[.14em] text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40">
        {continueLabel} <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      {children}
    </section>
  );
}

function SectionTitle({
  step,
  title,
  subtitle,
}: {
  step: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#043331] text-[10px] font-black text-white">
        {step}
      </span>
      <div>
        <h3 className="text-xl font-black tracking-[-.035em] text-[#043331]">
          {title}
        </h3>
        <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[.16em] text-slate-400">
        <Icon className="h-4 w-4 text-teal-700" /> {label}
      </div>
      {children}
    </label>
  );
}

function EstateSelect({
  value,
  placeholder,
  estates,
  onChange,
}: {
  value: string;
  placeholder: string;
  estates: EstateRecord[];
  onChange: (value: string) => void;
}) {
  const sortedEstates = useMemo(
    () =>
      [...estates].sort((a, b) => {
        const nameComparison = ESTATE_NAME_COLLATOR.compare(
          a.baseName,
          b.baseName,
        );
        return nameComparison || a.geoid.localeCompare(b.geoid);
      }),
    [estates],
  );

  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-[20px] border border-slate-200 bg-[#f8f4ea] px-4 py-4 text-base font-black text-[#043331] outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-teal-100"
    >
      <option value="">{placeholder}</option>
      {sortedEstates.map((estate) => (
        <option key={estate.geoid} value={estate.geoid}>
          {estate.baseName}
        </option>
      ))}
    </select>
  );
}

function ModeCard({
  item,
  active,
  recommended,
  onClick,
}: {
  item: ModeOption;
  active: boolean;
  recommended: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={`${item.label}${active ? ", selected" : ""}`}
      className={`relative rounded-[24px] border p-4 text-left transition ${
        active
          ? "border-[#f5b942] bg-[#fff4d6] shadow-sm"
          : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-teal-300"
      }`}
    >
      {active ? (
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-700 px-2 py-1 text-[7px] font-black uppercase tracking-[.12em] text-white">
          <Check className="h-3 w-3" /> Selected
        </span>
      ) : recommended ? (
        <span className="absolute right-3 top-3 rounded-full bg-[#043331] px-2 py-1 text-[7px] font-black uppercase tracking-[.12em] text-white">
          Recommended
        </span>
      ) : null}
      <span
        className={`grid h-10 w-10 place-items-center rounded-2xl ${
          active ? "bg-[#f5c451] text-[#5f3d00]" : "bg-[#edf6f2] text-teal-800"
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="mt-4 text-sm font-black uppercase tracking-[.16em] text-[#043331]">
        {item.label}
      </div>
      <div className="mt-2 text-sm font-semibold text-slate-600">{item.blurb}</div>
      <div className="mt-2 text-[9px] font-black uppercase tracking-[.14em] text-teal-700">
        {item.accent}
      </div>
    </button>
  );
}

function Stepper({
  icon: Icon,
  label,
  helper,
  value,
  minimum,
  maximum,
  onChange,
}: {
  icon: LucideIcon;
  label: string;
  helper: string;
  value: number;
  minimum: number;
  maximum: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-[#f8f4ea] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-teal-800 shadow-sm">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <div className="text-sm font-black text-[#043331]">{label}</div>
            <div className="mt-1 text-xs font-semibold text-slate-500">{helper}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => onChange(Math.max(minimum, value - 1))}
            disabled={value <= minimum}
            className="grid h-9 w-9 place-items-center rounded-full text-teal-800 transition hover:bg-teal-50 disabled:opacity-30"
            aria-label={`Decrease ${label.toLowerCase()}`}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-8 text-center text-lg font-black text-[#043331]">
            {value}
          </span>
          <button
            type="button"
            onClick={() => onChange(Math.min(maximum, value + 1))}
            disabled={value >= maximum}
            className="grid h-9 w-9 place-items-center rounded-full text-teal-800 transition hover:bg-teal-50 disabled:opacity-30"
            aria-label={`Increase ${label.toLowerCase()}`}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function FareReview({
  fare,
  submitting,
  canRequest,
  acceptedOperatorDisclosure,
  acceptedLegal,
  pilotActive,
  pilotMessage,
  onOperatorDisclosureChange,
  onLegalChange,
  onRequest,
}: {
  fare: FareBreakdown;
  submitting: boolean;
  canRequest: boolean;
  acceptedOperatorDisclosure: boolean;
  acceptedLegal: boolean;
  pilotActive: boolean;
  pilotMessage: string | null;
  onOperatorDisclosureChange: (accepted: boolean) => void;
  onLegalChange: (accepted: boolean) => void;
  onRequest: () => void;
}) {
  return (
    <>
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[.18em] text-slate-400">
            Official taxi fare
          </div>
          <div className="mt-2 text-5xl font-black tracking-[-.06em] text-[#043331]">
            ${fare.total.toFixed(2)}
          </div>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-2 text-[8px] font-black uppercase tracking-[.14em] text-emerald-800">
          No surge
        </span>
      </div>
      <div className="mt-5 space-y-3 rounded-[22px] bg-[#f8f4ea] p-4 text-sm font-semibold text-slate-600">
        <FareRow label="Published route fare" value={fare.routeFare} />
        <FareRow label="Passenger charge" value={fare.passengerFare} />
        <FareRow label="Luggage charge" value={fare.luggageFare} />
      </div>
      <div className="mt-4 grid gap-3 rounded-[22px] border border-teal-100 bg-teal-50 p-4 text-xs font-semibold leading-5 text-teal-950">
        <div className="flex items-start gap-2">
          <Bus className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
          <span>Shared and safari requests may wait for other riders and make additional stops. Other modes request a direct ride, subject to dispatch confirmation.</span>
        </div>
        <div className="flex items-start gap-2">
          <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
          <span>Payment method: secure online card. The digital booking record includes the official quote, payment status, assigned operator, and trip status.</span>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        <ServicePromise icon={ShieldCheck} text="Verified driver and vehicle assignment" />
        <ServicePromise icon={Clock3} text="Live trip tracking after payment" />
        <ServicePromise icon={BriefcaseBusiness} text="Published USVI tariff pricing" />
      </div>

      {!pilotActive ? (
        <section className="mt-5 rounded-[22px] border border-sky-200 bg-sky-50 p-4 text-sky-950">
          <div className="text-[9px] font-black uppercase tracking-[.18em] text-sky-700">
            Official fare preview
          </div>
          <p className="mt-2 text-xs font-semibold leading-5">
            {pilotMessage ||
              "This published fare is available for planning. Online ride requests will open after verified local dispatch is activated."}
          </p>
        </section>
      ) : null}

      <section className="mt-5 rounded-[22px] border border-amber-200 bg-amber-50 p-4 text-amber-950">
        <div className="text-[9px] font-black uppercase tracking-[.18em] text-amber-700">
          Passenger disclosures
        </div>
        <p className="mt-2 text-xs font-semibold leading-5">
          USVI Explorer coordinates booking, payment status, and dispatch. Transportation is provided by an independently authorized taxi operator or participating taxi association.
        </p>
        <div className="mt-4 space-y-3">
          <ConsentCheckbox
            checked={acceptedOperatorDisclosure}
            onChange={onOperatorDisclosureChange}
          >
            I understand that the displayed amount comes from the active published USVI taxi tariff for this route. Missing or additional charges require dispatch review and must be authorized by the tariff or separately disclosed before collection.
          </ConsentCheckbox>
          <ConsentCheckbox checked={acceptedLegal} onChange={onLegalChange}>
            I agree to the <Link href="/terms" className="font-black underline underline-offset-2">Terms of service</Link> and <Link href="/privacy" className="font-black underline underline-offset-2">Privacy notice</Link>, including sharing trip endpoints, operational status, and payment status with dispatch, the assigned operator, and service providers needed to fulfill the ride.
          </ConsentCheckbox>
        </div>
      </section>

      <button
        type="button"
        onClick={onRequest}
        disabled={!canRequest}
        className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-[#f5c451] px-5 text-[10px] font-black uppercase tracking-[.17em] text-[#5f3d00] shadow-lg transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        {submitting
          ? "Creating request…"
          : !pilotActive
            ? "Booking opens after pilot approval"
          : acceptedOperatorDisclosure && acceptedLegal
            ? "Continue to secure payment"
            : "Accept disclosures to continue"}
      </button>
      <div className="mt-3 text-center text-[9px] font-bold uppercase tracking-[.12em] text-slate-400">
        Payment unlocks dispatch and live tracking
      </div>
    </>
  );
}

function ConsentCheckbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-amber-200 bg-white/70 p-3 text-xs font-semibold leading-5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[#0f766e]"
      />
      <span>{children}</span>
    </label>
  );
}

function SummaryChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-2 text-[8px] font-black uppercase tracking-[.13em] text-teal-800">
      {label}
    </span>
  );
}

function ReviewChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-[8px] font-black uppercase tracking-[.13em] text-white/80">
      {label}
    </span>
  );
}

function FareRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>{label}</span>
      <span className="font-black text-[#043331]">${value.toFixed(2)}</span>
    </div>
  );
}

function ServicePromise({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
      <Icon className="h-4 w-4 shrink-0 text-teal-700" /> {text}
    </div>
  );
}
