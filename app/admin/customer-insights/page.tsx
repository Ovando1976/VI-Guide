import { redirect } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, SearchX, UsersRound } from "lucide-react";

import { getSession } from "@/lib/auth-server";
import { listCustomerInsights, summarizeCustomerInsights } from "@/lib/customer-insights-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CustomerInsightsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin/customer-insights");
  if (session.role !== "admin") redirect("/unauthorized");
  const records = await listCustomerInsights(750);
  const summary = summarizeCustomerInsights(records);

  return (
    <main className="min-h-screen bg-[#041b1a] px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(245,196,81,.18),transparent_35%),linear-gradient(145deg,#043331,#087069)] p-6 sm:p-8">
          <Link href="/admin" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-white/60"><ArrowLeft className="h-4 w-4" /> Admin home</Link>
          <p className="mt-6 text-[10px] font-black uppercase tracking-[.22em] text-[#f5c451]">Traveler Insight Loop</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-.055em] sm:text-6xl">Build what travelers actually need.</h1>
          <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-white/65">Consent-aware intent, unmet demand, real-world outcomes, and support issues. This view excludes precise location, contact information, payment details, and full conversations.</p>
        </header>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Events" value={summary.total} detail="bounded insight records" />
          <Metric label="Sessions" value={summary.sessions} detail="anonymous or signed-in" />
          <Metric label="Unmet searches" value={summary.counts.search_no_results ?? 0} detail="requests with no result" />
          <Metric label="Trip outcomes" value={summary.counts.trip_outcome_submitted ?? 0} detail="reality checks received" />
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <RankedPanel icon={SearchX} title="Unmet traveler demand" empty="No zero-result searches recorded yet." rows={summary.unmet} />
          <RankedPanel icon={AlertTriangle} title="Reported friction" empty="No support issues recorded yet." rows={summary.issues} />
        </div>

        <section className="mt-5 rounded-[28px] border border-white/10 bg-white/[.05] p-5">
          <h2 className="text-xl font-black">Provider reliability evidence</h2>
          <p className="mt-1 text-xs font-semibold text-white/45">Scores remain evidence-limited until enough completed outcomes are received.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {summary.providers.length ? summary.providers.map((provider) => <div key={provider.listingId} className="rounded-2xl bg-black/15 p-4"><p className="truncate text-sm font-black">{provider.listingId}</p><p className="mt-2 text-2xl font-black text-[#7ce0d4]">{provider.score}/100</p><p className="text-[10px] font-bold text-white/40">{provider.outcomes} traveler outcome{provider.outcomes === 1 ? "" : "s"}</p></div>) : <p className="text-sm font-semibold text-white/45">No provider outcomes recorded yet.</p>}
          </div>
        </section>

        <section className="mt-5 rounded-[28px] border border-white/10 bg-white/[.05] p-5">
          <div className="flex items-center gap-2"><UsersRound className="h-5 w-5 text-[#7ce0d4]" /><h2 className="text-xl font-black">Recent signals</h2></div>
          <div className="mt-4 divide-y divide-white/10">
            {records.slice(0, 30).map((record) => <div key={record.id} className="grid gap-2 py-3 text-xs sm:grid-cols-[180px_100px_1fr_auto]"><strong className="text-[#7ce0d4]">{record.name.replaceAll("_", " ")}</strong><span className="text-white/50">{record.island.toUpperCase()}</span><span className="truncate text-white/70">{signalSummary(record.properties)}</span><time className="text-white/40">{new Date(record.createdAt).toLocaleDateString("en-US", { timeZone: "America/St_Thomas" })}</time></div>)}
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value, detail }: { label: string; value: number; detail: string }) { return <div className="rounded-[24px] border border-white/10 bg-white/[.06] p-5"><p className="text-[9px] font-black uppercase tracking-[.16em] text-white/45">{label}</p><p className="mt-2 text-3xl font-black text-[#f5c451]">{value}</p><p className="mt-1 text-xs font-semibold text-white/50">{detail}</p></div>; }
function RankedPanel({ icon: Icon, title, empty, rows }: { icon: typeof SearchX; title: string; empty: string; rows: [string, number][] }) { return <section className="rounded-[28px] border border-white/10 bg-white/[.05] p-5"><div className="flex items-center gap-2"><Icon className="h-5 w-5 text-[#f5c451]" /><h2 className="text-xl font-black">{title}</h2></div>{rows.length ? <ol className="mt-4 space-y-2">{rows.map(([label, count]) => <li key={label} className="flex justify-between gap-4 rounded-xl bg-black/15 px-4 py-3 text-sm font-bold"><span>{label.replaceAll("_", " ")}</span><span className="text-[#7ce0d4]">{count}</span></li>)}</ol> : <p className="mt-4 text-sm font-semibold text-white/45">{empty}</p>}</section>; }
function signalSummary(properties: Record<string, string | number | boolean | null>) { return Object.entries(properties).slice(0, 4).map(([key, value]) => `${key.replaceAll("_", " ")}: ${String(value)}`).join(" · ") || "No additional properties"; }
