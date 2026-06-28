export type DictionaryReviewStatus =
  | "unreviewed"
  | "approved"
  | "needs_correction"
  | "rejected";

export type DictionaryFeatureType =
  | "estate"
  | "quarter"
  | "bay"
  | "point"
  | "hill"
  | "cay_or_island"
  | "gut_or_stream"
  | "road"
  | "settlement"
  | "school"
  | "church"
  | "historic_site"
  | "coordinate"
  | "unknown";

export type DictionaryReviewEntry = {
  id: string;
  sourceName: string;
  normalizedName: string;
  cleanedName: string;
  featureType: DictionaryFeatureType;
  island: string | null;
  quarter: string | null;
  parentEstateGeoid: string | null;
  parentEstateName: string | null;
  confidence: number;
  description: string;
  cleanedDescription: string;
  status: DictionaryReviewStatus;
  notes: string;
};