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
};

export type DirectoryRecordFilters = {
  island?: DirectoryIsland;
  category?: string;
  featured?: boolean;
};
