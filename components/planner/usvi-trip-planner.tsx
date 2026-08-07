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
  ShipWheel,
  Sparkles,
  Users,
  UtensilsCrossed,
  Waves,
} from "lucide-react";

const INTERESTS = [
  { label: "Beaches", icon: Waves },
  { label: "Food", icon: UtensilsCrossed },
  { label: "Culture & history", icon: Compass },
  { label: "Boating & cruises", icon: ShipWheel },
  { label: "Relaxation", icon: HeartHandshake },
  { label: "Local transportation", icon: Car },
] as const;

const FIELD_CLASS =
  "mt-2 w-full rounded-2xl border border-[#cfe0dc] bg-white px-4 py-3 text-sm font-semibold text-[#073b39] outline-none transition placeholder:text-slate-400 focus:border-[#159b91] focus:ring-4 focus:ring-[#159b91]/10";

export function UsviTripPlanner() {
  const router = useRouter();
  const [island, setIsland] = useState("Not sure yet");
  const [arrival, setArrival] = useState("");
  const [departure, setDeparture] = useState("");
  const [travelers, setTravelers] = useState("2");
  const [budget, setBudget] = useState("Comfort");
  const [stayStatus, setStayStatus] = useState("Need help choosing a stay");
  const [pace, setPace] = useState("Balanced");
  const [interests, setInterests] = useState<string[]>(["Beaches", "Food"]);
  const [notes, setNotes] = useState("");

  const tripLength = useMemo(() => {
    if (!arrival || !departure) return null;
    const start = new Date(`${arrival}T12:00:00`);
    const end = new Date(`${departure}T12:00:00`);
    const days = Math.round((end.getTime() - start.getTime()) / 86_400_000);
    return days > 0 ? days : null;
  }, [arrival, departure]);

  function toggleInterest(label: string) {
    setInterests((current) =>
      current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label],
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const details = [
      "Help me plan a complete U.S. Virgin Islands trip.",
      `Primary island: ${island}.`,
      arrival ? `Arrival: ${arrival}.` : "Arrival date: flexible or undecided.",
      departure ? `Departure: ${departure}.` : "Departure date: flexible or undecided.",
      tripLength ? `Trip length: about ${tripLength} days.` : null,
      `Travelers: ${travelers}.`,
      `Budget style: ${budget}.`,
      `Stay status: ${stayStatus}.`,
      `Preferred pace: ${pace}.`,
      interests.length ? `Interests: ${interests.join(", ")}.` : null,
      notes.trim() ? `Additional needs: ${notes.trim()}` : null,
      "Build a practical itinerary with recommended stays, dining, beaches and attractions, realistic transportation between stops, and bookable next steps. Ask me only for information you still need.",
    ]
      .filter(Boolean)
      .join(" ");

    router.push(`/concierge?open=true&prompt=${encodeURIComponent(details)}`);
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
              We will turn these details into a working itinerary inside VI Concierge.
            </p>
          </div>
          <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#159b91]/20 bg-[#eaf7f4] px-3 py-2 text-[10px] font-black uppercase tracking-[.14em] text-[#0f766e]">
            <BadgeCheck size={15} /> Travel specialist guided
          </div>
        </div>
      </div>

      <div className="grid gap-7 p-6 sm:p-8 lg:grid-cols-2">
        <label className="text-xs font-black uppercase tracking-[.12em] text-[#315b58]">
          <span className="inline-flex items-center gap-2"><Compass size={15} /> Primary island</span>
          <select className={FIELD_CLASS} value={island} onChange={(event) => setIsland(event.target.value)}>
            <option>Not sure yet</option>
            <option>St. Thomas</option>
            <option>St. John</option>
            <option>St. Croix</option>
            <option>Multi-island trip</option>
          </select>
        </label>

        <label className="text-xs font-black uppercase tracking-[.12em] text-[#315b58]">
          <span className="inline-flex items-center gap-2"><Users size={15} /> Travelers</span>
          <input
            className={FIELD_CLASS}
            min="1"
            max="20"
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
            <option>Value-focused</option>
            <option>Comfort</option>
            <option>Premium</option>
            <option>Luxury</option>
            <option>Flexible</option>
          </select>
        </label>

        <label className="text-xs font-black uppercase tracking-[.12em] text-[#315b58]">
          <span className="inline-flex items-center gap-2"><BedDouble size={15} /> Accommodation</span>
          <select className={FIELD_CLASS} value={stayStatus} onChange={(event) => setStayStatus(event.target.value)}>
            <option>Need help choosing a stay</option>
            <option>I already booked a stay</option>
            <option>Compare a few options for me</option>
            <option>Villa or vacation rental preferred</option>
            <option>Resort or hotel preferred</option>
          </select>
        </label>

        <label className="text-xs font-black uppercase tracking-[.12em] text-[#315b58] lg:col-span-2">
          Trip pace
          <div className="mt-2 grid grid-cols-3 gap-2">
            {["Relaxed", "Balanced", "Pack it in"].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setPace(option)}
                className={`rounded-2xl border px-3 py-3 text-xs font-black transition ${
                  pace === option
                    ? "border-[#0f766e] bg-[#0f766e] text-white"
                    : "border-[#cfe0dc] bg-white text-[#315b58] hover:border-[#159b91]"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </label>

        <fieldset className="lg:col-span-2">
          <legend className="text-xs font-black uppercase tracking-[.12em] text-[#315b58]">What matters most?</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {INTERESTS.map(({ label, icon: Icon }) => {
              const active = interests.includes(label);
              return (
                <button
                  key={label}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleInterest(label)}
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
            placeholder="Celebration, mobility needs, children, dietary needs, must-do experiences, cruise dates, preferred neighborhoods…"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
      </div>

      <div className="flex flex-col gap-3 border-t border-[#dce8e4] bg-[#f4f8f6] px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="max-w-2xl text-xs font-semibold leading-5 text-slate-500">
          Your answers are passed directly into VI Concierge so you can keep refining the trip instead of starting over.
        </p>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f5c451] px-6 py-3.5 text-xs font-black uppercase tracking-[.14em] text-[#073b39] shadow-lg shadow-black/10 transition hover:-translate-y-0.5"
        >
          Build my trip <ArrowRight size={16} />
        </button>
      </div>
    </form>
  );
}
