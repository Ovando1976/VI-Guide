export type UsviRecorderExtractionStatus =
  | "open"
  | "in_progress"
  | "extracted"
  | "blocked"
  | "verified";

export type UsviRecorderExtractionTarget = {
  id: string;
  estateCanonicalId: string;
  estateName: string;
  island: "st_thomas" | "st_john" | "st_croix";
  priority: 1 | 2 | 3 | 4 | 5;
  status: UsviRecorderExtractionStatus;
  archive: "USVI Recorder";
  series: string;
  goal: string;
  expectedFields: string[];
  notes?: string;
};

export const usviRecorderExtractionTargets: UsviRecorderExtractionTarget[] = [
  {
    id: "usvi-recorder-stj-carolina-deed-file",
    estateCanonicalId: "stj_carolina",
    estateName: "Carolina",
    island: "st_john",
    priority: 1,
    status: "verified",
    archive: "USVI Recorder",
    series: "Estate Carolina deed file cited by NPS",
    goal: "Extract deed-chain evidence for Estate Carolina and connect Recorder evidence to the estate graph.",
    expectedFields: ["estate name", "grantor", "grantee", "date", "instrument type", "parcel or boundary description", "recording reference"],
    notes: "Single confirmed USVI Recorder next-pull target from the priority audit.",
  },
];
