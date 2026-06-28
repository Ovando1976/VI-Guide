export type GeographicFrenchCoastalRule = {
  historicalName: string;
  displayName: string;
  canonicalName: string;
  featureType: "bay" | "cove" | "point" | "coast" | "harbor";
  island?: string;
  aliases: string[];
  notes?: string;
};

export const GEOGRAPHIC_FRENCH_COASTAL_RULES: GeographicFrenchCoastalRule[] = [
  {
    historicalName: "An8e de la Pointe Rouge",
    displayName: "Red Point Cove",
    canonicalName: "Red Point Cove",
    featureType: "cove",
    island: "st_croix",
    aliases: ["Anse de la Pointe Rouge", "Pointe Rouge", "Red Point", "An8e de la Pointe Rouge"],
  },
  {
    historicalName: "An86 Beau Regard",
    displayName: "Beauregard Bay",
    canonicalName: "Beauregard Bay",
    featureType: "bay",
    island: "st_croix",
    aliases: ["Anse Beau Regard", "An86 Beau Regard", "An8e Beau Regard", "Beau Regard"],
  },
  {
    historicalName: "Bnye de Hondrik",
    displayName: "Hendrik Bay",
    canonicalName: "Hendrik Bay",
    featureType: "bay",
    island: "st_thomas",
    aliases: ["Baie de Hendrik", "Bnye de Hondrik", "Bay de Hendrik", "Hendrik Bay"],
  },
  {
    historicalName: "Bnye Cunnkl",
    displayName: "Caneel Bay",
    canonicalName: "Caneel Bay",
    featureType: "bay",
    island: "st_john",
    aliases: ["Baie Caneel", "Bnye Cunnkl", "Caneel Bay"],
  },
  {
    historicalName: "Bordeaum ffroote Bay",
    displayName: "Great Bordeaux Bay",
    canonicalName: "Great Bordeaux Bay",
    featureType: "bay",
    island: "st_thomas",
    aliases: ["Grande Baie de Bordeaux", "Bordeaum ffroote Bay", "Bordeaux Grote Bay", "Great Bordeaux Bay"],
  },
  {
    historicalName: "Pc22t-Bqrdeaux Rail",
    displayName: "Little Bordeaux Bay",
    canonicalName: "Little Bordeaux Bay",
    featureType: "bay",
    island: "st_thomas",
    aliases: ["Petite Baie de Bordeaux", "Pc22t-Bqrdeaux Rail", "Petit Bordeaux Bay", "Little Bordeaux Bay"],
  },
  {
    historicalName: "Baye de L'est",
    displayName: "East Bay",
    canonicalName: "East Bay",
    featureType: "bay",
    island: "st_thomas",
    aliases: ["Baye de L'est", "Baie de l'Est", "East Bay"],
  },
  {
    historicalName: "Baye de la Reine Anne",
    displayName: "Queen Anne Bay",
    canonicalName: "Queen Anne Bay",
    featureType: "bay",
    island: "st_thomas",
    aliases: ["Baye de la Reine Anne", "Baie de la Reine Anne", "Queen Anne Bay"],
  },
];

function normalize(value?: string | null) {
  return String(value || "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function findGeographicFrenchCoastalRule(name?: string | null) {
  const key = normalize(name);

  return GEOGRAPHIC_FRENCH_COASTAL_RULES.find((rule) => {
    if (normalize(rule.historicalName) === key) return true;
    if (normalize(rule.displayName) === key) return true;
    if (normalize(rule.canonicalName) === key) return true;
    return rule.aliases.some((alias) => normalize(alias) === key);
  });
}