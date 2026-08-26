import { redirect } from "next/navigation";

import { BusinessClaimBoard } from "@/components/admin/business-claim-board";
import { getSession } from "@/lib/auth-server";

export const metadata = {
  title: "Business Claims | USVI Explorer",
  description:
    "Verify business listing claims before granting listing-scoped merchant access.",
};

export default async function BusinessClaimsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin/business-claims");
  if (!["admin", "dispatcher"].includes(session.role)) {
    redirect("/unauthorized");
  }

  return <BusinessClaimBoard />;
}
