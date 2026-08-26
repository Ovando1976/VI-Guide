"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { RideConfirmationLifecycle } from "@/components/mobility/ride-confirmation-lifecycle";

function verifiedReviewTarget() {
  const review = document.getElementById("trip-review");
  if (!review) return null;

  // The lifecycle describes what happens after a traveler can submit a
  // governed ride request. Keep it out of loading and fail-closed fare states.
  const hasVerifiedFare = review.textContent?.includes("Verified fare for this trip") ?? false;
  return hasVerifiedFare ? review : null;
}

export function RideConfirmationPortal() {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const syncTarget = () => {
      setTarget(verifiedReviewTarget());
    };

    syncTarget();
    const observer = new MutationObserver(syncTarget);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, []);

  if (!target) return null;

  return createPortal(<RideConfirmationLifecycle />, target);
}
