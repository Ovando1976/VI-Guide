import { Loader2, Sparkles } from "lucide-react";

export default function ConciergeLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f3f7f5] px-5 text-slate-950">
      <section className="w-full max-w-xl rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-sm">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#073542] text-cyan-200">
          <Sparkles size={23} />
        </span>
        <h1 className="mt-5 text-2xl font-black tracking-[-0.03em]">
          Opening Concierge Discovery
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Preparing the live VI Guide catalog and your saved trip picks.
        </p>
        <Loader2 className="mx-auto mt-6 animate-spin text-teal-700" aria-hidden="true" />
        <span className="sr-only">Loading Concierge Discovery</span>
      </section>
    </main>
  );
}
