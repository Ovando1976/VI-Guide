import { GEOGRAPHIC_ALPHABETICAL_CLEANUP_RULES_B } from "./geographicAlphabeticalCleanupRulesB";

export type CoordinateStatus =
  | "verified"
  | "estimated"
  | "approximate"
  | "missing"
  | "bad"
  | "not-applicable";

export type GeographicAlphabeticalCleanupRule = {
  originalName: string;
  displayName: string;
  canonicalName: string;
  featureType: string;
  island?: string;
  aliases?: string[];
  notes?: string;
  coordinates?: { lat: number; lng: number };
  coordinateStatus?: CoordinateStatus;
  coordinateNotes?: string;
  confidence?: number;
  uncertaintyMeters?: number;
  matchDescriptionIncludes?: string[];
  matchIsland?: string;
};

function normalize(value?: string | null) {
  return String(value || "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export const GEOGRAPHIC_ALPHABETICAL_CLEANUP_RULES: GeographicAlphabeticalCleanupRule[] = [
  ...GEOGRAPHIC_ALPHABETICAL_CLEANUP_RULES_B,
  {
    originalName: "A'aint Jantcrr",
    displayName: "Great St. James",
    canonicalName: "Great St. James",
    featureType: "island",
    island: "st_thomas",
    aliases: ["A'aint Jantcrr", "Saint James", "Great St. James"],
    notes: "OCR cleanup. Description says same as Great St. James.",
    coordinateStatus: "missing",
    coordinateNotes: "Known island; coordinate needs verification against map layer.",
  },
  {
    originalName: "Abada Eklll",
    displayName: "Jack Bay Point",
    canonicalName: "Jack Bay Point",
    featureType: "point",
    island: "st_croix",
    aliases: ["Abada Eklll", "Jack Bay Point"],
    notes: "OCR mixed entry; description identifies eastern entrance of Jack Bay.",
    coordinateStatus: "missing",
    coordinateNotes: "Point identified from description; exact coordinate needs verification.",
  },
  {
  originalName: "Altona",
  displayName: "Estate Altona, St. Croix",
  canonicalName: "Estate Altona, St. Croix",
  featureType: "estate",
  island: "st_croix",
  aliases: ["Altona", "Altona Estate"],
  matchDescriptionIncludes: ["eastend quarter", "christiansted", "altona lagoon"],
  coordinateStatus: "estimated",
  coordinateNotes:
    "Estate tracts 1 and 6, Eastend Quarter A, immediately east of Christiansted and south of Altona Lagoon.",
},
{
  originalName: "Altona",
  displayName: "Estate Altona, St. Thomas",
  canonicalName: "Estate Altona, St. Thomas",
  featureType: "estate",
  island: "st_thomas",
  aliases: ["Altona", "Altona Estate", "Altona and Velgunst", "Altone"],
  matchDescriptionIncludes: ["western suburbs", "st. thomas city", "southside quarter"],
  coordinateStatus: "estimated",
  coordinateNotes:
    "Estate adjoining the western suburbs of Charlotte Amalie in Southside Quarter, St. Thomas.",
},
{
  originalName: "Altona Lagoon",
  displayName: "Altona Lagoon",
  canonicalName: "Altona Lagoon",
  featureType: "lagoon",
  island: "st_croix",
  aliases: ["Altona Lagoon", "Christiansted Lagoon", "Shoy Lagoon", "the Lagoon"],
  coordinateStatus: "estimated",
  coordinateNotes:
    "Shallow inlet about 1 mile long opening on east side of Christiansted Harbor, St. Croix.",
},
{
  originalName: "Altona Hill",
  displayName: "Altona Hill",
  canonicalName: "Altona Hill",
  featureType: "hill",
  island: "st_croix",
  aliases: ["Altona Hill"],
  coordinates: { lat: 17.7475, lng: -64.692222 },
  coordinateStatus: "verified",
  coordinateNotes:
    "Verified from GeoView/OpenStreetMap peak record at 17°44′51″N, 64°41′32″W, near Altona Lagoon, St. Croix.",
},
{
  originalName: "Anna Point",
  displayName: "Anna Point",
  canonicalName: "Anna Point",
  featureType: "point",
  island: "st_john",
  aliases: ["Anna Point"],
  coordinates: { lat: 18.371289, lng: -64.733869 },
  coordinateStatus: "verified",
  coordinateNotes:
    "Converted from explicit Geographic Dictionary coordinate for Anna Point, St. John.",
},
{
  originalName: "Anna's Hope Gut",
  displayName: "Anna's Hope Gut",
  canonicalName: "Anna's Hope Gut",
  featureType: "gut",
  island: "st_croix",
  aliases: ["Anna's Hope Gut", "Annas Hope Gut"],
  coordinateStatus: "missing",
  coordinateNotes:
    "Ambiguous watercourse reference near Anna's Hope; do not assign a hard point until gut alignment is verified.",
},
{

    
    originalName: "Altse du Bois Abattu",
    displayName: "Ruan Bay",
    canonicalName: "Ruan Bay",
    featureType: "bay",
    island: "st_croix",
    aliases: ["Anse du Bois Abattu", "Cutwood Bay", "Long Point", "Ruan Bay"],
    notes: "Old French name; description says same as Long Point or Ruan Bay.",
    coordinateStatus: "approximate",
    coordinateNotes: "Immediately northwest of Long Point, south coast of St. Croix; exact coordinate needs verification.",
  },
  {
    originalName: "Anae du N w d",
    displayName: "North Cove",
    canonicalName: "North Cove",
    featureType: "cove",
    island: "st_croix",
    aliases: ["Anse du Nord", "North Cove"],
    coordinateStatus: "approximate",
    coordinateNotes: "West coast of St. Croix, about 1.5 miles northeast of Sandy Point.",
  },
  {
    originalName: "Anee du B u d",
    displayName: "South Bay",
    canonicalName: "South Bay",
    featureType: "bay",
    island: "st_croix",
    aliases: ["Anse du Sud", "South Bay", "Camporico Bay", "Wade Bay"],
    coordinateStatus: "approximate",
    coordinateNotes: "Indentation about 1.5 miles northeast of Southwest Point, St. Croix.",
  },
  {
    originalName: "Anee de l'Eetanfl",
    displayName: "Great Pond Bay",
    canonicalName: "Great Pond Bay",
    featureType: "bay",
    island: "st_croix",
    aliases: ["Anse de l'Étang", "Anse de l'Etang", "Bay of the Pond", "Great Pond Bay"],
    notes: "French: Anse de l'Étang = Bay/Cove of the Pond.",
    coordinateStatus: "approximate",
    coordinateNotes: "South coast, Eastend B Quarter, St. Croix; exact coordinate needs verification.",
  },
  {
    originalName: "Anee de saint Jean",
    displayName: "Cooper Bay",
    canonicalName: "Cooper Bay",
    featureType: "bay",
    island: "st_croix",
    aliases: ["Anse de Saint Jean", "Anee de saint Jean", "St. John Bay", "Cooper Bay"],
    coordinateStatus: "approximate",
    coordinateNotes: "Dictionary says probably Cooper Bay, Prince Quarter, St. Croix.",
  },
  {
    originalName: "AnguilJa Point",
    displayName: "Anguilla Point",
    canonicalName: "Anguilla Point",
    featureType: "point",
    island: "st_croix",
    aliases: ["AnguilJa Point", "Anguilla Point"],
    coordinateStatus: "approximate",
    coordinateNotes: "Near Krause Lagoon, south coast of St. Croix; exact coordinate needs verification.",
  },
  {
    originalName: "Anna de Wints Bay",
    displayName: "Bolongo Bay",
    canonicalName: "Bolongo Bay",
    featureType: "bay",
    island: "st_thomas",
    aliases: ["Anna de Wints Bay", "Reine Anne Bay", "Bolongo Bay"],
    coordinateStatus: "missing",
    coordinateNotes: "Known bay; coordinate should be verified against beach/place layer.",
  },
  {
    originalName: "Anne-Deurlnts-Bay",
    displayName: "Bolongo Bay",
    canonicalName: "Bolongo Bay",
    featureType: "bay",
    island: "st_thomas",
    aliases: ["Anne-Deurlnts-Bay", "Annedewintsbay", "Anna de Wint's Bay", "Bolongo Bay"],
    coordinateStatus: "missing",
    coordinateNotes: "Known bay; coordinate should be verified against beach/place layer.",
  },
  {
    originalName: "Annedevindtebay",
    displayName: "Bolongo Bay",
    canonicalName: "Bolongo Bay",
    featureType: "bay",
    island: "st_thomas",
    aliases: ["Annedevindtebay", "Annedewintsbay", "Bolongo Bay"],
    coordinateStatus: "missing",
    coordinateNotes: "Known bay; coordinate should be verified against beach/place layer.",
  },
  {
    originalName: "Anna's Hope",
    displayName: "Anna's Hope",
    canonicalName: "Anna's Hope",
    featureType: "estate",
    island: "st_croix",
    aliases: ["Anna's Hope", "Annahope"],
    coordinateStatus: "missing",
    coordinateNotes: "Estate identified; coordinate should be inherited from estate layer when available.",
  },
  {
    originalName: "Annahope",
    displayName: "Anna's Hope",
    canonicalName: "Anna's Hope",
    featureType: "estate",
    island: "st_croix",
    aliases: ["Annahope", "Anna's Hope"],
    coordinateStatus: "missing",
    coordinateNotes: "Estate identified; coordinate should be inherited from estate layer when available.",
  },
  {
    originalName: "Annaberg",
    displayName: "Estate Annaberg, St. Croix",
    canonicalName: "Estate Annaberg, St. Croix",
    featureType: "estate",
    island: "st_croix",
    aliases: ["Annaberg", "Annaberg Estate", "Anna Hill"],
    matchDescriptionIncludes: ["krause lagoon", "king quarter", "st. croix"],
    coordinateStatus: "approximate",
    coordinateNotes: "King Quarter, St. Croix, northwest of Krause Lagoon. Exact estate centroid needs verification.",
    notes: "Do not merge with Annaberg, St. John.",
  },
  {
    originalName: "Annaberg",
    displayName: "Annaberg Estate, St. John",
    canonicalName: "Annaberg Estate, St. John",
    featureType: "estate",
    island: "st_john",
    aliases: ["Annaberg", "Anneberg", "Annaberg Estate", "Annaberg Mill"],
    matchDescriptionIncludes: ["maho bay", "leinster bay", "st. john"],
    coordinates: { lat: 18.364961, lng: -64.729911 },
    coordinateStatus: "verified",
    coordinateNotes: "Converted from dictionary coordinate for Annaberg Mill: 18°21′53.86″ N, 64°43′47.68″ W.",
  },
  {
    originalName: "Anneberg",
    displayName: "Annaberg Estate, St. John",
    canonicalName: "Annaberg Estate, St. John",
    featureType: "estate",
    island: "st_john",
    aliases: ["Anneberg", "Annaberg", "Annaberg Estate", "Annaberg Mill"],
    coordinates: { lat: 18.364961, lng: -64.729911 },
    coordinateStatus: "verified",
    coordinateNotes: "Alternate spelling of Annaberg Estate/Mill, St. John.",
  },
  {
    originalName: "Annaberg Point",
    displayName: "Annaberg Point",
    canonicalName: "Annaberg Point",
    featureType: "point",
    island: "st_john",
    aliases: ["Annaberg Point", "Masonic Point"],
    coordinates: { lat: 18.367, lng: -64.7278 },
    coordinateStatus: "approximate",
    coordinateNotes: "Estimated from dictionary description: about 350 yards northeast of Annaberg Mill.",
  },
  {
    originalName: "Annally",
    displayName: "Annaly Estate",
    canonicalName: "Annaly Estate",
    featureType: "estate",
    island: "st_croix",
    aliases: ["Annally", "Annaly", "Annaly Estate"],
    coordinateStatus: "approximate",
    coordinateNotes: "Northside A Quarter, St. Croix; between Annaly Hill and Oxford Hill.",
  },
  {
    originalName: "Annaly",
    displayName: "Annaly Estate",
    canonicalName: "Annaly Estate",
    featureType: "estate",
    island: "st_croix",
    aliases: ["Annaly", "Annally", "Annaly Estate"],
    coordinateStatus: "approximate",
    coordinateNotes: "Northside A Quarter, St. Croix; exact estate centroid needs verification.",
  },
  {
    originalName: "Annaly Bay",
    displayName: "Annaly Bay",
    canonicalName: "Annaly Bay",
    featureType: "bay",
    island: "st_croix",
    aliases: ["Annaly Bay", "Annally Bay"],
    coordinateStatus: "approximate",
    coordinateNotes: "Northside Quarter, St. Croix, about long. 64°51′. Exact coordinate needs verification.",
  },
  {
    originalName: "Annaly Hill",
    displayName: "Annaly Hill",
    canonicalName: "Annaly Hill",
    featureType: "hill",
    island: "st_croix",
    aliases: ["Annaly Hill", "Annally Hill"],
    coordinateStatus: "approximate",
    coordinateNotes: "702-foot hill northeast of Annaly Estate on Bodkin Road, St. Croix.",
  },
  {
    originalName: "AnnaSp G u t",
    displayName: "Annaly Gut",
    canonicalName: "Annaly Gut",
    featureType: "gut",
    island: "st_croix",
    aliases: ["AnnaSp Gut", "AnnaSp G u t", "Annas Gut", "Annaly Gut"],
    coordinateStatus: "approximate",
    coordinateNotes: "Streambed running northward from Annaly Hill to Annaly Bay, St. Croix.",
  },
  {
    originalName: "Annaly School",
    displayName: "Annaly School",
    canonicalName: "Annaly School",
    featureType: "school",
    island: "st_croix",
    aliases: ["Annaly School", "Annally School"],
    coordinateStatus: "approximate",
    coordinateNotes: "On Oxford Road at foot of Oxford Ridge, west edge of Annaly Estate, St. Croix.",
  },
  {
    originalName: "An8e des Plumes",
    displayName: "White's Bay",
    canonicalName: "White's Bay",
    featureType: "bay",
    island: "st_croix",
    aliases: ["Anse des Plumes", "An8e des Plumes", "Plume Bay", "White's Bay"],
    coordinateStatus: "approximate",
    coordinateNotes: "South shore of Westend Quarter, St. Croix, about 2 miles east of Southwest Point; probably White's Bay.",
  },
  {
    originalName: "Anse clu Batteau",
    displayName: "Turner Hole",
    canonicalName: "Turner Hole",
    featureType: "bay",
    island: "st_croix",
    aliases: ["Anse du Bateau", "Anse clu Batteau", "Boat Cove", "Turner Hole", "Grapetree Bay"],
    coordinateStatus: "approximate",
    coordinateNotes: "Probably Turner Hole, possibly Grapetree Bay, south coast Eastend B Quarter.",
  },
  {
    originalName: "Anse d G a b t",
    displayName: "Halfpenny Bay",
    canonicalName: "Halfpenny Bay",
    featureType: "bay",
    island: "st_croix",
    aliases: ["Anse à Galet", "Anse a Galet", "Gravel Cove", "Halfpenny Bay"],
    coordinateStatus: "approximate",
    coordinateNotes: "French name meaning Gravel Cove; same as Halfpenny Bay, south coast Company Quarter.",
  },
  {
    originalName: "Anse d m Pdpes",
    displayName: "Goodhope Bay",
    canonicalName: "Goodhope Bay",
    featureType: "bay",
    island: "st_croix",
    aliases: ["Anse des Papes", "Goodhope Bay"],
    coordinateStatus: "approximate",
    coordinateNotes: "Old French name of Goodhope Bay, Westend Quarter, St. Croix.",
  },
  {
    originalName: "Anse de Iketan",
    displayName: "Breid Bay",
    canonicalName: "Breid Bay",
    featureType: "bay",
    island: "st_croix",
    aliases: ["Anse de l'Étang", "Anse de l'Etang", "Breid Bay"],
    coordinateStatus: "approximate",
    coordinateNotes: "At or near Breid Bay, St. Croix.",
  },
  {
    originalName: "Anse de la Maison du Camp",
    displayName: "Camp House Bay",
    canonicalName: "Camp House Bay",
    featureType: "bay",
    island: "st_croix",
    aliases: ["Anse de la Maison du Camp", "Camphouse Cove"],
    coordinateStatus: "approximate",
    coordinateNotes: "Near Fort Louise Augusta / outside Scotch Bank, St. Croix; obsolete name.",
  },
  {
    originalName: "Anse de SabZe Pin",
    displayName: "Rod Bay",
    canonicalName: "Rod Bay",
    featureType: "bay",
    island: "st_croix",
    aliases: ["Anse de Sable Pin", "Rod Bay"],
    coordinateStatus: "approximate",
    coordinateNotes: "Same as Rod Bay, south coast Eastend B Quarter, St. Croix.",
  },
  {
    originalName: "Anse de Za Lande",
    displayName: "Yellow Cliff Bay",
    canonicalName: "Yellow Cliff Bay",
    featureType: "bay",
    island: "st_croix",
    aliases: ["Anse de la Lande", "Anse de Za Lande", "Yellow Cliff Bay", "Gulklip Bay", "Hodge Bay"],
    coordinateStatus: "approximate",
    coordinateNotes: "North coast Eastend B Quarter; probably Yellow Cliff/Gulklip Bay at Cotton Valley, possibly Hodge Bay.",
  },
  {
    originalName: "Anse de8 Lambis",
    displayName: "Spring Bay",
    canonicalName: "Spring Bay",
    featureType: "bay",
    island: "st_croix",
    aliases: ["Anse des Lambis", "Anse de8 Lambis", "Spring Bay"],
    coordinateStatus: "approximate",
    coordinateNotes: "Old French name of Spring Bay, south coast of St. Croix.",
  },
  {
    originalName: "Anse de8 Partuuiers",
    displayName: "Tague Bay",
    canonicalName: "Tague Bay",
    featureType: "bay",
    island: "st_croix",
    aliases: ["Anse des Palétuviers", "Anse des Paletuviers", "Paretuvier", "Tague Bay"],
    coordinateStatus: "approximate",
    coordinateNotes: "Old French name of Tague Bay, north coast Eastend B Quarter, St. Croix.",
  },
  {
    originalName: "Anse des Bois Jauneu",
    displayName: "King Bay",
    canonicalName: "King Bay",
    featureType: "bay",
    island: "st_croix",
    aliases: ["Anse des Bois Jaunes", "Yellow-wood Cove", "King Bay", "Manning Bay"],
    coordinateStatus: "approximate",
    coordinateNotes: "Vicinity of King Bay or Manning Bay, Prince Quarter, St. Croix.",
  },
  {
    originalName: "Anse des Rurgots",
    displayName: "Robin Bay",
    canonicalName: "Robin Bay",
    featureType: "bay",
    island: "st_croix",
    aliases: ["Anse des Burgaux", "Hobin Bay", "Robin Bay"],
    coordinateStatus: "approximate",
    coordinateNotes: "Now Hobin/Robin Bay at Cottongrove, south coast Eastend B Quarter, St. Croix.",
  },
  {
    originalName: "Anso des Dunee",
    displayName: "Jack Bay",
    canonicalName: "Jack Bay",
    featureType: "bay",
    island: "st_croix",
    aliases: ["Anse des Dunes", "Dune Bay", "Jack Bay"],
    coordinateStatus: "approximate",
    coordinateNotes: "Old name of indentation west of Cape Cudejarre; apparently Jack Bay.",
  },
  {
    originalName: "Anse du Galel",
    displayName: "Halfpenny Bay",
    canonicalName: "Halfpenny Bay",
    featureType: "bay",
    island: "st_croix",
    aliases: ["Anse du Galel", "Anse à Galet", "Anse a Galet", "Pebble Cove", "Gravel Cove", "Manchenil Bay", "Halfpenny Bay"],
    coordinateStatus: "approximate",
    coordinateNotes: "French annotation applies to Manchenil or Halfpenny Bay, St. Croix.",
  },
  {
    originalName: "Anse du Milord",
    displayName: "Fareham Bay",
    canonicalName: "Fareham Bay",
    featureType: "bay",
    island: "st_croix",
    aliases: ["Anse du Milord", "Lord's Cove", "Fareham Bay"],
    coordinateStatus: "approximate",
    coordinateNotes: "One reference applies to Fareham Bay, south coast Eastend B Quarter; another may refer to Frederiksted landing.",
  },
  {
    originalName: "Anse Martel",
    displayName: "Martel Bay",
    canonicalName: "Martel Bay",
    featureType: "bay",
    island: "st_croix",
    aliases: ["Anse Martel", "Hammer Cove", "Martel Bay"],
    coordinateStatus: "approximate",
    coordinateNotes: "300 yards south-southwest of Shoy Point, north coast Eastend A Quarter, St. Croix.",
  },
  {
    originalName: "Arons",
    displayName: "Arons Estate",
    canonicalName: "Arons Estate",
    featureType: "estate",
    island: "st_thomas",
    aliases: ["Arons", "Arons Estate"],
    coordinateStatus: "approximate",
    coordinateNotes: "Historic estate approximately 1 mile northeast of Brewers Bay, St. Thomas.",
    notes: "Historic plantation listed in the Geographic Dictionary of the Virgin Islands.",
  },
  {
    originalName: "Arrecife Johnson",
    displayName: "Johnson Reef",
    canonicalName: "Johnson Reef",
    featureType: "reef",
    island: "st_john",
    aliases: ["Arrecife Johnson", "Johnson Reef"],
    coordinateStatus: "missing",
    coordinateNotes: "Reef off northwest shore of St. John; exact coordinate needs verification.",
  },
  {
    originalName: "Aspinall",
    displayName: "Aspinall",
    canonicalName: "Aspinall",
    island: "unknown",
    featureType: "reference",
    aliases: ["Aspinall"],
    coordinateStatus: "not-applicable",
    coordinateNotes: "Dictionary reference/person/source entry; not treated as a mappable place until verified.",
  },
  {
    originalName: "Augustti",
    displayName: "Little Green Cay",
    canonicalName: "Little Green Cay",
    featureType: "island",
    island: "st_croix",
    aliases: ["Augustti", "Ile Verte", "Cayo Verde", "Green Cay", "Little Green Cay"],
    coordinateStatus: "missing",
    coordinateNotes: "Known cay off north coast of St. Croix; exact coordinate needs verification.",
  },
  {
  originalName: "Awango Islaand",
  displayName: "Lovango Cay",
  canonicalName: "Lovango Cay",
  featureType: "island",
  island: "st_john",
  aliases: ["Awango Isla&", "Awango Islaand", "Awango Island", "Lavango Island", "Lovango Island", "Lovango Cay"],
  notes: "OCR cleanup. Historical spelling likely refers to Lovango/Lavango.",
  coordinateStatus: "missing",
  coordinateNotes: "Needs verification against modern Lovango Cay coordinates.",
},
{
  originalName: "Aztbert",
  displayName: "Aubert Estate",
  canonicalName: "Aubert Estate",
  featureType: "estate",
  island: "st_croix",
  aliases: [
    "Aztbert",
    "Aubert",
    "Aubert Estate"
  ],
  coordinateStatus: "approximate",
  coordinateNotes:
    "French colonial estate shown on the Lapointe 1671 map near Cornhill Estate, St. Croix. Exact location requires historical map georeferencing.",
  notes:
    "OCR correction. 'Aztbert' normalized to 'Aubert Estate'. French estate appearing on Lapointe's 1671 map."
},
{
  originalName: "Amesen",
  displayName: "Arnesen",
  canonicalName: "Arnesen",
  featureType: "reference",
  aliases: [
    "Amesen",
    "Arnesen",
    "H. L. Arnesen"
  ],
  island: "st_croix",
  coordinateStatus: "not-applicable",
  coordinateNotes:
    "Person referenced as the owner of multiple St. Croix estates in 1856.",
  notes:
    "OCR correction. Refers to H. L. Arnesen, who owned Sight, Sally's Fancy, Petronella, Lowry Hill, Hermon Hill, and Beck Grove in 1856. This is a person/reference entry, not a geographic feature."
}
];

function ruleMatchesContext(
  rule: GeographicAlphabeticalCleanupRule,
  context?: { description?: string; island?: string },
) {
  if (!context) return !rule.matchDescriptionIncludes?.length && !rule.matchIsland;

  if (rule.matchIsland && normalize(rule.matchIsland) !== normalize(context.island)) {
    return false;
  }

  if (rule.matchDescriptionIncludes?.length) {
    const description = normalize(context.description);
    return rule.matchDescriptionIncludes.every((part) =>
      description.includes(normalize(part)),
    );
  }

  return true;
}

export function findGeographicAlphabeticalCleanupRule(
  name?: string | null,
  context?: { description?: string; island?: string },
) {
  const key = normalize(name);

  const candidates = GEOGRAPHIC_ALPHABETICAL_CLEANUP_RULES.filter((rule) => {
    if (normalize(rule.originalName) === key) return true;
    if (normalize(rule.displayName) === key) return true;
    if (normalize(rule.canonicalName) === key) return true;
    return (rule.aliases || []).some((alias) => normalize(alias) === key);
  });

  return (
    candidates.find((rule) => ruleMatchesContext(rule, context)) ||
    candidates.find((rule) => !rule.matchDescriptionIncludes?.length && !rule.matchIsland) ||
    candidates[0]
  );
}