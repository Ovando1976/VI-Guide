import { redirect } from "next/navigation";

import { MerchantRegistryBoard } from "@/components/admin/merchant-registry-board";
import { getSession } from "@/lib/auth-server";

export const metadata = {
  title: "Merchant Registry | USVI Explorer",
  description:
    "Operate the USVI Explorer business acquisition pipeline from discovery through verified revenue activity.",
};

export default async function MerchantRegistryPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin/merchant-registry");
  if (!["admin", "dispatcher"].includes(session.role)) {
    redirect("/unauthorized");
  }

  return <MerchantRegistryBoard />;
}
