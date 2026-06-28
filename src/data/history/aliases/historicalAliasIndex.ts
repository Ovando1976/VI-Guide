import type { HistoricalAliasRecord } from "./historicalAliasTypes";

export const historicalAliasIndex: HistoricalAliasRecord[] = [
  {
    id: "alias-stt-brewers-bay-jan-krameur",
    modernName: "Brewers Bay",
    island: "st_thomas",
    historicalNames: [
      "Baye de Jean Krameur",
      "Ian Kramew Bay",
      "Ian Kramer Bay",
      "Jan Kramers Baai",
      "Jan Kramer Bay",
      "Janprubay",
      "John Brucebay",
      "John Brewers Bay",
      "John Brewer Bay",
      "John Brewer's Bay",
      "J. Bruce Estate",
      "John Bruce Estate"
    ],
    proprietorNames: [
      "Jan Cramues",
      "Jean Krameur",
      "Jan Kramer",
      "John Brewer",
      "John Bruce"
    ],
    frenchNames: ["Baye de Jean Krameur"],
    dutchNames: ["Jan Kramers Baai", "Jan Kramer Bay"],
    danishNames: [],
    englishNames: [
      "John Brucebay",
      "John Brewers Bay",
      "John Brewer Bay",
      "John Brewer's Bay",
      "J. Bruce Estate",
      "John Bruce Estate"
    ],
    confidence: "probable",
    evidence: [
      {
        source: "Geographic Dictionary of the Virgin Islands",
        pages: "Brewers Bay entry",
        quotation:
          "Another early name was Baye de Jean Krameur, or Ian Kramer Bay, in Dutch, Jan Kramers Baai.",
        notes:
          "Supports the historical name chain from Jean/Jan Krameur/Kramer to modern Brewers Bay."
      }
    ]
  },
  {
    id: "alias-stt-jansen-jesper-jansen",
    modernName: "Jansen",
    island: "st_thomas",
    historicalNames: [
      "Jesper Jansen's plantation",
      "Jeshan Jansen's plantation",
      "Jansen"
    ],
    proprietorNames: ["Jesper Jansen", "Jeshan Jansen"],
    frenchNames: [],
    dutchNames: [],
    danishNames: [],
    englishNames: ["Jansen"],
    confidence: "confirmed",
    evidence: [
      {
        source: "Knox / VI Guide geographicIndex audit",
        pages: "52–53, 64–72, 255",
        notes:
          "Current geographicIndex contains modern Estate Jansen on St. Thomas and Knox references Jesper/Jeshan Jansen's plantation."
      }
    ]
  }
];

function normalizeAlias(value: string) {
  return value
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/\bestate\b/g, "")
    .replace(/\bplantation\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function findHistoricalAliasMatch(query: string) {
  const needle = normalizeAlias(query);

  if (!needle) return undefined;

  return historicalAliasIndex.find((record) => {
    const haystack = [
      record.modernName,
      ...record.historicalNames,
      ...record.proprietorNames,
      ...record.frenchNames,
      ...record.dutchNames,
      ...record.danishNames,
      ...record.englishNames
    ].map(normalizeAlias);

    return haystack.some((item) => item === needle || item.includes(needle) || needle.includes(item));
  });
}
