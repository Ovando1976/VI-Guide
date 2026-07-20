import type { DirectoryItem } from "@/types/directory";

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
  reservationUrl?: string;
  sourceLabel?: string;
  sourceUrl?: string;
  verifiedAt?: string;
  operatingStatus?: DirectoryItem["operatingStatus"];
  verificationLevel?: DirectoryItem["verificationLevel"];
  hours: readonly string[];
  amenities: readonly string[];
  accessibility: readonly string[];
  aliases: readonly string[];
};

export type DirectoryRecordFilters = {
  island?: DirectoryIsland;
  category?: string;
  featured?: boolean;
};
