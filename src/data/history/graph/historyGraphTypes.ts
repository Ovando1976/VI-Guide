export type HistoryGraphNodeType =
  | "person"
  | "estate"
  | "estate_complex"
  | "place"
  | "document"
  | "map"
  | "source";

export type HistoryGraphEdgeType =
  | "owned"
  | "sold_to"
  | "mortgaged"
  | "guardian_of"
  | "alias_of"
  | "merged_into"
  | "component_of"
  | "near"
  | "mentioned_in"
  | "appears_on"
  | "requires_source";

export type HistoryGraphNode = {
  id: string;
  type: HistoryGraphNodeType;
  label: string;
  island?: "st_thomas" | "st_john" | "st_croix" | "water_island";
  confidence?: "confirmed" | "high" | "probable" | "possible" | "unresolved";
  notes?: string;
};

export type HistoryGraphEdge = {
  id: string;
  from: string;
  to: string;
  type: HistoryGraphEdgeType;
  label: string;
  date?: string;
  confidence: "confirmed" | "high" | "probable" | "possible" | "unresolved";
  source?: string;
  notes?: string;
};

export type HistoryGraph = {
  nodes: HistoryGraphNode[];
  edges: HistoryGraphEdge[];
};
