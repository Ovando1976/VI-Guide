"use client";

import { useEffect, useState } from "react";

type Check = { id: string; label: string; ready: boolean; detail: string };

export function LaunchReadiness() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/readiness", { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Readiness check failed.");
      setChecks(json.checks);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Readiness check failed.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);
  const ready = checks.length > 0 && checks.every((check) => check.ready);

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 text-[#043331]">
      <section className={`rounded-[32px] p-7 text-white ${ready ? "bg-emerald-800" : "bg-[#043331]"}`}>
        <div className="text-xs font-black uppercase tracking-[0.24em] text-amber-300">Production gate</div>
        <h1 className="mt-3 text-4xl font-black">{ready ? "Pilot launch ready" : "Launch requirements"}</h1>
        <p className="mt-3 text-sm font-semibold text-white/70">This page checks configuration and minimum operating supply. It does not replace regulatory signoff or partner agreements.</p>
        <button onClick={refresh} disabled={loading} className="mt-5 rounded-full bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#043331] disabled:opacity-60">{loading ? "Checking…" : "Run checks again"}</button>
      </section>
      {error ? <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 font-semibold text-rose-800">{error}</div> : null}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {checks.map((check) => (
          <div key={check.id} className={`rounded-[24px] border p-5 ${check.ready ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
            <div className="flex items-center justify-between gap-3"><div className="font-black">{check.label}</div><span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${check.ready ? "bg-emerald-200 text-emerald-900" : "bg-amber-200 text-amber-950"}`}>{check.ready ? "Ready" : "Required"}</span></div>
            <p className="mt-2 text-sm font-semibold text-slate-600">{check.detail}</p>
          </div>
        ))}
      </div>
    </main>
  );
}

