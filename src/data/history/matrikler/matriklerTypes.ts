export type MatriklerIsland = "st_thomas" | "st_john" | "st_croix";

export type MatriklerEntryConfidence =
  | "confirmed"
  | "probable"
  | "possible"
  | "unresolved";

export type MatriklerEntry = {
  id: string;
  year: number;
  island: MatriklerIsland;
  quarter?: string;
  estateName: string;
  historicalNames: string[];
  ownerNames: string[];
  acreage?: number;
  enslavedCount?: number;
  livestockCount?: number;
  cropOrUse?: string;
  neighboringEstates: string[];
  sourceLabel: string;
  sourcePage?: string;
  transcription?: string;
  confidence: MatriklerEntryConfidence;
  notes?: string;
};
