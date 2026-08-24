import { BadgeDollarSign, ShieldCheck, WalletCards } from "lucide-react";

import {
  TAXI_DRIVER_SHARE_BPS,
  TAXI_DRIVER_SIGNUP_FEE_CENTS,
  TAXI_PLATFORM_COMMISSION_BPS,
} from "@/lib/taxi-commission-policy";

export function DriverEconomicsPolicy() {
  const platformPercent = TAXI_PLATFORM_COMMISSION_BPS / 100;
  const driverPercent = TAXI_DRIVER_SHARE_BPS / 100;

  return (
    <section className="rounded-[30px] border border-[#043331]/10 bg-white/80 p-5 shadow-[0_18px_48px_rgba(4,51,49,.08)] backdrop-blur sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[.2em] text-amber-600">
            Driver economics
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-[-.04em] text-[#043331]">
            Free to join. Keep {driverPercent}% of eligible rides.
          </h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#043331]/65">
            No signup fee. VI Guide applies a fixed {platformPercent}% platform
            commission to each eligible taxi ride. Payment-processing charges,
            refunds, disputes, and other adjustments are tracked separately and do
            not change the stated platform commission.
          </p>
        </div>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[9px] font-black uppercase tracking-[.15em] text-emerald-800">
          Signup ${TAXI_DRIVER_SIGNUP_FEE_CENTS / 100}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <EconomicsFact
          icon={BadgeDollarSign}
          label="Platform commission"
          value={`${platformPercent}% per eligible ride`}
        />
        <EconomicsFact
          icon={WalletCards}
          label="Driver ride share"
          value={`${driverPercent}% before separate adjustments`}
        />
        <EconomicsFact
          icon={ShieldCheck}
          label="Payout protection"
          value="Completion + payment review required"
        />
      </div>

      <p className="mt-4 rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-950">
        Completed ride earnings are calculated at trip completion and remain pending
        review until payment verification, refund/dispute checks, and payout
        readiness clear.
      </p>
    </section>
  );
}

function EconomicsFact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BadgeDollarSign;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[22px] border border-[#043331]/10 bg-[#f7f2e7] p-4">
      <Icon className="h-5 w-5 text-teal-700" />
      <p className="mt-3 text-[8px] font-black uppercase tracking-[.16em] text-[#043331]/45">
        {label}
      </p>
      <p className="mt-1 text-sm font-black leading-5 text-[#043331]">{value}</p>
    </div>
  );
}
