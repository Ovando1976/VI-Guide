import { redirect } from "next/navigation";

import { MerchantAccessBoard } from "@/components/admin/merchant-access-board";
import { getSession } from "@/lib/auth-server";

export const metadata = {
  title: "Merchant Access | VI Guide",
  description:
    "Assign merchant accounts to the exact VI Guide listings they are authorized to operate.",
};

export default async function MerchantAccessPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin/merchants");
  if (session.role !== "admin") redirect("/unauthorized");

  return <MerchantAccessBoard />;
}
