import Link from "next/link";
import { redirect } from "next/navigation";

import { DriverApplicationReviewBoard } from "@/components/driver-application-review-board";
import { DispatcherTaxiOperationsBoard } from "@/components/dispatcher-taxi-operations-board";
import { TaxiOperationsBoard } from "@/components/taxi-operations-board";
import { getSession } from "@/lib/auth-server";

export default async function TaxiOperationsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin/taxi-operations");
  if (session.role !== "admin" && session.role !== "dispatcher") {
    redirect("/unauthorized");
  }

  if (session.role === "dispatcher") {
    return <DispatcherTaxiOperationsBoard />;
  }

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
      </div>
      <DriverApplicationReviewBoard />
      <TaxiOperationsBoard />
    </>
  );
}
