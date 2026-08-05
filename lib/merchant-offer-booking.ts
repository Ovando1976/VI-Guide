import {
  merchantOfferPublicState,
  normalizeMerchantOffer,
  normalizeMerchantOfferId,
} from "@/lib/merchant-offers";

export type MerchantOfferBookingSnapshot = {
  offerId: string;
  offerTitle: string;
  offerPriceCents: number;
  offerCompareAtCents: number | null;
  offerDepositCents: number | null;
  listingId: string;
  listingName: string;
  kind: "accommodation" | "tour" | "experience";
  island: "stt" | "stj" | "stx";
  validFrom: string;
  validThrough: string;
};

export type MerchantOfferBookingResolution =
  | { ok: true; snapshot: MerchantOfferBookingSnapshot }
  | { ok: false; error: string; status: 400 | 404 | 409 };

export function resolveMerchantOfferForBooking(input: {
  offerId: unknown;
  record: Record<string, unknown> | null | undefined;
  now?: Date;
}): MerchantOfferBookingResolution {
  const offerId = normalizeMerchantOfferId(input.offerId);
  if (!offerId) {
    return { ok: false, error: "Choose a valid VI Guide offer.", status: 400 };
  }
  if (!input.record) {
    return { ok: false, error: "This VI Guide offer was not found.", status: 404 };
  }

  const now = input.now ?? new Date();
  const validation = normalizeMerchantOffer(input.record, now, {
    allowStarted: true,
  });
  if (!validation.ok) {
    return {
      ok: false,
      error: "This VI Guide offer is not currently bookable.",
      status: 409,
    };
  }
  if (
    merchantOfferPublicState(
      {
        status: input.record.status,
        validFrom: validation.offer.validFrom,
        validThrough: validation.offer.validThrough,
      },
      now,
    ) !== "live"
  ) {
    return {
      ok: false,
      error: "This VI Guide offer is not currently bookable.",
      status: 409,
    };
  }

  return {
    ok: true,
    snapshot: {
      offerId,
      offerTitle: validation.offer.title,
      offerPriceCents: validation.offer.priceCents,
      offerCompareAtCents: validation.offer.compareAtCents,
      offerDepositCents: validation.offer.depositCents,
      listingId: validation.offer.listingId,
      listingName: validation.offer.listingName,
      kind: validation.offer.kind,
      island: validation.offer.island,
      validFrom: validation.offer.validFrom,
      validThrough: validation.offer.validThrough,
    },
  };
}
