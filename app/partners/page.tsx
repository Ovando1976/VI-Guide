import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export const metadata = {
  title: "VI Guide Partners",
  description:
    "Apply to partner with VI Guide or privately check an existing business application.",
};

export default function PartnersPage() {
  return (
    <main className="min-h-screen bg-[#f7f2e7] px-4 py-8 text-[#043331] sm:px-6 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <section className="overflow-hidden rounded-[40px] bg-[radial-gradient(circle_at_top_right,rgba(245,196,81,.34),transparent_35%),linear-gradient(145deg,#032f2d,#0b6b64)] p-7 text-white shadow-2xl sm:p-10 lg:p-14">
          <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#f5c451]">
            VI Guide business network
          </p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black leading-[.92] tracking-[-.06em] sm:text-7xl">
            Grow with the Virgin Islands’ digital guide.
          </h1>
          <p className="mt-6 max-w-2xl text-base font-semibold leading-8 text-white/65">
            Join local discovery, concierge recommendations, booking requests,
            secure payments, and practical business operations built around the
            U.S. Virgin Islands.
          </p>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <PartnerAction
            icon={Building2}
            eyebrow="New application"
            title="Apply to partner with VI Guide"
            text="Tell us about the business, the island served, and the VI Guide tools that would create the most value."
            href="/partners/apply"
            label="Start application"
          />
          <PartnerAction
            icon={Search}
            eyebrow="Existing application"
            title="Check your review status"
            text="Use the application reference and contact email to privately see the current public review stage."
            href="/partners/status"
            label="Check status"
          />
        </section>

        <section className="mt-6 grid gap-3 rounded-[30px] border border-amber-200 bg-amber-50 p-6 sm:grid-cols-3">
          <TrustItem
            icon={ShieldCheck}
            title="Reviewed access"
            text="An application never creates merchant privileges automatically."
          />
          <TrustItem
            icon={Sparkles}
            title="Listing scoped"
            text="Approved accounts manage only the businesses assigned to them."
          />
          <TrustItem
            icon={Building2}
            title="Local operations"
            text="The workflow is designed for real USVI businesses and organizations."
          />
        </section>
      </div>
    </main>
  );
}

function PartnerAction({
  icon: Icon,
  eyebrow,
  title,
  text,
  href,
  label,
}: {
  icon: typeof Building2;
  eyebrow: string;
  title: string;
  text: string;
  href: string;
  label: string;
}) {
  return (
    <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700">
        <Icon className="h-6 w-6" />
      </span>
      <p className="mt-6 text-[9px] font-black uppercase tracking-[.14em] text-teal-700">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-3xl font-black tracking-[-.045em]">{title}</h2>
      <p className="mt-4 text-sm font-semibold leading-7 text-slate-600">
        {text}
      </p>
      <Link
        href={href}
        className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#043331] px-6 text-[9px] font-black uppercase tracking-[.14em] text-white"
      >
        {label} <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}

function TrustItem({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Building2;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[22px] bg-white/70 p-4">
      <Icon className="h-5 w-5 text-amber-700" />
      <p className="mt-3 text-sm font-black">{title}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-amber-950/60">
        {text}
      </p>
    </div>
  );
}
