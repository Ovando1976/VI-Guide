"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import {
  ACQUISITION_STORAGE_KEY,
  attributionFromSearchParams,
  mergeAttribution,
  type AcquisitionAttribution,
} from "@/lib/acquisition";

function readStored(): AcquisitionAttribution | null {
  try {
    const raw = window.localStorage.getItem(ACQUISITION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AcquisitionAttribution) : null;
  } catch {
    return null;
  }
}

export function AcquisitionTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const incoming = attributionFromSearchParams(new URLSearchParams(searchParams.toString()), {
      landingPath: pathname,
      referrer: document.referrer,
    });
    const hasCampaignSignal = Boolean(
      incoming.source || incoming.medium || incoming.campaign || incoming.partnerId || incoming.placementId,
    );
    const previous = readStored();
    if (!previous && !hasCampaignSignal) return;

    const next = mergeAttribution(previous, incoming);
    try {
      window.localStorage.setItem(ACQUISITION_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Attribution must never block the traveler experience.
    }
  }, [pathname, searchParams]);

  return null;
}
