import { redirect } from "next/navigation";

import { CommerceLedgerBoard } from "@/components/admin/commerce-ledger-board";
import { CommerceLedgerExportActions } from "@/components/admin/commerce-ledger-export-actions";
import { getSession } from "@/lib/auth-server";

export const metadata = {
  title: "Commerce Accounting | USVI Explorer",
  description:
    "Review Stripe-verified captures, refund reversals, platform fee reserves, and merchant settlement obligations.",
};

export default async function CommerceLedgerPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin/commerce-ledger");
  if (session.role !== "admin") redirect("/unauthorized");

  return (
    <>
      <CommerceLedgerExportActions />
      <CommerceLedgerBoard />
    </>
  );
}
