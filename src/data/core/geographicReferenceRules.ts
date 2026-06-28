export type GeographicReferenceRule = {
  dictionaryName: string;
  linkedCanonicalIds: string[];
  preferredDisplayId?: string;
  notes?: string;
};

export const GEOGRAPHIC_REFERENCE_RULES: GeographicReferenceRule[] = [
  {
    dictionaryName: "Bodkin",
    linkedCanonicalIds: ["st_croix:bodkin:northside-a"],
    preferredDisplayId: "st_croix:bodkin:northside-a",
  },
  {
    dictionaryName: "Brewers Bay",
    linkedCanonicalIds: ["brewers-bay"],
    preferredDisplayId: "brewers-bay",
  },
  {
    dictionaryName: "Caneel Bay",
    linkedCanonicalIds: [
      "st_john:caneel-bay:8-cruz-bay",
      "stj-caneel-bay-ruins",
      "caneel-bay",
    ],
    preferredDisplayId: "st_john:caneel-bay:8-cruz-bay",
  },
  {
    dictionaryName: "Castle Coakley",
    linkedCanonicalIds: [
      "st_croix:castle-coakley:queen",
      "stx-estate-castle-coakley",
    ],
    preferredDisplayId: "st_croix:castle-coakley:queen",
  },
  {
    dictionaryName: "Cowell Battery",
    linkedCanonicalIds: ["stt-cowell-battery"],
    preferredDisplayId: "stt-cowell-battery",
  },
  {
    dictionaryName: "Fort Christian",
    linkedCanonicalIds: ["stt-fort-christian", "gov-fort-christian"],
    preferredDisplayId: "stt-fort-christian",
  },
  {
    dictionaryName: "Bordeaux",
    linkedCanonicalIds: ["st_john:bordeaux:coral-bay"],
    preferredDisplayId: "st_john:bordeaux:coral-bay",
    notes: "Do not merge St. John Bordeaux with other Bordeaux features.",
  },
  {
    dictionaryName: "Pearl",
    linkedCanonicalIds: ["st_croix:pearl:queen"],
    preferredDisplayId: "st_croix:pearl:queen",
  },
];

function normalize(value?: string | null) {
  return String(value || "")
    .toLowerCase()
    .replace(/^estate\s+/i, "")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function findGeographicReferenceRule(name?: string | null) {
  const key = normalize(name);
  return GEOGRAPHIC_REFERENCE_RULES.find(
    (rule) => normalize(rule.dictionaryName) === key,
  );
}