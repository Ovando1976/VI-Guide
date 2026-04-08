import React from 'react';
import type { SelectedParcel } from '../types';

export function ParcelDetailCard({
  parcel,
  onClose,
  onUseAsDestination,
  onExploreNearby,
  onAskConcierge,
}: {
  parcel: SelectedParcel;
  onClose: () => void;
  onUseAsDestination?: (parcel: NonNullable<SelectedParcel>) => void;
  onExploreNearby?: (parcel: NonNullable<SelectedParcel>) => void;
  onAskConcierge?: (parcel: NonNullable<SelectedParcel>) => void;
}) {
  if (!parcel) return null;

  return (
    <div className="absolute bottom-4 left-4 z-20 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Parcel</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">{parcel.label}</h3>
          <p className="mt-1 text-sm text-slate-600">{parcel.estateName || "Unknown estate"}</p>
          {parcel.address ? <p className="mt-1 text-sm text-slate-500">{parcel.address}</p> : null}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          Close
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => onUseAsDestination?.(parcel)}
          className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Use in route
        </button>
        <button
          type="button"
          onClick={() => onExploreNearby?.(parcel)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Nearby
        </button>
        <button
          type="button"
          onClick={() => onAskConcierge?.(parcel)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Ask concierge
        </button>
      </div>
    </div>
  );
}
