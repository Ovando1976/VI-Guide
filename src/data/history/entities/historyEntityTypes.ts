export type HistoryEntityKind =
  | "person"
  | "place"
  | "organization"
  | "event"
  | "document";

export type HistoryRelationshipKind =
  | "mentions"
  | "connected_to"
  | "located_at"
  | "participated_in"
  | "documented_by"
  | "occurred_in_year";

export type HistoryEntity = {
  id: string;
  kind: HistoryEntityKind;
  name: string;
  aliases: string[];
  description?: string;
  sourceIds: string[];
  confidence: number;
};

export type HistoryRelationship = {
  id: string;
  fromId: string;
  toId: string;
  kind: HistoryRelationshipKind;
  sourceRecordId: string;
  confidence: number;
};
