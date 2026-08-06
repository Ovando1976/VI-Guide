"use client";

import Link from "next/link";
import {
  BadgeCheck,
  BedDouble,
  CalendarRange,
  CheckCircle2,
  Compass,
  Loader2,
  Send,
  ShipWheel,
  Sparkles,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";

import {
  CRUISE_CABIN_PREFERENCES,
  CRUISE_DEPARTURE_PORTS,
  CRUISE_DESTINATIONS,
  CRUISE_PRIORITIES,
  CRUISE_TRIP_LENGTHS,
  humanizeCruiseValue,
} from "@/lib/cruise-advisor";

export function CruisePlanningForm() {
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    reference: string;
    duplicate: boolean;
  } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      travelerName: data.get("travelerName"),
      email: data.get("email"),
      phone: data.get("phone"),
      departureWindowStart: data.get("departureWindowStart"),
      departureWindowEnd: data.get("departureWindowEnd"),
      departurePort: data.get("departurePort"),
      otherDeparturePort: data.get("otherDeparturePort"),
      destinations: data.getAll("destinations"),
      adults: data.get("adults"),
      children: data.get("children"),
      budgetDollars: data.get("budgetDollars"),
      tripLength: data.get("tripLength"),
      cabinPreference: data.get("cabinPreference"),
      priorities: data.getAll("priorities"),
      accessibilityNotes: data.get("accessibilityNotes"),
      celebration: data.get("celebration"),
      notes: data.get("notes"),
      consent: data.get("consent") === "on",
      website: data.get("website"),
      formStartedAt: startedAt,
    };

    try {
      const response = await fetch("/api/cruise-advisor/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const responsePayload = (await response.json().catch(() => null)) as
        | { reference?: string; duplicate?: boolean; error?: string }
        | null;
      if (!response.ok || !responsePayload?.reference) {
        throw new Error(
          responsePayload?.error || "Unable to submit the cruise request.",
        );
      }

      setResult({
        reference: responsePayload.reference,
        duplicate: responsePayload.duplicate === true,
      });
      form.reset();
      setStartedAt(new Date().toISOString());
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to submit the cruise request.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <main className="min-h-screen bg-[#f7f2e7] px-4 py-12 text-[#043331] sm:px-6">
        <div className="mx-auto max-w-3xl rounded-[38px] border border-teal-200 bg-white p-7 text-center shadow-xl sm:p-12">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-[24px] bg-teal-100 text-teal-700">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <p className="mt-6 text-[10px] font-black uppercase tracking-[.18em] text-teal-700">
            Cruise request received
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-5xl">
            Your VI Guide advisor can take it from here.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-600">
            {result.duplicate
              ? "We found this request already submitted today and kept the original record."
              : "An advisor can now research suitable sailings, cabin options, pricing, and Caribbean port experiences around your preferences."}
          </p>
          <div className="mx-auto mt-7 max-w-md rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">
              Planning reference
            </p>
            <p className="mt-2 break-all font-mono text-sm font-black text-[#043331]">
              {result.reference}
            </p>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex min-h-12 items-center rounded-full bg-[#043331] px-6 text-[9px] font-black uppercase tracking-[.14em] text-white"
            >
              Return to VI Guide
            </Link>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="inline-flex min-h-12 items-center rounded-full border border-slate-200 bg-white px-6 text-[9px] font-black uppercase tracking-[.14em] text-slate-600"
            >
              Plan another cruise
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f2e7] pb-28 text-[#043331]">
      <section className="px-4 pb-8 pt-6 sm:px-6 lg:pb-12 lg:pt-10">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[40px] bg-[radial-gradient(circle_at_top_right,rgba(245,196,81,.34),transparent_36%),linear-gradient(145deg,#022e3b,#0b6b64)] p-7 text-white shadow-2xl sm:p-10 lg:p-14">
          <div className="grid gap-10 lg:grid-cols-[1.14fr_.86fr] lg:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#f5c451]">
                VI Guide Cruises
              </p>
              <h1 className="mt-4 max-w-4xl text-5xl font-black leading-[.92] tracking-[-.06em] sm:text-7xl">
                Start with your dream. We build the sailing.
              </h1>
              <p className="mt-6 max-w-2xl text-base font-semibold leading-8 text-white/70">
                Share your dates, budget, cabin style, and interests. A VI Guide
                advisor can turn them into researched cruise options and connect
                the voyage with practical Caribbean port plans.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <HeroBenefit
                icon={Compass}
                title="Personal cruise research"
                text="Compare suitable ships, sailings, cabins, and itineraries around your priorities."
              />
              <HeroBenefit
                icon={WalletCards}
                title="Clear total-cost planning"
                text="Keep fares, taxes, deposits, deadlines, and optional services visible in one plan."
              />
              <HeroBenefit
                icon={Sparkles}
                title="Local port intelligence"
                text="Connect the cruise with VI Guide transportation and shore experiences when available."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[.72fr_1.28fr] lg:items-start">
          <aside className="space-y-4 lg:sticky lg:top-6">
            <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
              <ShipWheel className="h-6 w-6 text-teal-700" />
              <h2 className="mt-5 text-2xl font-black tracking-[-.04em]">
                What happens next
              </h2>
              <ol className="mt-5 space-y-4">
                <ReviewStep number="01" text="Your request enters the protected cruise advisor desk." />
                <ReviewStep number="02" text="An advisor researches matching sailings through approved supplier tools." />
                <ReviewStep number="03" text="You receive clear options with cabins, deposits, deadlines, and conditions." />
                <ReviewStep number="04" text="Cruise fare payment remains in the supplier or host agency’s approved system." />
              </ol>
            </div>
            <div className="rounded-[30px] border border-amber-200 bg-amber-50 p-6">
              <BadgeCheck className="h-6 w-6 text-amber-700" />
              <h3 className="mt-4 text-lg font-black">Human-assisted launch</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-amber-950/65">
                This first release captures qualified planning requests. It does
                not claim live cruise inventory or collect cruise-line fares
                inside VI Guide.
              </p>
            </div>
          </aside>

          <form
            onSubmit={submit}
            className="rounded-[34px] border border-slate-200 bg-white p-5 shadow-xl sm:p-8"
          >
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-teal-50 text-teal-700">
                <ShipWheel className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.14em] text-teal-700">
                  Cruise planning request
                </p>
                <h2 className="mt-1 text-3xl font-black tracking-[-.045em]">
                  Tell us what the right cruise looks like
                </h2>
              </div>
            </div>

            {error ? (
              <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
                {error}
              </div>
            ) : null}

            <fieldset className="mt-8">
              <legend className={legendClass}>Traveler contact</legend>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Primary traveler name" required>
                  <input name="travelerName" required maxLength={140} autoComplete="name" className={inputClass} />
                </Field>
                <Field label="Email address" required>
                  <input name="email" type="email" required maxLength={220} autoComplete="email" className={inputClass} />
                </Field>
                <Field label="Phone number">
                  <input name="phone" type="tel" maxLength={80} autoComplete="tel" placeholder="(340) 555-0199" className={inputClass} />
                </Field>
                <Field label="Celebration or occasion">
                  <input name="celebration" maxLength={160} placeholder="Birthday, anniversary, reunion…" className={inputClass} />
                </Field>
              </div>
            </fieldset>

            <fieldset className="mt-9">
              <legend className={legendClass}>Travel window and party</legend>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Earliest departure date" required icon={CalendarRange}>
                  <input name="departureWindowStart" type="date" required className={inputClass} />
                </Field>
                <Field label="Latest departure date" required icon={CalendarRange}>
                  <input name="departureWindowEnd" type="date" required className={inputClass} />
                </Field>
                <Field label="Preferred departure port" required>
                  <select name="departurePort" required defaultValue="" className={inputClass}>
                    <option value="" disabled>Choose a port</option>
                    {CRUISE_DEPARTURE_PORTS.map((port) => (
                      <option key={port} value={port}>{humanizeCruiseValue(port)}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Other departure city or port">
                  <input name="otherDeparturePort" maxLength={120} placeholder="Complete when Other is selected" className={inputClass} />
                </Field>
                <Field label="Adults" required icon={UsersRound}>
                  <input name="adults" type="number" min={1} max={12} defaultValue={2} required className={inputClass} />
                </Field>
                <Field label="Children">
                  <input name="children" type="number" min={0} max={12} defaultValue={0} required className={inputClass} />
                </Field>
              </div>
            </fieldset>

            <fieldset className="mt-9">
              <legend className={legendClass}>Cruise preferences</legend>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Preferred cruise length" required>
                  <select name="tripLength" required defaultValue="" className={inputClass}>
                    <option value="" disabled>Choose a length</option>
                    {CRUISE_TRIP_LENGTHS.map((length) => (
                      <option key={length} value={length}>{humanizeCruiseValue(length)}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Cabin preference" required icon={BedDouble}>
                  <select name="cabinPreference" required defaultValue="" className={inputClass}>
                    <option value="" disabled>Choose a cabin</option>
                    {CRUISE_CABIN_PREFERENCES.map((cabin) => (
                      <option key={cabin} value={cabin}>{humanizeCruiseValue(cabin)}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Approximate total cruise budget">
                  <input name="budgetDollars" type="number" min={500} max={250000} step={50} placeholder="5000" className={inputClass} />
                </Field>
              </div>

              <p className="mt-6 text-sm font-black">Destination preferences</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {CRUISE_DESTINATIONS.map((destination) => (
                  <Choice key={destination} name="destinations" value={destination} label={humanizeCruiseValue(destination)} />
                ))}
              </div>

              <p className="mt-7 text-sm font-black">What matters most?</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {CRUISE_PRIORITIES.map((priority) => (
                  <Choice key={priority} name="priorities" value={priority} label={humanizeCruiseValue(priority)} />
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-9">
              <legend className={legendClass}>Important details</legend>
              <div className="mt-4 space-y-4">
                <Field label="Accessibility or mobility requirements">
                  <textarea name="accessibilityNotes" maxLength={900} rows={4} className={inputClass} />
                </Field>
                <Field label="Anything else the advisor should know?">
                  <textarea name="notes" maxLength={1400} rows={5} className={inputClass} />
                </Field>
              </div>
            </fieldset>

            <div className="hidden" aria-hidden="true">
              <label>
                Website
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            <label className="mt-8 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold leading-6 text-slate-600">
              <input name="consent" type="checkbox" required className="mt-1 h-4 w-4 shrink-0 accent-teal-700" />
              <span>
                I agree that VI Guide may contact me about cruise planning and
                related travel services. This request is not a cruise reservation
                and does not guarantee price or availability. See the{" "}
                <Link href="/privacy" className="font-black text-teal-700 underline">privacy policy</Link>{" "}
                and{" "}
                <Link href="/terms" className="font-black text-teal-700 underline">terms</Link>.
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#043331] px-6 text-[10px] font-black uppercase tracking-[.16em] text-white shadow-lg disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              Send to a cruise advisor
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function HeroBenefit({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Compass;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3 rounded-[22px] border border-white/15 bg-white/10 p-4 backdrop-blur">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#f5c451] text-[#043331]">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm font-black">{title}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-white/65">{text}</p>
      </div>
    </div>
  );
}

function ReviewStep({ number, text }: { number: string; text: string }) {
  return (
    <li className="flex gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-teal-50 text-[10px] font-black text-teal-700">
        {number}
      </span>
      <p className="pt-1 text-sm font-semibold leading-6 text-slate-600">{text}</p>
    </li>
  );
}

function Field({
  label,
  required,
  icon: Icon,
  children,
}: {
  label: string;
  required?: boolean;
  icon?: typeof CalendarRange;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-black text-[#043331]">
      <span className="flex items-center gap-2">
        {Icon ? <Icon className="h-4 w-4 text-teal-700" /> : null}
        {label}
        {required ? <span className="text-rose-500">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function Choice({
  name,
  value,
  label,
}: {
  name: string;
  value: string;
  label: string;
}) {
  return (
    <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold transition hover:border-teal-500">
      <input name={name} type="checkbox" value={value} className="h-4 w-4 accent-teal-700" />
      {label}
    </label>
  );
}

const legendClass =
  "text-[10px] font-black uppercase tracking-[.16em] text-slate-400";
const inputClass =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#043331] outline-none transition placeholder:text-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-100";
