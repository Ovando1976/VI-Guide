import { MerchantOfferBookingSummary } from "@/components/merchant/merchant-offer-booking-summary";
import { MerchantReservationInbox } from "@/components/merchant/merchant-reservation-inbox";
import { MerchantShoreReservationSummary } from "@/components/merchant/merchant-shore-reservation-summary";

export const metadata = {
  title: "Merchant Reservations | USVI Explorer",
  description: "Review and manage traveler booking requests in USVI Explorer.",
};

export default function MerchantReservationsPage() {
  return (
    <>
      <MerchantShoreReservationSummary />
      <MerchantOfferBookingSummary />
      <MerchantReservationInbox />
    </>
  );
}
