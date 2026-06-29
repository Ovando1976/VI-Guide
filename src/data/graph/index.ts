export type UsviGraphNode = { id: string; name: string; type: string; island?: string; lat?: number; lng?: number; source: string; sourceId: string; };
export type UsviGraphEdge = { id: string; from: string; to: string; type: string; distanceMeters?: number; };
export type UsviKnowledgeGraph = { stats: any; nodes: UsviGraphNode[]; edges: UsviGraphEdge[]; };

export async function fetchUsviKnowledgeGraph(): Promise<UsviKnowledgeGraph> {
  const res = await fetch("/data/graph/usviKnowledgeGraph.json");
  if (!res.ok) throw new Error("Graph data not found.");
  return res.json();
}