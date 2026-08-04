"use client";

import { CheckCircle2, Loader2, X } from "lucide-react";
import { useState, type FormEvent } from "react";

import type { JourneyPlan } from "@/lib/journey-planner";
import type { IntelligencePlanStop } from "@/types/intelligence";

export function WorkspaceBookingForm({
  journey,
  stop,
  onClose,
}: {
  journey: JourneyPlan;
  stop: IntelligencePlanStop;
  onClose: () => void;
}) {
  const [guestName, setGuestName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [startDate, setStartDate] = useState(journey.date || "");
  const [endDate, setEndDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  const kind = inferBookingKind(stop);
  const accommodation = kind === "accommodation";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/commerce-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          listingId: stop.id,
          listingName: stop.title,
          listingHref: stop.href,
          island: journey.island,
          startDate,
          ...(accommodation ? { endDate } : {}),
          ...(preferredTime ? { preferredTime } : {}),
          adults,
          children,
          guestName,
          email,
          ...(phone ? { phone } : {}),
          notes: [
            `Created from Traveler Workspace mission: ${journey.title}`,
            notes,
          ]
            .filter(Boolean)
            .join("\n"),
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { reference?: string; error?: string }
        | null;

      if (!response.ok || !payload?.reference) {
        throw new Error(payload?.error || "Unable to submit this booking request.");
      }

      setReference(payload.reference);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to submit this booking request.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[3000] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[32px] bg-white p-5 text-[#043331] shadow-2xl sm:rounded-[32px] sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[.16em] text-teal-700">
              Booking request
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-.04em]">{stop.title}</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Submit the request without leaving your active mission.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200"
            aria-label="Close booking form"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {reference ? (
          <section className="mt-7 rounded-[28px] border border-emerald-200 bg-emerald-50 p-6 text-center">
            <CheckCircle2 className="mx-auto h-11 w-11 text-emerald-700" />
            <h3 className="mt-4 text-2xl font-black">Request submitted</h3>
            <p className="mt-2 text-sm font-semibold text-emerald-950/70">
              Save this reference to track the request from My Bookings.
            </p>
            <div className="mx-auto mt-5 max-w-sm rounded-2xl bg-white p-4 font-mono text-lg font-black">
              {reference}
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <a
                href={`/bookings?reference=${encodeURIComponent(reference)}`}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-[#043331] px-5 text-[10px] font-black uppercase tracking-[.15em] text-white"
              >
                Track booking
              </a>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-emerald-200 bg-white px-5 text-[10px] font-black uppercase tracking-[.15em]"
              >
                Return to mission
              </button>
            </div>
          </section>
        ) : (
          <form onSubmit={submit} className="mt-7 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Guest name">
                <input required value={guestName} onChange={(event) => setGuestName(event.target.value)} className="field" />
              </Field>
              <Field label="Email">
                <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="field" />
              </Field>
              <Field label="Phone">
                <input value={phone} onChange={(event) => setPhone(event.target.value)} className="field" />
              </Field>
              <Field label={accommodation ? "Check-in" : "Date"}>
                <input required type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="field" />
              </Field>
              {accommodation ? (
                <Field label="Check-out">
                  <input required type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} className="field" />
                </Field>
              ) : (
                <Field label="Preferred time">
                  <input type="time" value={preferredTime} onChange={(event) => setPreferredTime(event.target.value)} className="field" />
                </Field>
              )}
              <Field label="Adults">
                <input required min={1} max={20} type="number" value={adults} onChange={(event) => setAdults(Number(event.target.value))} className="field" />
              </Field>
              <Field label="Children">
                <input min={0} max={20} type="number" value={children} onChange={(event) => setChildren(Number(event.target.value))} className="field" />
              </Field>
            </div>

            <Field label="Notes">
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="field min-h-28 resize-y" placeholder="Accessibility, pickup, dietary, or timing needs" />
            </Field>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-[#f5b942] px-6 text-[11px] font-black uppercase tracking-[.17em] text-[#043331] disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
              Submit booking request
            </button>
          </form>
        )}
      </div>
      <style jsx>{`
        .field {
          margin-top: 0.5rem;
          width: 100%;
          border-radius: 1rem;
          border: 1px solid rgb(226 232 240);
          background: #fbfaf6;
          padding: 0.8rem 1rem;
          font-size: 0.875rem;
          font-weight: 700;
          outline: none;
        }
        .field:focus {
          border-color: rgb(13 148 136 / 0.45);
          box-shadow: 0 0 0 4px rgb(13 148 136 / 0.1);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-black uppercase tracking-[.15em] text-slate-500">
      {label}
      {children}
    </label>
  );
}

function inferBookingKind(stop: IntelligencePlanStop): "accommodation" | "tour" | "experience" {
  const text = `${stop.kind} ${stop.title}`.toLowerCase();
  if (["hotel", "resort", "villa", "stay", "accommodation"].some((token) => text.includes(token))) {
    return "accommodation";
  }
  if (["tour", "charter", "fishing", "cruise"].some((token) => text.includes(token))) {
    return "tour";
  }
  return "experience";
}
