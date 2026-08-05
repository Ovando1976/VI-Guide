import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CalendarCheck2,
  CircleDollarSign,
  Clock3,
  Settings2,
  ShieldCheck,
} from "lucide-react";

import { getSession } from "@/lib/auth-server";
import { humanizeListingId } from "@/lib/merchant-portal";

export const metadata = {
  title: "Merchant Operations | VI Guide",
  description:
    "Manage VI Guide reservations, availability, payments, and assigned businesses.",
};

export default async function MerchantHomePage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/merchant");
  if (!["merchant", "dispatcher", "admin"].includes(session.role)) {
    redirect("/unauthorized");
  }

  const merchantListingIds =
    session.role === "merchant" ? session.listingIds ?? [] : [];
  const firstListingId = merchantListingIds[0] ?? "";
  const availabilityHref = firstListingId
    ? `/provider/operations?listingId=${encodeURIComponent(firstListingId)}`
    : "/provider/operations";

  return (
    <main className="px-4 py-8 pb-32 sm:px-6 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[38px] bg-[radial-gradient(circle_at_top_right,rgba(245,196,81,.3),transparent_34%),linear-gradient(145deg,#032f2d,#0b6b64)] p-7 text-white shadow-[0_30px_90px_rgba(4,51,49,.2)] sm:p-10 lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[1.25fr_.75fr] lg:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#f5c451]">
                Business command center
              </p>
              <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[.95] tracking-[-.055em] sm:text-6xl">
                Run the booking day from one place.
              </h1>
              <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-white/65">
                Review traveler requests, secure deposits, confirm paid bookings,
                and keep each assigned business available for sale.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <HeroMetric
                icon={Building2}
                label="Business scope"
                value={
                  session.role === "merchant"
                    ? `${merchantListingIds.length} assigned`
                    : "Territory-wide"
                }
              />
              <HeroMetric
                icon={ShieldCheck}
                label="Access"
                value={
                  session.role === "merchant"
                    ? "Listing restricted"
                    : "Staff operations"
                }
              />
            </div>
          </div>
        </section>

        {session.role === "merchant" && !merchantListingIds.length ? (
          <section className="mt-6 rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-rose-900">
            <h2 className="text-xl font-black">No businesses are assigned yet</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-rose-800/75">
              Your merchant account is active, but it has no listing scope. An
              administrator must assign at least one VI Guide listing before you
              can view reservations or edit availability.
            </p>
          </section>
        ) : null}

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <ActionCard
            href="/merchant/reservations"
            icon={CalendarCheck2}
            eyebrow="Traveler demand"
            title="Reservation inbox"
            detail="Review new requests, propose timing, request a deposit, confirm paid bookings, and complete delivered services."
            action="Open reservations"
          />
          <ActionCard
            href={availabilityHref}
            icon={Clock3}
            eyebrow="Inventory control"
            title="Availability & capacity"
            detail="Set operating dates, hours, capacity, and blackout periods for the businesses you manage."
            action="Manage availability"
          />
          <ActionCard
            href="/merchant/lifecycle"
            icon={CircleDollarSign}
            eyebrow="Revenue operations"
            title="Payment lifecycle"
            detail="Follow deposits, Stripe verification, confirmations, completed services, cancellations, and refunds."
            action="Review payments"
          />
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
          <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-50 text-teal-700">
                <Building2 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">
                  Operating scope
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-[-.04em]">
                  {session.role === "merchant"
                    ? "Assigned businesses"
                    : "Territory operations"}
                </h2>
              </div>
            </div>

            {session.role === "merchant" ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {merchantListingIds.map((listingId) => (
                  <Link
                    key={listingId}
                    href={`/provider/operations?listingId=${encodeURIComponent(listingId)}`}
                    className="group rounded-[24px] border border-slate-200 bg-[#fbfaf6] p-5 transition hover:border-teal-300 hover:bg-teal-50"
                  >
                    <p className="text-[9px] font-black uppercase tracking-[.14em] text-teal-700">
                      Managed listing
                    </p>
                    <h3 className="mt-2 text-lg font-black tracking-[-.03em]">
                      {humanizeListingId(listingId)}
                    </h3>
                    <p className="mt-2 break-all font-mono text-[10px] font-bold text-slate-400">
                      {listingId}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.14em] text-[#043331]">
                      Open operations
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-[24px] border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-sm font-semibold leading-6 text-emerald-900/75">
                  Your staff role can review bookings and provider operations
                  across all VI Guide listings. Merchant account assignments stay
                  restricted to administrators.
                </p>
              </div>
            )}
          </article>

          <article className="rounded-[32px] bg-[#043331] p-6 text-white shadow-sm sm:p-8">
            <Settings2 className="h-6 w-6 text-[#f5c451]" />
            <p className="mt-6 text-[9px] font-black uppercase tracking-[.16em] text-[#f5c451]">
              Daily operating sequence
            </p>
            <ol className="mt-5 space-y-4">
              {[
                "Review new traveler requests.",
                "Confirm capacity and proposed timing.",
                "Request the correct Stripe deposit.",
                "Confirm only after verified payment.",
                "Complete delivered services and resolve exceptions.",
              ].map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-[10px] font-black text-[#f5c451]">
                    {index + 1}
                  </span>
                  <span className="pt-1 text-sm font-semibold leading-5 text-white/70">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
            {session.role === "admin" ? (
              <Link
                href="/admin/merchants"
                className="mt-7 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#f5c451] px-5 text-[9px] font-black uppercase tracking-[.14em] text-[#043331]"
              >
                Manage merchant access <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
          </article>
        </section>
      </div>
    </main>
  );
}

function HeroMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[.07] p-5">
      <Icon className="h-5 w-5 text-[#f5c451]" />
      <p className="mt-4 text-[9px] font-black uppercase tracking-[.15em] text-white/45">
        {label}
      </p>
      <p className="mt-1 text-xl font-black tracking-[-.03em]">{value}</p>
    </div>
  );
}

function ActionCard({
  href,
  icon: Icon,
  eyebrow,
  title,
  detail,
  action,
}: {
  href: string;
  icon: typeof Building2;
  eyebrow: string;
  title: string;
  detail: string;
  action: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-teal-300 hover:shadow-xl"
    >
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-6 text-[9px] font-black uppercase tracking-[.16em] text-teal-700">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-black tracking-[-.04em]">{title}</h2>
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
        {detail}
      </p>
      <span className="mt-6 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.14em]">
        {action}
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
