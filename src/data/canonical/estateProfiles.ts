import type { IslandCode } from "../../types";

export type EstateSourceConfidence = "high" | "medium" | "low";

export type EstateProfile = {
  estateId: string;
  slug: string;
  name: string;
  displayName: string;
  island: IslandCode;
  islandLabel: string;
  quarter?: string;
  alternateNames?: string[];
  relatedFeatures?: string[];
  summary: string;
  description: string;
  historicalContext?: string;
  modernContext?: string;
  sourceConfidence: EstateSourceConfidence;
  sourceNotes: string[];
  sourceRefs: string[];
};

export const estateProfiles: EstateProfile[] = [
  {
    estateId: "1998",
    slug: "bovoni",
    name: "BOVONI",
    displayName: "Estate Bovoni",
    island: "st_thomas",
    islandLabel: "St. Thomas",
    quarter: "1, 2, & 3 Frenchman Bay",
    alternateNames: ["Bovoni Estate", "Bovoni", "BozjCnQaPlantage"],
    relatedFeatures: [
      "Bovoni Bay",
      "Bovoni Cay",
      "Patricia Cay",
      "Mangrove Lagoon",
      "Long Point",
    ],
    summary:
      "Estate Bovoni is a historic Frenchman Bay estate on the southeastern side of St. Thomas, associated with Bovoni Bay, Bovoni Cay, and the island’s south-shore geography.",
    description:
      "Estate Bovoni is a historic estate area on the southeastern side of St. Thomas, within the Frenchman Bay quarter. The Geographic Dictionary describes Bovoni as an estate situated on a hill of the same name, overlooking Bovoni Bay and lying roughly 300 yards from the south shore. By the mid-twentieth century, the estate was described as a stock estate, suggesting its later use was associated with grazing or livestock rather than intensive plantation cultivation.",
    historicalContext:
      "Dictionary-linked evidence identifies Bovoni as a ruined estate overlooking Bovoni Bay. The same source cluster connects the estate with nearby coastal and geographic names including Bovoni Bay, Bovoni Cay, Patricia Cay, Mangrove Lagoon, and older or variant place names. Because several OCR-derived records contain spelling noise, this profile should be treated as a cleaned interpretive summary based on the strongest matching records.",
    modernContext:
      "Today, Bovoni is an important geographic reference point for the south shore of St. Thomas. In the VI Guide atlas, it should function as both a modern estate boundary and a historic place-name cluster linking estate geography, coastal landmarks, dictionary records, parcels, and mobility routing.",
    sourceConfidence: "medium",
    sourceNotes: [
      "Estate polygon source identifies BOVONI as estate ID 1998.",
      "Estate source places BOVONI in 1, 2, & 3 Frenchman Bay.",
      "Dictionary graph includes a Bovoni entry describing the estate as ruined, on a hill, overlooking Bovoni Bay, about 300 yards from the south shore.",
      "Related dictionary records include Bovoni Bay, Bovoni Cay, Patricia Cay, Mangrove Lagoon, and variant spellings.",
      "OCR cleanup is still needed for several linked records, so this profile uses medium confidence.",
    ],
    sourceRefs: [
      "public/geo/usvi-estates.geojson",
      "src/data/estates",
      "src/data/estateKnowledge",
      "src/data/estateHistories",
      "src/data/dictionaryGraph",
      "src/data/core/geographicIndex",
      "src/data/atlas/masterAtlas",
    ],
  },
];

function normalize(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\bestate\b/g, "")
    .replace(/[_-]/g, " ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getEstateProfileById(id?: string | number | null) {
  if (id === null || id === undefined) return null;

  const target = normalize(id);

  return (
    estateProfiles.find((profile) => normalize(profile.estateId) === target) ??
    null
  );
}

export function getEstateProfileByName(name?: string | null) {
  if (!name) return null;

  const target = normalize(name);

  return (
    estateProfiles.find((profile) => {
      const names = [
        profile.name,
        profile.displayName,
        profile.slug,
        ...(profile.alternateNames ?? []),
      ];

      return names.some((candidate) => {
        const normalized = normalize(candidate);

        return (
          normalized === target ||
          normalized.includes(target) ||
          target.includes(normalized)
        );
      });
    }) ?? null
  );
}

export function getEstateProfileForSelection(selection?: {
  id?: string | number | null;
  geoid?: string | number | null;
  name?: string | null;
  title?: string | null;
  estate?: string | null;
  properties?: Record<string, unknown>;
} | null) {
  if (!selection) return null;

  return (
    getEstateProfileById(selection.geoid) ||
    getEstateProfileById(selection.id) ||
    getEstateProfileById(selection.properties?.geoid as string | undefined) ||
    getEstateProfileById(selection.properties?.GEOID as string | undefined) ||
    getEstateProfileById(selection.properties?.estateId as string | undefined) ||
    getEstateProfileById(selection.properties?.id as string | undefined) ||
    getEstateProfileByName(selection.name) ||
    getEstateProfileByName(selection.title) ||
    getEstateProfileByName(selection.estate) ||
    getEstateProfileByName(selection.properties?.name as string | undefined) ||
    getEstateProfileByName(selection.properties?.ESTATE as string | undefined) ||
    null
  );
}
