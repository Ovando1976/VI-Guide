export type DirectoryIsland = "stt" | "stj" | "stx";
export type DirectoryDataset = "places" | "beaches";

export type DirectoryRecord = {
  id: string;
  slug: string;
  name: string;
  island: DirectoryIsland;
  category: string;
  description: string;
  heroImage: string;
  tags: readonly string[];
  featured: boolean;
  bestFor: readonly string[];
  address?: string;
  phone?: string;
  website?: string;
  hours: readonly string[];
  amenities: readonly string[];
  accessNotes: readonly string[];
  safetyNotes: readonly string[];
  fees?: string;
  parking?: string;
  accessibility?: string;
  sourceLabel?: string;
  sourceUrl?: string;
  sourceUrls: readonly string[];
  verifiedAt?: string;
};

export type DirectoryRecordFilters = {
  island?: DirectoryIsland;
  category?: string;
  featured?: boolean;
};
