"use client";

import Link from "next/link";
import {
  CarFront,
  CheckCircle2,
  Loader2,
  RefreshCcw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type ApplicationStatus =
  | "pending"
  | "changes_requested"
  | "approved"
  | "rejected";

type DriverApplication = {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  phone: string;
  island: string;
  taxiCommissionBadgeNumber: string;
  taxiCommissionBadgeExpiresAt: string | null;
  licenseClass: string;
  licenseExpiresAt: string | null;
  taxiPlate: string;
  vehicleDescription: string;
  associationName: string;
  status: ApplicationStatus;
  reviewNote: string | null;
  signupFeeCents: number;
  platformCommissionBps: number;
  driverShareBps: number;
  associationId: string | null;
  vehicleId: string | null;
  submittedAt: string | null;
  updatedAt: string | null;
  approvedAt: string | null;
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
  islands: string[];
  active: boolean;
  taxiPlate: string;
  medallionNumber: string;
  make: string;
  model: string;
  color: string;
  inspectionStatus: string;
  inspectionExpiresAt: string | null;
  insuranceStatus: string;
  insuranceExpiresAt: string | null;
};

type Payload = {
  applications?: DriverApplication[];
  associations?: Association[];
  vehicles?: Vehicle[];
  error?: string;
};

type ReviewChoice = {
  associationId?: string;
  vehicleId?: string;
  reviewNote?: string;
};

type Filter = ApplicationStatus | "active" | "all";

const FILTERS: Array<[Filter, string]> = [
  ["active", "Needs review"],
  ["pending", "Pending"],
  ["changes_requested", "Changes requested"],
  ["approved", "Approved"],
  ["rejected", "Rejected"],
  ["all", "All"],
];

export function DriverApplicationBoard() {
  const [applications, setApplications] = useState<DriverApplication[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [choices, setChoices] = useState<Record<string, ReviewChoice>>({});
  const [filter, setFilter] = useState<Filter>("active");
  const [query, setQuery] = useState("");
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
      setApplications(Array.isArray(payload?.applications) ? payload!.applications! : []);
      setAssociations(Array.isArray(payload?.associations) ? payload!.associations! : []);
      setVehicles(Array.isArray(payload?.vehicles) ? payload!.vehicles! : []);
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

  const visible = useMemo(() => {
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
        application.id,
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [applications, filter, query]);

  function activeAssociations(application: DriverApplication) {
    return associations.filter(
      (association) =>
        association.status === "active" &&
        (!association.islands.length || association.islands.includes(application.island)),
    );
  }

  function associationValue(application: DriverApplication) {
    const chosen = choices[application.id]?.associationId;
    if (chosen) return chosen;
    if (application.associationId) return application.associationId;
    const wanted = normalizeKey(application.associationName);
    return (
      activeAssociations(application).find(
        (association) => normalizeKey(association.name) === wanted,
      )?.id ?? ""
    );
  }

  function dispatchReadyVehicles(
    application: DriverApplication,
    associationId: string,
  ) {
    const now = Date.now();
    const applicantPlate = normalizeKey(application.taxiPlate);
    return vehicles.filter(
      (vehicle) =>
        vehicle.associationId === associationId &&
        vehicle.active &&
        vehicle.inspectionStatus === "active" &&
        vehicle.insuranceStatus === "active" &&
        future(vehicle.inspectionExpiresAt, now) &&
        future(vehicle.insuranceExpiresAt, now) &&
        Boolean(vehicle.medallionNumber) &&
        normalizeKey(vehicle.taxiPlate) === applicantPlate &&
        (!vehicle.islands.length || vehicle.islands.includes(application.island)) &&
        (!vehicle.driverId || vehicle.driverId === application.id),
    );
  }

  function vehicleValue(application: DriverApplication, associationId: string) {
    const eligible = dispatchReadyVehicles(application, associationId);
    const chosen = choices[application.id]?.vehicleId;
    if (chosen && eligible.some((vehicle) => vehicle.id === chosen)) return chosen;
    if (
      application.vehicleId &&
      eligible.some((vehicle) => vehicle.id === application.vehicleId)
    ) {
      return application.vehicleId;
    }
    return eligible[0]?.id ?? "";
  }

  function setChoice(applicationId: string, patch: ReviewChoice) {
    setChoices((current) => ({
      ...current,
      [applicationId]: { ...current[applicationId], ...patch },
    }));
  }

  async function review(
    application: DriverApplication,
    action: "approve" | "request_changes" | "reject",
  ) {
    setWorkingId(application.id);
    setError(null);
    setMessage(null);
    try {
      const associationId = associationValue(application);
      const vehicleId = vehicleValue(application, associationId);
      if (action === "approve" && (!associationId || !vehicleId)) {
        throw new Error(
          "Approval needs an active reviewed association and a dispatch-ready fleet vehicle with the same taxi plate as the application.",
        );
      }
      const response = await fetch(
        `/api/admin/driver-applications/${encodeURIComponent(application.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            reviewNote: choices[application.id]?.reviewNote ?? application.reviewNote ?? "",
            ...(action === "approve" ? { associationId, vehicleId } : {}),
          }),
        },
      );
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; status?: string; sessionRefreshRequired?: boolean }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to review driver application.");
      }
      setMessage(
        action === "approve"
          ? `${application.displayName} is approved. Their existing sessions were invalidated; they must sign in again before Driver OS unlocks.`
          : action === "request_changes"
            ? `Changes requested from ${application.displayName}.`
            : `${application.displayName}'s application was rejected.`,
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

  const counts = {
    pending: applications.filter((item) => item.status === "pending").length,
    changes: applications.filter((item) => item.status === "changes_requested").length,
    approved: applications.filter((item) => item.status === "approved").length,
    rejected: applications.filter((item) => item.status === "rejected").length,
  };

  return (
    <main className="min-h-screen bg-[#f7f2e7] px-4 py-8 text-[#043331] sm:px-6 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/taxi-operations"
              className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-5 text-[9px] font-black uppercase tracking-[.14em]"
            >
              Taxi operations
            </Link>
            <Link
              href="/admin/fleet"
              className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-5 text-[9px] font-black uppercase tracking-[.14em]"
            >
              Fleet
            </Link>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => void load()}
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

        <section className="mt-5 overflow-hidden rounded-[34px] bg-[radial-gradient(circle_at_top_right,rgba(245,196,81,.28),transparent_30%),linear-gradient(145deg,#032f2d,#0b6b64)] p-7 text-white shadow-xl sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-[.18em] text-[#f5c451]">
            <ShieldCheck className="h-4 w-4" /> Driver compliance queue
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-[-.05em] sm:text-6xl">
            Review applicants without weakening the taxi gate.
          </h1>
          <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-white/70">
            Free signup never creates operating authority. Approval only succeeds when the applicant UID, current credentials, active association, submitted taxi plate, inspection, insurance, and fleet assignment all match the reviewed records.
          </p>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Pending" value={counts.pending} />
          <Metric label="Changes requested" value={counts.changes} />
          <Metric label="Approved" value={counts.approved} />
          <Metric label="Rejected" value={counts.rejected} />
        </section>

        {error ? <Notice tone="error">{error}</Notice> : null}
        {message ? <Notice tone="success">{message}</Notice> : null}

        <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search driver, email, badge, taxi plate, association, or UID"
              className="min-h-12 w-full rounded-2xl border border-slate-200 pl-11 pr-4 text-sm font-semibold outline-none focus:border-teal-600"
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            {FILTERS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
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
          ) : !visible.length ? (
            <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-8 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-700" />
              <h2 className="mt-4 text-xl font-black">No matching driver applications</h2>
            </div>
          ) : (
            visible.map((application) => {
              const availableAssociations = activeAssociations(application);
              const selectedAssociationId = associationValue(application);
              const availableVehicles = dispatchReadyVehicles(
                application,
                selectedAssociationId,
              );
              const selectedVehicleId = vehicleValue(
                application,
                selectedAssociationId,
              );
              const approved = application.status === "approved";

              return (
                <article
                  key={application.id}
                  className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[.14em] text-teal-700">
                        {humanize(application.status)} · {application.island.toUpperCase()}
                      </p>
                      <h2 className="mt-2 text-2xl font-black tracking-[-.04em]">
                        {application.displayName || "Unnamed driver"}
                      </h2>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {application.email} · {application.phone}
                      </p>
                      <p className="mt-1 break-all font-mono text-[10px] font-bold text-slate-400">
                        UID {application.id}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[#f7f2e7] px-4 py-3 text-right">
                      <p className="text-[8px] font-black uppercase tracking-[.14em] text-slate-400">
                        Driver economics
                      </p>
                      <p className="mt-1 text-sm font-black">$0 signup · 15% / 85%</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <Detail label="Commission badge" value={application.taxiCommissionBadgeNumber} />
                    <Detail label="Badge expires" value={dateLabel(application.taxiCommissionBadgeExpiresAt)} />
                    <Detail label="License" value={`${application.licenseClass} · ${dateLabel(application.licenseExpiresAt)}`} />
                    <Detail label="Submitted taxi plate" value={application.taxiPlate} />
                  </div>

                  <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-600">
                    <p><strong>Requested association:</strong> {application.associationName}</p>
                    <p className="mt-1"><strong>Vehicle:</strong> {application.vehicleDescription}</p>
                  </div>

                  {!approved ? (
                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                      <div>
                        <label className="block">
                          <span className="text-[9px] font-black uppercase tracking-[.14em] text-slate-500">
                            Reviewed active association
                          </span>
                          <select
                            value={selectedAssociationId}
                            onChange={(event) =>
                              setChoice(application.id, {
                                associationId: event.target.value,
                                vehicleId: "",
                              })
                            }
                            className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-teal-600"
                          >
                            <option value="">Select association</option>
                            {availableAssociations.map((association) => (
                              <option key={association.id} value={association.id}>
                                {association.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="mt-3 block">
                          <span className="text-[9px] font-black uppercase tracking-[.14em] text-slate-500">
                            Matching dispatch-ready vehicle
                          </span>
                          <select
                            value={selectedVehicleId}
                            onChange={(event) =>
                              setChoice(application.id, {
                                vehicleId: event.target.value,
                              })
                            }
                            disabled={!selectedAssociationId}
                            className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-teal-600 disabled:bg-slate-50"
                          >
                            <option value="">Select matching taxi</option>
                            {availableVehicles.map((vehicle) => (
                              <option key={vehicle.id} value={vehicle.id}>
                                {vehicle.taxiPlate} · {[vehicle.make, vehicle.model, vehicle.color].filter(Boolean).join(" ")} · medallion {vehicle.medallionNumber}
                              </option>
                            ))}
                          </select>
                        </label>
                        {!availableVehicles.length && selectedAssociationId ? (
                          <p className="mt-2 text-xs font-bold leading-5 text-amber-700">
                            No dispatch-ready fleet vehicle in this association matches submitted plate {application.taxiPlate}. Verify or onboard the reviewed fleet record before approval.
                          </p>
                        ) : null}
                      </div>

                      <div>
                        <textarea
                          value={choices[application.id]?.reviewNote ?? application.reviewNote ?? ""}
                          onChange={(event) =>
                            setChoice(application.id, {
                              reviewNote: event.target.value,
                            })
                          }
                          maxLength={500}
                          rows={5}
                          placeholder="Compliance review note"
                          className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-semibold outline-none focus:border-teal-600"
                        />
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={workingId === application.id || !selectedVehicleId}
                            onClick={() => void review(application, "approve")}
                            className="min-h-11 rounded-full bg-[#043331] px-5 text-[9px] font-black uppercase tracking-[.12em] text-white disabled:opacity-40"
                          >
                            Approve & activate driver
                          </button>
                          <button
                            type="button"
                            disabled={workingId === application.id}
                            onClick={() => void review(application, "request_changes")}
                            className="min-h-11 rounded-full border border-amber-300 bg-amber-50 px-5 text-[9px] font-black uppercase tracking-[.12em] text-amber-800 disabled:opacity-40"
                          >
                            Request changes
                          </button>
                          <button
                            type="button"
                            disabled={workingId === application.id}
                            onClick={() => void review(application, "reject")}
                            className="min-h-11 rounded-full border border-rose-200 bg-rose-50 px-5 text-[9px] font-black uppercase tracking-[.12em] text-rose-700 disabled:opacity-40"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-900">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                      <p className="text-sm font-semibold leading-6">
                        Approved and linked to reviewed association/fleet records. The driver must sign in again to receive the new driver claim before opening Driver OS.
                      </p>
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-[#fbfcfb] p-4">
      <p className="text-[8px] font-black uppercase tracking-[.14em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black">{value || "—"}</p>
    </div>
  );
}

function Notice({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: React.ReactNode;
}) {
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

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function future(value: string | null, now: number) {
  return Boolean(value && Number.isFinite(Date.parse(value)) && Date.parse(value) > now);
}

function dateLabel(value: string | null) {
  if (!value) return "—";
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp)
    ? new Date(timestamp).toLocaleDateString()
    : value;
}

function humanize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
