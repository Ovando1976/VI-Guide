import Link from "next/link";

import { TaxiOperationsBoard } from "@/components/taxi-operations-board";

export default function TaxiOperationsPage() {
  return (
    <>
      <div className="mx-auto flex max-w-7xl flex-wrap justify-end gap-3 px-5 pt-6">
        <Link
          href="/admin/tariffs"
          className="rounded-full bg-[#043331] px-5 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-sm"
        >
          Official tariff governance
        </Link>
        <Link
          href="/admin/pilot-readiness"
          className="rounded-full bg-[#f5c451] px-5 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#5f3d00] shadow-sm"
        >
          Pilot readiness
        </Link>
        <Link
          href="/admin/payment-operations"
          className="rounded-full border border-[#043331]/15 bg-white px-5 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#043331] shadow-sm"
        >
          Payment operations
        </Link>
        <Link
          href="/admin/refund-operations"
          className="rounded-full border border-rose-200 bg-rose-50 px-5 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-rose-800 shadow-sm"
        >
          Refund operations
        </Link>
      </div>
      <TaxiOperationsBoard />
    </>
  );
}
