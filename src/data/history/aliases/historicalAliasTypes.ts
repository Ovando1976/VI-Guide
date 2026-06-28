export type HistoricalAliasConfidence = "confirmed" | "probable" | "possible";

export type HistoricalAliasSource = {
  source: string;
  pages?: string;
  quotation?: string;
  notes?: string;
};

export type HistoricalAliasRecord = {
  id: string;
  modernName: string;
  modernEstateId?: string;
  island: "st_thomas" | "st_john" | "st_croix" | "water_island";
  historicalNames: string[];
  proprietorNames: string[];
  frenchNames: string[];
  dutchNames: string[];
  danishNames: string[];
  englishNames: string[];
  firstKnownDate?: string;
  lastHistoricalUse?: string;
  confidence: HistoricalAliasConfidence;
  evidence: HistoricalAliasSource[];
};
