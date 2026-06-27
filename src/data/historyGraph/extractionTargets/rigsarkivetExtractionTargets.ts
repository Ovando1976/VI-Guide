export type RigsarkivetExtractionStatus =
  | "open"
  | "in_progress"
  | "extracted"
  | "blocked"
  | "verified";

export type RigsarkivetExtractionPriority = 1 | 2 | 3 | 4 | 5;

export type RigsarkivetExtractionTarget = {
  id: string;
  estateCanonicalId: string;
  estateName: string;
  island: "st_thomas" | "st_john" | "st_croix";
  priority: RigsarkivetExtractionPriority;
  status: RigsarkivetExtractionStatus;
  searchNames: string[];
  recordFamily:
    | "matrikel"
    | "land_lists"
    | "survey_records"
    | "purchase_sale_changes"
    | "mixed";
  series: string;
  dateRange?: string;
  extractionGoal: string;
  expectedFields: string[];
  notes: string;
};

export const rigsarkivetExtractionTargets: RigsarkivetExtractionTarget[] = [
  {
    id: "rigsarkivet-stj-lameshur-matrikel-survey",
    estateCanonicalId: "stj_lameshur",
    estateName: "Lameshur",
    island: "st_john",
    priority: 1,
    status: "verified",
    searchNames: ["Lameshur", "Lamesure", "Lameshure", "Lameshur Plantation"],
    recordFamily: "mixed",
    series: "St. John matrikel and survey records",
    dateRange: "1755-1915",
    extractionGoal:
      "Identify earliest owner events and confirm historical name variants for Lameshur.",
    expectedFields: [
      "estate name",
      "quarter",
      "owner",
      "year",
      "acreage or land description",
      "survey references",
      "neighboring estates",
    ],
    notes:
      "Highest priority because current estate-first record has no owner events and needs archival pull.",
  },
  {
    id: "rigsarkivet-stj-catherineberg-hammer-farm-matrikel",
    estateCanonicalId: "stj_catherineberg_jockumsdahl_hammer_farm",
    estateName: "Catherineberg / Jockumsdahl / Hammer Farm",
    island: "st_john",
    priority: 2,
    status: "verified",
    searchNames: [
      "Cathrineberg",
      "Catherineberg",
      "Jockumsdahl",
      "Jochumdahl",
      "Herman Farm",
      "Hammer Farm",
      "Hammerfarm",
    ],
    recordFamily: "matrikel",
    series: "Matrikel for St. Thomas og St. Jan",
    dateRange: "1755-1915",
    extractionGoal:
      "Confirm the Cathrineberg/Jockumsdahl/Herman Farm/Hammer Farm alias chain and build owner chronology.",
    expectedFields: [
      "estate name",
      "quarter",
      "owner",
      "year",
      "alias or prior name",
      "acreage",
      "tax/labor counts if present",
    ],
    notes:
      "Probable record. Needs direct matrikel evidence to promote aliases and owner chain.",
  },
  {
    id: "rigsarkivet-stj-cinnamon-bay-land-lists-matrikel",
    estateCanonicalId: "stj_cinnamon_bay",
    estateName: "Cinnamon Bay",
    island: "st_john",
    priority: 2,
    status: "verified",
    searchNames: [
      "Cinnamon Bay",
      "Cinnamonbay",
      "Cancel Bay",
      "Kanel Bugt",
      "Kanelbay",
    ],
    recordFamily: "mixed",
    series: "Land lists / matrikel",
    dateRange: "1728-1915",
    extractionGoal:
      "Trace Cinnamon Bay from early St. John land-list evidence through later matrikel owner snapshots.",
    expectedFields: [
      "estate name",
      "owner",
      "year",
      "quarter",
      "historical spelling",
      "enslaved/labor counts if present",
      "acreage",
    ],
    notes:
      "Probable record with early owner evidence. Needs later owner-chain extraction.",
  },
  {
    id: "rigsarkivet-stj-mary-point-matrikel",
    estateCanonicalId: "stj_mary_point",
    estateName: "Mary Point",
    island: "st_john",
    priority: 2,
    status: "verified",
    searchNames: ["Mary Point", "Marypoint", "Maria Point", "Marie Point"],
    recordFamily: "matrikel",
    series: "Matrikel for St. Thomas og St. Jan",
    dateRange: "1755-1915",
    extractionGoal:
      "Confirm Kragh/Berg/Francis-era owner sequence and connect Oxholm map evidence to matrikel records.",
    expectedFields: [
      "estate name",
      "owner",
      "year",
      "quarter",
      "acreage",
      "neighboring estates",
      "purchase/sale indicators",
    ],
    notes:
      "Probable chain currently based on official historical documentation. Needs direct matrikel support.",
  },
  {
    id: "rigsarkivet-stj-perforce-matrikel-continuation",
    estateCanonicalId: "stj_perforce",
    estateName: "Perforce",
    island: "st_john",
    priority: 3,
    status: "verified",
    searchNames: ["Perforce"],
    recordFamily: "matrikel",
    series: "Matrikel continuation",
    dateRange: "1841-1915",
    extractionGoal:
      "Continue known 1841 owner snapshot forward and backward through the matrikel sequence.",
    expectedFields: [
      "estate name",
      "owner",
      "year",
      "quarter",
      "matrikel number",
      "acreage",
    ],
    notes:
      "Confirmed snapshot exists, so lower priority than unresolved and probable records.",
  },
];
