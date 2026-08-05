import { redirect } from "next/navigation";

import { ApprovedPartnerOnboarding } from "@/components/admin/approved-partner-onboarding";
import { MerchantAccessBoard } from "@/components/admin/merchant-access-board";
import { getSession } from "@/lib/auth-server";

export const metadata = {
  title: "Merchant Access | VI Guide",
  description:
    "Assign merchant accounts to the exact VI Guide listings they are authorized to operate.",
};

type MerchantAccessPageProps = {
  searchParams?: {
    email?: string | string[];
    listingId?: string | string[];
  };
};

export default async function MerchantAccessPage({
  searchParams,
}: MerchantAccessPageProps) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin/merchants");
  if (session.role !== "admin") redirect("/unauthorized");

  const email = firstValue(searchParams?.email).slice(0, 220);
  const listingId = firstValue(searchParams?.listingId).slice(0, 160);

  return (
    <>
      {email ? (
        <ApprovedPartnerOnboarding email={email} listingId={listingId} />
      ) : null}
      <MerchantAccessBoard />
    </>
  );
}

function firstValue(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value ?? "").trim();
}
