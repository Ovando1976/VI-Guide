import { redirect } from "next/navigation";

import { CommerceLedgerBoard } from "@/components/admin/commerce-ledger-board";
import { getSession } from "@/lib/auth-server";

export const metadata = {
  title: "Commerce Accounting | VI Guide",
  description:
    "Review Stripe-verified captures, refund reversals, platform fee reserves, and merchant settlement obligations.",
};

export default async function CommerceLedgerPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin/commerce-ledger");
  if (session.role !== "admin") redirect("/unauthorized");

  return <CommerceLedgerBoard />;
}
