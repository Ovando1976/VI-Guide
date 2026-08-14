import { redirect } from "next/navigation";

import { ApprovedPartnerOnboarding } from "@/components/admin/approved-partner-onboarding";
import { MerchantAccessBoard } from "@/components/admin/merchant-access-board";
import { getSession } from "@/lib/auth-server";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import { normalizePartnerApplicationStatus } from "@/lib/partners/partner-application";

export const metadata = {
  title: "Merchant Access | USVI Explorer",
  description:
    "Assign merchant accounts to the exact USVI Explorer listings they are authorized to operate.",
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

  const email = normalizeEmail(firstValue(searchParams?.email));
  const listingId = firstValue(searchParams?.listingId).slice(0, 160);
  const approvedPartner = await findApprovedPartner(email, listingId);

  return (
    <>
      {approvedPartner ? (
        <ApprovedPartnerOnboarding
          applicationId={approvedPartner.applicationId}
          email={approvedPartner.email}
          listingId={approvedPartner.listingId}
          convertedAt={approvedPartner.convertedAt}
        />
      ) : null}
      <MerchantAccessBoard />
    </>
  );
}

async function findApprovedPartner(email: string, listingId: string) {
  if (!email || !listingId || !hasFirebaseAdminConfiguration()) return null;

  const snapshot = await getAdminDb()
    .collection("partnerApplications")
    .where("email", "==", email)
    .limit(20)
    .get();

  for (const document of snapshot.docs) {
    const data = document.data();
    if (normalizePartnerApplicationStatus(data.status) !== "approved") continue;

    const approvedListingId = clean(data.existingListingId, 160);
    if (approvedListingId !== listingId) continue;

    return {
      applicationId: document.id,
      email,
      listingId: approvedListingId,
      convertedAt: clean(data.merchantAccessGrantedAt, 50) || null,
    };
  }

  return null;
}

function normalizeEmail(value: string) {
  const email = value.toLowerCase().slice(0, 220);
  return /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(email) ? email : "";
}

function firstValue(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value ?? "").trim();
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
