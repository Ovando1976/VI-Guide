"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  BedDouble,
  CalendarDays,
  Car,
  Check,
  Compass,
  HeartHandshake,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  ShipWheel,
  Sparkles,
  UserRound,
  Users,
  UtensilsCrossed,
  Waves,
} from "lucide-react";

const INTERESTS = [
  { label: "Beaches", value: "beaches", icon: Waves },
  { label: "Food", value: "food", icon: UtensilsCrossed },
  { label: "Culture & history", value: "culture_history", icon: Compass },
  { label: "Boating & cruises", value: "boating_cruises", icon: ShipWheel },
  { label: "Relaxation", value: "relaxation", icon: HeartHandshake },
  { label: "Local transportation", value: "transportation", icon: Car },
] as const;

const ISLANDS = [
  ["not_sure", "Not sure yet"],
  ["stt", "St. Thomas"],
  ["stj", "St. John"],
  ["stx", "St. Croix"],
  ["multi", "Multi-island trip"],
] as const;

const BUDGETS = [
  ["value", "Value-focused"],
  ["comfort", "Comfort"],
  ["premium", "Premium"],
  ["luxury", "Luxury"],
  ["flexible", "Flexible"],
] as const;

const STAY_STATUSES = [
  ["need_help", "Need help choosing a stay"],
  ["already_booked", "I already booked a stay"],
  ["compare_options", "Compare a few options for me"],
  ["villa", "Villa or vacation rental preferred"],
  ["hotel", "Resort or hotel preferred"],
] as const;

const PACES = [
  ["relaxed", "Relaxed"],
  ["balanced", "Balanced"],
  ["packed", "Pack it in"],
] as const;

const FIELD_CLASS =
  "mt-2 w-full rounded-2xl border border-[#cfe0dc] bg-white px-4 py-3 text-sm font-semibold text-[#073b39] outline-none transition placeholder:text-slate-400 focus:border-[#159b91] focus:ring-4 focus:ring-[#159b91]/10";

export function UsviTripPlanner() {
  const router = useRouter();
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const [travelerName, setTravelerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [island, setIsland] = useState("not_sure");
  const [arrival, setArrival] = useState("");
  const [departure, setDeparture] = useState("");
  const [travelers, setTravelers] = useState("2");
  const [budget, setBudget] = useState("comfort");
  const [stayStatus, setStayStatus] = useState("need_help");
  const [pace, setPace] = useState("balanced");
  const [interests, setInterests] = useState<string[]>(["beaches", "food"]);
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tripLength = useMemo(() => {
    if (!arrival || !departure) return null;
    const start = new Date(`${arrival}T12:00:00`);
    const end = new Date(`${departure}T12:00:00`);
    const days = Math.round((end.getTime() - start.getTime()) / 86_400_000);
    return days > 0 ? days : null;
  }, [arrival, departure]);

  function toggleInterest(value: string) {
    setInterests((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      travelerName,
      email,
      phone,
      island,
      arrival,
      departure,
      travelers,
      budget,
      stayStatus,
      pace,
      interests,
      notes,
      consent,
      website: formData.get("website"),
      formStartedAt: startedAt,
    };

    try {
      const response = await fetch("/api/travel-advisor/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const responsePayload = (await response.json().catch(() => null)) as
        | { reference?: string; error?: string }
        | null;
      if (!response.ok || !responsePayload?.reference) {
        throw new Error(
          responsePayload?.error || "Unable to save your planning request.",
        );
      }

      const islandLabel = labelFor(ISLANDS, island);
      const budgetLabel = labelFor(BUDGETS, budget);
      const stayLabel = labelFor(STAY_STATUSES, stayStatus);
      const paceLabel = labelFor(PACES, pace);
      const interestLabels = interests
        .map((value) => INTERESTS.find((interest) => interest.value === value)?.label)
        .filter(Boolean);
      const details = [
        "Help me plan a complete U.S. Virgin Islands trip.",
        `Advisor planning reference: ${responsePayload.reference}.`,
        `Primary island: ${islandLabel}.`,
        arrival ? `Arrival: ${arrival}.` : "Arrival date: flexible or undecided.",
        departure ? `Departure: ${departure}.` : "Departure date: flexible or undecided.",
        tripLength ? `Trip length: about ${tripLength} days.` : null,
        `Travelers: ${travelers}.`,
        `Budget style: ${budgetLabel}.`,
        `Stay status: ${stayLabel}.`,
        `Preferred pace: ${paceLabel}.`,
        interestLabels.length ? `Interests: ${interestLabels.join(", ")}.` : null,
        notes.trim() ? `Additional needs: ${notes.trim()}` : null,
        "Build a practical itinerary with recommended stays, dining, beaches and attractions, realistic transportation between stops, and bookable next steps. Ask me only for information you still need. Do not repeat or expose my contact details.",
      ]
        .filter(Boolean)
        .join(" ");

      setStartedAt(new Date().toISOString());
      router.push(`/concierge?open=true&prompt=${encodeURIComponent(details)}`);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to save your planning request.",
      );
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-[34px] border border-[#d4e4e0] bg-[#fffdf8] shadow-[0_28px_80px_rgba(4,51,49,.14)]"
    >
      <div className="border-b border-[#dce8e4] bg-white/80 px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.22em] text-[#a76019]">
              <Sparkles size={14} /> Personal trip intake
            </div>
            <h2 className="mt-2 font-serif text-3xl font-bold tracking-[-.035em] text-[#073b39]">
              Tell us what your trip needs to feel like.
            </h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
              Your request enters the USVI Explorer advisor desk, then the same trip brief continues into VI Concierge.
            </p>
          </div>
          <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#159b91]/20 bg-[#eaf7f4] px-3 py-2 text-[10px] font-black uppercase tracking-[.14em] text-[#0f766e]">
            <BadgeCheck size={15} /> Travel specialist guided
          </div>
        </div>
      </div>

      {error ? (
        <div className="mx-6 mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700 sm:mx-8">
          {error}
        </div>
      ) : null}

      <div className="grid gap-7 p-6 sm:p-8 lg:grid-cols-2">
        <fieldset className="grid gap-5 rounded-[26px] border border-[#d9e7e3] bg-white p-5 lg:col-span-2 sm:grid-cols-2">
          <legend className="px-2 text-xs font-black uppercase tracking-[.12em] text-[#315b58]">
            Traveler contact
          </legend>
          <label className="text-xs font-black uppercase tracking-[.12em] text-[#315b58]">
            <span className="inline-flex items-center gap-2"><UserRound size={15} /> Primary traveler</span>
            <input
              className={FIELD_CLASS}
              required
              maxLength={140}
              autoComplete="name"
              value={travelerName}
              onChange={(event) => setTravelerName(event.target.value)}
            />
          </label>
          <label className="text-xs font-black uppercase tracking-[.12em] text-[#315b58]">
            <span className="inline-flex items-center gap-2"><Mail size={15} /> Email</span>
            <input
              className={FIELD_CLASS}
              required
              type="email"
              maxLength={220}
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="text-xs font-black uppercase tracking-[.12em] text-[#315b58] sm:col-span-2">
            <span className="inline-flex items-center gap-2"><Phone size={15} /> Phone (optional)</span>
            <input
              className={FIELD_CLASS}
              type="tel"
              maxLength={80}
              autoComplete="tel"
              placeholder="(340) 555-0199"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </label>
        </fieldset>

        <label className="text-xs font-black uppercase tracking-[.12em] text-[#315b58]">
          <span className="inline-flex items-center gap-2"><Compass size={15} /> Primary island</span>
          <select className={FIELD_CLASS} value={island} onChange={(event) => setIsland(event.target.value)}>
            {ISLANDS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>

        <label className="text-xs font-black uppercase tracking-[.12em] text-[#315b58]">
          <span className="inline-flex items-center gap-2"><Users size={15} /> Travelers</span>
          <input
            className={FIELD_CLASS}
            min="1"
            max="20"
            required
            inputMode="numeric"
            type="number"
            value={travelers}
            onChange={(event) => setTravelers(event.target.value)}
          />
        </label>

        <label className="text-xs font-black uppercase tracking-[.12em] text-[#315b58]">
          <span className="inline-flex items-center gap-2"><CalendarDays size={15} /> Arrival</span>
          <input className={FIELD_CLASS} type="date" value={arrival} onChange={(event) => setArrival(event.target.value)} />
        </label>

        <label className="text-xs font-black uppercase tracking-[.12em] text-[#315b58]">
          <span className="inline-flex items-center gap-2"><CalendarDays size={15} /> Departure</span>
          <input className={FIELD_CLASS} type="date" value={departure} onChange={(event) => setDeparture(event.target.value)} />
        </label>

        <label className="text-xs font-black uppercase tracking-[.12em] text-[#315b58]">
          Budget style
          <select className={FIELD_CLASS} value={budget} onChange={(event) => setBudget(event.target.value)}>
            {BUDGETS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>

        <label className="text-xs font-black uppercase tracking-[.12em] text-[#315b58]">
          <span className="inline-flex items-center gap-2"><BedDouble size={15} /> Accommodation</span>
          <select className={FIELD_CLASS} value={stayStatus} onChange={(event) => setStayStatus(event.target.value)}>
            {STAY_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>

        <label className="text-xs font-black uppercase tracking-[.12em] text-[#315b58] lg:col-span-2">
          Trip pace
          <div className="mt-2 grid grid-cols-3 gap-2">
            {PACES.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setPace(value)}
                className={`rounded-2xl border px-3 py-3 text-xs font-black transition ${
                  pace === value
                    ? "border-[#0f766e] bg-[#0f766e] text-white"
                    : "border-[#cfe0dc] bg-white text-[#315b58] hover:border-[#159b91]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </label>

        <fieldset className="lg:col-span-2">
          <legend className="text-xs font-black uppercase tracking-[.12em] text-[#315b58]">What matters most?</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {INTERESTS.map(({ label, value, icon: Icon }) => {
              const active = interests.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleInterest(value)}
                  className={`flex items-center gap-3 rounded-2xl border p-3 text-left text-sm font-black transition ${
                    active
                      ? "border-[#159b91]/40 bg-[#e9f8f4] text-[#073b39]"
                      : "border-[#d8e5e1] bg-white text-slate-600 hover:border-[#159b91]/40"
                  }`}
                >
                  <span className={`grid h-9 w-9 place-items-center rounded-xl ${active ? "bg-[#0f766e] text-white" : "bg-[#f3f7f5] text-[#0f766e]"}`}>
                    {active ? <Check size={17} /> : <Icon size={17} />}
                  </span>
                  {label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="text-xs font-black uppercase tracking-[.12em] text-[#315b58] lg:col-span-2">
          Anything else we should know?
          <textarea
            className={`${FIELD_CLASS} min-h-[120px] resize-y normal-case tracking-normal`}
            maxLength={1800}
            placeholder="Celebration, mobility needs, children, dietary needs, must-do experiences, cruise dates, preferred neighborhoods…"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>

        <div className="hidden" aria-hidden="true">
          <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#d9e7e3] bg-white p-4 text-sm font-semibold leading-6 text-slate-600 lg:col-span-2">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 accent-[#0f766e]"
          />
          <span>
            I agree that USVI Explorer may use these details to respond to my trip-planning request and coordinate relevant travel services.
          </span>
        </label>
      </div>

      <div className="flex flex-col gap-4 border-t border-[#dce8e4] bg-[#f4f8f6] px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="flex max-w-2xl items-start gap-2 text-xs font-semibold leading-5 text-slate-500">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0f766e]" />
          Your contact details stay in the advisor request. VI Concierge receives the trip brief and planning reference, not your email or phone number.
        </p>
        <button
          type="submit"
          disabled={submitting || !consent}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f5c451] px-6 py-3.5 text-xs font-black uppercase tracking-[.14em] text-[#073b39] shadow-lg shadow-black/10 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {submitting ? "Saving request…" : "Save & build my trip"}
          {!submitting ? <ArrowRight size={16} /> : null}
        </button>
      </div>
    </form>
  );
}

function labelFor(
  options: readonly (readonly [string, string])[],
  value: string,
) {
  return options.find(([candidate]) => candidate === value)?.[1] ?? value;
}
