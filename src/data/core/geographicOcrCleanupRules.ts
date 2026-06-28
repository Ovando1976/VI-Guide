export type GeographicOcrCleanupRule = {
  ocrName: string;
  displayName: string;
  canonicalName: string;
  featureType?: string;
  island?: string;
  aliases?: string[];
  notes?: string;
};

export const GEOGRAPHIC_OCR_CLEANUP_RULES: GeographicOcrCleanupRule[] = [
  {
    ocrName: "An8e Beau Regard",
    displayName: "Beauregard Bay",
    canonicalName: "Beauregard Bay",
    featureType: "bay",
    island: "st_croix",
    aliases: ["Anse Beau Regard", "An8e Beau Regard", "Beau Regard"],
    notes: "French historical name meaning cove of the fair outlook.",
  },
  {
    ocrName: "An8e de la Pointe Rouge",
    displayName: "Red Point Cove",
    canonicalName: "Red Point Cove",
    featureType: "bay",
    aliases: ["Anse de la Pointe Rouge", "An8e de la Pointe Rouge"],
  },
  {
    ocrName: "AfuhZenfeZa Batterie",
    displayName: "Muhlenfels Battery",
    canonicalName: "Muhlenfels Battery",
    featureType: "historic",
    island: "st_thomas",
    aliases: ["Muhlenfels Battery", "Mühlenfels Battery"],
  },
  {
    ocrName: "AnnaSp G u t",
    displayName: "Annas Gut",
    canonicalName: "Annas Gut",
    featureType: "gut",
    aliases: ["Anna's Gut", "Annas Gut", "AnnaSp G u t"],
  },
  {
    ocrName: "AfanchineaE Bail",
    displayName: "Morningstar Bay",
    canonicalName: "Morningstar Bay",
    featureType: "bay",
    aliases: ["Morningstar Bay", "Mrinchenil Buy", "AfanchineaE Bail"],
  },
  {
    ocrName: "Afingo Pohrt",
    displayName: "Mingo Point",
    canonicalName: "Mingo Point",
    featureType: "point",
    aliases: ["Mingo Point", "Afingo Pohrt"],
  },
];

function normalize(value?: string | null) {
  return String(value || "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function findGeographicOcrCleanupRule(name?: string | null) {
  const normalized = normalize(name);

  return GEOGRAPHIC_OCR_CLEANUP_RULES.find((rule) => {
    if (normalize(rule.ocrName) === normalized) return true;
    return rule.aliases?.some((alias) => normalize(alias) === normalized) ?? false;
  });
}