import Link from "next/link";

import { DriverRosterBoard } from "@/components/drivers-board";

export default function DriversPage() {
  return (
    <>
      <div className="bg-[#f7f2e7] px-4 pt-5 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-[#043331] shadow-sm">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[.14em] text-emerald-700">
              Business access
            </p>
            <p className="mt-1 text-sm font-bold">
              Assign merchant accounts to their authorized VI Guide listings.
            </p>
          </div>
          <Link
            href="/admin/merchants"
            className="inline-flex min-h-11 items-center rounded-xl bg-[#043331] px-5 text-[9px] font-black uppercase tracking-[.14em] text-white"
          >
            Manage merchants
          </Link>
        </div>
      </div>
      <DriverRosterBoard />
    </>
  );
}
