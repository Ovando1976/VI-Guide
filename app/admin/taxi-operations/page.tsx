import Link from "next/link";

import { TaxiOperationsBoard } from "@/components/taxi-operations-board";

export default function TaxiOperationsPage() {
  return (
    <>
      <div className="mx-auto flex max-w-7xl justify-end px-5 pt-6">
        <Link
          href="/admin/tariffs"
          className="rounded-full bg-[#043331] px-5 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-sm"
        >
          Official tariff governance
        </Link>
      </div>
      <TaxiOperationsBoard />
    </>
  );
}
