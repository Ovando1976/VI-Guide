import type { TravelKnowledgeRecord } from "@/lib/territory/adapters";
import type { DirectoryItem } from "@/types/directory";

import { getHistoricSites } from "./loader";
import type { HistoricSite } from "./types";

/**
 * Converts the immutable historic-domain model into the legacy directory model.
 *
 * Mutable arrays are intentionally created at this application boundary.
 */
export function historicSiteToDirectoryItem(
  site: HistoricSite
): DirectoryItem {
  return {
    id: site.id,
    slug: site.slug,
    name: site.name,
    island: site.island,
    category: site.category,
    description: site.description,
    heroImage: site.heroImage,
    images: [...site.images],
    tags: [...site.tags],
    featured: site.featured,
  };
}

/**
 * Returns historic sites in the format consumed by directory pages.
 */
export function getHistoricDirectoryItems(): DirectoryItem[] {
  return getHistoricSites().map(historicSiteToDirectoryItem);
}

/**
 * Converts the immutable historic-domain model into the legacy territory
 * knowledge record while preserving historic metadata for entity attributes.
 */
export function historicSiteToTravelKnowledgeRecord(
  site: HistoricSite
): TravelKnowledgeRecord {
  return {
    ...site,
    aliases: [...site.aliases],
    images: [...site.images],
    tags: [...site.tags],
    sourceImageIds: [...site.sourceImageIds],
    nrhpOtherNames: [...site.nrhpOtherNames],
    sourceUrls: [...site.sourceUrls],
  };
}

/**
 * Returns historic sites in the format consumed by the territory catalog.
 */
export function getHistoricTravelKnowledgeRecords(): TravelKnowledgeRecord[] {
  return getHistoricSites().map(historicSiteToTravelKnowledgeRecord);
}
