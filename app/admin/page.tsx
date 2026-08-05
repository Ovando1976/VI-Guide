import Link from "next/link";
import { CircleDollarSign, Store } from "lucide-react";

import { DriverRosterBoard } from "@/components/drivers-board";

export default function DriversPage() {
  return (
    <>
      <div className="bg-[#f7f2e7] px-4 pt-5 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-3 lg:grid-cols-2">
          <AdminAction
            href="/admin/merchants"
            icon={Store}
            eyebrow="Business access"
            title="Manage merchant accounts"
            detail="Assign merchant accounts to their authorized VI Guide listings."
            action="Manage merchants"
          />
          <AdminAction
            href="/admin/commerce-ledger"
            icon={CircleDollarSign}
            eyebrow="Financial operations"
            title="Review commerce accounting"
            detail="Inspect Stripe-verified captures, refund reversals, fee reserves, and merchant settlement obligations."
            action="Open accounting"
          />
        </div>
      </div>
      <DriverRosterBoard />
    </>
  );
}

function AdminAction({
  href,
  icon: Icon,
  eyebrow,
  title,
  detail,
  action,
}: {
  href: string;
  icon: typeof Store;
  eyebrow: string;
  title: string;
  detail: string;
  action: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-[#043331] shadow-sm">
      <div className="flex min-w-0 gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-emerald-700 shadow-sm">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[9px] font-black uppercase tracking-[.14em] text-emerald-700">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-lg font-black tracking-[-.025em]">{title}</h2>
          <p className="mt-1 max-w-xl text-sm font-semibold leading-5 text-emerald-950/65">
            {detail}
          </p>
        </div>
      </div>
      <Link
        href={href}
        className="inline-flex min-h-11 items-center rounded-xl bg-[#043331] px-5 text-[9px] font-black uppercase tracking-[.14em] text-white"
      >
        {action}
      </Link>
    </div>
  );
}
