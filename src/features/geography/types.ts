export type GeographyIslandCode = "stt" | "stj" | "stx" | "wat" | "unk";
export type ParcelIslandCode = GeographyIslandCode;

export type ParcelRecord = {
  parcelId: string;
  sourceParcelId?: string | null;
  sourceParcelNo?: string | null;
  sourceParcelName?: string | null;
  estateName?: string | null;
  estateGeoid?: string | null;
  island: GeographyIslandCode;
  address?: string | null;
  plotNumber?: string | null;
  lotNumber?: string | null;
  blockNumber?: string | null;
  label: string;
  searchText: string;
  centroid: {
    lat: number | null;
    lng: number | null;
  };
  bbox: [number, number, number, number] | null;
  dpnrZone?: string | null;
  geometryType?: "Polygon" | "MultiPolygon" | null;
};

export type ParcelFeatureProperties = {
  parcelId: string;
  label: string;
  island: GeographyIslandCode;
  estateName: string | null;
  estateGeoid: string | null;
  address: string | null;
  sourceParcelNo: string | null;
  centroidLat?: number | null;
  centroidLng?: number | null;
};

export type SelectedParcel = {
  parcelId: string;
  label: string;
  estateName: string | null;
  estateGeoid: string | null;
  island: GeographyIslandCode;
  address: string | null;
  sourceParcelNo: string | null;
  centroid: { lat: number | null; lng: number | null };
} | null;
