import { MerchantAccessBoard } from "@/components/admin/merchant-access-board";

export const metadata = {
  title: "Merchant Access | VI Guide",
  description:
    "Assign merchant accounts to the exact VI Guide listings they are authorized to operate.",
};

export default function MerchantAccessPage() {
  return <MerchantAccessBoard />;
}
