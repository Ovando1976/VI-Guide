import transportGraphFile from "../../../public/data/transport/transportGraph.json";

export type TransportGraphNodeType =
  | "airport"
  | "ferry_terminal"
  | "cruise_port"
  | "taxi_stand"
  | "vitran_stop"
  | "safari_stop"
  | "school"
  | "ball_park"
  | "hospital"
  | "government"
  | "shopping"
  | "beach"
  | "historic_site"
  | "restaurant"
  | "attraction"
  | "community_hub"
  | "transport";

export type TransportGraphNode = {
  id: string;
  name: string;
  island: import("../../types").IslandCode;
  type: TransportGraphNodeType;
  lat: number;
  lng: number;
  aliases: string[];
  description: string;
  source: "transportNodes" | "canonicalDiscoveries";
  sourceId: string;
  routes: string[];
  canPickup: boolean;
  canDropoff: boolean;
  searchText: string;
};

export type TransportGraphFile = {
  generatedAt: string;
  stats: {
    totalNodes: number;
    byIsland: Record<string, number>;
    byType: Record<string, number>;
  };
  nodes: TransportGraphNode[];
};

export const transportGraph = transportGraphFile as TransportGraphFile;
export const transportGraphNodes = transportGraph.nodes;
export const transportGraphStats = transportGraph.stats;
