import { redirect } from "next/navigation";

import { ProviderOperationsBoard } from "@/components/provider/provider-operations-board";
import { getSession } from "@/lib/auth-server";
import { isIsoCalendarDate } from "@/lib/booking/booking-dates";
import { resolveMerchantListingSelection } from "@/lib/merchant-portal";

export const metadata = {
  title: "Merchant Availability | VI Guide",
  description:
    "Manage operating days, hours, capacity, and blackout periods for assigned VI Guide businesses.",
};

type MerchantAvailabilityPageProps = {
  searchParams?: {
    listingId?: string | string[];
    date?: string | string[];
  };
};

export default async function MerchantAvailabilityPage({
  searchParams,
}: MerchantAvailabilityPageProps) {
  const session = await getSession();
  if (!session) redirect("/login?next=/merchant/availability");
  if (!["merchant", "dispatcher", "admin"].includes(session.role)) {
    redirect("/unauthorized");
  }

  const managedListingIds =
    session.role === "merchant" ? session.listingIds ?? [] : [];
  const rawListingId = searchParams?.listingId;
  const requestedListingId = Array.isArray(rawListingId)
    ? rawListingId[0]
    : rawListingId;
  const initialListingId = resolveMerchantListingSelection({
    requestedListingId,
    managedListingIds,
    restricted: session.role === "merchant",
  });

  const rawDate = searchParams?.date;
  const requestedDate = Array.isArray(rawDate) ? rawDate[0] : rawDate;
  const initialFocusDate =
    typeof requestedDate === "string" && isIsoCalendarDate(requestedDate)
      ? requestedDate
      : "";

  return (
    <ProviderOperationsBoard
      initialListingId={initialListingId}
      initialFocusDate={initialFocusDate}
      managedListingIds={managedListingIds}
      restrictToManagedListings={session.role === "merchant"}
    />
  );
}
