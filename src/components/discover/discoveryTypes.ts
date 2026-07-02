// src/components/discover/discoveryTypes.ts

import type { IslandCode } from "../../types";

export type IslandFilter = IslandCode | "all";

export type DiscoveryItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  displayCategory?: string;
  collectionName: string;
  islandCode: IslandCode | string;
  areaSlug?: string;
  coordinates?: { lat: number; lng: number };
  coverImage: string;
  gallery?: string[];
  featured?: boolean;
};