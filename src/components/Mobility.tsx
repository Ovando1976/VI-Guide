import type { IslandCode } from "../types";

type MobilityProps = {
  selectedIsland?: IslandCode;
  user?: unknown;
};

export default function Mobility(_props: MobilityProps) {
  return (
    <main className="min-h-screen bg-[#f8edcf] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-amber-900/20 bg-white shadow-xl">
        <div className="bg-slate-950 px-6 py-8 text-amber-50 sm:px-8">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-300">
            USVI Mobility
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
            Transportation system restored.
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-amber-50/75 sm:text-base">
            This safe version confirms that the Mobility route loads correctly.
            Next we will re-add the planner, fare engine, ferry connector, and
            trip request system one layer at a time.
          </p>
        </div>

        <div className="grid gap-5 p-6 sm:p-8 lg:grid-cols-3">
          <div className="rounded-3xl border border-stone-200 bg-amber-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-800">
              Step 1
            </p>
            <h2 className="mt-3 text-xl font-black">Plan a trip</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Airport, ferry, cruise, beach, town, estate, and parcel search.
            </p>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-amber-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-800">
              Step 2
            </p>
            <h2 className="mt-3 text-xl font-black">Compare routes</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Shared taxi, private transfer, ferry connector, VITRAN, and walk
              segments.
            </p>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-amber-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-800">
              Step 3
            </p>
            <h2 className="mt-3 text-xl font-black">Request service</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Save the trip request, then send it to Firebase dispatch and the
              driver dashboard.
            </p>
          </div>
        </div>

        <div className="border-t border-stone-200 bg-[#fff8e6] p-6 sm:p-8">
          <h2 className="text-2xl font-black">Test routes coming next</h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              "Cyril E. King Airport → Red Hook Ferry Terminal",
              "Cyril E. King Airport → Trunk Bay",
              "Havensight Cruise Pier → Magens Bay",
              "Henry E. Rohlsen Airport → Christiansted",
              "Christiansted → Frederiksted",
              "Cruz Bay Ferry Terminal → Trunk Bay",
            ].map((route) => (
              <div
                key={route}
                className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"
              >
                {route}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
