export type EstateEvidenceStatus =
  | "confirmed"
  | "probable"
  | "needs_archival_pull";

export type EstateIsland = "st_thomas" | "st_john";

export type EstateOwnerRole =
  | "owner"
  | "seller"
  | "buyer"
  | "mission"
  | "state"
  | "heir"
  | "trustee"
  | "mortgagor"
  | "mortgagee";

export type EstateSourceRef = {
  archive:
    | "Rigsarkivet"
    | "NARA RG 55"
    | "Moravian Archives"
    | "USVI Recorder"
    | "USVI Tax Assessor"
    | "Federal Gazetteer"
    | "NPS / NRHP"
    | "Research Note";
  citationKey: string;
  series?: string;
  entry?: string;
  box?: string;
  item?: string;
  note?: string;
};

export type EstateOwnerEvent = {
  personOrInstitution: string;
  role: EstateOwnerRole;
  dateFrom?: string;
  dateTo?: string;
  evidenceStatus: EstateEvidenceStatus;
  sourceRefs: EstateSourceRef[];
};

export type EstateFirstRecord = {
  canonicalEstateId: string;
  island: EstateIsland;
  canonicalName: string;
  quarter?: string;
  historicalNames: string[];
  earliestNamedAppearance?: string;
  latestDanishPeriodAppearance?: string;
  ownerChain: EstateOwnerEvent[];
  evidenceStatus: EstateEvidenceStatus;
  stateStatus?: {
    reversionStatus?:
      | "reverted_to_crown"
      | "private_bankrupt"
      | "under_investigation"
      | "not_evidenced";
    liquidationYear?: number;
    sourceRefs: EstateSourceRef[];
  };
  modernMatches: {
    modernEstateName?: string;
    confidence: EstateEvidenceStatus;
    sourceRefs: EstateSourceRef[];
  }[];
  notes: string[];
  nextPulls: EstateSourceRef[];
};
