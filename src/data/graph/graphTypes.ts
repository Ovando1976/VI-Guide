export type UsviGraphNode = {
  id: string;
  name: string;
  type: string;
  island?: string;
  lat?: number;
  lng?: number;
  source: string;
  sourceId: string;
};

export type UsviGraphEdge = {
  id: string;
  from: string;
  to: string;
  type: string;
  distanceMeters?: number;
};

export type UsviKnowledgeGraph = {
  stats: {
    generatedAt: string;
    totalNodes: number;
    geoNodes: number;
    totalEdges: number;
    byNodeType: Record<string, number>;
    byEdgeType: Record<string, number>;
  };
  nodes: UsviGraphNode[];
  edges: UsviGraphEdge[];
};
