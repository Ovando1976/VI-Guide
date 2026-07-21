import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { DispatchLiveFleet } from "@/components/mobility/dispatch-live-fleet";
import { requireSession } from "@/lib/auth-server";

export default async function FleetPage() {
  await requireSession(["admin", "dispatcher"]);

  return (
    <main className="min-h-screen bg-[#f8f4ea] px-4 py-6 text-[#043331] sm:px-6 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin/dispatch"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-[9px] font-black uppercase tracking-[.15em] shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" /> Dispatch board
          </Link>
          <Link
            href="/driver"
            className="rounded-full bg-[#043331] px-5 py-3 text-[9px] font-black uppercase tracking-[.15em] text-white"
          >
            Driver console
          </Link>
        </div>
        <DispatchLiveFleet />
      </div>
    </main>
  );
}
