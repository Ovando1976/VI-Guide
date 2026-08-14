import "server-only";

import { Timestamp } from "firebase-admin/firestore";

import { getAdminDb, hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";
import { calculateProviderReliability, type CustomerInsightEventName, type InsightValue } from "@/lib/customer-insights";

export type CustomerInsightRecord = {
  id: string;
  sessionId: string;
  name: CustomerInsightEventName;
  island: string;
  path: string;
  properties: Record<string, InsightValue>;
  createdAt: string;
};

export async function listCustomerInsights(limit = 500) {
  if (!hasFirebaseAdminConfiguration()) return [] as CustomerInsightRecord[];
  const snapshot = await getAdminDb().collection("customerInsightEvents")
    .orderBy("createdAt", "desc").limit(Math.max(1, Math.min(limit, 1000))).get();
  return snapshot.docs.map((document) => {
    const data = document.data();
    return {
      id: document.id,
      sessionId: String(data.sessionId ?? document.id),
      name: String(data.name) as CustomerInsightEventName,
      island: String(data.island ?? "all"),
      path: String(data.path ?? "/"),
      properties: (data.properties && typeof data.properties === "object" ? data.properties : {}) as Record<string, InsightValue>,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date(0).toISOString(),
    };
  });
}

export function summarizeCustomerInsights(records: CustomerInsightRecord[]) {
  const counts = new Map<string, number>();
  const unmet = new Map<string, number>();
  const issues = new Map<string, number>();
  const providers = new Map<string, { completed: number; confirmed: number; cancelledByProvider: number; priceAccurate: number; onTime: number; complaints: number; resolvedComplaints: number }>();
  for (const record of records) {
    counts.set(record.name, (counts.get(record.name) ?? 0) + 1);
    if (record.name === "search_no_results") {
      const query = String(record.properties.query ?? "Unknown request");
      unmet.set(query, (unmet.get(query) ?? 0) + 1);
    }
    if (record.name === "support_issue_reported") {
      const category = String(record.properties.category ?? "other");
      issues.set(category, (issues.get(category) ?? 0) + 1);
    }
    if (record.name === "trip_outcome_submitted") {
      const listingId = String(record.properties.listing_id ?? "");
      if (listingId) {
        const provider = providers.get(listingId) ?? { completed: 0, confirmed: 0, cancelledByProvider: 0, priceAccurate: 0, onTime: 0, complaints: 0, resolvedComplaints: 0 };
        provider.confirmed += 1;
        provider.completed += record.properties.delivered === true ? 1 : 0;
        provider.priceAccurate += record.properties.price_accurate === true ? 1 : 0;
        provider.onTime += record.properties.on_time === true ? 1 : 0;
        provider.complaints += record.properties.issue_category && record.properties.issue_category !== "none" ? 1 : 0;
        providers.set(listingId, provider);
      }
    }
  }
  return {
    total: records.length,
    sessions: new Set(records.map((record) => record.sessionId)).size,
    counts: Object.fromEntries(counts),
    unmet: [...unmet].sort((a, b) => b[1] - a[1]).slice(0, 12),
    issues: [...issues].sort((a, b) => b[1] - a[1]).slice(0, 12),
    providers: [...providers].map(([listingId, input]) => ({ listingId, outcomes: input.confirmed, score: calculateProviderReliability(input) })).sort((a, b) => b.outcomes - a.outcomes).slice(0, 12),
  };
}
