export type EstateOwnerMatchConfidence = "high" | "moderate" | "low";

export type OriginalEstateOwnerMatch = {
  id: string;
  historicalNames: string[];
  earliestOwners: string[];
  currentEstateName: string;
  island: "st_thomas" | "st_john" | "st_croix" | "water_island";
  coordinates?: [number, number];
  confidence: EstateOwnerMatchConfidence;
  evidenceSummary: string;
  sourceNotes: string[];
};

export const originalEstateOwnerMatches: OriginalEstateOwnerMatch[] = [
  {
    id: "stj-browns-bay-bruyn-hendrichsen",
    historicalNames: ["Bruyn plantation", "Bruyn-Hendrichsen plantation", "Brownsbay plantation"],
    earliestOwners: ["Elisabet Thoma", "Mariane Thoma", "Michel Hendrichsen", "John Shatford Jones", "William Johnston", "William Brown"],
    currentEstateName: "Browns Bay Estate",
    island: "st_john",
    coordinates: [18.3604502, -64.7074843],
    confidence: "high",
    evidenceSummary: "Strong name continuity from Bruyn/Brown/Brownsbay to modern Browns Bay Estate.",
    sourceNotes: ["Danish National Archive materials summarized in Brown Bay research", "Modern Census estate gazetteer"],
  },
  {
    id: "stj-great-cinnamon-bay-cancel-bay",
    historicalNames: ["Cancel Bay", "Cinnamon Bay plantation"],
    earliestOwners: ["Daniel Jansen"],
    currentEstateName: "Great Cinnamon Bay Estate",
    island: "st_john",
    coordinates: [18.3530606, -64.7525738],
    confidence: "high",
    evidenceSummary: "National Register documentation equates Cancel Bay with Cinnamon Bay.",
    sourceNotes: ["National Register nomination", "Modern Census estate gazetteer"],
  },
  {
    id: "stj-leinster-bay-smith-bay",
    historicalNames: ["Smith Bay", "Leinster Bay"],
    earliestOwners: ["James E. Murphy"],
    currentEstateName: "Leinster Bay Estate",
    island: "st_john",
    coordinates: [18.3610101, -64.7180251],
    confidence: "high",
    evidenceSummary: "Documented rename from Smith Bay to Leinster Bay under Murphy.",
    sourceNotes: ["Annaberg ownership chronology", "Modern Census estate gazetteer"],
  },
  {
    id: "stx-canaan",
    historicalNames: ["Canaan"],
    earliestOwners: ["Cornelius Stallard", "Kipnass"],
    currentEstateName: "Canaan Estate",
    island: "st_croix",
    coordinates: [17.761062, -64.7999394],
    confidence: "high",
    evidenceSummary: "Beck and later manuscript maps preserve ownership references; modern estate name unchanged.",
    sourceNotes: ["Beck map variants", "Modern Census estate gazetteer"],
  },
  {
    id: "stx-granard",
    historicalNames: ["Granard"],
    earliestOwners: ["Richard Schmidt", "Christopher McEvoy"],
    currentEstateName: "Granard Estate",
    island: "st_croix",
    coordinates: [17.7136064, -64.7095849],
    confidence: "high",
    evidenceSummary: "Clear eighteenth-century ownership transition and modern name continuity.",
    sourceNotes: ["1750 map", "1760s map evidence", "Modern Census estate gazetteer"],
  },
  {
    id: "stx-judiths-fancy",
    historicalNames: ["Judith’s Fancy", "Judiths Fancy"],
    earliestOwners: ["Judith Aletta Kenney"],
    currentEstateName: "Judiths Fancy Estate",
    island: "st_croix",
    coordinates: [17.7743224, -64.7464895],
    confidence: "moderate",
    evidenceSummary: "Modern match is direct; early owner evidence is inferential in accessible documentation.",
    sourceNotes: ["St. Croix windmill documentation", "Modern Census estate gazetteer"],
  },
  {
    id: "stt-bordeaux",
    historicalNames: ["Plantage Bordeaux", "Estate Bordeaux", "Bordeaux"],
    earliestOwners: ["William Punnet", "James Kennedy", "A. Kerllerup"],
    currentEstateName: "Bordeaux Estate",
    island: "st_thomas",
    coordinates: [18.3568536, -65.0168926],
    confidence: "high",
    evidenceSummary: "Modern estate name unchanged; first accessible recorded transaction is 1832.",
    sourceNotes: ["National Register form", "Modern Census estate gazetteer"],
  },
  {
    id: "stt-hassel-island",
    historicalNames: ["Orkanshullet", "Hurricanehole", "Careeninghole", "Hassel Island"],
    earliestOwners: ["James Hazzel Sr.", "James Hazzel Jr."],
    currentEstateName: "Hassel Island Estate",
    island: "st_thomas",
    coordinates: [18.3294116, -64.9347047],
    confidence: "high",
    evidenceSummary: "Strong historical-to-modern match for island/estate complex.",
    sourceNotes: ["National Register nomination", "Modern Census estate gazetteer"],
  },
];
