import Link from "next/link";
import { ArrowRight, BadgeCheck, CarFront, ShieldCheck, WalletCards } from "lucide-react";

import { getSession } from "@/lib/auth-server";

export const metadata = {
  title: "Drive with USVI Explorer",
  description:
    "Apply to drive with free signup, a fixed 15% platform commission, and reviewed access to USVI Explorer Driver OS.",
};

export default async function DrivePage() {
  const session = await getSession();
  const destination =
    session?.role === "driver" || session?.role === "admin"
      ? "/driver"
      : session
        ? "/driver/apply"
        : "/login?next=/driver/apply";
  const cta =
    session?.role === "driver" || session?.role === "admin"
      ? "Open Driver OS"
      : session
        ? "Start free application"
        : "Create account & apply";

  return (
    <main className="min-h-screen bg-[#f7f2e7] px-3 py-4 pb-24 text-[#043331] sm:px-5 sm:py-6 lg:py-8">
      <div className="mx-auto max-w-6xl">
        <section className="overflow-hidden rounded-[38px] bg-[radial-gradient(circle_at_top_right,rgba(245,196,81,.3),transparent_32%),linear-gradient(145deg,#032f2d,#0b6b64)] p-6 text-white shadow-[0_30px_90px_rgba(4,51,49,.24)] sm:p-10 lg:p-12">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#f5c451]/25 bg-black/15 px-3 py-2 text-[9px] font-black uppercase tracking-[.22em] text-[#f5c451] backdrop-blur">
              <CarFront className="h-4 w-4" /> Driver network
            </div>
            <h1 className="mt-5 text-4xl font-black leading-[.94] tracking-[-.055em] sm:text-6xl lg:text-7xl">
              Drive the islands. Join for $0.
            </h1>
            <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-white/[.72] sm:text-base">
              USVI Explorer driver signup is free. The platform commission is fixed at 15% per eligible completed ride, so the driver ride share is 85% before separately disclosed processing fees or adjustments.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={destination}
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#f5c451] px-6 text-[10px] font-black uppercase tracking-[.16em] text-[#043331] shadow-lg transition hover:bg-[#ffcf64]"
              >
                {cta} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/"
                className="inline-flex min-h-12 items-center rounded-full border border-white/20 bg-white/[.08] px-6 text-[10px] font-black uppercase tracking-[.16em] text-white transition hover:bg-white/[.14]"
              >
                Explore the USVI
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <EconomicsCard icon={WalletCards} eyebrow="Signup fee" value="$0" detail="No driver signup or activation fee." />
          <EconomicsCard icon={BadgeCheck} eyebrow="VI Guide commission" value="15%" detail="Fixed platform commission on each eligible completed ride." />
          <EconomicsCard icon={ShieldCheck} eyebrow="Driver ride share" value="85%" detail="Before separately disclosed processing fees or adjustments." />
        </section>

        <section className="mt-6 rounded-[30px] border border-[#043331]/10 bg-white/80 p-6 shadow-[0_18px_48px_rgba(4,51,49,.08)] sm:p-8">
          <p className="text-[9px] font-black uppercase tracking-[.2em] text-amber-600">How access works</p>
          <h2 className="mt-2 text-2xl font-black tracking-[-.04em] sm:text-3xl">Free application. Verified operation.</h2>
          <div className="mt-5 grid gap-4 text-sm font-semibold leading-6 text-slate-600 md:grid-cols-3">
            <p><strong className="text-[#043331]">1. Create or use your account.</strong><br />Your application is bound to your signed-in USVI Explorer identity.</p>
            <p><strong className="text-[#043331]">2. Submit operating details.</strong><br />Provide the credential and vehicle information operations needs to review.</p>
            <p><strong className="text-[#043331]">3. Get verified.</strong><br />Submitting does not grant dispatch access. Driver OS is provisioned only after trusted compliance review.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

function EconomicsCard({
  icon: Icon,
  eyebrow,
  value,
  detail,
}: {
  icon: typeof WalletCards;
  eyebrow: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[28px] border border-[#043331]/10 bg-white/85 p-6 shadow-[0_16px_40px_rgba(4,51,49,.07)]">
      <Icon className="h-5 w-5 text-[#0f766e]" />
      <p className="mt-4 text-[9px] font-black uppercase tracking-[.16em] text-slate-400">{eyebrow}</p>
      <p className="mt-1 text-3xl font-black tracking-[-.04em]">{value}</p>
      <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{detail}</p>
    </div>
  );
}
