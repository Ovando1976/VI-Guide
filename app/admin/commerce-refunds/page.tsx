import { CommerceRefundBoard } from "@/components/admin/commerce-refund-board";

export const metadata = {
  title: "Commerce Refunds | VI Guide",
  description:
    "Issue and reconcile full Stripe refunds for VI Guide commerce bookings.",
};

export default function CommerceRefundsPage() {
  return <CommerceRefundBoard />;
}
