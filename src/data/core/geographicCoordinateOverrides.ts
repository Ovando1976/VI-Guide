export type CoordinateStatus =
  | "verified"
  | "estimated"
  | "approximate"
  | "missing"
  | "bad"
  | "not-applicable";

export type CoordinateOverride = {
  id?: string;
  name: string;
  canonicalName: string;
  featureType: string;
  island?: string;
  coordinates?: { lat: number; lng: number };
  coordinateStatus: CoordinateStatus;
  coordinateNotes: string;
  confidence?: number;
  uncertaintyMeters?: number;
  historicalSource?: string;
  locationEvidence?: string;
  aliases?: string[];
};

export const GEOGRAPHIC_COORDINATE_OVERRIDES: CoordinateOverride[] = [
  {
    name: "Annaly Estate",
    canonicalName: "Annaly Estate",
    featureType: "estate",
    island: "st_croix",
    coordinates: { lat: 17.76331, lng: -64.8482 },
    coordinateStatus: "estimated",
    confidence: 90,
    uncertaintyMeters: 75,
    coordinateNotes:
      "Modern Estate Annaly gazetteer coordinate; consistent with Northside A Quarter placement.",
    aliases: ["Annaly", "Annally", "Annaly Estate"],
  },
  {
    name: "Annaly Hill",
    canonicalName: "Annaly Hill",
    featureType: "hill",
    island: "st_croix",
    coordinates: { lat: 17.75136, lng: -64.85515 },
    coordinateStatus: "estimated",
    confidence: 88,
    uncertaintyMeters: 75,
    coordinateNotes:
      "Modern peak coordinate consistent with dictionary description of 702-foot hill northeast of Annaly Estate.",
    aliases: ["Annaly Hill", "Annally Hill"],
  },
  {
    name: "Annaly Gut",
    canonicalName: "Annaly Gut",
    featureType: "gut",
    island: "st_croix",
    coordinates: { lat: 17.758595, lng: -64.852715 },
    coordinateStatus: "estimated",
    confidence: 70,
    uncertaintyMeters: 250,
    coordinateNotes:
      "Midpoint proxy between Annaly Hill and Annaly Bay.",
    aliases: ["Annaly Gut", "Annas Gut", "AnnaSp G u t"],
  },
  {
    name: "Annaly Bay",
    canonicalName: "Annaly Bay",
    featureType: "bay",
    island: "st_croix",
    coordinates: { lat: 17.76583, lng: -64.85028 },
    coordinateStatus: "estimated",
    confidence: 90,
    uncertaintyMeters: 80,
    coordinateNotes:
      "Modern bay coordinate consistent with dictionary placement off Annaly Estate.",
    aliases: ["Annaly Bay", "Annally Bay"],
  },
  {
    name: "Anna's Hope",
    canonicalName: "Anna's Hope",
    featureType: "estate",
    island: "st_croix",
    coordinates: { lat: 17.72831, lng: -64.72875 },
    coordinateStatus: "estimated",
    confidence: 92,
    uncertaintyMeters: 75,
    coordinateNotes:
      "Modern settlement/estate coordinate; should be cross-checked against estate polygon centroid.",
    aliases: ["Anna's Hope", "Annahope"],
  },
  {
    name: "Altona Hill",
    canonicalName: "Altona Hill",
    featureType: "hill",
    island: "st_croix",
    coordinates: { lat: 17.74747, lng: -64.69236 },
    coordinateStatus: "verified",
    confidence: 95,
    uncertaintyMeters: 50,
    coordinateNotes:
      "Corrected to St. Croix; modern gazetteer coordinate agrees with dictionary placement.",
    aliases: ["Altona Hill"],
  },
  {
    name: "Arons Estate",
    canonicalName: "Arons Estate",
    featureType: "estate",
    island: "st_thomas",
    coordinates: { lat: 18.35358, lng: -64.96938 },
    coordinateStatus: "estimated",
    confidence: 65,
    uncertaintyMeters: 500,
    coordinateNotes:
      "Calculated approximately 1 mile northeast of Brewers Bay, St. Thomas.",
    aliases: ["Arons", "Arons Estate", "Plantage Arons"],
  },
  {
    name: "Anna Point",
    canonicalName: "Anna Point",
    featureType: "point",
    island: "st_john",
    coordinates: { lat: 18.371289, lng: -64.733869 },
    coordinateStatus: "verified",
    confidence: 99,
    uncertaintyMeters: 10,
    coordinateNotes:
      "Converted from explicit geographic dictionary position for Anna Point, St. John.",
    aliases: ["Anna Point"],
  },
  {
    name: "Atkins",
    canonicalName: "Atkins Estate",
    featureType: "estate",
    island: "st_croix",
    coordinates: { lat: 17.75192, lng: -64.75264 },
    coordinateStatus: "estimated",
    confidence: 60,
    uncertaintyMeters: 500,
    coordinateNotes:
      "Linked to Queen Quarter Estate 14; modern locality proxy near Rattan/Belvedere area.",
    aliases: ["Atkins", "Atkins Estate"],
  },
  {
    name: "Aubert Estate",
    canonicalName: "Aubert Estate",
    featureType: "estate",
    island: "st_croix",
    coordinates: { lat: 17.71609, lng: -64.71209 },
    coordinateStatus: "estimated",
    confidence: 45,
    uncertaintyMeters: 900,
    coordinateNotes:
      "Estimated from Corn Hill proxy. Dictionary places Aubert/Aztbert near Cornhill on Lapointe 1671 map.",
    historicalSource: "Lapointe Map (1671)",
    locationEvidence: "French estate not far from Cornhill, St. Croix.",
    aliases: ["Aztbert", "Aubert", "Aubert Estate"],
  },
  {
    name: "Arnesen",
    canonicalName: "Arnesen",
    featureType: "reference",
    island: "st_croix",
    coordinateStatus: "not-applicable",
    confidence: 100,
    uncertaintyMeters: 0,
    coordinateNotes:
      "Person/owner reference, not a single mappable estate.",
    aliases: ["Amesen", "Arnesen", "H. L. Arnesen"],
  },
];

function normalize(value?: string | null) {
  return String(value || "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function findGeographicCoordinateOverride(input: {
  id?: string;
  name?: string;
  canonicalName?: string;
  island?: string;
  featureType?: string;
}) {
  const keys = [
    normalize(input.id),
    normalize(input.name),
    normalize(input.canonicalName),
  ].filter(Boolean);

  return GEOGRAPHIC_COORDINATE_OVERRIDES.find((rule) => {
    if (input.island && rule.island && normalize(input.island) !== normalize(rule.island)) {
      return false;
    }

    if (
      input.featureType &&
      rule.featureType &&
      normalize(input.featureType) !== normalize(rule.featureType)
    ) {
      return false;
    }

    const ruleKeys = [
      normalize(rule.name),
      normalize(rule.canonicalName),
      ...(rule.aliases || []).map(normalize),
    ];

    return keys.some((key) => ruleKeys.includes(key));
  });
}