"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CarFront,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";

type DriverApplication = {
  id: string;
  status: string;
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
  reviewNote: string;
  submittedAt: string;
  updatedAt: string;
  driverId: string;
  vehicleId: string;
  associationId: string;
};

type TaxiAssociation = {
  id: string;
  name: string;
  status: string;
  islands: string[];
};

type FleetVehicle = {
  id: string;
  associationId: string;
  driverId: string;
  taxiPlate: string;
  medallionNumber: string;
  make: string;
  model: string;
  color: string;
  inspectionExpiresAt: string;
  insuranceExpiresAt: string;
  dispatchReady: boolean;
};

type QueuePayload = {
  applications: DriverApplication[];
  associations: TaxiAssociation[];
  vehicles: FleetVehicle[];
};

export function DriverApplicationReviewBoard() {
  const [data, setData] = useState<QueuePayload>({
    applications: [],
    associations: [],
    vehicles: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/driver-applications", {
        cache: "no-store",
      });
      const payload = (await response.json()) as QueuePayload & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load driver applications.");
      }
      setData(payload);
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

  const activeCount = useMemo(
    () =>
      data.applications.filter(
        (application) =>
          application.status === "pending" ||
          application.status === "changes_requested",
      ).length,
    [data.applications],
  );

  return (
    <section className="mx-auto max-w-7xl px-5 pt-8 text-[#043331]">
      <div className="overflow-hidden rounded-[30px] border border-[#0f766e]/15 bg-[#eff9f6] shadow-[0_18px_48px_rgba(4,51,49,.08)]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#0f766e]/10 p-6 sm:p-7">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-[#0f766e]">
              <BadgeCheck className="h-4 w-4" /> Driver application review
            </div>
            <h2 className="mt-2 text-3xl font-black tracking-[-.045em]">
              Compliance queue
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#58706b]">
              Applications are free and unprivileged. Approval grants Driver OS only after the submitted credentials are current and you link an active taxi association plus a dispatch-ready insured and inspected fleet vehicle.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#0f766e]/15 bg-white px-4 text-[10px] font-black uppercase tracking-[.16em] text-[#0f766e] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="grid gap-3 border-b border-[#0f766e]/10 bg-white/55 p-5 sm:grid-cols-3">
          <Metric label="Needs attention" value={activeCount} />
          <Metric label="Active associations" value={data.associations.length} />
          <Metric label="Dispatch-ready vehicles" value={data.vehicles.length} />
        </div>

        {error ? (
          <div className="m-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : null}

        {loading && !data.applications.length ? (
          <div className="flex items-center gap-2 p-7 text-sm font-bold text-[#58706b]">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading reviewed driver records…
          </div>
        ) : data.applications.length ? (
          <div className="grid gap-4 p-5 xl:grid-cols-2">
            {data.applications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                associations={data.associations}
                vehicles={data.vehicles}
                onUpdated={load}
              />
            ))}
          </div>
        ) : (
          <div className="p-7 text-sm font-semibold text-[#58706b]">
            No driver applications have been submitted yet.
          </div>
        )}
      </div>
    </section>
  );
}

function ApplicationCard({
  application,
  associations,
  vehicles,
  onUpdated,
}: {
  application: DriverApplication;
  associations: TaxiAssociation[];
  vehicles: FleetVehicle[];
  onUpdated: () => Promise<void>;
}) {
  const [associationId, setAssociationId] = useState(
    application.associationId || "",
  );
  const [vehicleId, setVehicleId] = useState(application.vehicleId || "");
  const [reviewNote, setReviewNote] = useState(application.reviewNote || "");
  const [working, setWorking] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const eligibleVehicles = vehicles.filter(
    (vehicle) =>
      (!associationId || vehicle.associationId === associationId) &&
      (!vehicle.driverId || vehicle.driverId === application.id),
  );
  const locked = application.status === "approved";

  async function review(action: "approve" | "request_changes" | "reject") {
    setWorking(action);
    setMessage(null);
    try {
      if (action === "approve" && (!associationId || !vehicleId)) {
        throw new Error(
          "Select the verified taxi association and dispatch-ready vehicle before approval.",
        );
      }
      const response = await fetch(
        `/api/admin/driver-applications/${encodeURIComponent(application.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            reviewNote,
            driverId: application.id,
            associationId,
            vehicleId,
          }),
        },
      );
      const payload = (await response.json()) as {
        error?: string;
        sessionRefreshRequired?: boolean;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to review driver application.");
      }
      setMessage(
        action === "approve"
          ? "Driver approved. The driver must sign out and back in before Driver OS access appears."
          : action === "request_changes"
            ? "Changes requested from the applicant."
            : "Application rejected.",
      );
      await onUpdated();
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : "Unable to review driver application.",
      );
    } finally {
      setWorking(null);
    }
  }

  return (
    <article className="rounded-[26px] border border-[#043331]/10 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CarFront className="h-5 w-5 text-[#0f766e]" />
            <h3 className="text-xl font-black">{application.displayName || "Driver applicant"}</h3>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {application.email || application.id} · {application.phone || "No phone"}
          </p>
        </div>
        <Status value={application.status} />
      </div>

      <dl className="mt-5 grid gap-3 rounded-2xl bg-[#f7f2e7] p-4 text-xs sm:grid-cols-2">
        <Fact label="Island" value={application.island.toUpperCase()} />
        <Fact label="Requested association" value={application.associationName} />
        <Fact
          label="Commission badge"
          value={`${application.taxiCommissionBadgeNumber} · expires ${application.taxiCommissionBadgeExpiresAt}`}
        />
        <Fact
          label="Driver license"
          value={`${application.licenseClass} · expires ${application.licenseExpiresAt}`}
        />
        <Fact label="Taxi plate" value={application.taxiPlate} />
        <Fact label="Vehicle" value={application.vehicleDescription} />
      </dl>

      {locked ? (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold leading-5 text-emerald-900">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          Approved and provisioned as driver {application.driverId || application.id}.
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-[9px] font-black uppercase tracking-[.14em] text-slate-500">
                Verified association
              </span>
              <select
                value={associationId}
                onChange={(event) => {
                  setAssociationId(event.target.value);
                  setVehicleId("");
                }}
                className={FIELD}
              >
                <option value="">Select association</option>
                {associations.map((association) => (
                  <option key={association.id} value={association.id}>
                    {association.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[9px] font-black uppercase tracking-[.14em] text-slate-500">
                Dispatch-ready fleet vehicle
              </span>
              <select
                value={vehicleId}
                onChange={(event) => setVehicleId(event.target.value)}
                className={FIELD}
              >
                <option value="">Select vehicle</option>
                {eligibleVehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.taxiPlate} · {vehicle.make} {vehicle.model} · medallion {vehicle.medallionNumber}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {!associations.length || !eligibleVehicles.length ? (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold leading-5 text-amber-950">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              Import or review the association and fleet record in the Reviewed onboarding section below before approving this application.
            </div>
          ) : null}

          <label className="mt-4 block">
            <span className="text-[9px] font-black uppercase tracking-[.14em] text-slate-500">
              Review note
            </span>
            <textarea
              value={reviewNote}
              onChange={(event) => setReviewNote(event.target.value)}
              rows={3}
              placeholder="Record the source checked or the correction needed."
              className={`${FIELD} resize-y`}
            />
          </label>

          {message ? (
            <div className="mt-4 rounded-2xl bg-slate-100 p-4 text-xs font-semibold leading-5 text-slate-700">
              {message}
            </div>
          ) : null}

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => void review("approve")}
              disabled={Boolean(working)}
              className="rounded-full bg-[#043331] px-4 py-3 text-[9px] font-black uppercase tracking-[.15em] text-white disabled:opacity-50"
            >
              {working === "approve" ? "Approving…" : "Approve driver"}
            </button>
            <button
              type="button"
              onClick={() => void review("request_changes")}
              disabled={Boolean(working)}
              className="rounded-full border border-amber-300 bg-amber-50 px-4 py-3 text-[9px] font-black uppercase tracking-[.15em] text-amber-900 disabled:opacity-50"
            >
              Request changes
            </button>
            <button
              type="button"
              onClick={() => void review("reject")}
              disabled={Boolean(working)}
              className="rounded-full border border-rose-200 bg-rose-50 px-4 py-3 text-[9px] font-black uppercase tracking-[.15em] text-rose-800 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </>
      )}
    </article>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#043331]/8 bg-white p-4">
      <div className="text-2xl font-black">{value}</div>
      <div className="mt-1 text-[9px] font-black uppercase tracking-[.15em] text-slate-400">
        {label}
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[9px] font-black uppercase tracking-[.12em] text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 font-bold text-[#043331]">{value || "Not supplied"}</dd>
    </div>
  );
}

function Status({ value }: { value: string }) {
  const style =
    value === "approved"
      ? "bg-emerald-100 text-emerald-800"
      : value === "rejected"
        ? "bg-rose-100 text-rose-800"
        : value === "changes_requested"
          ? "bg-amber-100 text-amber-900"
          : "bg-sky-100 text-sky-800";
  return (
    <span className={`rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-[.14em] ${style}`}>
      {value.replaceAll("_", " ")}
    </span>
  );
}

const FIELD =
  "mt-2 min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#043331] outline-none focus:border-[#0f766e]";
