"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Loader2,
  RefreshCcw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type DriverApplication = {
  id: string;
  displayName: string;
  email: string;
  phone: string;
  island: string;
  taxiCommissionBadgeNumber: string;
  taxiCommissionBadgeExpiresAt: string;
  licenseClass: string;
  licenseExpiresAt: string;
  taxiPlate: string;
  vehicleDescription: string;
  associationName: string;
  status: "pending" | "changes_requested" | "approved" | "rejected";
  reviewNote: string | null;
  submittedAt: string;
  updatedAt: string;
  driverId: string | null;
  vehicleId: string | null;
  associationId: string | null;
};

type Association = {
  id: string;
  name: string;
  status: string;
  islands: string[];
};

type Vehicle = {
  id: string;
  associationId: string;
  driverId: string | null;
  taxiPlate: string;
  medallionNumber: string;
  description: string;
  dispatchReady: boolean;
};

type Payload = {
  applications?: DriverApplication[];
  associations?: Association[];
  vehicles?: Vehicle[];
  counts?: {
    pending: number;
    changesRequested: number;
    approved: number;
    rejected: number;
  };
  error?: string;
};

type ReviewAction = "approve" | "request_changes" | "reject";
type Filter = DriverApplication["status"] | "active" | "all";

const EMPTY_COUNTS = {
  pending: 0,
  changesRequested: 0,
  approved: 0,
  rejected: 0,
};

export function DriverApplicationBoard() {
  const [applications, setApplications] = useState<DriverApplication[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [filter, setFilter] = useState<Filter>("active");
  const [query, setQuery] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [associationIds, setAssociationIds] = useState<Record<string, string>>({});
  const [vehicleIds, setVehicleIds] = useState<Record<string, string>>({});
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/driver-applications", {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as Payload | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load driver applications.");
      }
      const nextApplications = payload?.applications ?? [];
      setApplications(nextApplications);
      setAssociations(payload?.associations ?? []);
      setVehicles(payload?.vehicles ?? []);
      setCounts(payload?.counts ?? EMPTY_COUNTS);
      setNotes(
        Object.fromEntries(
          nextApplications.map((application) => [
            application.id,
            application.reviewNote ?? "",
          ]),
        ),
      );
      setAssociationIds((current) => ({
        ...Object.fromEntries(
          nextApplications
            .filter((application) => application.associationId)
            .map((application) => [application.id, application.associationId ?? ""]),
        ),
        ...current,
      }));
      setVehicleIds((current) => ({
        ...Object.fromEntries(
          nextApplications
            .filter((application) => application.vehicleId)
            .map((application) => [application.id, application.vehicleId ?? ""]),
        ),
        ...current,
      }));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load driver applications.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return applications.filter((application) => {
      const statusMatch =
        filter === "all" ||
        (filter === "active"
          ? ["pending", "changes_requested"].includes(application.status)
          : application.status === filter);
      if (!statusMatch) return false;
      if (!normalizedQuery) return true;
      return [
        application.displayName,
        application.email,
        application.phone,
        application.taxiCommissionBadgeNumber,
        application.taxiPlate,
        application.associationName,
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [applications, filter, query]);

  async function review(application: DriverApplication, action: ReviewAction) {
    const associationId = associationIds[application.id] ?? "";
    const vehicleId = vehicleIds[application.id] ?? "";
    if (action === "approve" && (!associationId || !vehicleId)) {
      setError("Choose the verified taxi association and dispatch-ready fleet vehicle before approval.");
      return;
    }

    setWorkingId(application.id);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/admin/driver-applications/${encodeURIComponent(application.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            reviewNote: notes[application.id] ?? "",
            associationId,
            vehicleId,
          }),
        },
      );
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; status?: string; driverId?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to review driver application.");
      }
      setMessage(
        action === "approve"
          ? `${application.displayName} is approved. The driver must refresh their session before opening Driver OS.`
          : action === "request_changes"
            ? `Changes requested from ${application.displayName}.`
            : `${application.displayName} was rejected.`,
      );
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to review driver application.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f2e7] px-4 py-8 text-[#043331] sm:px-6 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin"
            className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-5 text-[9px] font-black uppercase tracking-[.14em]"
          >
            Admin
          </Link>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-[9px] font-black uppercase tracking-[.14em] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            Refresh
          </button>
        </div>

        <section className="mt-5 rounded-[34px] bg-[#043331] p-7 text-white shadow-xl sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-[.18em] text-[#f5c451]">
            <ShieldCheck className="h-4 w-4" /> Driver compliance
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-[-.05em] sm:text-6xl">
            Driver application review
          </h1>
          <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-white/65">
            Verify the applicant against reviewed Taxicab Commission credentials, then link an active taxi association and a dispatch-ready insured and inspected fleet vehicle before granting Driver OS access.
          </p>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Pending" value={counts.pending} />
          <Metric label="Needs changes" value={counts.changesRequested} />
          <Metric label="Approved" value={counts.approved} />
          <Metric label="Rejected" value={counts.rejected} />
        </section>

        {error ? <Notice tone="error">{error}</Notice> : null}
        {message ? <Notice tone="success">{message}</Notice> : null}

        {!associations.length || !vehicles.some((vehicle) => vehicle.dispatchReady) ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold leading-6 text-amber-950">
            Approval remains fail-closed until reviewed active taxi associations and dispatch-ready fleet vehicles exist. Use the taxi operations/fleet workflow to import or correct those records first.
          </div>
        ) : null}

        <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search applicant, email, badge, taxi plate, or association"
              className="min-h-12 w-full rounded-2xl border border-slate-200 pl-11 pr-4 text-sm font-semibold outline-none focus:border-teal-600"
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              ["active", "Active"],
              ["pending", "Pending"],
              ["changes_requested", "Needs changes"],
              ["approved", "Approved"],
              ["rejected", "Rejected"],
              ["all", "All"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value as Filter)}
                className={`min-h-10 rounded-full px-4 text-[9px] font-black uppercase tracking-[.13em] ${
                  filter === value
                    ? "bg-[#043331] text-white"
                    : "border border-slate-200 bg-white text-slate-500"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-5 space-y-4">
          {loading && !applications.length ? (
            <div className="grid min-h-56 place-items-center rounded-[28px] border border-slate-200 bg-white">
              <Loader2 className="h-7 w-7 animate-spin text-teal-700" />
            </div>
          ) : !visibleApplications.length ? (
            <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-8 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-700" />
              <h2 className="mt-4 text-xl font-black">No matching driver applications</h2>
            </div>
          ) : (
            visibleApplications.map((application) => {
              const selectedAssociationId = associationIds[application.id] ?? "";
              const eligibleVehicles = vehicles.filter(
                (vehicle) =>
                  vehicle.dispatchReady &&
                  (!selectedAssociationId ||
                    vehicle.associationId === selectedAssociationId) &&
                  (!vehicle.driverId || vehicle.driverId === application.id),
              );
              return (
                <article
                  key={application.id}
                  className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[.14em] text-teal-700">
                        {humanize(application.status)} · {humanizeIsland(application.island)}
                      </p>
                      <h2 className="mt-2 text-2xl font-black tracking-[-.04em]">
                        {application.displayName}
                      </h2>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {application.email} · {application.phone}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#f7f2e7] px-4 py-2 text-[9px] font-black uppercase tracking-[.13em]">
                      $0 signup · 15% commission
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Datum label="Taxi badge / permit" value={application.taxiCommissionBadgeNumber} />
                    <Datum label="Badge expires" value={application.taxiCommissionBadgeExpiresAt} />
                    <Datum label="License" value={`${application.licenseClass} · ${application.licenseExpiresAt}`} />
                    <Datum label="Applicant taxi plate" value={application.taxiPlate} />
                  </div>

                  <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-600">
                    <p><strong>Applicant association:</strong> {application.associationName}</p>
                    <p className="mt-1"><strong>Vehicle:</strong> {application.vehicleDescription}</p>
                  </div>

                  {application.status !== "approved" ? (
                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                      <div className="space-y-3">
                        <label className="block">
                          <span className="text-[9px] font-black uppercase tracking-[.14em] text-slate-500">Verified association</span>
                          <select
                            value={selectedAssociationId}
                            onChange={(event) => {
                              const value = event.target.value;
                              setAssociationIds((current) => ({ ...current, [application.id]: value }));
                              setVehicleIds((current) => ({ ...current, [application.id]: "" }));
                            }}
                            className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold"
                          >
                            <option value="">Choose reviewed association</option>
                            {associations.map((association) => (
                              <option key={association.id} value={association.id}>
                                {association.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <span className="text-[9px] font-black uppercase tracking-[.14em] text-slate-500">Dispatch-ready vehicle</span>
                          <select
                            value={vehicleIds[application.id] ?? ""}
                            disabled={!selectedAssociationId}
                            onChange={(event) =>
                              setVehicleIds((current) => ({
                                ...current,
                                [application.id]: event.target.value,
                              }))
                            }
                            className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold disabled:bg-slate-50"
                          >
                            <option value="">Choose compliant fleet vehicle</option>
                            {eligibleVehicles.map((vehicle) => (
                              <option key={vehicle.id} value={vehicle.id}>
                                {vehicle.taxiPlate} · {vehicle.description} · medallion {vehicle.medallionNumber}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <div>
                        <textarea
                          value={notes[application.id] ?? ""}
                          onChange={(event) =>
                            setNotes((current) => ({
                              ...current,
                              [application.id]: event.target.value,
                            }))
                          }
                          maxLength={500}
                          rows={5}
                          placeholder="Compliance review note"
                          className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-semibold outline-none focus:border-teal-600"
                        />
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={workingId === application.id}
                            onClick={() => void review(application, "approve")}
                            className="min-h-10 rounded-full bg-emerald-700 px-4 text-[9px] font-black uppercase tracking-[.12em] text-white disabled:opacity-50"
                          >
                            Approve verified driver
                          </button>
                          <button
                            type="button"
                            disabled={workingId === application.id}
                            onClick={() => void review(application, "request_changes")}
                            className="min-h-10 rounded-full bg-amber-600 px-4 text-[9px] font-black uppercase tracking-[.12em] text-white disabled:opacity-50"
                          >
                            Request changes
                          </button>
                          <button
                            type="button"
                            disabled={workingId === application.id}
                            onClick={() => void review(application, "reject")}
                            className="min-h-10 rounded-full bg-slate-700 px-4 text-[9px] font-black uppercase tracking-[.12em] text-white disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">
                      Approved driver ID: {application.driverId ?? application.id}. Association and vehicle linkage are locked to the trusted approval record.
                    </div>
                  )}
                </article>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function Datum({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f7f2e7] p-4">
      <p className="text-[8px] font-black uppercase tracking-[.14em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black">{value || "—"}</p>
    </div>
  );
}

function Notice({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  return (
    <div
      className={`mt-5 rounded-2xl border px-5 py-4 text-sm font-bold ${
        tone === "error"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
    >
      {children}
    </div>
  );
}

function humanize(value: string) {
  return value.replaceAll("_", " ");
}

function humanizeIsland(value: string) {
  return value === "stt" ? "St. Thomas" : value === "stj" ? "St. John" : value === "stx" ? "St. Croix" : value;
}
