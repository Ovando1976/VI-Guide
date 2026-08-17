import { redirect } from "next/navigation";

import { summarizePhase1Funnel } from "@/lib/analytics/funnel";
import { getSession } from "@/lib/auth-server";
import { getAdminDb, hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Phase 1 Funnel | USVI Explorer",
  description:
    "Admin-only proof view for the Explore-to-payment funnel and Phase 1 business invariants.",
};

export default async function Phase1AnalyticsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin/analytics");
  if (session.role !== "admin") redirect("/unauthorized");

  if (!hasFirebaseAdminConfiguration()) {
    return (
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <Header />
        <GateBanner
          passed={false}
          text="Analytics is unavailable because Firebase Admin is not configured. The Phase 1 production gate remains blocked."
        />
      </main>
    );
  }

  const snapshot = await getAdminDb()
    .collection("viEvents")
    .orderBy("receivedAt", "desc")
    .limit(1000)
    .get();
  const summary = summarizePhase1Funnel(snapshot.docs.map((doc) => doc.data()));
  const gatePassed =
    summary.financial.clientOriginated === 0 &&
    summary.financial.unattributed === 0 &&
    summary.cruise.returnBufferMissing === 0 &&
    summary.cruise.returnBufferFailed === 0 &&
    summary.funnel.every((step) => step.count > 0);

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <Header />
      <GateBanner
        passed={gatePassed}
        text={
          gatePassed
            ? "Observed data satisfies the Phase 1 production invariants in this 1,000-event proof window."
            : "Phase 1 is not production-ready. One or more required funnel steps or invariants are still missing or failing."
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="Events inspected" value={summary.totalEvents} />
        <Metric label="Client financial events" value={summary.financial.clientOriginated} danger={summary.financial.clientOriginated > 0} />
        <Metric label="Unattributed financial events" value={summary.financial.unattributed} danger={summary.financial.unattributed > 0} />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700">Vertical slice</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-950">Explore → Concierge → Cruise Plan → Activity → Checkout → Payment</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-6">
          {summary.funnel.map((step, index) => (
            <div key={step.eventName} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-500">{index + 1}</div>
              <div className="mt-2 break-words text-sm font-semibold text-slate-900">{step.eventName}</div>
              <div className="mt-3 text-3xl font-bold text-slate-950">{step.count}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Money truth</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Metric label="Payments" value={summary.financial.paymentCompleted} compact />
            <Metric label="Commissions" value={summary.financial.commissionGenerated} compact />
            <Metric label="Refunds" value={summary.financial.refundCompleted} compact />
          </div>
          <p className="mt-5 text-sm leading-6 text-slate-600">
            Financial events are expected only from the server-side Stripe/ledger boundary and must carry both booking and provider attribution.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Cruise return buffer</p>
          <div className="mt-4 grid grid-cols-4 gap-3">
            <Metric label="Reported" value={summary.cruise.returnBufferReported} compact />
            <Metric label="Met" value={summary.cruise.returnBufferMet} compact />
            <Metric label="Failed" value={summary.cruise.returnBufferFailed} compact danger={summary.cruise.returnBufferFailed > 0} />
            <Metric label="Missing" value={summary.cruise.returnBufferMissing} compact danger={summary.cruise.returnBufferMissing > 0} />
          </div>
          <p className="mt-5 text-sm leading-6 text-slate-600">
            Cruise plan, activity, and checkout events must explicitly include <code className="rounded bg-slate-100 px-1.5 py-0.5">return_buffer_met: true</code>. A false or missing result blocks release.
          </p>
        </div>
      </section>
    </main>
  );
}

function Header() {
  return (
    <header>
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-700">USVI Explorer · Phase 1 proof</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">Business funnel release gate</h1>
      <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
        This page reports the same invariants enforced by CI. It is evidence for release readiness, not a substitute for the automated gate.
      </p>
    </header>
  );
}

function GateBanner({ passed, text }: { passed: boolean; text: string }) {
  return (
    <section className={`rounded-3xl border p-5 ${passed ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
      <div className={`text-xs font-bold uppercase tracking-[0.18em] ${passed ? "text-emerald-800" : "text-rose-800"}`}>
        {passed ? "Gate passing" : "Gate blocked"}
      </div>
      <p className={`mt-2 text-sm font-medium ${passed ? "text-emerald-950" : "text-rose-950"}`}>{text}</p>
    </section>
  );
}

function Metric({
  label,
  value,
  danger = false,
  compact = false,
}: {
  label: string;
  value: number;
  danger?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={`${compact ? "rounded-2xl bg-slate-50 p-3" : "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"}`}>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-2 text-3xl font-bold ${danger ? "text-rose-700" : "text-slate-950"}`}>{value}</div>
    </div>
  );
}
