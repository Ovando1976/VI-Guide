import fs from "node:fs";
import path from "node:path";

const graphPath = path.join(process.cwd(), "generated/dictionary-graph.json");
const modulePath = path.join(process.cwd(), "src/data/dictionaryGraph.ts");

const graph = JSON.parse(fs.readFileSync(graphPath, "utf8"));

const badNames = new Set([
  "bay", "point", "road", "estate", "hill", "mountain",
  "island", "cay", "key", "quarter", "place", "harbor", "harbour"
]);

function norm(v: unknown) {
  return String(v ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const before = graph.nodes.length;
const kept = graph.nodes.filter((n: any) => !badNames.has(norm(n.label || n.name)));
const keptIds = new Set(kept.map((n: any) => n.id));

graph.nodes = kept;
graph.relationships = graph.relationships.filter(
  (r: any) => keptIds.has(r.sourceId) && keptIds.has(r.targetId)
);

fs.writeFileSync(graphPath, JSON.stringify(graph, null, 2));

fs.writeFileSync(modulePath, `import dictionaryGraphRaw from "../../generated/dictionary-graph.json";

export type DictionaryNode = {
  id: string;
  label?: string;
  name?: string;
  type?: string;
  featureType?: string;
  island?: string | null;
  quarter?: string | null;
  description?: string;
  aliases?: string[];
  lat?: number;
  lng?: number;
  source?: string;
  searchText?: string;
  raw?: unknown;
};

export type DictionaryRelationship = {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
};

export type DictionaryGraphStats = {
  nodes: number;
  relationships: number;
  dictionaryEntries: number;
  estates: number;
  quarters: number;
  coordinates: number;
  standalonePlaces: number;
};

export type DictionaryGraph = {
  nodes: DictionaryNode[];
  relationships: DictionaryRelationship[];
  stats: DictionaryGraphStats;
  metadata?: Record<string, unknown>;
};

const raw = dictionaryGraphRaw as { nodes: DictionaryNode[]; relationships: DictionaryRelationship[]; stats?: Partial<DictionaryGraphStats>; metadata?: Record<string, unknown> };

export const dictionaryGraph: DictionaryGraph = {
  nodes: raw.nodes || [],
  relationships: raw.relationships || [],
  metadata: raw.metadata || {},
  stats: {
    nodes: raw.nodes?.length || 0,
    relationships: raw.relationships?.length || 0,
    dictionaryEntries: raw.stats?.dictionaryEntries || raw.nodes?.filter((n) => n.type === "dictionary_entry").length || 0,
    estates: raw.stats?.estates || raw.nodes?.filter((n) => n.type === "estate").length || 0,
    quarters: raw.stats?.quarters || raw.nodes?.filter((n) => n.type === "quarter").length || 0,
    coordinates: raw.stats?.coordinates || raw.nodes?.filter((n) => typeof n.lat === "number" && typeof n.lng === "number").length || 0,
    standalonePlaces: raw.stats?.standalonePlaces || 0,
  },
};

export function getDictionaryNodeById(id: string) {
  return dictionaryGraph.nodes.find((node) => node.id === id) ?? null;
}

export function getRelationshipsForNode(id: string) {
  return dictionaryGraph.relationships.filter((rel) => rel.sourceId === id || rel.targetId === id);
}

export function getConnectedDictionaryNodes(id: string) {
  const ids = new Set<string>();
  for (const rel of getRelationshipsForNode(id)) {
    ids.add(rel.sourceId === id ? rel.targetId : rel.sourceId);
  }
  return dictionaryGraph.nodes.filter((node) => ids.has(node.id));
}

export function searchDictionaryGraph(query: string, limit = 300) {
  const q = query.trim().toLowerCase();
  if (!q) return dictionaryGraph.nodes.slice(0, limit);
  return dictionaryGraph.nodes.filter((node) =>
    [node.id, node.label, node.name, node.description, node.searchText].filter(Boolean).join(" ").toLowerCase().includes(q)
  ).slice(0, limit);
}

export default dictionaryGraph;
`);

console.log({ before, after: kept.length, removed: before - kept.length });
