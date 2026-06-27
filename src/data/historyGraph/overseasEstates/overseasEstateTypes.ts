export type IslandCode = "st_thomas" | "st_john" | "st_croix";

export type OverseasSourceFamily =
  | "modern_gazetteer"
  | "land_list"
  | "matrikel"
  | "matrikeloplysningsskema"
  | "pantebog"
  | "probate"
  | "debt_liquidation"
  | "state_assets"
  | "map"
  | "nara_rg55"
  | "recorder_of_deeds"
  | "usvi_gis";

export type EstateAliasType =
  | "historical_name"
  | "owner_heading"
  | "merged_complex"
  | "subdivision"
  | "map_label"
  | "modern_gazetteer";

export type EstateAlias = {
  name: string;
  fromYear?: number;
  toYear?: number;
  aliasType: EstateAliasType;
  confidence: number;
  sourceRefs: string[];
};

export type GeometryCandidate = {
  id: string;
  sourceRef: string;
  label: string;
  confidence: number;
  notes?: string;
};

export type ArchivalProvenance = {
  sourceRef: string;
  sourceFamily: OverseasSourceFamily;
  repository?: string;
  collection?: string;
  series?: string;
  dateRange?: string;
  notes?: string;
};

export type HistoricalEstateNode = {
  canonicalId: string;
  canonicalName: string;
  island: IslandCode;
  quarterOrJurisdiction?: string;
  modernEstateMatch?: string;
  aliasNames: EstateAlias[];
  geometryCandidates: GeometryCandidate[];
  provenanceSummary: ArchivalProvenance[];
};

export type EstateStateInterventionEvent = {
  id: string;
  estateCanonicalId: string;
  eventType:
    | "private_bankruptcy"
    | "debt_liquidation"
    | "reverted_to_crown"
    | "crown_management"
    | "lease_of_royal_estate"
    | "sale_from_state_assets";
  eventStart?: string;
  eventEnd?: string;
  sourceRefs: string[];
  notes?: string;
};

export type EstateInventorySnapshot = {
  id: string;
  estateCanonicalId: string;
  snapshotDate?: string;
  sourceFamily: OverseasSourceFamily;
  acreageText?: string;
  cropText?: string;
  structures?: string[];
  laborCounts?: {
    enslaved?: number;
    free?: number;
    kingNegroes?: number;
  };
  valuationText?: string;
  sourceRefs: string[];
};
