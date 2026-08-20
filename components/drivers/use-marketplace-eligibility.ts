"use client";

import { useEffect, useMemo, useState } from "react";

type MarketplaceEligibilityResponse = {
  eligibleBookingIds?: string[];
  candidateCount?: number;
  filteredCount?: number;
  readinessIssue?: string | null;
  error?: string;
};

export function useMarketplaceEligibility({
  driverId,
  availability,
  vehicleId,
  associationId,
  openBookingIds,
}: {
  driverId?: string | null;
  availability?: string | null;
  vehicleId?: string | null;
  associationId?: string | null;
  openBookingIds: string[];
}) {
  const [eligibleBookingIds, setEligibleBookingIds] = useState<Set<string>>(new Set());
  const [candidateCount, setCandidateCount] = useState(0);
  const [readinessIssue, setReadinessIssue] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const candidateKey = useMemo(() => [...openBookingIds].sort().join("|"), [openBookingIds]);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      if (!driverId) {
        setEligibleBookingIds(new Set());
        setCandidateCount(0);
        setReadinessIssue(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch("/api/drivers/marketplace", { cache: "no-store" });
        const payload = (await response.json().catch(() => null)) as MarketplaceEligibilityResponse | null;
        if (!response.ok) throw new Error(payload?.error || "Unable to load compatible ride requests.");
        if (cancelled) return;
        setEligibleBookingIds(new Set(payload?.eligibleBookingIds ?? []));
        setCandidateCount(payload?.candidateCount ?? 0);
        setReadinessIssue(payload?.readinessIssue ?? null);
      } catch (error) {
        if (cancelled) return;
        setEligibleBookingIds(new Set());
        setCandidateCount(0);
        setReadinessIssue(error instanceof Error ? error.message : "Unable to load compatible ride requests.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void refresh();
    const timer = window.setInterval(refresh, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [driverId, availability, vehicleId, associationId, candidateKey]);

  return { eligibleBookingIds, candidateCount, readinessIssue, loading };
}
