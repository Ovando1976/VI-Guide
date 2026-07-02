import estateSearchIndex from "./estate-search-index.json";

export type EstateRecord = {
  id?: string;
  geoid?: string;
  name?: string;
  estate?: string;
  island?: string;
  quarter?: string;
  quarterGroup?: string;
  centroid?: { lat?: number; lng?: number } | null;
  coordinates?: { lat?: number; lng?: number } | null;
  [key: string]: unknown;
};

export const estates = estateSearchIndex as EstateRecord[];
export default estates;
