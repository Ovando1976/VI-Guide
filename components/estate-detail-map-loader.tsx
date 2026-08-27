"use client";

import dynamic from "next/dynamic";

import type { EstateRecord } from "@/types/usvi";

const EstateDetailMap = dynamic(
  () =>
    import("@/components/estate-detail-map").then(
      (module) => module.EstateDetailMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-[440px] animate-pulse rounded-[28px] border border-slate-200 bg-slate-100"
        role="status"
        aria-label="Loading estate map"
      />
    ),
  },
);

export function EstateDetailMapLoader({ estate }: { estate: EstateRecord }) {
  return <EstateDetailMap estate={estate} />;
}
