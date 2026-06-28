export type HistoricalEvidenceConfidence =
  | "confirmed"
  | "probable"
  | "possible"
  | "rejected"
  | "unresolved";

export type HistoricalEvidenceItem = {
  id: string;
  targetName: string;
  normalizedTargetName: string;
  proposedModernName?: string;
  sourceId: string;
  sourceTitle: string;
  sourcePages?: string;
  evidenceText: string;
  evidenceType:
    | "name_match"
    | "alias_chain"
    | "map_label"
    | "deed_boundary"
    | "estate_holder"
    | "dictionary_entry";
  confidence: HistoricalEvidenceConfidence;
  notes?: string;
};
