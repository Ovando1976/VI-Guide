import { Search } from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";
import { PartnerApplicationForm } from "@/components/partners/partner-application-form";

export const metadata = {
  title: "Become a USVI Explorer Partner",
  description:
    "Apply to operate a USVI Explorer business listing, receive booking requests, and participate in concierge referrals across the U.S. Virgin Islands.",
};

export default function PartnerApplicationPage() {
  return (
    <>
      <div className="bg-[#032f2d] px-4 pt-5 sm:px-7 lg:px-10">
        <ViPublicHeader
          actionHref="/partners/status"
          actionLabel="Check status"
          actionIcon={Search}
          secondaryHref="/partners"
          secondaryLabel="Partner network"
        />
      </div>
      <PartnerApplicationForm />
    </>
  );
}
