import type { IslandCode } from "../../types";

export type GeographicFeatureType =
  | "estate"
  | "town"
  | "place"
  | "beach"
  | "historicSite"
  | "business"
  | "parcel"
  | "dictionary"
  | "archive"
  | "unknown";

export type GeographicCanonicalOverride = {
  match: {
    name: string;
    island?: IslandCode;
    type?: string;
    source?: string;
  };
  canonicalName: string;
  displayName?: string;
  baseName?: string;
  featureType: GeographicFeatureType;
  aliases?: string[];
  notes?: string;
};

export const GEOGRAPHIC_CANONICAL_OVERRIDES: GeographicCanonicalOverride[] = [
  {
    match: { name: "Charlotte Amalia", island: "st_thomas", type: "estate" },
    canonicalName: "Estate Charlotte Amalia",
    displayName: "Estate Charlotte Amalia",
    baseName: "Charlotte Amalia",
    featureType: "estate",
    aliases: ["Charlotte Amalia Estate", "Charlotte Amalie Estate"],
    notes:
      "Keep separate from the town/place Charlotte Amalie. This is the estate record.",
  },
  {
    match: { name: "Charlotte Amalia", island: "st_thomas", type: "place" },
    canonicalName: "Charlotte Amalie",
    displayName: "Charlotte Amalie",
    baseName: "Charlotte Amalie",
    featureType: "town",
    aliases: ["Charlotte Amalia", "Charlotte Amalie town", "St. Thomas town"],
    notes:
      "Town/place record. Do not merge with Estate Charlotte Amalia.",
  },
  {
    match: { name: "Charlotte Amalie", island: "st_thomas", type: "place" },
    canonicalName: "Charlotte Amalie",
    displayName: "Charlotte Amalie",
    baseName: "Charlotte Amalie",
    featureType: "town",
    aliases: ["Charlotte Amalia", "Charlotte Amalie town"],
  },

  {
    match: { name: "Bordeaux", island: "st_thomas", type: "estate" },
    canonicalName: "Estate Bordeaux",
    displayName: "Estate Bordeaux, St. Thomas",
    baseName: "Bordeaux",
    featureType: "estate",
    aliases: ["Bordeaux Estate", "Bordeaux St. Thomas"],
    notes: "Same base name also exists on St. John. Do not merge across islands.",
  },
  {
    match: { name: "Bordeaux", island: "st_john", type: "estate" },
    canonicalName: "Estate Bordeaux",
    displayName: "Estate Bordeaux, St. John",
    baseName: "Bordeaux",
    featureType: "estate",
    aliases: ["Bordeaux Estate", "Bordeaux St. John"],
    notes: "Same base name also exists on St. Thomas. Do not merge across islands.",
  },

  {
    match: { name: "Pear", island: "st_croix", type: "estate" },
    canonicalName: "Estate Pear",
    displayName: "Estate Pear, St. Croix",
    baseName: "Pear",
    featureType: "estate",
    aliases: ["Pear Estate", "Pear St. Croix"],
    notes: "Same base name may exist on St. John. Do not merge across islands.",
  },
  {
    match: { name: "Pear", island: "st_john", type: "estate" },
    canonicalName: "Estate Pear",
    displayName: "Estate Pear, St. John",
    baseName: "Pear",
    featureType: "estate",
    aliases: ["Pear Estate", "Pear St. John"],
    notes: "Same base name may exist on St. Croix. Do not merge across islands.",
  },

  {
    match: { name: "St. Thomas", island: "st_thomas", type: "estate" },
    canonicalName: "Estate St. Thomas",
    displayName: "Estate St. Thomas",
    baseName: "St. Thomas",
    featureType: "estate",
    aliases: ["Saint Thomas Estate"],
    notes:
      "Estate record. Do not merge with the island-level St. Thomas record.",
  },
  {
    match: { name: "St. John", island: "st_john", type: "estate" },
    canonicalName: "Estate St. John",
    displayName: "Estate St. John",
    baseName: "St. John",
    featureType: "estate",
    aliases: ["Saint John Estate"],
    notes: "Estate record. Do not merge with the island-level St. John record.",
  },

  {
    match: { name: "Darape", type: "estate" },
    canonicalName: "Darape",
    displayName: "Darape",
    baseName: "Darape",
    featureType: "estate",
    aliases: [],
    notes:
      "Flag for manual review. Possible OCR/spelling issue; do not auto-merge until verified.",
  },
];

function normalizeText(value?: string | null) {
  return String(value || "")
    .toLowerCase()
    .replace(/estate\s+/g, "")
    .replace(/[’']/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function findGeographicCanonicalOverride(input: {
  name?: string | null;
  island?: IslandCode | string | null;
  type?: string | null;
  source?: string | null;
}) {
  const name = normalizeText(input.name);
  const island = input.island || undefined;
  const type = normalizeText(input.type);
  const source = normalizeText(input.source);

  return GEOGRAPHIC_CANONICAL_OVERRIDES.find((rule) => {
    const ruleName = normalizeText(rule.match.name);
    const ruleType = normalizeText(rule.match.type);
    const ruleSource = normalizeText(rule.match.source);

    if (ruleName !== name) return false;
    if (rule.match.island && rule.match.island !== island) return false;
    if (rule.match.type && ruleType !== type) return false;
    if (rule.match.source && ruleSource !== source) return false;

    return true;
  });
}