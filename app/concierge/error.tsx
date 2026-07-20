"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw, Sparkles } from "lucide-react";

export default function ConciergeError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f3f7f5] px-5 text-slate-950">
      <section className="w-full max-w-xl rounded-[32px] border border-amber-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-700">
          <AlertTriangle size={24} />
        </span>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-amber-700">
          Concierge temporarily unavailable
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.035em]">
          Your trip picks are still safe.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-600">
          VI Guide could not open the discovery workspace. Retry the page, or continue to the map while the service recovers.
        </p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#073542] px-5 py-3 text-sm font-extrabold text-white"
          >
            <RefreshCw size={16} /> Try again
          </button>
          <Link
            href="/map?concierge=open"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-800"
          >
            <Sparkles size={16} /> Open map Concierge
          </Link>
        </div>
      </section>
    </main>
  );
}
