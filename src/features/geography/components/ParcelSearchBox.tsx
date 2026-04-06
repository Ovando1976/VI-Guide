import React from 'react';
import type { ParcelRecord } from '../types';

export function ParcelSearchBox({
  query,
  onQueryChange,
  results,
  onSelect,
}: {
  query: string;
  onQueryChange: (query: string) => void;
  results: ParcelRecord[];
  onSelect: (parcel: ParcelRecord) => void;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-3 space-y-2">
      <input
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search parcel ID, parcel #, estate, or address"
        className="w-full rounded-xl bg-stone-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-turquoise/30"
      />
      {query && (
        <div className="max-h-44 overflow-y-auto space-y-1">
          {results.map((parcel) => (
            <button
              key={parcel.parcelId}
              onClick={() => onSelect(parcel)}
              className="w-full text-left rounded-xl px-3 py-2 hover:bg-stone-50"
            >
              <p className="text-sm font-medium text-ink">{parcel.label}</p>
              <p className="text-[11px] text-stone-500">{parcel.estateName ?? 'Unknown estate'}</p>
            </button>
          ))}
          {results.length === 0 && (
            <p className="px-3 py-2 text-xs text-stone-500">No parcel matches yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
