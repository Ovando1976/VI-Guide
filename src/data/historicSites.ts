import type { IslandCode } from "../types";

export type { IslandCode };

export type HistoricSite = {
  id: string;
  name: string;
  island?: IslandCode | string;
  type?: string;
  category?: string;
  description?: string;
  history?: string;
  significance?: string;
  estate?: string;
  estateId?: string;
  coordinates?: { lat: number; lng: number } | null;
  imageUrl?: string;
  coverImage?: string;
  thumbnailUrl?: string;
  sourceUrl?: string;
  source?: string;
  sources?: unknown[];
  relatedEstates?: string[];
  relatedArchives?: string[];
  relatedDictionaryEntries?: string[];
  tags?: string[];
};

export const historicSites: HistoricSite[] = [];
