import React from 'react';
import type { SelectedParcel } from '../types';

export function ParcelDetailCard({
  parcel,
  onUseForRoute,
  onAskConcierge,
}: {
  parcel: SelectedParcel;
  onUseForRoute: (parcel: NonNullable<SelectedParcel>) => void;
  onAskConcierge: (parcel: NonNullable<SelectedParcel>) => void;
}) {
  if (!parcel) return null;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xl space-y-3">
      <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-stone-400">Parcel precision</p>
      <h3 className="text-lg font-semibold text-ink">{parcel.label}</h3>
      <p className="text-xs text-stone-500">{parcel.estateName ?? 'Unknown estate'} · {parcel.island.toUpperCase()}</p>
      {parcel.address && <p className="text-sm text-stone-600">{parcel.address}</p>}

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={() => onUseForRoute(parcel)}
          className="rounded-xl bg-ink text-white text-xs font-semibold py-2.5"
        >
          Use in route
        </button>
        <button
          onClick={() => onAskConcierge(parcel)}
          className="rounded-xl border border-stone-200 text-xs font-semibold py-2.5"
        >
          Ask concierge
        </button>
      </div>
    </div>
  );
}
