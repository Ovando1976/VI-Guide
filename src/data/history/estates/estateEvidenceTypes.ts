export type EstateEvidenceConfidence =
  | "confirmed"
  | "high"
  | "probable"
  | "possible"
  | "unresolved";

export type EstateEvidenceSourceType =
  | "danish_archive"
  | "rigsarkivet"
  | "nara_rg55"
  | "recorder_of_deeds"
  | "national_register"
  | "nps"
  | "geographic_dictionary"
  | "map"
  | "secondary";

export type EstateEvidenceItem = {
  id: string;
  estateTargetId: string;
  modernEstateName: string;
  island: "st_thomas" | "st_john" | "st_croix";
  evidenceType:
    | "owner"
    | "alias"
    | "boundary"
    | "map_reference"
    | "deed"
    | "tax_record"
    | "probate"
    | "historic_district"
    | "complex_relationship"
  | "research_question";
  claim: string;
  dateText?: string;
  people: string[];
  historicalNames: string[];
  modernMatches: string[];
  sourceType: EstateEvidenceSourceType;
  sourceLabel: string;
  sourceLocator?: string;
  confidence: EstateEvidenceConfidence;
  notes?: string;
};
