"use client";

import { CheckCircle2, ShieldCheck, SteeringWheel } from "lucide-react";
import { useEffect, useState } from "react";

type ExistingApplication = {
  status?: "pending" | "changes_requested" | "approved" | "rejected";
  reviewNote?: string | null;
};

export function DriverApplicationForm({ email }: { email: string }) {
  const [application, setApplication] = useState<ExistingApplication | null>(null);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/drivers/applications", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (response.ok) setApplication(payload.application ?? null);
      })
      .catch(() => undefined);
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorking(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    const response = await fetch("/api/drivers/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, consent: form.get("consent") === "on" }),
    });
    const payload = await response.json();
    setWorking(false);
    if (!response.ok) {
      setMessage(payload.error ?? "Unable to submit application.");
      return;
    }
    setApplication(payload.application);
    setMessage("Application submitted for compliance review.");
  }

  const status = application?.status;
  return (
    <main className="min-h-screen bg-[#f7f2e7] px-4 py-8 text-[#043331]">
      <div className="mx-auto max-w-3xl">
        <section className="rounded-[34px] bg-[linear-gradient(145deg,#032f2d,#0b6b64)] p-7 text-white shadow-[0_28px_80px_rgba(4,51,49,.22)] sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-[.18em] text-[#f5c451]">
            <SteeringWheel className="h-4 w-4" /> Drive with USVI Explorer
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-[-.05em] sm:text-5xl">
            Apply free. Keep 85% of each eligible ride.
          </h1>
          <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/70">
            There is no signup or activation fee. VI Guide keeps a fixed 15% platform commission. Payment processing fees or adjustments, when applicable, are disclosed separately.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[["Signup", "$0"], ["Platform", "15%"], ["Driver share", "85%"]].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[.07] p-4">
                <p className="text-[8px] font-black uppercase tracking-[.16em] text-white/45">{label}</p>
                <p className="mt-1 text-2xl font-black text-[#f5c451]">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-[30px] border border-[#043331]/10 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-amber-900">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm font-semibold leading-6">
              Applying does not authorize taxi operation. Driver OS and payouts remain locked until USVI taxi credentials, association linkage, and an eligible fleet vehicle are verified and an administrator approves the application.
            </p>
          </div>

          {status ? (
            <div className="mt-5 rounded-2xl border border-[#d8e5e1] bg-[#f7fbfa] p-4">
              <p className="text-[9px] font-black uppercase tracking-[.16em] text-[#0f766e]">Application status</p>
              <p className="mt-1 text-lg font-black capitalize">{status.replace("_", " ")}</p>
              {application?.reviewNote ? <p className="mt-2 text-sm font-semibold text-slate-600">{application.reviewNote}</p> : null}
            </div>
          ) : null}

          <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
            <Field label="Legal name" name="displayName" required />
            <Field label="Account email" name="email" value={email} disabled />
            <Field label="Phone" name="phone" required />
            <label className="block">
              <span className="text-[9px] font-black uppercase tracking-[.14em] text-slate-500">Island</span>
              <select name="island" required className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 font-semibold">
                <option value="stt">St. Thomas</option><option value="stj">St. John</option><option value="stx">St. Croix</option>
              </select>
            </label>
            <Field label="Taxicab Commission badge / permit #" name="taxiCommissionBadgeNumber" required />
            <Field label="Badge / permit expiration" name="taxiCommissionBadgeExpiresAt" type="date" required />
            <Field label="Driver license class" name="licenseClass" required />
            <Field label="Driver license expiration" name="licenseExpiresAt" type="date" required />
            <Field label="Taxi plate" name="taxiPlate" required />
            <Field label="Taxi association / operating company" name="associationName" required />
            <label className="block sm:col-span-2">
              <span className="text-[9px] font-black uppercase tracking-[.14em] text-slate-500">Vehicle</span>
              <textarea name="vehicleDescription" minLength={6} required placeholder="Year, make, model, color" className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none focus:border-[#0f766e]" />
            </label>
            <label className="flex items-start gap-3 rounded-2xl bg-[#f7f2e7] p-4 sm:col-span-2">
              <input name="consent" type="checkbox" required className="mt-1" />
              <span className="text-sm font-semibold leading-6 text-slate-700">
                I certify that the information is accurate and agree to the $0 signup, fixed 15% platform commission, and 85% driver ride share before separately disclosed processing fees or adjustments.
              </span>
            </label>
            {message ? <p className="sm:col-span-2 text-sm font-bold text-[#0f766e]">{message}</p> : null}
            <button disabled={working || status === "approved"} className="sm:col-span-2 inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-[#043331] px-5 py-3 text-[10px] font-black uppercase tracking-[.16em] text-white disabled:opacity-50">
              <CheckCircle2 className="h-4 w-4 text-[#f5c451]" />
              {working ? "Submitting…" : status === "changes_requested" || status === "rejected" ? "Resubmit for review" : "Submit free driver application"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function Field({ label, name, type = "text", ...props }: { label: string; name: string; type?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-[9px] font-black uppercase tracking-[.14em] text-slate-500">{label}</span>
      <input name={name} type={type} {...props} className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 font-semibold outline-none focus:border-[#0f766e] disabled:bg-slate-50" />
    </label>
  );
}
