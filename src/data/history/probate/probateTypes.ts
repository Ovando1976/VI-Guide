export type ProbateRecordType =
  | "skifte"
  | "distribution"
  | "registration"
  | "valuation"
  | "guardianship"
  | "debt_settlement";

export type ProbateConfidence =
  | "confirmed"
  | "probable"
  | "possible"
  | "unresolved";

export type ProbateResearchTarget = {
  id: string;
  familyNames: string[];
  personNames: string[];
  dateRange: string;
  island: "st_thomas";
  office: string;
  recordTypes: ProbateRecordType[];
  estates: string[];
  researchGoal: string;
  expectedEvidence: string[];
  confidence: ProbateConfidence;
  notes: string;
};
