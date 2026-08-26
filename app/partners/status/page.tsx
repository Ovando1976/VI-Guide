import { BadgeCheck } from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";
import { PartnerApplicationStatusTracker } from "@/components/partners/partner-application-status";

export const metadata = {
  title: "Business Request Status | USVI Explorer",
  description:
    "Privately check the review status of a USVI Explorer business claim or partner application using its reference and contact email.",
};

export default function PartnerApplicationStatusPage({
  searchParams,
}: {
  searchParams?: { reference?: string };
}) {
  return (
    <>
      <div className="bg-[#032f2d] px-4 pt-5 sm:px-7 lg:px-10">
        <ViPublicHeader
          actionHref="/partners/claim"
          actionLabel="Claim your business"
          actionIcon={BadgeCheck}
          secondaryHref="/partners"
          secondaryLabel="Business network"
        />
      </div>
      <PartnerApplicationStatusTracker
        initialReference={searchParams?.reference ?? ""}
      />
    </>
  );
}
