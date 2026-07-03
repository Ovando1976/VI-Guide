export type ManualEstateHistoryOverride = {
  id?: string;
  name: string;
  aliases: string[];
  island: "st_thomas" | "st_john" | "st_croix" | "water_island";
  quarter?: string;
  shortDescription: string;
  historicalDescription: string;
  keyFacts: string[];
  sourceRefs: string[];
  confidence: "high" | "medium" | "low" | "needs-research";
  researchStatus:
    | "verified"
    | "partially-verified"
    | "source-extracted"
    | "needs-research";
  updatedAt: string;
};

export const manualEstateHistoryOverrides = [
  {
    id: "st_thomas-estate-bovoni",
    name: "Estate Bovoni",
    aliases: ["Bovoni", "Estate Bovoni", "st_thomas-estate-bovoni"],
    island: "st_thomas",
    quarter: "Frenchman's Bay",
    shortDescription:
      "Estate Bovoni is a St. Thomas estate in the Frenchman's Bay area connected to Sixto's early twentieth-century discussion of rural estate agriculture.",
    historicalDescription:
      "Estate Bovoni is a historic St. Thomas estate/place-name in the Frenchman's Bay area. In Adolph Sixto's 1902 work Time and I; or, Looking Forward, Bovoni appears in a section discussing St. Thomas estates and their agricultural possibilities. The surrounding passage concerns neglected estates, stock estates, cane-cultivated lands, cocoa plantations, pasture, and cattle-oriented agriculture. Based on the source currently extracted, Bovoni should be presented as a St. Thomas estate connected to Sixto's broader argument that rural estates could be reorganized for productive agricultural use.",
    keyFacts: [
      "Bovoni is identified as a St. Thomas estate/place-name.",
      "Bovoni is associated with the Frenchman's Bay area.",
      "Adolph Sixto mentions Bovoni in Time and I; or, Looking Forward, c. 1902.",
      "The surrounding Sixto passage concerns estate agriculture, pasture, stock estates, cane lands, cocoa plantations, and cattle-oriented production.",
      "No claim is currently made about the origin of the Bovoni name, family ownership, Peru, or modern title history."
    ],
    sourceRefs: [
      "Adolph Sixto, Time and I; or, Looking Forward, San Juan News, c. 1902.",
      "generated/sources/sixto-time-and-i-1902.txt, lines around 4387-4421.",
      "VI Guide estate index."
    ],
    confidence: "medium",
    researchStatus: "source-extracted",
    updatedAt: "2026-07-03"
  }
] satisfies ManualEstateHistoryOverride[];

function normalizeEstateKey(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/^Estate\s+/i, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getManualEstateHistoryOverride(idOrName: unknown) {
  const target = normalizeEstateKey(idOrName);

  if (!target) return null;

  return (
    manualEstateHistoryOverrides.find((entry) => {
      const candidates = [entry.id, entry.name, ...entry.aliases]
        .filter(Boolean)
        .map(normalizeEstateKey);

      return candidates.some((candidate) => {
        if (!candidate) return false;
        return (
          candidate === target ||
          target.endsWith(`-${candidate}`) ||
          candidate.endsWith(`-${target}`) ||
          target.includes(candidate) ||
          candidate.includes(target)
        );
      });
    }) ?? null
  );
}
