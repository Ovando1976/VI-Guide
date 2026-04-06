import React, { Suspense } from 'react';
import type { Coordinates } from "../../types";

const ClientMap = React.lazy(() => import("./LocationMapClient"));

export function LocationMap({
  coordinates,
  title,
}: {
  coordinates: Coordinates;
  title: string;
}) {
  return (
    <Suspense fallback={
      <div className="flex h-[320px] items-center justify-center rounded-3xl border border-stone-200 bg-stone-50 text-sm text-stone-400">
        Loading map...
      </div>
    }>
      <ClientMap coordinates={coordinates} title={title} />
    </Suspense>
  );
}
