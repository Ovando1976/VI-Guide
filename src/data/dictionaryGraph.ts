import graphJson from "../../generated/dictionary-graph.json";

export type DictionaryNode = {
  id: string;
  label?: string;
  name?: string;
  type?: string;
  featureType?: string;
  island?: string;
  description?: string;
  aliases?: string[];
  searchText?: string;
  source?: string;
  lat?: number;
  lng?: number;
  [key: string]: unknown;
};

export type DictionaryGraph = {
  nodes: DictionaryNode[];
  relationships: unknown[];
  edges?: unknown[];
  metadata?: Record<string, unknown>;
};

const graph = graphJson as unknown as DictionaryGraph;

export const dictionaryGraph: DictionaryGraph = {
  nodes: Array.isArray(graph.nodes) ? graph.nodes : [],
  relationships: Array.isArray(graph.relationships)
    ? graph.relationships
    : Array.isArray(graph.edges)
      ? graph.edges
      : [],
  metadata: graph.metadata ?? {},
};

export const dictionaryGraphNodes = dictionaryGraph.nodes;
export const dictionaryGraphRelationships = dictionaryGraph.relationships;
export const dictionaryGraphMetadata = dictionaryGraph.metadata;

export default dictionaryGraph;


export function getConnectedDictionaryNodes(..._args: unknown[]) {
  return [];
}

export function getRelationshipsForNode(..._args: unknown[]) {
  return [];
}


export const dictionaryGraphStats = {
  nodes: Array.isArray((dictionaryGraph as any).nodes) ? (dictionaryGraph as any).nodes.length : 0,
  relationships: Array.isArray((dictionaryGraph as any).relationships) ? (dictionaryGraph as any).relationships.length : 0,
  dictionaryEntries: Array.isArray((dictionaryGraph as any).nodes)
    ? (dictionaryGraph as any).nodes.filter((n: any) => n.type === "dictionaryEntry").length
    : 0,
  standalonePlaces: Array.isArray((dictionaryGraph as any).nodes)
    ? (dictionaryGraph as any).nodes.filter((n: any) => n.type === "place").length
    : 0,
};

(dictionaryGraph as any).stats = dictionaryGraphStats;
