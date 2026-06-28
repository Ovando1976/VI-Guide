// src/types/estateKnowledge.ts
import type { Coordinates } from "../types";

export type EstateCategory =
  | "estate"
  | "historic_estate"
  | "plantation"
  | "harbor"
  | "settlement"
  | "quarter"
  | "place";

export type EstateCivicPlaceType =
  | "school"
  | "church"
  | "government_office"
  | "clinic"
  | "hospital"
  | "police"
  | "fire_station"
  | "post_office"
  | "park"
  | "cemetery"
  | "port"
  | "business"
  | "landmark"
  | "historic_site"
  | "transportation"
  | "other";

export type EstateCivicRelationship =
  | "inside_estate"
  | "near_estate"
  | "serves_estate"
  | "estate_unknown"
  | "review";

export type EstateCivicPlace = {
  id: string;
  name: string;
  type: EstateCivicPlaceType;
  estateName?: string;
  estateGeoid?: string;
  address?: string;
  coordinates?: Coordinates;
  relationship: EstateCivicRelationship;
  source?: string;
  notes?: string;
};

export type EstateRuleType =
  | "navigation"
  | "archive"
  | "property"
  | "civic"
  | "review"
  | "data_quality";

export type EstateRule = {
  id: string;
  title: string;
  description: string;
  ruleType: EstateRuleType;
};

export type EstateKnowledgeSourceType =
  | "official_estate_geometry"
  | "dictionary"
  | "archive"
  | "photo"
  | "map"
  | "historic_site"
  | "government"
  | "property"
  | "deed"
  | "national_park"
  | "habs_haer"
  | "danish_archive"
  | "tourism_context"
  | "manual_seed"
  | "other";

export type EstateKnowledgeSource = {
  id: string;
  label: string;
  url?: string;
  sourceType: EstateKnowledgeSourceType;
  accessDate?: string;
  query?: string;
  notes?: string;
};

export type EstateTimelineEvent = {
  year: string;
  event: string;
  sourceIds?: string[];
  confidence?: number;
};

export type ArchiveTargetFlags = {
  historicMaps: boolean;
  censusRecords: boolean;
  plantationDocuments: boolean;
  churchRecords: boolean;
  photographs: boolean;
  landRecords: boolean;
};

export type EstateKnowledgeStatus =
  | "seed"
  | "review"
  | "validated"
  | "verified";

export interface EstateKnowledge {
  estateId: string;
  geoid: string;

  estateName: string;
  normalizedName: string;
  aliases: string[];

  island: string;
  quarter?: string;
  quarterGroup?: string;

  category: EstateCategory;
  coordinates?: Coordinates;

  description?: string;
  historicSummary?: string;
  geography?: string;
  history?: string;
  significance?: string;
  danishName?: string;

  knownFor?: string[];

  relatedPlaces: string[];
  relatedHistoricSites: string[];
  relatedArchives: string[];

  civicPlaces: EstateCivicPlace[];
  estateRules: EstateRule[];

  archiveTargets: ArchiveTargetFlags;

  timeline?: EstateTimelineEvent[];
  sources?: EstateKnowledgeSource[];

  tags: string[];
  searchText: string;

  confidence?: number;
  status?: EstateKnowledgeStatus;
  lastValidatedAt?: string;
  notes?: string[];
}

export interface EstateKnowledgeIndex {
  generatedAt: string;
  totalEstates: number;
  records: EstateKnowledge[];
}