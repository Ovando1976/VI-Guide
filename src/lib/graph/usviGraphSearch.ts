import type {
  UsviGraphEdge,
  UsviGraphNode,
  UsviKnowledgeGraph,
} from "../../data/graph/graphTypes";

export type UsviSearchResult = UsviGraphNode & {
  score: number;
  edges: UsviGraphEdge[];
};

let graphCache: UsviKnowledgeGraph | null = null;
let edgeIndexCache: Map<string, UsviGraphEdge[]> | null = null;

async function getGraph() {
  if (graphCache) return graphCache;

  const res = await fetch("/data/graph/usviKnowledgeGraph.json");
  if (!res.ok) throw new Error(`Failed to load USVI graph: ${res.status}`);

  graphCache = (await res.json()) as UsviKnowledgeGraph;
  return graphCache;
}

function normalize(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function getEdgeIndex() {
  if (edgeIndexCache) return edgeIndexCache;

  const { edges } = await getGraph();
  edgeIndexCache = new Map<string, UsviGraphEdge[]>();

  for (const edge of edges) {
    const existing = edgeIndexCache.get(edge.from) ?? [];
    existing.push(edge);
    edgeIndexCache.set(edge.from, existing);
  }

  return edgeIndexCache;
}

export async function searchUsviKnowledgeGraph({
  query,
  island,
  types,
  limit = 25,
}: {
  query: string;
  island?: string;
  types?: string[];
  limit?: number;
}): Promise<UsviSearchResult[]> {
  const { nodes } = await getGraph();
  const edgeIndex = await getEdgeIndex();
  const q = normalize(query);

  return nodes
    .filter((node) => !island || node.island === island)
    .filter((node) => !types?.length || types.includes(node.type))
    .map((node) => {
      const name = normalize(node.name);
      const type = normalize(node.type);
      const source = normalize(node.source);
      const haystack = `${name} ${type} ${source}`;

      let score = 0;

      if (!q) score += 1;
      else {
        if (name === q) score += 100;
        else if (name.startsWith(q)) score += 60;
        else if (name.includes(q)) score += 35;

        if (type.includes(q)) score += 15;
        if (haystack.includes(q)) score += 10;
      }

      return { ...node, score, edges: edgeIndex.get(node.id) ?? [] };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
