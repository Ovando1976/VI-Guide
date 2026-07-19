import type { GeographicDictionaryEntry } from "@/types/geographic";
import {
  buildSearchTokens,
  normalizeGeoText,
  slugifyGeoName,
  uniqueStrings,
} from "@/lib/geographic-normalize";

function entry(
  input: Omit<
    GeographicDictionaryEntry,
    | "id"
    | "slug"
    | "normalizedName"
    | "searchTokens"
    | "createdAt"
    | "updatedAt"
    | "rawText"
    | "parseConfidence"
    | "parseWarnings"
    | "needsReview"
  > &
    Partial<
      Pick<
        GeographicDictionaryEntry,
        "rawText" | "parseConfidence" | "parseWarnings" | "needsReview"
      >
    >
): GeographicDictionaryEntry {
  const now = new Date().toISOString();
  const slug = slugifyGeoName(input.canonicalName);

  const aliases = uniqueStrings(input.aliases);
  const linguisticEquivalents = uniqueStrings(input.linguisticEquivalents);
  const obsoleteNames = uniqueStrings(input.obsoleteNames);
  const variantSpellings = uniqueStrings(input.variantSpellings);

  return {
    ...input,
    rawText: input.rawText ?? input.description,
    parseConfidence: input.parseConfidence ?? 1,
    parseWarnings: input.parseWarnings ?? [],
    needsReview: input.needsReview ?? false,
    id: slug,
    slug,
    normalizedName: normalizeGeoText(input.canonicalName),
    aliases,
    linguisticEquivalents,
    obsoleteNames,
    variantSpellings,
    searchTokens: buildSearchTokens([
      input.canonicalName,
      input.shortDescription,
      input.description,
      input.quarter || "",
      ...aliases,
      ...linguisticEquivalents,
      ...obsoleteNames,
      ...variantSpellings,
    ]),
    createdAt: now,
    updatedAt: now,
  };
}

export const GEOGRAPHIC_DICTIONARY_SEED: GeographicDictionaryEntry[] = [
  entry({
    canonicalName: "Charlotte Amalie",
    featureType: "district",
    island: "STT",
    quarter: "Charlotte Amalie Quarter",
    aliases: [],
    linguisticEquivalents: [],
    obsoleteNames: [],
    variantSpellings: [],
    description:
      "Principal town and harbor district on St. Thomas; core urban, harbor, and administrative center.",
    shortDescription: "Historic harbor town and urban center on St. Thomas.",
    historicalNotes:
      "Important harbor and administrative center with deep connections to trade, shipping, and territorial governance.",
    scenicNotes:
      "Harbor-facing townscape with waterfront and hillside context.",
    nameOrigin: null,
    relatedEntryIds: [],
    relatedEstateGeoids: [],
    relatedPlaceIds: [],
    relatedHistoricSiteIds: [],
    source: {
      title: "Geographic Dictionary of the Virgin Islands of the United States",
      year: 1925,
    },
    featured: true,
  }),

  entry({
    canonicalName: "Cruz Bay",
    featureType: "harbor",
    island: "STJ",
    quarter: "Cruz Bay Quarter",
    aliases: ["Cruz Bay Town"],
    linguisticEquivalents: [],
    obsoleteNames: [],
    variantSpellings: [],
    description:
      "Primary bay, harbor, and town focus on St. John, used as a major arrival and circulation point.",
    shortDescription: "Main harbor and town focus on St. John.",
    historicalNotes:
      "Serves as one of the most important movement nodes on St. John.",
    scenicNotes: "Bay, harbor edge, ferry activity, and town movement.",
    nameOrigin: null,
    relatedEntryIds: [],
    relatedEstateGeoids: ["7802028950"],
    relatedPlaceIds: [],
    relatedHistoricSiteIds: [],
    source: {
      title: "Geographic Dictionary of the Virgin Islands of the United States",
      year: 1925,
    },
    featured: true,
  }),

  entry({
    canonicalName: "Christiansted",
    featureType: "district",
    island: "STX",
    quarter: "Company Quarter",
    aliases: [],
    linguisticEquivalents: [],
    obsoleteNames: ["Bassin"],
    variantSpellings: ["Christiansted Town"],
    description:
      "Historic town on St. Croix with major commercial, civic, and waterfront importance.",
    shortDescription: "Historic town and waterfront center on St. Croix.",
    historicalNotes:
      "Strong Danish colonial and waterfront significance; linked to important public buildings and harbor infrastructure.",
    scenicNotes: "Waterfront townscape with fort, wharf, and historic core.",
    nameOrigin: null,
    relatedEntryIds: [],
    relatedEstateGeoids: ["7801020000"],
    relatedPlaceIds: [],
    relatedHistoricSiteIds: [],
    source: {
      title: "Geographic Dictionary of the Virgin Islands of the United States",
      year: 1925,
    },
    featured: true,
  }),

  entry({
    canonicalName: "Fort Christian",
    featureType: "landmark",
    island: "STT",
    quarter: "Charlotte Amalie Quarter",
    aliases: [],
    linguisticEquivalents: [],
    obsoleteNames: [],
    variantSpellings: [],
    description:
      "Historic fort and landmark in Charlotte Amalie, strongly associated with the harbor and early colonial defense.",
    shortDescription: "Historic fort landmark in Charlotte Amalie.",
    historicalNotes:
      "Useful as a linked landmark for historic browsing and place identity.",
    scenicNotes: null,
    nameOrigin: null,
    relatedEntryIds: [],
    relatedEstateGeoids: [],
    relatedPlaceIds: [],
    relatedHistoricSiteIds: ["fort-christian"],
    source: {
      title: "Geographic Dictionary of the Virgin Islands of the United States",
      year: 1925,
    },
    featured: true,
  }),

  entry({
    canonicalName: "Blackbeard's Castle",
    featureType: "landmark",
    island: "STT",
    quarter: "Charlotte Amalie Quarter",
    aliases: ["Skytsborg"],
    linguisticEquivalents: [],
    obsoleteNames: [],
    variantSpellings: ["Blackbeards Castle"],
    description:
      "Historic tower and landmark above Charlotte Amalie with a strong visual and cultural association.",
    shortDescription: "Historic tower landmark above Charlotte Amalie.",
    historicalNotes: "Important for historic tourism and local identity.",
    scenicNotes: "Elevated vantage point over harbor and town.",
    nameOrigin: null,
    relatedEntryIds: [],
    relatedEstateGeoids: [],
    relatedPlaceIds: [],
    relatedHistoricSiteIds: ["blackbeards-castle-skytsborg"],
    source: {
      title: "Geographic Dictionary of the Virgin Islands of the United States",
      year: 1925,
    },
    featured: true,
  }),

  entry({
    canonicalName: "Annaberg",
    featureType: "estate",
    island: "STJ",
    quarter: "Maho Quarter",
    aliases: ["Annaberg Estate"],
    linguisticEquivalents: [],
    obsoleteNames: [],
    variantSpellings: [],
    description:
      "Historic estate name on St. John with plantation and ruin associations.",
    shortDescription:
      "Historic St. John estate associated with plantation ruins.",
    historicalNotes:
      "Strong historical and visitor interest because of estate and ruin associations.",
    scenicNotes: "North Shore scenic context.",
    nameOrigin: null,
    relatedEntryIds: [],
    relatedEstateGeoids: ["7802003520"],
    relatedPlaceIds: [],
    relatedHistoricSiteIds: ["annaberg-sugar-plantation"],
    source: {
      title: "Geographic Dictionary of the Virgin Islands of the United States",
      year: 1925,
    },
    featured: true,
  }),

  entry({
    canonicalName: "Cane Bay",
    featureType: "bay",
    island: "STX",
    quarter: null,
    aliases: [],
    linguisticEquivalents: [],
    obsoleteNames: [],
    variantSpellings: ["Canebay"],
    description:
      "Bay on St. Croix, distinct from compounded estate-style naming where spelling may collapse the generic term.",
    shortDescription: "North shore bay on St. Croix.",
    historicalNotes:
      "Useful example for distinguishing a bay from estate-style compounded forms.",
    scenicNotes: "Prominent recreational and coastal identity.",
    nameOrigin: null,
    relatedEntryIds: [],
    relatedEstateGeoids: [],
    relatedPlaceIds: [],
    relatedHistoricSiteIds: [],
    source: {
      title: "Geographic Dictionary of the Virgin Islands of the United States",
      year: 1925,
    },
    featured: true,
  }),

  entry({
    canonicalName: "Canebay",
    featureType: "estate",
    island: "STX",
    quarter: null,
    aliases: [],
    linguisticEquivalents: [],
    obsoleteNames: [],
    variantSpellings: ["Cane Bay Estate"],
    description:
      "Estate-style compounded form distinguished from Cane Bay the coastal feature.",
    shortDescription: "Estate-style geographic name on St. Croix.",
    historicalNotes:
      "Included to support alias resolution and disambiguation in search and mapping.",
    scenicNotes: null,
    nameOrigin: null,
    relatedEntryIds: ["cane-bay"],
    relatedEstateGeoids: [],
    relatedPlaceIds: [],
    relatedHistoricSiteIds: [],
    source: {
      title: "Geographic Dictionary of the Virgin Islands of the United States",
      year: 1925,
    },
    featured: false,
  }),

  entry({
    canonicalName: "Kings Quarter",
    featureType: "estate",
    island: "STT",
    quarter: null,
    aliases: [],
    linguisticEquivalents: [],
    obsoleteNames: [],
    variantSpellings: ["King's Quarter"],
    description:
      "Estate and neighborhood reference on St. Thomas, important to local routing and movement.",
    shortDescription: "Important St. Thomas estate and movement reference.",
    historicalNotes: "Useful for route building and local search.",
    scenicNotes: null,
    nameOrigin: null,
    relatedEntryIds: [],
    relatedEstateGeoids: ["7803050575"],
    relatedPlaceIds: [],
    relatedHistoricSiteIds: [],
    source: {
      title: "Geographic Dictionary of the Virgin Islands of the United States",
      year: 1925,
    },
    featured: true,
  }),

  entry({
    canonicalName: "Havensight",
    featureType: "district",
    island: "STT",
    quarter: null,
    aliases: ["Haven Sight"],
    linguisticEquivalents: [],
    obsoleteNames: [],
    variantSpellings: [],
    description:
      "Port and commercial movement area on St. Thomas, highly relevant to cruise and ride demand.",
    shortDescription: "Port and commercial district on St. Thomas.",
    historicalNotes: "Important movement node for the app’s dispatch logic.",
    scenicNotes: "Harbor and port edge context.",
    nameOrigin: null,
    relatedEntryIds: [],
    relatedEstateGeoids: ["7803047235"],
    relatedPlaceIds: [],
    relatedHistoricSiteIds: [],
    source: {
      title: "Geographic Dictionary of the Virgin Islands of the United States",
      year: 1925,
    },
    featured: true,
  }),
];
