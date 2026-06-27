export type NaraExtractionStatus =
  | "open"
  | "in_progress"
  | "extracted"
  | "blocked"
  | "verified";

export type NaraExtractionTarget = {
  id: string;
  estateCanonicalId: string;
  estateName: string;
  island: "st_thomas" | "st_john" | "st_croix";
  priority: 1 | 2 | 3 | 4 | 5;
  status: NaraExtractionStatus;
  entry: string;
  box?: string;
  series: string;
  goal: string;
  expectedFields: string[];
  notes?: string;
};

export const naraRg55ExtractionTargets: NaraExtractionTarget[] = [
  {
    id: "nara-rg55-annas-retreat-entry-838",
    estateCanonicalId: "stt_annas_retreat_tutu",
    estateName: "Anna's Retreat",
    island: "st_thomas",
    priority: 1,
    status: "verified",
    entry: "838",
    box: "2006",
    series: "Register of Mortgages on St. Thomas Plantations, 1796-1849",
    goal: "Recover mortgage/title evidence for Anna's Retreat, Tutu, Tabor, Harmoni, Pogy, and Schifter.",
    expectedFields: ["estate name", "owner", "mortgagor", "mortgagee", "date", "instrument", "amount", "folio"],
  },
  {
    id: "nara-rg55-annas-retreat-entry-840",
    estateCanonicalId: "stt_annas_retreat_tutu",
    estateName: "Anna's Retreat",
    island: "st_thomas",
    priority: 1,
    status: "verified",
    entry: "840",
    box: "2007",
    series: "Register of Mortgages in the East End Quarter, 1808-1852",
    goal: "Check East End mortgage references for Tutu/Tabor/Harmoni/Anna's Retreat chain.",
    expectedFields: ["estate name", "quarter", "owner", "date", "mortgage parties", "folio"],
  },
  {
    id: "nara-rg55-annas-retreat-entry-842",
    estateCanonicalId: "stt_annas_retreat_tutu",
    estateName: "Anna's Retreat",
    island: "st_thomas",
    priority: 1,
    status: "verified",
    entry: "842",
    box: "2008",
    series: "Copies of Documents Recorded by the Court, 1807-1810",
    goal: "Search court-record copies immediately before the 1813 Pogy-to-Schifter hinge.",
    expectedFields: ["party names", "estate name", "document type", "date", "court reference"],
  },
  {
    id: "nara-rg55-new-herrnhut-entry-798",
    estateCanonicalId: "stt_new_herrnhut",
    estateName: "New Herrnhut",
    island: "st_thomas",
    priority: 2,
    status: "verified",
    entry: "798",
    box: "1952-1953",
    series: "Surveyor work papers on St. Thomas estates, 1820-1911",
    goal: "Recover survey evidence for New Herrnhut boundaries and Moravian estate layout.",
    expectedFields: ["survey date", "estate name", "acreage", "boundary notes", "neighboring estates", "map reference"],
  },
  {
    id: "nara-rg55-nisky-entry-798",
    estateCanonicalId: "stt_nisky",
    estateName: "Nisky",
    island: "st_thomas",
    priority: 2,
    status: "verified",
    entry: "798",
    box: "1952-1953",
    series: "Surveyor work papers on St. Thomas estates, 1820-1911",
    goal: "Recover survey evidence for Nisky parcelization and boundary links to New Herrnhut.",
    expectedFields: ["survey date", "estate name", "parcel", "acreage", "boundary notes", "map reference"],
  },
];
