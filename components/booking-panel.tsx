"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Anchor,
  ArrowLeftRight,
  BriefcaseBusiness,
  Bus,
  CarFront,
  Check,
  ChevronDown,
  Clock3,
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
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [acceptedOperatorDisclosure, setAcceptedOperatorDisclosure] =
    useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [showMoreModes, setShowMoreModes] = useState(
    MORE_MODES.some((item) => item.value === mode),
  );

  useEffect(() => {
    const controller = new AbortController();
    setAcceptedOperatorDisclosure(false);
    setAcceptedLegal(false);

    if (!fromEstate || !toEstate) {
      setFare(null);
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
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setFare(null);
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
  const canRequest = Boolean(
    routeReady &&
      fare &&
      acceptedOperatorDisclosure &&
      acceptedLegal &&
      !submitting,
  );
  const recommendedMode = useMemo<RideMode>(() => {
    const routeText = `${fromEstate?.baseName ?? ""} ${toEstate?.baseName ?? ""}`.toLowerCase();
    if (routeText.includes("airport")) return "airport";
    if (routeText.includes("ferry") || routeText.includes("red hook")) {
      return "ferry-transfer";
    }
    if (passengers >= 5) return "shared";
    return "standard";
  }, [fromEstate, passengers, toEstate]);

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
              Four simple steps to your island ride.
            </h2>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/68 sm:text-base">
              Choose your route, select the right ride, tell us who is traveling, and review the official fare.
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              ["01", "Route"],
              ["02", "Ride"],
              ["03", "Guests"],
              ["04", "Fare"],
            ].map(([step, label]) => (
              <div
                key={step}
                className="rounded-2xl border border-white/10 bg-white/[.07] px-3 py-3 text-center"
              >
                <div className="text-[8px] font-black uppercase tracking-[.16em] text-white/40">
                  {step}
                </div>
                <div className="mt-1 text-[10px] font-black uppercase tracking-[.1em]">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(330px,.65fr)] lg:p-7">
        <div className="space-y-6">
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
          </Panel>

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
          </Panel>

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
          </Panel>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
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
        </aside>
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
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-[20px] border border-slate-200 bg-[#f8f4ea] px-4 py-4 text-base font-black text-[#043331] outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-teal-100"
    >
      <option value="">{placeholder}</option>
      {estates.map((estate) => (
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
      className={`relative rounded-[24px] border p-4 text-left transition ${
        active
          ? "border-[#f5b942] bg-[#fff4d6] shadow-sm"
          : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-teal-300"
      }`}
    >
      {recommended ? (
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
  onOperatorDisclosureChange,
  onLegalChange,
  onRequest,
}: {
  fare: FareBreakdown;
  submitting: boolean;
  canRequest: boolean;
  acceptedOperatorDisclosure: boolean;
  acceptedLegal: boolean;
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
      <div className="mt-5 space-y-3">
        <ServicePromise icon={ShieldCheck} text="Verified driver and vehicle assignment" />
        <ServicePromise icon={Clock3} text="Live trip tracking after payment" />
        <ServicePromise icon={BriefcaseBusiness} text="Published USVI tariff pricing" />
      </div>

      <section className="mt-5 rounded-[22px] border border-amber-200 bg-amber-50 p-4 text-amber-950">
        <div className="text-[9px] font-black uppercase tracking-[.18em] text-amber-700">
          Passenger disclosures
        </div>
        <p className="mt-2 text-xs font-semibold leading-5">
          VI Guide coordinates booking, payment status, and dispatch. Transportation is provided by an independently authorized taxi operator or participating taxi association.
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
