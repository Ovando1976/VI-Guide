import { redirect } from "next/navigation";

import { MerchantPayoutSetup } from "@/components/merchant/merchant-payout-setup";
import { getSession } from "@/lib/auth-server";

export const metadata = {
  title: "Merchant Payouts | USVI Explorer",
  description:
    "Connect and verify the Stripe account that receives USVI Explorer marketplace settlement.",
};

export default async function MerchantPayoutsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/merchant/payouts");
  if (session.role !== "merchant") redirect("/unauthorized");

  return <MerchantPayoutSetup listingCount={session.listingIds?.length ?? 0} />;
}
