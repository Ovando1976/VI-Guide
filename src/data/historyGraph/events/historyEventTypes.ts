export type EvidenceStatus = "confirmed" | "probable" | "needs_archival_pull";

export type HistorySourceRef = {
  archive: string;
  citationKey?: string;
  series?: string;
  entry?: string;
  box?: string;
  item?: string;
  folio?: string;
  page?: string;
  note?: string;
};

export type EstateHistoryEventType =
  | "owner"
  | "alias"
  | "survey"
  | "tax"
  | "mortgage"
  | "probate"
  | "source_note";

export type EstateHistoryEvent = {
  id: string;
  estateCanonicalId: string;
  estateName: string;
  island: "st_thomas" | "st_john" | "st_croix";
  type: EstateHistoryEventType;
  dateFrom?: string;
  dateTo?: string;
  label: string;
  description?: string;
  personOrInstitution?: string;
  role?: string;
  evidenceStatus: EvidenceStatus;
  sourceRefs: HistorySourceRef[];
  notes?: string[];
};
