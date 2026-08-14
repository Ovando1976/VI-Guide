import { BookingLifecycleBoard } from "@/components/merchant/booking-lifecycle-board";

export const metadata = {
  title: "Booking Lifecycle | USVI Explorer",
  description:
    "Manage deposits, payments, confirmations, and completed services for USVI Explorer bookings.",
};

export default function BookingLifecyclePage() {
  return <BookingLifecycleBoard />;
}
