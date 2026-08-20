import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Map as MapIcon,
  ShieldCheck,
  Truck,
} from "lucide-react";

import { DriverConsole } from "@/components/driver-console";
import { UsviTaxiOperatingBoard } from "@/components/drivers/usvi-taxi-operating-board";
import { DriverComplianceReadiness } from "@/components/mobility/driver-compliance-readiness";
import { DriverLifecycleBanner } from "@/components/mobility/driver-lifecycle-banner";
import { DriverLocationPublisher } from "@/components/mobility/driver-location-publisher";
import { requireSession } from "@/lib/auth-server";

export const metadata = {
  title: "USVI Taxi Driver OS | USVI Explorer",
  description:
    "Run USVI taxi stand, airport, cruise, ferry, dispatch, regulated fare, location, and trip operations from one driver workspace.",
};

export default async function DriverPage() {
  const session = await requireSession(["driver", "admin"]);
  const driverId = session.driverId ?? session.uid;

  return (
    <div className="min-h-screen bg-[#f7f2e7] px-3 py-4 pb-32 text-[#043331] sm:px-5 sm:py-6 lg:py-8">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[36px] bg-[radial-gradient(circle_at_top_right,rgba(245,196,81,.3),transparent_32%),linear-gradient(145deg,#032f2d,#0b6b64)] p-6 text-white shadow-[0_30px_90px_rgba(4,51,49,.24)] sm:p-9 lg:p-11">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#f5c451]/25 bg-black/15 px-3 py-2 text-[9px] font-black uppercase tracking-[.22em] text-[#f5c451] backdrop-blur">
                <Activity className="h-4 w-4" /> USVI Taxi Driver OS
              </div>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[.95] tracking-[-.055em] sm:text-6xl">
                Run island taxi work from one operational cockpit.
              </h1>
              <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-white/[.68] sm:text-base">
                Work stands and queues, airport and cruise arrivals, ferry connections,
                private requests, regulated fares, rider verification, trip progress, and
                earnings from the same USVI mobility system.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/map"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#f5c451] px-5 text-[10px] font-black uppercase tracking-[.16em] text-[#043331] shadow-lg transition hover:bg-[#ffcf64]"
                >
                  <MapIcon className="h-4 w-4" /> Live island map
                </Link>
                <Link
                  href="/"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 bg-white/[.08] px-5 text-[10px] font-black uppercase tracking-[.16em] text-white transition hover:bg-white/[.14]"
                >
                  Public guide <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-[24px] border border-white/10 bg-white/[.07] p-5 backdrop-blur">
                <ShieldCheck className="h-5 w-5 text-[#f5c451]" />
                <p className="mt-4 text-[9px] font-black uppercase tracking-[.15em] text-white/45">
                  Driver access
                </p>
                <p className="mt-1 text-xl font-black tracking-[-.03em]">
                  {session.role === "admin" ? "Admin preview" : "Verified driver"}
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/[.07] p-5 backdrop-blur">
                <Truck className="h-5 w-5 text-[#f5c451]" />
                <p className="mt-4 text-[9px] font-black uppercase tracking-[.15em] text-white/45">
                  Taxi operations
                </p>
                <p className="mt-1 text-xl font-black tracking-[-.03em]">
                  Stand · dispatch · trip
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/[.07] p-5 backdrop-blur">
                <MapIcon className="h-5 w-5 text-[#f5c451]" />
                <p className="mt-4 text-[9px] font-black uppercase tracking-[.15em] text-white/45">
                  Governed territory
                </p>
                <p className="mt-1 text-xl font-black tracking-[-.03em]">
                  STT · STJ · STX
                </p>
              </div>
            </div>
          </div>
        </section>

        <UsviTaxiOperatingBoard />

        <section className="mt-6 rounded-[30px] border border-[#043331]/10 bg-white/70 p-4 shadow-[0_18px_48px_rgba(4,51,49,.08)] backdrop-blur sm:p-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[.2em] text-amber-600">
                Shift readiness
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-[-.04em]">
                Get legal, visible, and ready before taking a fare.
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {["Compliance", "Vehicle", "Location", "Trip lifecycle"].map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-[#043331]/10 bg-[#f7f2e7] px-3 py-2 text-[9px] font-black uppercase tracking-[.14em] text-[#043331]/65"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <DriverLifecycleBanner />
            <DriverComplianceReadiness driverId={driverId} />
            <DriverLocationPublisher driverId={driverId} />
          </div>
        </section>

        <section className="mt-7">
          <div className="mb-4 px-1">
            <p className="text-[9px] font-black uppercase tracking-[.2em] text-amber-600">
              Live taxi operations
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-[-.04em]">
              Paid requests, active fares, regulated pricing, positioning, wallet, and history.
            </h2>
          </div>
          <DriverConsole driverId={driverId} />
        </section>
      </div>
    </div>
  );
}
