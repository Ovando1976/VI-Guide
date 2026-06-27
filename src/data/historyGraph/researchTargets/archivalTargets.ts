export type ArchivalTargetStatus =
  | "open"
  | "requested"
  | "located"
  | "transcribed"
  | "verified"
  | "closed";

export type ArchivalResearchTarget = {
  id: string;
  title: string;
  status: ArchivalTargetStatus;
  priority: 1 | 2 | 3;
  relatedEdgeIds: string[];
  repository: string;
  collectionPath: string;
  dateRange: string;
  searchTerms: string[];
  goal: string;
  expectedProof: string[];
  notes: string;
};

export const archivalResearchTargets: ArchivalResearchTarget[] = [
  {
    id: "target:deed:pogy-schifter-annas-retreat:1813",
    title: "Locate 1813 Pogy to Schifter deed for Anna's Retreat",
    status: "open",
    priority: 1,
    relatedEdgeIds: ["edge:sale:pogy:schifter:annas-retreat:1813"],
    repository: "Rigsarkivet / Virgin Islands land records",
    collectionPath:
      "Vestindiske lokalarkiver > St. Thomas og St. Jan Guvernementsarkiv > Skøde- og Pantebøger / Panteprotokoller",
    dateRange: "1813",
    searchTerms: [
      "Octavius Pogy",
      "Octavius Pogh",
      "Erasmus Frederick Schifter",
      "Anna's Retreat",
      "Tutu",
      "Tabor",
      "Harmonie",
      "Harmoni"
    ],
    goal:
      "Verify the reported 1813 deed transferring Tutu, Tabor, and Harmonie under the name Anna's Retreat from Octavius Pogy to Erasmus Frederick Schifter.",
    expectedProof: [
      "Grantor and grantee names",
      "Estate names Tutu, Tabor, Harmonie, or Anna's Retreat",
      "Date of conveyance",
      "Boundaries, acreage, or neighboring estates",
      "Mortgage or debt references"
    ],
    notes:
      "This is the primary-source verification needed to upgrade the Pogy to Schifter sale edge from probable to confirmed.",
  },
];
