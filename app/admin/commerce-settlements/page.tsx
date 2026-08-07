import { redirect } from "next/navigation";

import { CommerceSettlementBoard } from "@/components/admin/commerce-settlement-board";
import { getSession } from "@/lib/auth-server";

export const metadata = {
  title: "Marketplace Settlements | VI Guide",
  description:
    "Release and reverse Stripe Connect merchant settlements with VI Guide financial controls.",
};

export default async function CommerceSettlementsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin/commerce-settlements");
  if (session.role !== "admin") redirect("/unauthorized");

  return <CommerceSettlementBoard />;
}
