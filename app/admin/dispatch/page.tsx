import Link from "next/link";
import { Radio, ShieldCheck } from "lucide-react";

import { DispatchBoard } from "@/components/dispatch-board";
import { DispatchHubRadar } from "@/components/dispatch-hub-radar";
import { requireSession } from "@/lib/auth-server";

export default async function DispatchPage() {
  await requireSession(["admin", "dispatcher"]);

  return (
    <main className="min-h-screen bg-[#f8f4ea] px-3 py-4 text-[#043331] sm:px-5 sm:py-6">
      <div className="mx-auto max-w-7xl">
        <section className="mb-5 rounded-[28px] border border-teal-900/10 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#edf6f2] text-teal-800">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <div className="text-[9px] font-black uppercase tracking-[.18em] text-teal-800">
                  Authorized mobility operations
                </div>
                <h1 className="mt-1 text-2xl font-black tracking-[-.04em]">
                  Dispatch control center
                </h1>
                <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                  Assign verified drivers, monitor ride progression, preserve association stand procedure, and move into live fleet intelligence without leaving operations.
                </p>
              </div>
            </div>
            <Link
              href="/admin/fleet"
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#043331] px-5 text-[9px] font-black uppercase tracking-[.15em] text-white shadow-lg"
            >
              <Radio className="h-4 w-4" /> Live fleet
            </Link>
          </div>
        </section>
        <DispatchHubRadar />
        <DispatchBoard />
      </div>
    </main>
  );
}
