export type SixtoEstateNarrative1902 = {
  name: string;
  aliases: string[];
  island: "st_thomas";
  sourceTitle: string;
  author: string;
  year: number;
  sourcePages: number[];
  sourceLines: string;
  summary: string;
  historicalDescription: string;
  excerpts: string[];
  keyFacts: string[];
  researchStatus: "source-extracted" | "table-only";
};

export const sixtoEstateNarratives1902 = [
  {
    name: "Bovoni",
    aliases: ["Bovoni", "Estate Bovoni", "st_thomas-estate-bovoni"],
    island: "st_thomas",
    sourceTitle: "Time and I; or, Looking Forward",
    author: "Adolph Sixto",
    year: 1902,
    sourcePages: [101],
    sourceLines: "generated/sources/sixto-time-and-i-1902.txt around lines 4387-4421",
    summary:
      "Sixto mentions Bovoni in a passage about St. Thomas estates and their agricultural future, including stock estates, cane lands, cocoa plantations, pasture, and cattle-oriented production.",
    historicalDescription:
      "Adolph Sixto's Time and I; or, Looking Forward places Bovoni within his wider vision of St. Thomas estates as agricultural landscapes capable of renewed productivity. The surrounding passage describes previously neglected estates being imagined as stock estates, cane-cultivated lands, cocoa plantations, and pasture lands. Bovoni is therefore useful as a period source reference showing how an early twentieth-century St. Thomian writer connected rural estates to agriculture, livestock, and future development.",
    excerpts: [
      "Sixto names Bovoni in a section describing St. Thomas estates and their agricultural possibilities.",
      "The surrounding passage refers to stock estates, cane cultivated lands, cocoa plantations, pasture, and cattle."
    ],
    keyFacts: [
      "Bovoni is directly mentioned by Sixto.",
      "The surrounding passage concerns St. Thomas estate agriculture.",
      "The passage includes stock estates, cane cultivation, cocoa plantations, pasture, and cattle-oriented production.",
      "This source supports an agricultural-history description, not an ownership or naming-origin claim."
    ],
    researchStatus: "source-extracted"
  }
] satisfies SixtoEstateNarrative1902[];

function normalizeSixtoNarrativeKey(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/^Estate\s+/i, "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getSixtoEstateNarrative1902(idOrName: unknown) {
  const target = normalizeSixtoNarrativeKey(idOrName);

  if (!target) return null;

  return (
    sixtoEstateNarratives1902.find((entry) =>
      [entry.name, ...entry.aliases].some((candidate) => {
        const key = normalizeSixtoNarrativeKey(candidate);
        return (
          key === target ||
          target.endsWith(`-${key}`) ||
          key.endsWith(`-${target}`) ||
          target.includes(key)
        );
      }),
    ) ?? null
  );
}
