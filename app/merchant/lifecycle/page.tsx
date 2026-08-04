import { BookingLifecycleBoard } from "@/components/merchant/booking-lifecycle-board";

export const metadata = {
  title: "Booking Lifecycle | VI Guide",
  description:
    "Manage deposits, payments, confirmations, and completed services for VI Guide bookings.",
};

export default function BookingLifecyclePage() {
  return <BookingLifecycleBoard />;
}
