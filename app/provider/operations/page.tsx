import { redirect } from "next/navigation";

import { ProviderOperationsBoard } from "@/components/provider/provider-operations-board";
import { getSession } from "@/lib/auth-server";
import { resolveMerchantListingSelection } from "@/lib/merchant-portal";

export const metadata = {
  title: "Provider Operations | VI Guide",
  description:
    "Manage business availability, operating hours, capacity, and blackout periods in VI Guide.",
};

type ProviderOperationsPageProps = {
  searchParams?: {
    listingId?: string | string[];
  };
};

export default async function ProviderOperationsPage({
  searchParams,
}: ProviderOperationsPageProps) {
  const session = await getSession();
  if (!session) redirect("/login?next=/provider/operations");
  if (!["merchant", "dispatcher", "admin"].includes(session.role)) {
    redirect("/unauthorized");
  }

  const managedListingIds =
    session.role === "merchant" ? session.listingIds ?? [] : [];
  const requestedListingId = Array.isArray(searchParams?.listingId)
    ? searchParams?.listingId[0]
    : searchParams?.listingId;
  const initialListingId = resolveMerchantListingSelection({
    requestedListingId,
    managedListingIds,
    restricted: session.role === "merchant",
  });

  return (
    <ProviderOperationsBoard
      initialListingId={initialListingId}
      managedListingIds={managedListingIds}
      restrictToManagedListings={session.role === "merchant"}
    />
  );
}
