export type EstateResearchPriority = 1 | 2 | 3;
export type EstateResearchStatus =
  | "not_started"
  | "needs_primary_sources"
  | "partially_matched"
  | "owner_matched"
  | "complex_footprint";

export type EstateResearchTarget = {
  id: string;
  modernEstateName: string;
  island: "st_thomas" | "st_john" | "st_croix";
  priority: EstateResearchPriority;
  status: EstateResearchStatus;
  researchQuestion: string;
  likelySources: string[];
  notes: string;
};

export const estateResearchTargets: EstateResearchTarget[] = [
  {
    id: "stj-hammer-farm",
    modernEstateName: "Hammer Farm",
    island: "st_john",
    priority: 1,
    status: "needs_primary_sources",
    researchQuestion: "Identify earliest owner and whether Hammer Farm connects to Danish-period plantation boundaries.",
    likelySources: ["Rigsarkivet land registers", "St. John tax rolls", "NPS cultural landscape records", "RG 55"],
    notes: "Modern estate confirmed; owner chain still needs primary documentation.",
  },
  {
    id: "stj-lameshur",
    modernEstateName: "Lameshur",
    island: "st_john",
    priority: 1,
    status: "needs_primary_sources",
    researchQuestion: "Trace Danish-era plantation ownership and aliases for Lameshur.",
    likelySources: ["Oxholm maps", "Danish cadastral records", "NPS St. John plantation studies", "RG 55"],
    notes: "High-value St. John target because NPS-related records may preserve strong evidence.",
  },
  {
    id: "stt-nisky",
    modernEstateName: "Nisky",
    island: "st_thomas",
    priority: 1,
    status: "needs_primary_sources",
    researchQuestion: "Find earliest documented owner and name variants for Nisky.",
    likelySources: ["Rigsarkivet land records", "St. Thomas deed books", "Geographic Dictionary", "RG 55"],
    notes: "Important St. Thomas estate with likely colonial continuity.",
  },
  {
    id: "stt-annas-retreat",
    modernEstateName: "Anna's Retreat",
    island: "st_thomas",
    priority: 1,
    status: "needs_primary_sources",
    researchQuestion: "Determine earliest owner, historical spellings, and whether the modern estate footprint matches the Danish-period estate.",
    likelySources: ["Danish land registers", "Recorder of Deeds", "Geographic Dictionary", "historic maps"],
    notes: "Major modern estate; likely important for public-facing VI Guide history.",
  },
  {
    id: "stt-solberg",
    modernEstateName: "Solberg",
    island: "st_thomas",
    priority: 2,
    status: "needs_primary_sources",
    researchQuestion: "Identify original owner and Danish-era estate continuity.",
    likelySources: ["Rigsarkivet", "RG 55", "St. Thomas maps", "Geographic Dictionary"],
    notes: "Needs archival confirmation.",
  },
  {
    id: "stx-cane-garden",
    modernEstateName: "Cane Garden",
    island: "st_croix",
    priority: 1,
    status: "needs_primary_sources",
    researchQuestion: "Build owner chain from Danish-era maps and land-tax records.",
    likelySources: ["Beck map", "Oxholm map", "St. Croix land-tax records", "Recorder of Deeds"],
    notes: "Likely strong St. Croix map evidence.",
  },
  {
    id: "stx-bethlehem",
    modernEstateName: "Bethlehem",
    island: "st_croix",
    priority: 1,
    status: "needs_primary_sources",
    researchQuestion: "Identify earliest documented owner and map continuity.",
    likelySources: ["Beck map", "Oxholm map", "Danish cadastral records", "St. Croix deed records"],
    notes: "High-value St. Croix estate target.",
  },
  {
    id: "stj-annaberg-complex",
    modernEstateName: "Annaberg Historic District / north-shore complex",
    island: "st_john",
    priority: 1,
    status: "complex_footprint",
    researchQuestion: "Model Annaberg as a complex historical footprint involving Annaberg, Mary Point, Betty's Hope, Leinster Bay, and Brown Bay relationships.",
    likelySources: ["NPS Annaberg HABS", "NPS cultural landscape report", "Danish land records", "Oxholm maps"],
    notes: "Do not force one-to-one modern estate matching. Treat as a multi-estate historical complex.",
  },
];
