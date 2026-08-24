"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";

type DriverApplicationStatus =
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected";

type DriverApplication = {
  status: DriverApplicationStatus;
  fullName: string;
  phone: string;
  island: string;
  credentialNumber: string;
  vehicleSummary: string;
  association: string;
  submittedAt: string;
  updatedAt: string;
};

const STATUS_COPY: Record<DriverApplicationStatus, { title: string; detail: string }> = {
  submitted: {
    title: "Application received",
    detail: "Your driver details are queued for credential and compliance review.",
  },
  under_review: {
    title: "Credentials under review",
    detail: "Operations is checking the records required before driver access can be provisioned.",
  },
  approved: {
    title: "Application approved",
    detail: "Compliance approval is complete. Driver OS access is activated separately through trusted role provisioning.",
  },
  rejected: {
    title: "Follow-up required",
    detail: "Update your application details and resubmit, or contact operations for the item that needs correction.",
  },
};

export function DriverApplicationForm({
  accountEmail,
  accountName,
}: {
  accountEmail: string;
  accountName: string;
}) {
  const [fullName, setFullName] = useState(accountName);
  const [phone, setPhone] = useState("");
  const [island, setIsland] = useState("st_thomas");
  const [credentialNumber, setCredentialNumber] = useState("");
  const [vehicleSummary, setVehicleSummary] = useState("");
  const [association, setAssociation] = useState("");
  const [acceptedEconomics, setAcceptedEconomics] = useState(false);
  const [acceptedCompliance, setAcceptedCompliance] = useState(false);
  const [application, setApplication] = useState<DriverApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/driver-applications", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error((await response.json()).error ?? "Unable to load application.");
        return response.json() as Promise<{ application: DriverApplication | null }>;
      })
      .then(({ application: existing }) => {
        if (!active || !existing) return;
        setApplication(existing);
        setFullName(existing.fullName || accountName);
        setPhone(existing.phone);
        setIsland(existing.island || "st_thomas");
        setCredentialNumber(existing.credentialNumber);
        setVehicleSummary(existing.vehicleSummary);
        setAssociation(existing.association);
      })
      .catch((caught) => {
        if (active) setError(caught instanceof Error ? caught.message : "Unable to load application.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [accountName]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setWorking(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/driver-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          island,
          credentialNumber,
          vehicleSummary,
          association,
          acceptedEconomics,
          acceptedCompliance,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        message?: string;
        status?: DriverApplicationStatus;
      };
      if (!response.ok) throw new Error(payload.error ?? "Unable to submit application.");
      setApplication((current) => ({
        status: payload.status ?? current?.status ?? "submitted",
        fullName,
        phone,
        island,
        credentialNumber,
        vehicleSummary,
        association,
        submittedAt: current?.submittedAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      setMessage(payload.message ?? "Your driver application was received.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to submit application.");
    } finally {
      setWorking(false);
    }
  }

  const statusCopy = application ? STATUS_COPY[application.status] : null;
  const approved = application?.status === "approved";

  return (
    <div className="rounded-[30px] border border-[#043331]/10 bg-white p-5 shadow-[0_18px_48px_rgba(4,51,49,.08)] sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[.2em] text-amber-600">Driver application</p>
          <h2 className="mt-1 text-2xl font-black tracking-[-.04em]">Tell us what operations should verify.</h2>
          <p className="mt-2 text-xs font-semibold text-slate-500">Account: {accountEmail || "Signed-in USVI Explorer user"}</p>
        </div>
        <span className="rounded-full bg-[#e8f5f1] px-3 py-2 text-[9px] font-black uppercase tracking-[.15em] text-[#0f766e]">Free signup</span>
      </div>

      {loading ? (
        <div className="mt-6 flex items-center gap-2 rounded-2xl bg-[#f7f2e7] p-4 text-sm font-bold text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your application…
        </div>
      ) : statusCopy ? (
        <div className="mt-6 rounded-[22px] border border-[#b9ddd6] bg-[#eff9f6] p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#0f766e]" />
            <div>
              <p className="text-sm font-black text-[#043331]">{statusCopy.title}</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-[#58706b]">{statusCopy.detail}</p>
            </div>
          </div>
        </div>
      ) : null}

      <form onSubmit={submit} className="mt-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <input required value={fullName} onChange={(event) => setFullName(event.target.value)} className={inputClass} autoComplete="name" />
          </Field>
          <Field label="Phone">
            <input required value={phone} onChange={(event) => setPhone(event.target.value)} className={inputClass} autoComplete="tel" inputMode="tel" />
          </Field>
          <Field label="Primary island">
            <select required value={island} onChange={(event) => setIsland(event.target.value)} className={inputClass}>
              <option value="st_thomas">St. Thomas</option>
              <option value="st_john">St. John</option>
              <option value="st_croix">St. Croix</option>
            </select>
          </Field>
          <Field label="Taxi / for-hire credential number">
            <input required value={credentialNumber} onChange={(event) => setCredentialNumber(event.target.value)} className={inputClass} placeholder="Credential or permit number" />
          </Field>
        </div>

        <Field label="Vehicle details">
          <input required value={vehicleSummary} onChange={(event) => setVehicleSummary(event.target.value)} className={inputClass} placeholder="Year, make, model, plate or fleet identifier" />
        </Field>
        <Field label="Taxi association or dispatch group (optional)">
          <input value={association} onChange={(event) => setAssociation(event.target.value)} className={inputClass} placeholder="Association or dispatch group" />
        </Field>

        <label className="flex items-start gap-3 rounded-2xl border border-[#d8e4e1] bg-[#fbfdfc] p-4">
          <input type="checkbox" required checked={acceptedEconomics} onChange={(event) => setAcceptedEconomics(event.target.checked)} className="mt-1 h-4 w-4" />
          <span className="text-xs font-semibold leading-5 text-slate-600">
            I understand driver signup costs $0, VI Guide charges a fixed 15% commission on each eligible completed ride, and the driver ride share is 85% before separately disclosed processing fees or adjustments.
          </span>
        </label>
        <label className="flex items-start gap-3 rounded-2xl border border-[#d8e4e1] bg-[#fbfdfc] p-4">
          <input type="checkbox" required checked={acceptedCompliance} onChange={(event) => setAcceptedCompliance(event.target.checked)} className="mt-1 h-4 w-4" />
          <span className="text-xs font-semibold leading-5 text-slate-600">
            I understand this submission is an application only. Driver access requires credential, vehicle, and operating-record review plus trusted role provisioning; this form does not activate dispatch access.
          </span>
        </label>

        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div> : null}
        {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{message}</div> : null}

        <button
          disabled={working || loading || approved}
          className="inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#043331] px-5 py-3 text-[10px] font-black uppercase tracking-[.17em] text-white shadow-[0_12px_30px_rgba(4,51,49,.16)] transition hover:bg-[#075e58] disabled:cursor-not-allowed disabled:opacity-55"
        >
          <ShieldCheck className="h-4 w-4 text-[#8ef0e7]" />
          {approved ? "Application approved" : working ? "Submitting…" : application ? "Update application" : "Submit free driver application"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-[9px] font-black uppercase tracking-[.15em] text-[#78908c]">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

const inputClass =
  "min-h-12 w-full rounded-2xl border border-[#d8e4e1] bg-white px-4 py-3 text-sm font-semibold outline-none transition placeholder:text-[#a7b4b1] focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10";
