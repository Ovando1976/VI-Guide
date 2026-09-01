"use client";

import { useEffect } from "react";

import { trackEvent } from "@/lib/analytics/tracking-client";

const OFFER_ID = "traveler-plus-annual";

export function TravelerPlusOfferTracker() {
  useEffect(() => {
    trackEvent(
      "offer_viewed",
      {
        offer_id: OFFER_ID,
        offer_type: "subscription",
        price_cents: 9900,
        billing_period: "annual",
      },
      { source: "traveler_plus_page" },
    );

    const checkout = new URLSearchParams(window.location.search).get("checkout");
    if (checkout === "success") {
      trackEvent(
        "purchase_return_viewed",
        {
          offer_id: OFFER_ID,
          checkout_result: "success",
        },
        { source: "traveler_plus_checkout_return" },
      );
    }
  }, []);

  return null;
}
