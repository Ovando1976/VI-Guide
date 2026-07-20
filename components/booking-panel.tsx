"use client";

import { useEffect, useRef, useState } from "react";
import type { EstateRecord, IslandCode } from "@/types/usvi";
import type { FareBreakdown, RideMode } from "@/types/mobility";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const RoutePreviewMap = dynamic(
  () => import("@/components/route-preview-map").then((module) => module.RoutePreviewMap),
  { ssr: false, loading: () => <div className="mt-6 h-[360px] animate-pulse rounded-[26px] bg-slate-100" /> },
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
  pickupLabel?: string;
  destinationLabel?: string;
};

const MODES: {
  value: RideMode;
  label: string;
  blurb: string;
  accent: string;
}[] = [
  {
    value: "standard",
    label: "Standard",
    blurb: "Daily local ride",
    accent: "Town + estate flow",
  },
  {
    value: "premium",
    label: "Premium",
    blurb: "Comfort request",
    accent: "Dispatch preference only",
  },
  {
    value: "shared",
    label: "Shared",
    blurb: "Shared taxi request",
    accent: "Official tariff applies",
  },
  {
    value: "airport",
    label: "Airport",
    blurb: "Terminal handling",
    accent: "Arrival corridor",
  },
  {
    value: "ferry-transfer",
    label: "Ferry",
    blurb: "Port connection",
    accent: "Harbor transfer",
  },
  {
    value: "executive",
    label: "Executive",
    blurb: "Executive vehicle request",
    accent: "Dispatch preference only",
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
  pickupLabel,
  destinationLabel,
}: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [resultTone, setResultTone] = useState<"success" | "error" | null>(
    null
  );
  const [fare, setFare] = useState<FareBreakdown | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [manualReviewRequired, setManualReviewRequired] = useState(false);
  const reviewRequestKey = useRef(
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `review-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );

  useEffect(() => {
    const controller = new AbortController();
    if (!fromEstate || !toEstate) {
      setFare(null);
      setQuoteError(null);
      setManualReviewRequired(false);
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
        pickupLabel,
        destinationLabel,
      }),
    })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || "Official taxi rate unavailable.");
        if (json.manualReviewRequired) {
          setFare(null);
          setManualReviewRequired(true);
          setQuoteError(json.error || "This route requires official rate review.");
          return;
        }
        setManualReviewRequired(false);
        setFare(json.fare as FareBreakdown);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setFare(null);
        setManualReviewRequired(false);
        setQuoteError(error instanceof Error ? error.message : "Official taxi rate unavailable.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setQuoteLoading(false);
      });
    return () => controller.abort();
  }, [fromEstate, toEstate, mode, passengers, luggage, pickupLabel, destinationLabel]);

  const provisionalFare = fare?.quoteStatus === "provisional";
  const canRequest = Boolean(fromEstate && toEstate && fare?.quoteStatus === "official" && !submitting);
  const canRequestReview = Boolean(
    fromEstate && toEstate && (manualReviewRequired || provisionalFare) && !submitting,
  );

  async function requestRide() {
    if (!fromEstate || !toEstate) return;

    try {
      setSubmitting(true);
      setResultMessage(null);
      setResultTone(null);

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          originEstateGeoid: fromEstate.geoid,
          destinationEstateGeoid: toEstate.geoid,
          mode,
          passengers,
          luggage,
          pickupLabel,
          destinationLabel,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Booking request failed.");
      }

      setResultTone("success");
      setResultMessage(`Ride requested successfully. Redirecting to payment...`);
      router.push(`/checkout/${json.bookingId}`);
    } catch (error) {
      console.error(error);
      setResultTone("error");
      setResultMessage(
        error instanceof Error ? error.message : "Unexpected booking error."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function requestRateReview() {
    if (!fromEstate || !toEstate || !canRequestReview) return;
    try {
      setSubmitting(true);
      setResultMessage(null);
      setResultTone(null);
      const response = await fetch("/api/bookings/rate-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originEstateGeoid: fromEstate.geoid,
          destinationEstateGeoid: toEstate.geoid,
          mode,
          passengers,
          luggage,
          pickupLabel,
          destinationLabel,
          requestKey: reviewRequestKey.current,
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Unable to request official rate review.");
      setResultTone("success");
      setResultMessage(`Route confirmed. Official-rate review request ${json.reviewId} is pending; no taxi or payment has been created.`);
    } catch (error) {
      setResultTone("error");
      setResultMessage(error instanceof Error ? error.message : "Unable to request official rate review.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      className="overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-sm"
      id="book"
    >
      <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#043331_0%,#0b5d5b_55%,#14b8a6_100%)] px-5 py-6 text-white md:px-7 md:py-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.32em] text-[#fde68a]">
              Licensed taxi dispatch
            </div>
            <h2 className="mt-3 text-4xl font-black italic tracking-tight">
              Build your island ride
            </h2>
            <p className="mt-3 max-w-2xl text-sm font-semibold uppercase tracking-[0.18em] text-teal-50/80">
              Official USVI taxi tariff quotes with licensed association,
              driver, and fleet dispatch.
            </p>
          </div>

          <button
            onClick={onSwapRoute}
            disabled={!fromGeoid && !toGeoid}
            className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-white transition hover:bg-white/15 disabled:opacity-50"
          >
            Swap route
          </button>
        </div>
      </div>

      <div className="p-4 md:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Pickup estate">
            <select
              value={fromGeoid}
              onChange={(e) => onSelectFrom(e.target.value)}
              className="w-full rounded-[22px] border border-slate-200 bg-[#f8f4ea] px-4 py-4 text-base font-black text-[#043331] outline-none transition focus:border-[#0f766e]"
            >
              <option value="">Choose pickup estate</option>
              {estates.map((estate) => (
                <option key={estate.geoid} value={estate.geoid}>
                  {estate.baseName}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Destination estate">
            <select
              value={toGeoid}
              onChange={(e) => onSelectTo(e.target.value)}
              className="w-full rounded-[22px] border border-slate-200 bg-[#f8f4ea] px-4 py-4 text-base font-black text-[#043331] outline-none transition focus:border-[#0f766e]"
            >
              <option value="">Choose destination estate</option>
              {estates.map((estate) => (
                <option key={estate.geoid} value={estate.geoid}>
                  {estate.baseName}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <RoutePreviewMap
          island={island}
          fromEstate={fromEstate}
          toEstate={toEstate}
        />

        <div className="mt-6">
          <div className="mb-3 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
            Ride style
          </div>
          <p className="mb-4 text-sm font-semibold text-slate-500">
            Service style is a dispatch preference. It never changes the regulated taxi fare.
          </p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MODES.map((item) => {
              const active = mode === item.value;

              return (
                <button
                  key={item.value}
                  onClick={() => onChangeMode(item.value)}
                  className={`rounded-[24px] border p-4 text-left transition ${
                    active
                      ? "border-[#f5b942] bg-[#fff4d6]"
                      : "border-slate-200 bg-white hover:border-[#0f766e]/40 hover:bg-[#f8f4ea]"
                  }`}
                >
                  <div className="text-sm font-black uppercase tracking-[0.2em] text-[#043331]">
                    {item.label}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-600">
                    {item.blurb}
                  </div>
                  <div className="mt-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#0f766e]">
                    {item.accent}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Passengers">
            <input
              type="number"
              min={1}
              max={12}
              value={passengers}
              onChange={(e) => onChangePassengers(Number(e.target.value))}
              className="w-full rounded-[22px] border border-slate-200 bg-[#f8f4ea] px-4 py-4 text-base font-black text-[#043331] outline-none transition focus:border-[#0f766e]"
            />
          </Field>

          <Field label="Luggage">
            <input
              type="number"
              min={0}
              max={12}
              value={luggage}
              onChange={(e) => onChangeLuggage(Number(e.target.value))}
              className="w-full rounded-[22px] border border-slate-200 bg-[#f8f4ea] px-4 py-4 text-base font-black text-[#043331] outline-none transition focus:border-[#0f766e]"
            />
          </Field>
        </div>

        <div className="mt-6 rounded-[26px] border border-slate-200 bg-[#f8f4ea] p-5">
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
            Island trip summary
          </div>

          <div className="mt-3 text-2xl font-black italic tracking-tight text-[#043331]">
            {pickupLabel || fromEstate?.baseName || "Select origin"} →{" "}
            {destinationLabel || toEstate?.baseName || "Select destination"}
          </div>
          {fromEstate && toEstate && (pickupLabel || destinationLabel) ? (
            <div className="mt-2 text-xs font-semibold text-slate-500">
              Official tariff zones: {fromEstate.baseName} → {toEstate.baseName}
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            <SummaryChip label={mode.replace("-", " ")} />
            <SummaryChip
              label={`${passengers} passenger${passengers === 1 ? "" : "s"}`}
            />
            <SummaryChip label={`${luggage} bag${luggage === 1 ? "" : "s"}`} />
          </div>
        </div>

        {fare ? (
          <div className="mt-10 space-y-4">
            <div className="rounded-[26px] border border-slate-200 bg-white p-5">
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                {provisionalFare ? "Provisional fare transcription" : "Official fare breakdown"}
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <Row label="Published route fare" value={`$${fare.routeFare.toFixed(2)}`} />
                <Row
                  label="Passenger charge"
                  value={`$${fare.passengerFare.toFixed(2)}`}
                />
                <Row
                  label="Published luggage charge"
                  value={`$${fare.luggageFare.toFixed(2)}`}
                />
              </div>
              <div className="mt-5 border-t border-slate-200 pt-4 text-xs font-semibold text-slate-500">
                {fare.tariffTitle} · version {fare.tariffVersion} · effective {fare.tariffEffectiveAt}
                {fare.tariffSourceUrl ? (
                  <> · <a className="underline" href={fare.tariffSourceUrl} target="_blank" rel="noreferrer">official source</a></>
                ) : null}
              </div>
            </div>

            <div className="rounded-[28px] bg-[linear-gradient(135deg,#043331_0%,#0b5d5b_55%,#14b8a6_100%)] p-6 text-white shadow-sm">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.24em] text-white/60">
                    {provisionalFare ? "Planning-only tariff preview" : "Official taxi quote"}
                  </div>
                  <div className="mt-3 text-5xl font-black tracking-tight">
                    ${fare.total.toFixed(2)}
                  </div>
                  <div className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-teal-50/75">
                    {provisionalFare
                      ? "Pending Commission verification · USD · booking and payment disabled"
                      : "Published tariff · USD · no surge pricing"}
                  </div>
                </div>

                <div className="flex w-full max-w-sm flex-col gap-3">
                  {provisionalFare ? (
                    <button
                      type="button"
                      onClick={requestRateReview}
                      disabled={!canRequestReview}
                      className="w-full rounded-full bg-[#f5b942] px-5 py-4 text-xs font-black uppercase tracking-[0.2em] text-[#6b3f00] transition hover:brightness-95 disabled:opacity-60"
                    >
                      {submitting ? "Submitting review..." : "Confirm route & request official-rate review"}
                    </button>
                  ) : (
                    <button
                      onClick={requestRide}
                      disabled={!canRequest}
                      className="w-full rounded-full bg-[#f5b942] px-5 py-4 text-xs font-black uppercase tracking-[0.25em] text-[#6b3f00] transition hover:brightness-95 disabled:opacity-60"
                    >
                      {submitting ? "Confirming..." : "Confirm official fare & continue"}
                    </button>
                  )}

                  <div className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
                    {provisionalFare
                      ? "This preview cannot create a booking, enter dispatch, or authorize payment"
                      : "Assignment requires an eligible association driver and inspected vehicle"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : quoteLoading ? (
          <div className="mt-6 rounded-[24px] border border-slate-200 bg-[#f8f4ea] p-5 text-sm font-bold text-slate-600">
            Checking the active official USVI taxi tariff…
          </div>
        ) : quoteError ? (
          <div className="mt-6 rounded-[24px] border border-amber-300 bg-amber-50 p-5">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-700">Official rate review required</div>
            <div className="mt-2 text-sm font-semibold text-amber-950">{quoteError}</div>
            <div className="mt-2 text-sm text-amber-800">No estimated, distance-based, or surge fare has been substituted.</div>
            {manualReviewRequired ? (
              <button
                type="button"
                onClick={requestRateReview}
                disabled={!canRequestReview}
                className="mt-5 w-full rounded-full bg-[#043331] px-5 py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:bg-[#0b5d5b] disabled:opacity-50"
              >
                {submitting ? "Submitting review..." : "Confirm route & request official rate review"}
              </button>
            ) : null}
            <div className="mt-3 text-xs font-semibold text-amber-800">
              A review request does not book a taxi, authorize payment, or enter dispatch. You will confirm again after an authorized official rate is attached.
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-[24px] border border-slate-200 bg-[#f8f4ea] p-5">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
              Quote pending
            </div>
            <div className="mt-2 text-lg font-black italic tracking-tight text-[#043331]">
              Choose both estates to load the official taxi rate.
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-500">
              Quotes come only from the active published USVI taxi tariff. Missing
              routes are sent for dispatch review instead of being estimated.
            </div>
          </div>
        )}
      </div>

      {resultMessage ? (
        <div
          className={`border-t px-8 py-4 text-sm font-semibold ${
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
        {label}
      </div>
      {children}
    </label>
  );
}

function SummaryChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#043331]">
      {label}
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>{label}</span>
      <span className="font-black text-[#043331]">{value}</span>
    </div>
  );
}
