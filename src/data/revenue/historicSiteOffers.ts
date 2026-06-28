export type HistoricSiteOffer = {
  siteId: string;
  tourTitle: string;
  tourPrice: number;
  rideLeadFee: number;
  sponsorSlotPrice: number;
  bookingIntent: string;
  nearbyBusinessCategories: string[];
  suggestedUpsells: string[];
};

export const historicSiteOffers: Record<string, HistoricSiteOffer> = {
  "stt-fort-christian": {
    siteId: "stt-fort-christian",
    tourTitle: "Fort Christian Heritage Walk",
    tourPrice: 35,
    rideLeadFee: 5,
    sponsorSlotPrice: 99,
    bookingIntent: "book-tour",
    nearbyBusinessCategories: ["food", "shopping", "taxi", "tour-guide"],
    suggestedUpsells: [
      "Charlotte Amalie walking tour",
      "Historic photo package",
      "Taxi pickup",
      "Nearby lunch recommendation",
    ],
  },
};

export function getHistoricSiteOffer(siteId?: string | null) {
  if (!siteId) return null;
  return historicSiteOffers[siteId] ?? null;
}
