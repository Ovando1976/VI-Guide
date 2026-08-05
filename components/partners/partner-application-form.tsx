"use client";

import Link from "next/link";
import {
  BadgeCheck,
  Building2,
  CalendarCheck2,
  CheckCircle2,
  CreditCard,
  Loader2,
  MapPin,
  Send,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { useState, type FormEvent } from "react";

import {
  PARTNER_APPLICATION_CATEGORIES,
  PARTNER_APPLICATION_INTERESTS,
  PARTNER_APPLICATION_ISLANDS,
  humanizePartnerValue,
} from "@/lib/partners/partner-application";

export function PartnerApplicationForm() {
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
      contactName: data.get("contactName"),
      email: data.get("email"),
      phone: data.get("phone"),
      island: data.get("island"),
      category: data.get("category"),
      website: data.get("website"),
      existingListingId: data.get("existingListingId"),
      services: data.get("services"),
      goals: data.get("goals"),
      interests: data.getAll("interests"),
      referralSource: data.get("referralSource"),
      consent: data.get("consent") === "on",
      companyFax: data.get("companyFax"),
      formStartedAt: startedAt,
    };

    try {
      const response = await fetch("/api/partner-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const responsePayload = (await response.json().catch(() => null)) as
        | {
            reference?: string;
            duplicate?: boolean;
            error?: string;
          }
        | null;
      if (!response.ok || !responsePayload?.reference) {
        throw new Error(
          responsePayload?.error || "Unable to submit the application.",
        );
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
          : "Unable to submit the application.",
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
            Application received
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-5xl">
            Let’s build island business together.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-600">
            {result.duplicate
              ? "We found the application already submitted today and kept the original record."
              : "The VI Guide team will review the business, service details, and requested tools before merchant access is granted."}
          </p>
          <div className="mx-auto mt-7 max-w-md rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">
              Application reference
            </p>
            <p className="mt-2 break-all font-mono text-sm font-black text-[#043331]">
              {result.reference}
            </p>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex min-h-12 items-center rounded-full bg-[#043331] px-6 text-[9px] font-black uppercase tracking-[.14em] text-white"
            >
              Return to VI Guide
            </Link>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="inline-flex min-h-12 items-center rounded-full border border-slate-200 bg-white px-6 text-[9px] font-black uppercase tracking-[.14em] text-slate-600"
            >
              Submit another business
            </button>
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
                VI Guide partners
              </p>
              <h1 className="mt-4 max-w-4xl text-5xl font-black leading-[.92] tracking-[-.06em] sm:text-7xl">
                Turn local discovery into real customers.
              </h1>
              <p className="mt-6 max-w-2xl text-base font-semibold leading-8 text-white/65">
                Apply to operate your VI Guide listing, receive qualified booking
                requests, appear in concierge recommendations, and build a direct
                digital relationship with visitors and residents.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <HeroBenefit
                icon={MapPin}
                title="Territory visibility"
                text="Place the business inside VI Guide’s island discovery experience."
              />
              <HeroBenefit
                icon={CalendarCheck2}
                title="Booking operations"
                text="Review requests, collect deposits, confirm service, and manage availability."
              />
              <HeroBenefit
                icon={Sparkles}
                title="Concierge referrals"
                text="Become eligible for relevant customer recommendations and trip plans."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[.72fr_1.28fr] lg:items-start">
          <aside className="space-y-4 lg:sticky lg:top-6">
            <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
              <Building2 className="h-6 w-6 text-teal-700" />
              <h2 className="mt-5 text-2xl font-black tracking-[-.04em]">
                What happens next
              </h2>
              <ol className="mt-5 space-y-4">
                <ReviewStep number="01" text="We verify the business and service information." />
                <ReviewStep number="02" text="The team matches or creates the correct VI Guide listing." />
                <ReviewStep number="03" text="An approved Firebase account receives listing-scoped merchant access." />
                <ReviewStep number="04" text="The business configures availability and starts handling requests." />
              </ol>
            </div>
            <div className="rounded-[30px] border border-amber-200 bg-amber-50 p-6">
              <BadgeCheck className="h-6 w-6 text-amber-700" />
              <h3 className="mt-4 text-lg font-black">Access is reviewed</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-amber-950/65">
                Submission does not automatically create merchant privileges.
                VI Guide verifies ownership and assigns access only to approved
                listings.
              </p>
            </div>
          </aside>

          <form
            onSubmit={submit}
            className="rounded-[34px] border border-slate-200 bg-white p-5 shadow-xl sm:p-8"
          >
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-teal-50 text-teal-700">
                <UsersRound className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.14em] text-teal-700">
                  Business application
                </p>
                <h2 className="mt-1 text-3xl font-black tracking-[-.045em]">
                  Tell us what you offer
                </h2>
              </div>
            </div>

            {error ? (
              <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
                {error}
              </div>
            ) : null}

            <fieldset className="mt-8">
              <legend className="text-[10px] font-black uppercase tracking-[.16em] text-slate-400">
                Business identity
              </legend>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Business or organization name" required>
                  <input name="businessName" required maxLength={160} className={inputClass} />
                </Field>
                <Field label="Primary contact name" required>
                  <input name="contactName" required maxLength={120} autoComplete="name" className={inputClass} />
                </Field>
                <Field label="Contact email" required>
                  <input name="email" type="email" required maxLength={220} autoComplete="email" className={inputClass} />
                </Field>
                <Field label="Phone number">
                  <input name="phone" type="tel" maxLength={80} autoComplete="tel" placeholder="(340) 555-0199" className={inputClass} />
                </Field>
                <Field label="Primary island" required>
                  <select name="island" required defaultValue="" className={inputClass}>
                    <option value="" disabled>Choose an island</option>
                    {PARTNER_APPLICATION_ISLANDS.map((island) => (
                      <option key={island} value={island}>{humanizePartnerValue(island)}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Business category" required>
                  <select name="category" required defaultValue="" className={inputClass}>
                    <option value="" disabled>Choose a category</option>
                    {PARTNER_APPLICATION_CATEGORIES.map((category) => (
                      <option key={category} value={category}>{humanizePartnerValue(category)}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Website or social profile">
                  <input name="website" type="url" maxLength={500} placeholder="https://" className={inputClass} />
                </Field>
                <Field label="Existing VI Guide listing ID">
                  <input name="existingListingId" maxLength={160} placeholder="Optional" className={inputClass} />
                </Field>
              </div>
            </fieldset>

            <fieldset className="mt-9">
              <legend className="text-[10px] font-black uppercase tracking-[.16em] text-slate-400">
                Services and goals
              </legend>
              <div className="mt-4 space-y-4">
                <Field label="Describe the services, products, or experiences offered" required>
                  <textarea name="services" required minLength={20} maxLength={1400} rows={6} className={inputClass} />
                </Field>
                <Field label="What would make VI Guide valuable to the business?">
                  <textarea name="goals" maxLength={1200} rows={4} className={inputClass} />
                </Field>
              </div>
            </fieldset>

            <fieldset className="mt-9">
              <legend className="text-[10px] font-black uppercase tracking-[.16em] text-slate-400">
                Interested tools
              </legend>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Choose at least one.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {PARTNER_APPLICATION_INTERESTS.map((interest) => (
                  <label key={interest} className="flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold transition hover:border-teal-500">
                    <input name="interests" type="checkbox" value={interest} className="h-4 w-4 accent-teal-700" />
                    {humanizePartnerValue(interest)}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Field label="How did you hear about VI Guide?">
                <input name="referralSource" maxLength={120} className={inputClass} />
              </Field>
            </div>

            <div className="hidden" aria-hidden="true">
              <label>
                Company fax
                <input name="companyFax" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            <label className="mt-8 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold leading-6 text-slate-600">
              <input name="consent" type="checkbox" required className="mt-1 h-4 w-4 shrink-0 accent-teal-700" />
              <span>
                I am authorized to submit this information and agree that VI Guide
                may contact the business about verification, listing access, and
                partnership services. See the{" "}
                <Link href="/privacy" className="font-black text-teal-700 underline">privacy policy</Link>{" "}
                and{" "}
                <Link href="/terms" className="font-black text-teal-700 underline">terms</Link>.
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#043331] px-6 text-[10px] font-black uppercase tracking-[.16em] text-white shadow-lg disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              Submit partner application
            </button>
            <p className="mt-4 text-center text-xs font-semibold leading-5 text-slate-400">
              VI Guide does not charge a fee to review an application.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}

const inputClass =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#043331] outline-none transition placeholder:text-slate-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-[9px] font-black uppercase tracking-[.13em] text-slate-500">
      {label}{required ? " *" : ""}
      {children}
    </label>
  );
}

function HeroBenefit({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Sparkles;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[.07] p-5 backdrop-blur-sm">
      <Icon className="h-5 w-5 text-[#f5c451]" />
      <p className="mt-3 text-sm font-black">{title}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-white/55">{text}</p>
    </div>
  );
}

function ReviewStep({ number, text }: { number: string; text: string }) {
  return (
    <li className="flex gap-3">
      <span className="font-mono text-xs font-black text-teal-700">{number}</span>
      <p className="text-sm font-semibold leading-6 text-slate-600">{text}</p>
    </li>
  );
}
