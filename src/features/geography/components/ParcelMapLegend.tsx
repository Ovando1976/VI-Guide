import React from 'react';

export function ParcelMapLegend({ parcelVisible }: { parcelVisible: boolean }) {
  return (
    <div className="rounded-xl bg-white/90 backdrop-blur border border-stone-200 px-3 py-2 text-[11px] text-stone-600 space-y-1">
      <p className="font-semibold uppercase tracking-[0.2em] text-stone-400">Map mode</p>
      <p>Estate boundaries: <span className="font-semibold">Always on</span></p>
      <p>Parcels: <span className="font-semibold">{parcelVisible ? 'Visible (zoom/estate)' : 'Hidden (zoom in)'}</span></p>
    </div>
  );
}
