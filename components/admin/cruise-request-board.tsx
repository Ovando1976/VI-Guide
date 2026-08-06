"use client";

import {
  CalendarRange,
  CheckCircle2,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Search,
  ShipWheel,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AdminShell } from "@/components/admin-shell";
import {
  CRUISE_REQUEST_STATUSES,
  humanizeCruiseValue,
  type CruiseRequestStatus,
} from "@/lib/cruise-advisor";

type CruiseRequest = {
  id: string;
  reference: string;
  travelerName: string;
  email: string;
  phone: string | null;
  departureWindowStart: string;
  departureWindowEnd: string;
  departurePort: string;
  otherDeparturePort: string | null;
  destinations: string[];
  adults: number;
  children: number;
  budgetCents: number | null;
  tripLength: string;
  cabinPreference: string;
  priorities: string[];
  accessibilityNotes: string | null;
  celebration: string | null;
  notes: string | null;
  status: CruiseRequestStatus;
  advisorNote: string | null;
  assignedAdvisorEmail: string | null;
  createdAt: string;
  updatedAt: string;
};

type RequestPayload = {
  requests?: CruiseRequest[];
  request?: CruiseRequest;
  error?: string;
};

export function CruiseRequestBoard() {
  const [requests, setRequests] = useState<CruiseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | CruiseRequestStatus>("all");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/cruise-advisor/requests", {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | RequestPayload
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load cruise requests.");
      }
      const nextRequests = payload?.requests;
      setRequests(Array.isArray(nextRequests) ? nextRequests : []);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load cruise requests.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return requests.filter((request) => {
      if (status !== "all" && request.status !== status) return false;
      if (!normalized) return true;
      return [
        request.reference,
        request.travelerName,
        request.email,
        request.phone ?? "",
        request.departurePort,
        request.otherDeparturePort ?? "",
        ...request.destinations,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [query, requests, status]);

  const metrics = useMemo(
    () => ({
      total: requests.length,
      new: requests.filter((request) => request.status === "new").length,
      active: requests.filter((request) =>
        ["researching", "quoted", "customer_review"].includes(request.status),
      ).length,
      booked: requests.filter((request) => request.status === "booked").length,
    }),
    [requests],
  );

  function replaceRequest(updated: CruiseRequest) {
    setRequests((current) =>
      current.map((request) => (request.id === updated.id ? updated : request)),
    );
  }

  return (
    <AdminShell
      eyebrow="Cruise Advisor OS"
      title="Cruise planning requests"
      description="Research qualified cruise leads, preserve advisor notes, and move each request through a controlled planning workflow. Cruise-line fares remain outside VI Guide until approved supplier credentials are connected."
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
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="All requests" value={metrics.total} />
        <Metric label="Needs attention" value={metrics.new} />
        <Metric label="Active planning" value={metrics.active} />
        <Metric label="Booked" value={metrics.booked} />
      </section>

      <section className="mt-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_240px]">
          <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 px-4">
            <Search className="h-4 w-4 text-teal-700" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search traveler, email, reference, or destination"
              className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-300"
            />
          </label>
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as "all" | CruiseRequestStatus)
            }
            className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-[#043331] outline-none"
          >
            <option value="all">All workflow statuses</option>
            {CRUISE_REQUEST_STATUSES.map((value) => (
              <option key={value} value={value}>
                {humanizeCruiseValue(value)}
              </option>
            ))}
          </select>
        </div>
      </section>

      {error ? (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
          {error}
        </div>
      ) : null}

      {loading && requests.length === 0 ? (
        <div className="mt-5 grid min-h-64 place-items-center rounded-[28px] border border-slate-200 bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-5 rounded-[28px] border border-slate-200 bg-white p-10 text-center shadow-sm">
          <ShipWheel className="mx-auto h-9 w-9 text-slate-300" />
          <h2 className="mt-4 text-xl font-black">No matching cruise requests</h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            New customer submissions will appear here automatically.
          </p>
        </div>
      ) : (
        <section className="mt-5 space-y-4">
          {filtered.map((request) => (
            <CruiseRequestCard
              key={request.id}
              request={request}
              onSaved={replaceRequest}
            />
          ))}
        </section>
      )}
    </AdminShell>
  );
}

function CruiseRequestCard({
  request,
  onSaved,
}: {
  request: CruiseRequest;
  onSaved: (request: CruiseRequest) => void;
}) {
  const [status, setStatus] = useState<CruiseRequestStatus>(request.status);
  const [advisorNote, setAdvisorNote] = useState(request.advisorNote ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStatus(request.status);
    setAdvisorNote(request.advisorNote ?? "");
  }, [request]);

  async function save() {
    try {
      setSaving(true);
      setMessage(null);
      setError(null);
      const response = await fetch("/api/cruise-advisor/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          status,
          advisorNote,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | RequestPayload
        | null;
      if (!response.ok || !payload?.request) {
        throw new Error(payload?.error || "Unable to save this request.");
      }
      onSaved(payload.request);
      setMessage("Advisor workflow updated.");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to save this request.",
      );
    } finally {
      setSaving(false);
    }
  }

  const partySize = request.adults + request.children;
  const departurePort =
    request.departurePort === "other"
      ? request.otherDeparturePort || "Other port"
      : humanizeCruiseValue(request.departurePort);

  return (
    <article className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-6 p-5 lg:grid-cols-[1fr_340px] lg:p-7">
        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-teal-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.14em] text-teal-700">
                  {humanizeCruiseValue(request.status)}
                </span>
                <span className="font-mono text-[10px] font-bold text-slate-400">
                  {request.reference}
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-black tracking-[-.04em]">
                {request.travelerName}
              </h2>
              <p className="mt-1 text-xs font-semibold text-slate-400">
                Received {formatDateTime(request.createdAt)}
              </p>
            </div>
            {request.assignedAdvisorEmail ? (
              <span className="rounded-full border border-slate-200 px-3 py-2 text-[9px] font-black text-slate-500">
                {request.assignedAdvisorEmail}
              </span>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Detail icon={CalendarRange} label="Travel window" value={`${formatDate(request.departureWindowStart)} – ${formatDate(request.departureWindowEnd)}`} />
            <Detail icon={ShipWheel} label="Departure" value={departurePort} />
            <Detail icon={UsersRound} label="Travelers" value={`${partySize} total · ${request.adults} adult${request.adults === 1 ? "" : "s"}`} />
            <Detail icon={WalletCards} label="Budget" value={request.budgetCents === null ? "Not specified" : formatMoney(request.budgetCents)} />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <InfoBlock title="Cruise profile">
              <p>{humanizeCruiseValue(request.tripLength)}</p>
              <p>{humanizeCruiseValue(request.cabinPreference)} cabin</p>
              {request.celebration ? <p>{request.celebration}</p> : null}
            </InfoBlock>
            <InfoBlock title="Destination interests">
              <TagList values={request.destinations} />
            </InfoBlock>
            <InfoBlock title="Traveler priorities">
              {request.priorities.length ? (
                <TagList values={request.priorities} />
              ) : (
                <p>No priorities selected.</p>
              )}
            </InfoBlock>
            <InfoBlock title="Contact">
              <a href={`mailto:${request.email}`} className="flex items-center gap-2 font-black text-teal-700">
                <Mail className="h-4 w-4" /> {request.email}
              </a>
              {request.phone ? (
                <a href={`tel:${request.phone}`} className="mt-2 flex items-center gap-2 font-black text-teal-700">
                  <Phone className="h-4 w-4" /> {request.phone}
                </a>
              ) : null}
            </InfoBlock>
          </div>

          {request.accessibilityNotes || request.notes ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {request.accessibilityNotes ? (
                <InfoBlock title="Accessibility and mobility">
                  <p className="whitespace-pre-wrap">{request.accessibilityNotes}</p>
                </InfoBlock>
              ) : null}
              {request.notes ? (
                <InfoBlock title="Traveler notes">
                  <p className="whitespace-pre-wrap">{request.notes}</p>
                </InfoBlock>
              ) : null}
            </div>
          ) : null}
        </div>

        <aside className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <p className="text-[9px] font-black uppercase tracking-[.15em] text-teal-700">
            Advisor controls
          </p>
          <label className="mt-4 block text-xs font-black text-slate-600">
            Workflow status
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as CruiseRequestStatus)
              }
              className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-[#043331] outline-none"
            >
              {CRUISE_REQUEST_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {humanizeCruiseValue(value)}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-4 block text-xs font-black text-slate-600">
            Private advisor note
            <textarea
              value={advisorNote}
              onChange={(event) => setAdvisorNote(event.target.value)}
              maxLength={2000}
              rows={8}
              placeholder="Research notes, supplier follow-up, cabin options, deadlines…"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#043331] outline-none focus:border-teal-600"
            />
          </label>
          {error ? <p className="mt-3 text-sm font-bold text-rose-700">{error}</p> : null}
          {message ? (
            <p className="mt-3 flex items-center gap-2 text-sm font-bold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> {message}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#043331] px-5 text-[10px] font-black uppercase tracking-[.14em] text-white disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save advisor update
          </button>
        </aside>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black tracking-[-.05em] text-[#043331]">
        {value}
      </p>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarRange;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <Icon className="h-4 w-4 text-teal-700" />
      <p className="mt-3 text-[9px] font-black uppercase tracking-[.13em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-black leading-5 text-[#043331]">{value}</p>
    </div>
  );
}

function InfoBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4 text-sm font-semibold leading-6 text-slate-600">
      <p className="mb-2 text-[9px] font-black uppercase tracking-[.14em] text-slate-400">
        {title}
      </p>
      {children}
    </div>
  );
}

function TagList({ values }: { values: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <span
          key={value}
          className="rounded-full bg-teal-50 px-3 py-1.5 text-[10px] font-black text-teal-700"
        >
          {humanizeCruiseValue(value)}
        </span>
      ))}
    </div>
  );
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDate(value: string) {
  const parsed = Date.parse(`${value}T12:00:00.000Z`);
  return Number.isFinite(parsed)
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "America/St_Thomas",
      }).format(parsed)
    : value;
}

function formatDateTime(value: string) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed)
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/St_Thomas",
      }).format(parsed)
    : value;
}
