import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth-server";
import { resolveMerchantListingSelection } from "@/lib/merchant-portal";

export const metadata = {
  title: "Provider Operations | USVI Explorer",
  description:
    "Manage business availability, operating hours, capacity, and blackout periods in USVI Explorer.",
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
  const canonicalListingId = resolveMerchantListingSelection({
    requestedListingId,
    managedListingIds,
    restricted: session.role === "merchant",
  });

  const params = new URLSearchParams();
  if (canonicalListingId) params.set("listingId", canonicalListingId);

  redirect(
    `/merchant/availability${params.size ? `?${params.toString()}` : ""}`,
  );
}
