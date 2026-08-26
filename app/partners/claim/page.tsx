import { Search } from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";
import { BusinessClaimForm } from "@/components/partners/business-claim-form";

export const metadata = {
  title: "Claim Your Business | USVI Explorer",
  description:
    "Claim and verify an existing USVI Explorer business listing before receiving listing-scoped merchant access.",
};

export default function BusinessClaimPage({
  searchParams,
}: {
  searchParams?: { listingId?: string; businessName?: string };
}) {
  return (
    <>
      <div className="bg-[#032f2d] px-4 pt-5 sm:px-7 lg:px-10">
        <ViPublicHeader
          actionHref="/partners/status"
          actionLabel="Check status"
          actionIcon={Search}
          secondaryHref="/partners"
          secondaryLabel="Business network"
        />
      </div>
      <BusinessClaimForm
        initialListingId={searchParams?.listingId ?? ""}
        initialBusinessName={searchParams?.businessName ?? ""}
      />
    </>
  );
}
