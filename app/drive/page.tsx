import Link from "next/link";
import { ArrowRight, BadgeCheck, CarFront, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Drive with Us",
  description:
    "Apply free to drive with USVI Explorer. Verified taxi credentials and compliance approval are required before ride access is activated.",
};

const STEPS = [
  ["1", "Create your account", "Use your USVI Explorer account so the application stays tied to one verified identity."],
  ["2", "Submit taxi credentials", "Provide your current taxi badge or permit, driver license, taxi plate, vehicle, and operating association."],
  ["3", "Compliance review", "USVI Explorer verifies the applicant, active association, and dispatch-ready fleet record before driver access is granted."],
] as const;

export default function DrivePage() {
  return (
    <main className="min-h-screen bg-[#f7f2e7] px-4 py-7 text-[#043331] sm:px-6 lg:py-12">
      <div className="mx-auto max-w-5xl">
        <section className="overflow-hidden rounded-[38px] bg-[radial-gradient(circle_at_top_right,rgba(245,196,81,.3),transparent_30%),linear-gradient(145deg,#032f2d,#0b6b64)] p-7 text-white shadow-[0_30px_90px_rgba(4,51,49,.24)] sm:p-10 lg:p-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#f5c451]/25 bg-black/15 px-3 py-2 text-[9px] font-black uppercase tracking-[.2em] text-[#f5c451]">
            <CarFront className="h-4 w-4" /> Driver network
          </div>
          <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[.92] tracking-[-.055em] sm:text-7xl">
            Drive local. Join free. Keep 85%.
          </h1>
          <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-white/72 sm:text-base">
            Driver signup and activation cost $0. USVI Explorer keeps a fixed 15% platform commission on each eligible completed ride. Separately disclosed payment-processing fees or adjustments are not hidden inside that commission.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {[["Signup fee", "$0"], ["Platform commission", "15%"], ["Driver ride share", "85%"]].map(([label, value]) => (
              <div key={label} className="rounded-[22px] border border-white/10 bg-white/[.08] p-5 backdrop-blur">
                <p className="text-[8px] font-black uppercase tracking-[.16em] text-white/45">{label}</p>
                <p className="mt-2 text-3xl font-black text-[#f5c451]">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/login?next=/driver/apply"
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#f5c451] px-6 text-[10px] font-black uppercase tracking-[.16em] text-[#043331] shadow-lg transition hover:bg-[#ffcf64]"
            >
              Start free application <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-12 items-center rounded-full border border-white/20 bg-white/[.08] px-6 text-[10px] font-black uppercase tracking-[.16em] text-white transition hover:bg-white/[.14]"
            >
              Back to USVI Explorer
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {STEPS.map(([number, title, detail]) => (
            <article key={number} className="rounded-[28px] border border-[#043331]/10 bg-white p-6 shadow-[0_16px_44px_rgba(4,51,49,.07)]">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-[#043331] text-sm font-black text-[#f5c451]">{number}</div>
              <h2 className="mt-5 text-xl font-black tracking-[-.03em]">{title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{detail}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-[28px] border border-amber-200 bg-amber-50 p-6 sm:p-7">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" />
            <div>
              <h2 className="font-black text-amber-950">Application is not authorization to operate.</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-amber-900/80">
                Driver OS, ride assignment, and payouts remain locked until current taxi credentials, association linkage, and an eligible inspected and insured fleet vehicle are reviewed and approved. Settlement, refund, dispute, and payout-readiness checks still apply after activation.
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-[.14em] text-amber-900/75">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-2"><BadgeCheck className="h-3.5 w-3.5" /> Verified credentials</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-2"><BadgeCheck className="h-3.5 w-3.5" /> Active association</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-2"><BadgeCheck className="h-3.5 w-3.5" /> Dispatch-ready vehicle</span>
          </div>
        </section>
      </div>
    </main>
  );
}
