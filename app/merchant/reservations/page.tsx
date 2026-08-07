import { MerchantOfferBookingSummary } from "@/components/merchant/merchant-offer-booking-summary";
import { MerchantReservationInbox } from "@/components/merchant/merchant-reservation-inbox";
import { MerchantShoreReservationSummary } from "@/components/merchant/merchant-shore-reservation-summary";

export const metadata = {
  title: "Merchant Reservations | VI Guide",
  description: "Review and manage traveler booking requests in VI Guide.",
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
