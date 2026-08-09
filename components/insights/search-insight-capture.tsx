"use client";

import { useEffect } from "react";
import { recordCustomerInsight } from "@/lib/customer-insights-client";

export function SearchInsightCapture({ query, count, kind, island }: { query: string; count: number; kind: string; island: string | null }) {
  useEffect(() => {
    if (!query) return;
    void recordCustomerInsight(count ? "search_completed" : "search_no_results", { query, result_count: count, kind }, { island: island === "stt" || island === "stj" || island === "stx" ? island : undefined });
  }, [count, island, kind, query]);
  return null;
}
