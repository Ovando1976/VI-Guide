"use client";

import Link from "next/link";
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  Loader2,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";

import {
  BUSINESS_CLAIM_ISLANDS,
  BUSINESS_CLAIM_ROLES,
  humanizeBusinessClaimValue,
} from "@/lib/partners/business-claim";

export function BusinessClaimForm({
  initialListingId = "",
  initialBusinessName = "",
}: {
  initialListingId?: string;
  initialBusinessName?: string;
}) {
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    reference: string;
    duplicate: boolean;
  } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      businessName: data.get("businessName"),
      existingListingId: data.get("existingListingId"),
      contactName: data.get("contactName"),
      email: data.get("email"),
      phone: data.get("phone"),
      island: data.get("island"),
      claimRole: data.get("claimRole"),
      website: data.get("website"),
      verificationNote: data.get("verificationNote"),
      consent: data.get("consent") === "on",
      companyFax: data.get("companyFax"),
      formStartedAt: startedAt,
    };

    try {
      const response = await fetch("/api/business-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const responsePayload = (await response.json().catch(() => null)) as
        | { reference?: string; duplicate?: boolean; error?: string }
        | null;
      if (!response.ok || !responsePayload?.reference) {
        throw new Error(responsePayload?.error || "Unable to submit the claim.");
      }

      setResult({
        reference: responsePayload.reference,
        duplicate: responsePayload.duplicate === true,
      });
      form.reset();
      setStartedAt(new Date().toISOString());
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to submit the business claim.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <main className="min-h-screen bg-[#f7f2e7] px-4 py-12 text-[#043331] sm:px-6">
        <div className="mx-auto max-w-3xl rounded-[38px] border border-emerald-200 bg-white p-7 text-center shadow-xl sm:p-12">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-[24px] bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <p className="mt-6 text-[10px] font-black uppercase tracking-[.18em] text-emerald-700">
            Claim received
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-5xl">
            We’ll verify the business before access changes.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-600">
            {result.duplicate
              ? "We found the same claim submitted today and kept the original record."
              : "USVI Explorer will match the business, verify your authority, and only then connect an approved account to the correct listing."}
          </p>
          <div className="mx-auto mt-7 max-w-md rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">
              Claim reference
            </p>
            <p className="mt-2 break-all font-mono text-sm font-black text-[#043331]">
              {result.reference}
            </p>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href={`/partners/status?reference=${encodeURIComponent(result.reference)}`}
              className="inline-flex min-h-12 items-center rounded-full bg-[#043331] px-6 text-[9px] font-black uppercase tracking-[.14em] text-white"
            >
              Check review status
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-12 items-center rounded-full border border-slate-200 bg-white px-6 text-[9px] font-black uppercase tracking-[.14em] text-slate-600"
            >
              Return to Explorer
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f2e7] text-[#043331]">
      <section className="px-4 pb-8 pt-6 sm:px-6 lg:pb-12 lg:pt-10">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[40px] bg-[radial-gradient(circle_at_top_right,rgba(245,196,81,.35),transparent_34%),linear-gradient(145deg,#032f2d,#0b6b64)] p-7 text-white shadow-2xl sm:p-10 lg:p-14">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#f5c451]">
                Claim your business
              </p>
              <h1 className="mt-4 max-w-4xl text-5xl font-black leading-[.92] tracking-[-.06em] sm:text-7xl">
                Your profile is the starting point, not paperwork.
              </h1>
              <p className="mt-6 max-w-2xl text-base font-semibold leading-8 text-white/65">
                Tell us who you are and which USVI business you represent. We verify ownership or authority before any listing control is granted. There is no upfront fee to verify a legitimate listing.
              </p>
            </div>
            <div className="space-y-3">
              <HeroBenefit icon={BadgeCheck} title="Existing profile first" text="Claim an existing USVI Explorer listing instead of rebuilding it from scratch." />
              <HeroBenefit icon={ShieldCheck} title="Human-reviewed access" text="A claim never grants merchant privileges automatically." />
              <HeroBenefit icon={Sparkles} title="Grow when ready" text="After verification, businesses can add booking, offers, and other merchant tools." />
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[.72fr_1.28fr] lg:items-start">
          <aside className="space-y-4 lg:sticky lg:top-6">
            <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
              <Building2 className="h-6 w-6 text-teal-700" />
              <h2 className="mt-5 text-2xl font-black tracking-[-.04em]">What happens next</h2>
              <ol className="mt-5 space-y-4">
                <ReviewStep number="01" text="We match the claim to the correct business listing." />
                <ReviewStep number="02" text="We verify that you are authorized to represent the business." />
                <ReviewStep number="03" text="Approved access is scoped only to the verified listing." />
                <ReviewStep number="04" text="You can then review the profile and activate merchant tools when useful." />
              </ol>
            </div>
            <div className="rounded-[30px] border border-amber-200 bg-amber-50 p-6">
              <ShieldCheck className="h-6 w-6 text-amber-700" />
              <h3 className="mt-4 text-lg font-black">Listed ≠ verified ≠ partner</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-amber-950/65">
                USVI Explorer keeps these states separate. A public listing does not imply endorsement or a commercial relationship.
              </p>
            </div>
          </aside>

          <form onSubmit={submit} className="rounded-[34px] border border-slate-200 bg-white p-5 shadow-xl sm:p-8">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-teal-50 text-teal-700">
                <BadgeCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.14em] text-teal-700">Business verification</p>
                <h2 className="mt-1 text-3xl font-black tracking-[-.045em]">Confirm the basics</h2>
              </div>
            </div>

            {error ? <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">{error}</div> : null}

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Field label="Business name" required>
                <input name="businessName" required maxLength={160} defaultValue={initialBusinessName} className={inputClass} />
              </Field>
              <Field label="USVI Explorer listing ID">
                <input name="existingListingId" maxLength={160} defaultValue={initialListingId} placeholder="Optional if you don't know it" className={inputClass} />
              </Field>
              <Field label="Your name" required>
                <input name="contactName" required maxLength={120} autoComplete="name" className={inputClass} />
              </Field>
              <Field label="Business email" required>
                <input name="email" type="email" required maxLength={220} autoComplete="email" className={inputClass} />
              </Field>
              <Field label="Phone">
                <input name="phone" type="tel" maxLength={80} autoComplete="tel" placeholder="(340) 555-0199" className={inputClass} />
              </Field>
              <Field label="Business island" required>
                <select name="island" required defaultValue="" className={inputClass}>
                  <option value="" disabled>Choose an island</option>
                  {BUSINESS_CLAIM_ISLANDS.map((island) => <option key={island} value={island}>{humanizeBusinessClaimValue(island)}</option>)}
                </select>
              </Field>
              <Field label="Your relationship to the business" required>
                <select name="claimRole" required defaultValue="" className={inputClass}>
                  <option value="" disabled>Choose your role</option>
                  {BUSINESS_CLAIM_ROLES.map((role) => <option key={role} value={role}>{humanizeBusinessClaimValue(role)}</option>)}
                </select>
              </Field>
              <Field label="Official website">
                <input name="website" type="url" maxLength={500} placeholder="https://" className={inputClass} />
              </Field>
            </div>

            <div className="mt-5">
              <Field label="Anything that will help us verify the claim?">
                <textarea name="verificationNote" maxLength={800} rows={4} placeholder="Optional: role, location, best callback time, or other verification context." className={inputClass} />
              </Field>
            </div>

            <div className="hidden" aria-hidden="true">
              <label>Company fax<input name="companyFax" tabIndex={-1} autoComplete="off" /></label>
            </div>

            <label className="mt-8 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold leading-6 text-slate-600">
              <input name="consent" type="checkbox" required className="mt-1 h-4 w-4 shrink-0 accent-teal-700" />
              <span>
                I am authorized to request control of this business listing and agree that USVI Explorer may contact the business to verify the claim. See the <Link href="/privacy" className="font-black text-teal-700 underline">privacy policy</Link> and <Link href="/terms" className="font-black text-teal-700 underline">terms</Link>.
              </span>
            </label>

            <button type="submit" disabled={submitting} className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#043331] px-6 text-[10px] font-black uppercase tracking-[.16em] text-white shadow-lg disabled:opacity-50">
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              Submit business claim
            </button>
            <p className="mt-4 text-center text-xs font-semibold leading-5 text-slate-400">Claim review does not automatically create merchant access or a commercial partnership.</p>
          </form>
        </div>
      </section>
    </main>
  );
}

const inputClass = "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#043331] outline-none transition placeholder:text-slate-400 focus:border-teal-600";

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return <label className="block text-sm font-black text-slate-700">{label}{required ? <span className="text-rose-600"> *</span> : null}{children}</label>;
}

function HeroBenefit({ icon: Icon, title, text }: { icon: typeof BadgeCheck; title: string; text: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[.07] p-4"><Icon className="h-5 w-5 text-[#73e3d9]" /><p className="mt-3 text-sm font-black">{title}</p><p className="mt-1 text-xs font-semibold leading-5 text-white/58">{text}</p></div>;
}

function ReviewStep({ number, text }: { number: string; text: string }) {
  return <li className="flex gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-teal-50 text-[10px] font-black text-teal-700">{number}</span><p className="pt-1 text-sm font-semibold leading-6 text-slate-600">{text}</p></li>;
}
