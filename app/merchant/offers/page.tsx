import { redirect } from "next/navigation";

import { MerchantOfferBoard } from "@/components/merchant/merchant-offer-board";
import { MerchantOfferDemandSummary } from "@/components/merchant/merchant-offer-demand-summary";
import { getSession } from "@/lib/auth-server";

export const metadata = {
  title: "Offers | USVI Explorer Merchant",
  description:
    "Create, publish, pause, archive, and measure listing-scoped USVI Explorer packages.",
};

export default async function MerchantOffersPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/merchant/offers");
  if (!["merchant", "dispatcher", "admin"].includes(session.role)) {
    redirect("/unauthorized");
  }

  return (
    <>
      <MerchantOfferDemandSummary />
      <MerchantOfferBoard
        role={session.role}
        listingIds={session.role === "merchant" ? session.listingIds ?? [] : []}
      />
    </>
  );
}
