import { redirect } from "next/navigation";

import { DispatcherSettlementLedger } from "@/components/dispatcher-settlement-ledger";
import { PayoutLedger } from "@/components/payout-ledger";
import { getSession } from "@/lib/auth-server";

export default async function PayoutsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin/payouts");
  if (session.role !== "admin" && session.role !== "dispatcher") {
    redirect("/unauthorized");
  }

  return session.role === "admin" ? (
    <PayoutLedger />
  ) : (
    <DispatcherSettlementLedger />
  );
}
