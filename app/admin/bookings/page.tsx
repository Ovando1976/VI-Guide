import { redirect } from "next/navigation";

import { CommerceBookingReview } from "@/components/admin/commerce-booking-review";
import { getSession } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Booking Review | USVI Explorer",
  description: "Authorized booking request review and status management.",
};

export default async function AdminBookingsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin/bookings");
  if (session.role !== "admin" && session.role !== "dispatcher") {
    redirect("/unauthorized");
  }

  return <CommerceBookingReview />;
}
