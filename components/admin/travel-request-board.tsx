"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Route,
  Save,
  Search,
  Sparkles,
  Users,
} from "lucide-react";

import { AdminShell } from "@/components/admin-shell";
import { OpsMetric, OpsPill, OpsSection } from "@/components/ops/ops-ui";
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

type RequestPayload = {
  requests?: TravelRequest[];
  request?: TravelRequest;
  error?: string;
};

export function TravelRequestBoard() {
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TravelRequestStatus>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/travel-advisor/requests", {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as RequestPayload | null;
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

  const metrics = useMemo(
    () => ({
      total: requests.length,
      new: requests.filter((request) => request.status === "new").length,
      active: requests.filter((request) =>
        ["reviewing", "planned", "contacted"].includes(request.status),
      ).length,
      booked: requests.filter((request) => request.status === "booked").length,
    }),
    [requests],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return requests.filter((request) => {
      if (statusFilter !== "all" && request.status !== statusFilter) return false;
      if (!normalized) return true;

      return [
        request.reference,
        request.travelerName,
        request.email,
        request.phone ?? "",
        travelIslandLabel(request.island),
        request.budget,
        request.stayStatus,
        request.pace,
        ...request.interests,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [query, requests, statusFilter]);

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
      const payload = (await response.json().catch(() => null)) as RequestPayload | null;
      if (!response.ok || !payload?.request) {
        throw new Error(payload?.error || "Unable to update this request.");
      }
      const updated = payload.request;
      setRequests((current) =>
        current.map((request) => (request.id === requestId ? updated : request)),
      );
      setDrafts((current) => ({
        ...current,
        [requestId]: {
          status: updated.status,
          advisorNote: updated.advisorNote ?? "",
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
    <AdminShell
      eyebrow="Travel Advisor OS"
      title="USVI travel planning requests"
      description="Turn qualified traveler intent into practical itineraries, human follow-up, local bookings, and completed trips without losing the Concierge planning context."
      actions={
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#043331] px-5 text-[10px] font-black uppercase tracking-[.14em] text-white disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      }
    >
      <div className="space-y-5">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <OpsMetric label="All requests" value={String(metrics.total)} footnote="qualified trip leads" />
          <OpsMetric
            label="Needs attention"
            value={String(metrics.new)}
            tone={metrics.new ? "warning" : "default"}
            footnote="new requests"
          />
          <OpsMetric label="Active planning" value={String(metrics.active)} tone="success" footnote="in advisor workflow" />
          <OpsMetric label="Booked" value={String(metrics.booked)} tone="success" footnote="converted trips" />
        </section>

        <OpsSection
          eyebrow="Advisor queue"
          title="Traveler pipeline"
          subtitle="Search the same way across VI Guide operations and filter the desk by workflow status. New qualified requests receive an automatic acknowledgement while the advisor builds the human-reviewed plan."
          actions={<OpsPill label={`${filtered.length} shown`} tone="teal" />}
        >
          <div className="grid gap-3 md:grid-cols-[1fr_240px]">
            <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4">
              <Search className="h-4 w-4 text-teal-700" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search traveler, email, reference, island, or interest"
                className="w-full border-0 bg-transparent p-0 text-sm font-semibold outline-none placeholder:text-slate-300 focus:ring-0"
              />
            </label>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "all" | TravelRequestStatus)
              }
              className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-[#043331] outline-none"
            >
              <option value="all">All workflow statuses</option>
              {TRAVEL_REQUEST_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {travelPreferenceLabel(status)}
                </option>
              ))}
            </select>
          </div>
        </OpsSection>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
            {error}
          </div>
        ) : null}

        {loading && requests.length === 0 ? (
          <div className="grid min-h-64 place-items-center rounded-[28px] border border-slate-200 bg-white">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-teal-700" />
              <p className="mt-3 text-[10px] font-black uppercase tracking-[.16em] text-slate-400">
                Loading advisor queue
              </p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center shadow-sm">
            <Sparkles className="mx-auto h-9 w-9 text-slate-300" />
            <h2 className="mt-4 text-xl font-black">No matching travel requests</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              New customer submissions from the USVI trip planner will appear here automatically.
            </p>
          </div>
        ) : (
          <section className="space-y-4">
            {filtered.map((request) => {
              const draft = drafts[request.id] ?? {
                status: request.status,
                advisorNote: request.advisorNote ?? "",
              };

              return (
                <article
                  key={request.id}
                  className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm"
                >
                  <div className="grid gap-6 p-5 lg:grid-cols-[1fr_340px] lg:p-7">
                    <div>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <OpsPill
                              label={travelPreferenceLabel(request.status)}
                              tone={statusTone(request.status)}
                            />
                            <span className="font-mono text-[10px] font-bold text-slate-400">
                              {request.reference}
                            </span>
                          </div>
                          <h2 className="mt-3 text-2xl font-black tracking-[-.04em] text-[#043331]">
                            {request.travelerName}
                          </h2>
                          <p className="mt-1 text-xs font-semibold text-slate-400">
                            Received {formatDateTime(request.createdAt)}
                          </p>
                        </div>
                        {request.assignedAdvisorEmail ? (
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[9px] font-black text-slate-500">
                            {request.assignedAdvisorEmail}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <Detail icon={Mail} label="Email" value={request.email} href={`mailto:${request.email}`} />
                        <Detail
                          icon={Phone}
                          label="Phone"
                          value={request.phone ?? "Not provided"}
                          href={request.phone ? `tel:${request.phone}` : undefined}
                        />
                        <Detail icon={MapPin} label="Island" value={travelIslandLabel(request.island)} />
                        <Detail
                          icon={Users}
                          label="Travelers"
                          value={`${request.travelers} traveler${request.travelers === 1 ? "" : "s"}`}
                        />
                        <Detail
                          icon={CalendarDays}
                          label="Travel window"
                          value={dateRange(request.arrival, request.departure)}
                        />
                        <Detail
                          icon={Sparkles}
                          label="Trip style"
                          value={`${travelPreferenceLabel(request.budget)} · ${travelPreferenceLabel(request.pace)}`}
                        />
                      </div>

                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <InfoBlock title="Stay planning">
                          <p>{travelPreferenceLabel(request.stayStatus)}</p>
                        </InfoBlock>
                        <InfoBlock title="Interests">
                          <TagList values={request.interests} />
                        </InfoBlock>
                      </div>

                      {request.notes ? (
                        <div className="mt-4 rounded-[22px] border border-slate-200 bg-slate-50 p-5">
                          <p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-400">
                            Traveler notes
                          </p>
                          <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-600">
                            {request.notes}
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <aside className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 sm:p-5">
                      <p className="text-[9px] font-black uppercase tracking-[.15em] text-teal-700">
                        Advisor controls
                      </p>

                      <div className="mt-4 grid gap-2">
                        <Link
                          href={buildAdvisorConciergeHref(request)}
                          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0f766e] px-4 text-[10px] font-black uppercase tracking-[.13em] text-white transition hover:bg-[#0b5d5b]"
                        >
                          <Route className="h-4 w-4" /> Build planning brief
                        </Link>
                        <a
                          href={buildAdvisorEmailHref(request)}
                          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-[.13em] text-[#043331] transition hover:border-teal-300"
                        >
                          <Mail className="h-4 w-4 text-teal-700" /> Follow up by email
                        </a>
                      </div>

                      <label className="mt-4 block text-xs font-black text-slate-600">
                        Workflow status
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
                          className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-[#043331] outline-none"
                        >
                          {TRAVEL_REQUEST_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {travelPreferenceLabel(status)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="mt-4 block text-xs font-black text-slate-600">
                        Private advisor note
                        <textarea
                          value={draft.advisorNote}
                          maxLength={2000}
                          rows={8}
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
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#043331] outline-none focus:border-teal-600"
                        />
                      </label>

                      {savedId === request.id ? (
                        <p className="mt-3 flex items-center gap-2 text-sm font-bold text-emerald-700">
                          <CheckCircle2 className="h-4 w-4" /> Advisor workflow updated.
                        </p>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => void save(request.id)}
                        disabled={savingId !== null}
                        className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#043331] px-5 text-[10px] font-black uppercase tracking-[.14em] text-white disabled:opacity-60"
                      >
                        {savingId === request.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : savedId === request.id ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        {savedId === request.id ? "Saved" : "Save advisor update"}
                      </button>
                    </aside>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </AdminShell>
  );
}

function Detail({
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
    <div className="h-full rounded-[20px] border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.14em] text-slate-400">
        <Icon className="h-4 w-4 text-teal-700" /> {label}
      </div>
      <div className="mt-2 break-words text-sm font-black text-[#043331]">{value}</div>
    </div>
  );

  return href ? (
    <a href={href} className="block h-full transition hover:-translate-y-0.5">
      {content}
    </a>
  ) : (
    content
  );
}

function InfoBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-5 text-sm font-semibold leading-6 text-slate-600">
      <p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-400">{title}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function TagList({ values }: { values: string[] }) {
  if (!values.length) return <p>No interests selected.</p>;

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <span
          key={value}
          className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.12em] text-teal-700"
        >
          {travelPreferenceLabel(value)}
        </span>
      ))}
    </div>
  );
}

function buildAdvisorConciergeHref(request: TravelRequest) {
  const prompt = [
    `Act as the VI Guide travel-advisor planning workspace for request ${request.reference}.`,
    "Create a practical U.S. Virgin Islands itinerary draft for human advisor review before anything is sent to the traveler.",
    `Island preference: ${travelIslandLabel(request.island)}.`,
    `Travel window: ${dateRange(request.arrival, request.departure)}.`,
    `Travelers: ${request.travelers}.`,
    `Budget: ${travelPreferenceLabel(request.budget)}.`,
    `Pace: ${travelPreferenceLabel(request.pace)}.`,
    `Stay status: ${travelPreferenceLabel(request.stayStatus)}.`,
    `Interests: ${request.interests.length ? request.interests.map(travelPreferenceLabel).join(", ") : "No specific interests selected"}.`,
    "Do not infer or expose contact information. Treat availability, operating hours, transportation schedules, and prices as details that must be confirmed before commitment.",
    "Return a day-by-day draft plus lodging considerations, transportation/ferry logistics, bookable categories, open questions for the advisor, and a concise follow-up checklist.",
  ].join("\n");

  return `/concierge?open=true&prompt=${encodeURIComponent(prompt.slice(0, 3900))}`;
}

function buildAdvisorEmailHref(request: TravelRequest) {
  const subject = `VI Guide trip planning · ${request.reference}`;
  const body = [
    `Hello ${request.travelerName},`,
    "",
    `I am following up on your VI Guide trip-planning request ${request.reference}.`,
    "",
    "I am reviewing the trip details you submitted and can help turn them into a practical U.S. Virgin Islands itinerary, including stays, transportation, activities, and bookable options where appropriate.",
    "",
    "Before anything is booked or charged, we will confirm the relevant availability, terms, and pricing with you.",
    "",
    "VI Guide",
  ].join("\n");
  return `mailto:${encodeURIComponent(request.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function statusTone(status: TravelRequestStatus): "neutral" | "teal" | "amber" | "emerald" | "rose" {
  if (status === "new") return "amber";
  if (status === "reviewing" || status === "planned" || status === "contacted") return "teal";
  if (status === "booked") return "emerald";
  if (status === "closed") return "neutral";
  return "neutral";
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

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function dateRange(arrival: string | null, departure: string | null) {
  if (arrival && departure) return `${formatDate(arrival)} – ${formatDate(departure)}`;
  if (arrival) return `From ${formatDate(arrival)}`;
  if (departure) return `Until ${formatDate(departure)}`;
  return "Flexible / undecided";
}
