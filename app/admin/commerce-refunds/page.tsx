import { CommerceRefundBoard } from "@/components/admin/commerce-refund-board";

export const metadata = {
  title: "Commerce Refunds | USVI Explorer",
  description:
    "Issue and reconcile full Stripe refunds for USVI Explorer commerce bookings.",
};

export default function CommerceRefundsPage() {
  return <CommerceRefundBoard />;
}
