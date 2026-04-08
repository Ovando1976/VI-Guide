import { useState } from 'react';
import type { ParcelRecord, SelectedParcel } from '../types';

export function useParcelSelection(initial: SelectedParcel = null) {
  const [selectedParcel, setSelectedParcel] = useState<SelectedParcel>(initial);

  const selectParcel = (parcel: ParcelRecord) => {
    setSelectedParcel({
      parcelId: parcel.parcelId,
      label: parcel.label,
      estateName: parcel.estateName ?? null,
      estateGeoid: parcel.estateGeoid ?? null,
      island: parcel.island,
      centroid: parcel.centroid,
      address: parcel.address ?? null,
      sourceParcelNo: parcel.sourceParcelNo ?? null,
    });
  };

  return {
    selectedParcel,
    setSelectedParcel,
    selectParcel,
  };
}
