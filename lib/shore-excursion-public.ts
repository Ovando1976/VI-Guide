import "server-only";

import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import {
  resolveMerchantOfferForBooking,
  type MerchantOfferBookingSnapshot,
} from "@/lib/merchant-offer-booking";
import {
  normalizeShoreExcursionProfile,
  normalizeShoreExcursionStatus,
  type ShoreExcursionProfile,
} from "@/lib/shore-excursions";

export type PublicShoreExcursion = ShoreExcursionProfile & {
  offer: MerchantOfferBookingSnapshot;
};

export async function loadPublicShoreExcursions() {
  if (!hasFirebaseAdminConfiguration()) return [] as PublicShoreExcursion[];

  const db = getAdminDb();
  const snapshot = await db
    .collection("shoreExcursions")
    .where("status", "==", "active")
    .limit(100)
    .get();
  const excursions: PublicShoreExcursion[] = [];

  for (const document of snapshot.docs) {
    const profileData = document.data();
    if (normalizeShoreExcursionStatus(profileData.status) !== "active") continue;
    const offerDocument = await db.collection("merchantOffers").doc(document.id).get();
    const offerResolution = resolveMerchantOfferForBooking({
      offerId: document.id,
      record: offerDocument.exists ? offerDocument.data() ?? {} : null,
    });
    if (!offerResolution.ok) continue;
    const profileResolution = normalizeShoreExcursionProfile({
      profile: profileData,
      offer: offerResolution.snapshot,
    });
    if (!profileResolution.ok) continue;
    excursions.push({
      ...profileResolution.profile,
      offer: offerResolution.snapshot,
    });
  }

  return excursions.sort((left, right) => {
    const islandOrder = left.offer.island.localeCompare(right.offer.island);
    if (islandOrder !== 0) return islandOrder;
    return left.offer.offerTitle.localeCompare(right.offer.offerTitle);
  });
}

export async function loadPublicShoreExcursion(offerId: string) {
  const normalizedId = offerId.trim().slice(0, 160);
  if (!normalizedId || !hasFirebaseAdminConfiguration()) return null;

  const db = getAdminDb();
  const [profileDocument, offerDocument] = await Promise.all([
    db.collection("shoreExcursions").doc(normalizedId).get(),
    db.collection("merchantOffers").doc(normalizedId).get(),
  ]);
  if (!profileDocument.exists || !offerDocument.exists) return null;

  const profileData = profileDocument.data() ?? {};
  if (normalizeShoreExcursionStatus(profileData.status) !== "active") return null;
  const offerResolution = resolveMerchantOfferForBooking({
    offerId: normalizedId,
    record: offerDocument.data() ?? {},
  });
  if (!offerResolution.ok) return null;
  const profileResolution = normalizeShoreExcursionProfile({
    profile: profileData,
    offer: offerResolution.snapshot,
  });
  if (!profileResolution.ok) return null;

  return {
    ...profileResolution.profile,
    offer: offerResolution.snapshot,
  } satisfies PublicShoreExcursion;
}
