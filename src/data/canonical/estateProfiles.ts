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
      "Estate Bovoni is a historic Frenchman Bay estate whose modern identity differs sharply from its late Danish-period landscape: once a quiet coastal estate of lagoon, islets, and open land, it is now a major south-shore community with public housing, private homeowners, commerce, public facilities, the landfill, and the Clinton E. Phipps Racetrack.",
    description:
      "Estate Bovoni is a historic south-shore estate in the Frenchman Bay quarter of St. Thomas. Before the United States acquired the Danish West Indies in 1917, Bovoni belonged to the older estate landscape of St. Thomas: coastal land, lagoon features, small islets, mangroves, sea crabs, pelicans, and open stock-estate country. At the end of the Danish colonial period, the area was still largely quiet, isolated, and underused. Its later development took a different path from the villa or resort future imagined in early twentieth-century writing. Modern Bovoni became a lived-in south-shore community, dominated by public housing and a large private homeowner community, with neighborhood roads, public facilities, schools and shelter functions, gas stations, shopping areas, commercial business complexes, the Clinton E. Phipps Racetrack, and the island’s landfill/dump area. The change from lagoon estate landscape to residential, commercial, recreational, and infrastructure zone is the central story of Bovoni.",
    historicalContext:
      "Bovoni’s historic importance comes from the contrast between the late Danish-period estate landscape and the modern community that developed after the transfer to the United States. The older estate profile centers on coastal geography, lagoon ecology, open land, stock-estate use, and unrealized resort or villa expectations.",
    modernContext:
      "Modern Bovoni is a major south-shore residential and service community. Its present-day identity is shaped by public housing, private homeowners, public facilities, school and shelter functions, commerce, transportation services, landfill/dump use, and the Clinton E. Phipps Racetrack.",
    sourceConfidence: "medium",
    sourceNotes: [
      "Estate polygon source identifies BOVONI as estate ID 1998.",
      "Estate source places BOVONI in 1, 2, & 3 Frenchman Bay.",
      "Before the 1917 transfer, Bovoni belonged to the older Danish-period estate landscape of St. Thomas.",
      "The older estate landscape included Bovoni Bay, lagoon features, small islets, mangroves, sea crabs, pelicans, open land, and coastal wildlife.",
      "At the end of the Danish colonial period, Bovoni was still largely quiet, isolated, and underused.",
      "Early twentieth-century writing imagined a possible villa or resort future for the estate.",
      "The actual modern community developed gradually from that Cattle in the street to today’s east end town atmosphere.",
      "Part of the former lagoon/coastal landscape became associated with landfill and dump use.",
      "Present-day Bovoni is mix of a densely populated residential area combined with and ever expanding commercial development.",
      "Present-day Bovoni includes a large public housing presence.",
      "Present-day Bovoni includes Bovoni U.S.V.I Public Housing Project as well as an extensive private homeowner community.",
      "Present-day Bovoni includes the Bertha C. Boschulte Middle School, the  only public middle school serving the East end of the island along community facilities such te school school gym and other facilities.",
      "Present-day Bovoni includes gas stations, shopping areas, and commercial business complexes.",
      "Present-day Bovoni includes the island landfill/dump area.",
    ],
    sourceRefs: [
      "public/geo/usvi-estates.geojson",
      "src/data/estates",
      "src/data/estateKnowledge",
      "src/data/estateHistories",
      "src/data/dictionaryGraph",
      "src/data/core/geographicIndex",
      "src/data/atlas/masterAtlas",
      "Adolph Sixto, Time and I; or, Looking Forward, San Juan News, c. 1902, Bovoni passage around PDF page 104.",
      "Sixto is used here as a pre-1917 witness to the late Danish-period estate landscape.",
      "generated/sources/sixto-time-and-i-1902.txt",
      "reports/estate-history/sixto-review-packet-001.md",
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


export function getEstateProfile(idOrName?: string | number | null) {
  return (
    getEstateProfileById(idOrName) ||
    getEstateProfileByName(String(idOrName ?? "")) ||
    null
  );
}
