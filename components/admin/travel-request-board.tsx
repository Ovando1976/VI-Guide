"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Save,
  Sparkles,
  Users,
} from "lucide-react";

import {
  TRAVEL_REQUEST_STATUSES,
  travelIslandLabel,
  travelPreferenceLabel,
  type TravelRequestStatus,
} from "@/lib/travel-advisor";

type TravelRequest = {
  id: string;
  reference: string;
  travelerName: string;
  email: string;
  phone: string | null;
  island: string;
  arrival: string | null;
  departure: string | null;
  travelers: number;
  budget: string;
  stayStatus: string;
  pace: string;
  interests: string[];
  notes: string | null;
  status: TravelRequestStatus;
  advisorNote: string | null;
  assignedAdvisorEmail: string | null;
  createdAt: string;
  updatedAt: string;
};

type Draft = { status: TravelRequestStatus; advisorNote: string };

export function TravelRequestBoard() {
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/travel-advisor/requests", {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | { requests?: TravelRequest[]; error?: string }
        | null;
      if (!response.ok || !payload?.requests) {
        throw new Error(payload?.error || "Unable to load travel requests.");
      }
      setRequests(payload.requests);
      setDrafts(
        Object.fromEntries(
          payload.requests.map((request) => [
            request.id,
            {
              status: request.status,
              advisorNote: request.advisorNote ?? "",
            },
          ]),
        ),
      );
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to load travel requests.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    return requests.reduce<Record<string, number>>((current, request) => {
      current[request.status] = (current[request.status] ?? 0) + 1;
      return current;
    }, {});
  }, [requests]);

  async function save(requestId: string) {
    const draft = drafts[requestId];
    if (!draft || savingId) return;
    setSavingId(requestId);
    setSavedId(null);
    setError(null);

    try {
      const response = await fetch("/api/travel-advisor/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, ...draft }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { request?: TravelRequest; error?: string }
        | null;
      if (!response.ok || !payload?.request) {
        throw new Error(payload?.error || "Unable to update this request.");
      }
      setRequests((current) =>
        current.map((request) =>
          request.id === requestId ? payload.request! : request,
        ),
      );
      setDrafts((current) => ({
        ...current,
        [requestId]: {
          status: payload.request!.status,
          advisorNote: payload.request!.advisorNote ?? "",
        },
      }));
      setSavedId(requestId);
      window.setTimeout(() => setSavedId(null), 1800);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to update this request.",
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f0e7] pb-24 text-[#073b39]">
      <section className="bg-[linear-gradient(145deg,#032f2d,#075e58_62%,#0f8d83)] px-4 py-9 text-white sm:px-6 lg:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#f5c451]">
                VI Guide Operations
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-6xl">
                USVI Travel Advisor Desk
              </h1>
              <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/70 sm:text-base">
                Turn traveler intent into an itinerary, a conversation, and a bookable trip.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 text-[10px] font-black uppercase tracking-[.14em] disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {TRAVEL_REQUEST_STATUSES.map((status) => (
              <div key={status} className="rounded-2xl border border-white/10 bg-white/[.08] px-4 py-3">
                <div className="text-[9px] font-black uppercase tracking-[.14em] text-white/50">
                  {travelPreferenceLabel(status)}
                </div>
                <div className="mt-1 text-2xl font-black">{counts[status] ?? 0}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {error ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="grid min-h-60 place-items-center rounded-[30px] border border-slate-200 bg-white">
            <div className="text-center">
              <Loader2 className="mx-auto h-7 w-7 animate-spin text-teal-700" />
              <p className="mt-3 text-xs font-black uppercase tracking-[.16em] text-slate-400">Loading requests</p>
            </div>
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-[30px] border border-slate-200 bg-white p-10 text-center shadow-sm">
            <Sparkles className="mx-auto h-8 w-8 text-teal-700" />
            <h2 className="mt-4 text-2xl font-black">No trip-planning requests yet.</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              New traveler submissions from /trip-planning will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {requests.map((request) => {
              const draft = drafts[request.id] ?? {
                status: request.status,
                advisorNote: request.advisorNote ?? "",
              };
              return (
                <article key={request.id} className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
                  <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.15fr_.85fr]">
                    <div>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-[10px] font-black uppercase tracking-[.12em] text-teal-700">
                            {request.reference}
                          </p>
                          <h2 className="mt-2 text-2xl font-black tracking-[-.035em]">{request.travelerName}</h2>
                          <p className="mt-1 text-xs font-semibold text-slate-400">
                            Received {formatDateTime(request.createdAt)}
                          </p>
                        </div>
                        <span className="rounded-full bg-[#e9f7f3] px-3 py-2 text-[9px] font-black uppercase tracking-[.12em] text-teal-800">
                          {travelPreferenceLabel(request.status)}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <Info icon={Mail} label="Email" value={request.email} href={`mailto:${request.email}`} />
                        <Info icon={Phone} label="Phone" value={request.phone ?? "Not provided"} href={request.phone ? `tel:${request.phone}` : undefined} />
                        <Info icon={MapPin} label="Island" value={travelIslandLabel(request.island)} />
                        <Info icon={Users} label="Party" value={`${request.travelers} traveler${request.travelers === 1 ? "" : "s"}`} />
                        <Info icon={CalendarDays} label="Dates" value={dateRange(request.arrival, request.departure)} />
                        <Info icon={Sparkles} label="Style" value={`${travelPreferenceLabel(request.budget)} · ${travelPreferenceLabel(request.pace)}`} />
                      </div>

                      <div className="mt-5 rounded-2xl bg-[#f7f4ec] p-4">
                        <p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">Trip preferences</p>
                        <p className="mt-2 text-sm font-bold text-slate-700">
                          Stay: {travelPreferenceLabel(request.stayStatus)}
                        </p>
                        <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                          {request.interests.length
                            ? request.interests.map(travelPreferenceLabel).join(" · ")
                            : "No interests selected"}
                        </p>
                        {request.notes ? (
                          <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-600">{request.notes}</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                      <p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">Advisor workflow</p>
                      <label className="mt-4 block text-xs font-black uppercase tracking-[.12em] text-slate-500">
                        Status
                        <select
                          value={draft.status}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [request.id]: {
                                ...draft,
                                status: event.target.value as TravelRequestStatus,
                              },
                            }))
                          }
                          className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-teal-500"
                        >
                          {TRAVEL_REQUEST_STATUSES.map((status) => (
                            <option key={status} value={status}>{travelPreferenceLabel(status)}</option>
                          ))}
                        </select>
                      </label>
                      <label className="mt-4 block text-xs font-black uppercase tracking-[.12em] text-slate-500">
                        Advisor note
                        <textarea
                          value={draft.advisorNote}
                          maxLength={2000}
                          rows={7}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [request.id]: {
                                ...draft,
                                advisorNote: event.target.value,
                              },
                            }))
                          }
                          placeholder="Research, follow-up, supplier, booking, or traveler notes…"
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold leading-6 outline-none focus:border-teal-500"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => void save(request.id)}
                        disabled={savingId !== null}
                        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#043331] px-5 text-[10px] font-black uppercase tracking-[.14em] text-white disabled:opacity-50"
                      >
                        {savingId === request.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : savedId === request.id ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        {savedId === request.id ? "Saved" : "Save workflow"}
                      </button>
                      {request.assignedAdvisorEmail ? (
                        <p className="mt-3 text-center text-[10px] font-semibold text-slate-400">
                          Last handled by {request.assignedAdvisorEmail}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function Info({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.13em] text-slate-400">
        <Icon className="h-4 w-4 text-teal-700" /> {label}
      </div>
      <div className="mt-2 break-words text-sm font-black text-[#073b39]">{value}</div>
    </div>
  );
  return href ? <a href={href} className="block transition hover:-translate-y-0.5">{content}</a> : content;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/St_Thomas",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function dateRange(arrival: string | null, departure: string | null) {
  if (arrival && departure) return `${arrival} → ${departure}`;
  if (arrival) return `From ${arrival}`;
  if (departure) return `Until ${departure}`;
  return "Flexible / undecided";
}
