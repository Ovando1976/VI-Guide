import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, CarFront, ShieldCheck, WalletCards } from "lucide-react";

import { DriverApplicationForm } from "@/components/driver-application-form";
import { getSession } from "@/lib/auth-server";

export const metadata = {
  title: "Apply to Drive | USVI Explorer",
  description:
    "Apply to join USVI Explorer mobility with free signup, transparent 15% commission, and reviewed driver access.",
};

export default async function DriverApplyPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/driver/apply");
  if (session.role === "driver" || session.role === "admin") redirect("/driver");

  return (
    <main className="min-h-screen bg-[#f7f2e7] px-3 py-4 pb-24 text-[#043331] sm:px-5 sm:py-6 lg:py-8">
      <div className="mx-auto max-w-6xl">
        <section className="overflow-hidden rounded-[36px] bg-[radial-gradient(circle_at_top_right,rgba(245,196,81,.28),transparent_30%),linear-gradient(145deg,#032f2d,#0b6b64)] p-6 text-white shadow-[0_30px_90px_rgba(4,51,49,.24)] sm:p-9 lg:p-11">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#f5c451]/25 bg-black/15 px-3 py-2 text-[9px] font-black uppercase tracking-[.22em] text-[#f5c451] backdrop-blur">
                <CarFront className="h-4 w-4" /> Drive with USVI Explorer
              </div>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[.95] tracking-[-.055em] sm:text-6xl">
                Join for free. Keep 85% of each eligible ride.
              </h1>
              <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-white/[.72] sm:text-base">
                Submit your driver details from your existing USVI Explorer account. There is no signup or activation fee, and the platform commission is fixed at 15% per eligible completed ride.
              </p>
              <Link
                href="/"
                className="mt-7 inline-flex min-h-11 items-center rounded-full border border-white/20 bg-white/[.08] px-5 text-[10px] font-black uppercase tracking-[.16em] text-white transition hover:bg-white/[.14]"
              >
                Back to public guide
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <ValueCard icon={WalletCards} label="Signup" value="$0" detail="No signup or activation fee" />
              <ValueCard icon={BadgeCheck} label="Platform" value="15%" detail="Fixed commission per eligible ride" />
              <ValueCard icon={ShieldCheck} label="Driver share" value="85%" detail="Before disclosed processing or adjustments" />
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[.75fr_1.25fr]">
          <div className="rounded-[30px] border border-[#043331]/10 bg-white/80 p-6 shadow-[0_18px_48px_rgba(4,51,49,.08)]">
            <p className="text-[9px] font-black uppercase tracking-[.2em] text-amber-600">
              Safe onboarding
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-.04em]">
              Application first. Driver access after review.
            </h2>
            <div className="mt-5 space-y-4 text-sm font-semibold leading-6 text-slate-600">
              <p>
                Your application is tied to your signed-in account. We do not collect bank credentials or payout-account secrets in this form.
              </p>
              <p>
                Submitting does not grant Driver OS access. Taxi/for-hire credentials, vehicle and association records must be reviewed before a trusted operator provisions the driver role.
              </p>
              <p>
                Payment processing fees, refunds, disputes, and other adjustments remain separate from the 15% VI Guide commission and can affect the final payout timing or amount.
              </p>
            </div>
          </div>

          <DriverApplicationForm accountEmail={session.email ?? ""} accountName={session.name ?? ""} />
        </section>
      </div>
    </main>
  );
}

function ValueCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof WalletCards;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[.07] p-5 backdrop-blur">
      <Icon className="h-5 w-5 text-[#f5c451]" />
      <p className="mt-4 text-[9px] font-black uppercase tracking-[.15em] text-white/45">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-[-.03em]">{value}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-white/60">{detail}</p>
    </div>
  );
}
