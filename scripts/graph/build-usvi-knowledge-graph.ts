import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { transportGraphNodes } from "../../src/data/transport/transportGraph";
import { atlasRecords } from "../../src/data/atlas/masterAtlas";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = join(scriptDir, "..", "..");
const publicGraphDir = join(rootDir, "public/data/graph");
const srcGraphDir = join(rootDir, "src/data/graph");
const publicGraphFile = join(publicGraphDir, "usviKnowledgeGraph.json");
const srcGraphIndex = join(srcGraphDir, "index.ts");

// --- Types ---
type GraphNode = { id: string; name: string; type: string; island?: string; lat?: number; lng?: number; source: string; sourceId: string; };
type GraphEdge = { id: string; from: string; to: string; type: string; distanceMeters?: number; };

// --- Geometry Helpers ---
function isFiniteCoord(lat?: unknown, lng?: unknown) { return Number.isFinite(lat) && Number.isFinite(lng); }
function meters(a: GraphNode, b: GraphNode) {
  if (!isFiniteCoord(a.lat, a.lng) || !isFiniteCoord(b.lat, b.lng)) return Infinity;
  const r = 6371000;
  const lat1 = ((a.lat as number) * Math.PI) / 180;
  const lat2 = ((b.lat as number) * Math.PI) / 180;
  const dLat = (((b.lat as number) - (a.lat as number)) * Math.PI) / 180;
  const dLng = (((b.lng as number) - (a.lng as number)) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * r * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
}

function clean(value: unknown) { return String(value ?? "").trim(); }

// --- Node Processing ---
const atlasNodes: GraphNode[] = atlasRecords.map((record: any): GraphNode | null => {
  const name = clean(record.name || record.title || record.displayName);
  if (!name) return null;
  return { id: `atlas:${record.id}`, name, type: clean(record.type || record.category || "place"), island: clean(record.island) || undefined, lat: typeof record.lat === "number" ? record.lat : undefined, lng: typeof record.lng === "number" ? record.lng : undefined, source: "atlas", sourceId: String(record.id) };
}).filter(Boolean) as GraphNode[];

const transportNodes: GraphNode[] = transportGraphNodes.map((node) => ({ id: `transport:${node.id}`, name: node.name, type: node.type, island: node.island, lat: node.lat, lng: node.lng, source: "transportGraph", sourceId: node.id }));
const nodesById = new Map<string, GraphNode>();
[...atlasNodes, ...transportNodes].forEach(n => { if(!nodesById.has(n.id)) nodesById.set(n.id, n); });
const nodes = [...nodesById.values()];
const geoNodes = nodes.filter((node) => isFiniteCoord(node.lat, node.lng));

// --- Edge Logic ---
const edges: GraphEdge[] = [];
const edgeKeys = new Set<string>();
function addEdge(edge: GraphEdge) {
  const key = `${edge.from}|${edge.to}|${edge.type}`;
  if (edge.from === edge.to || edgeKeys.has(key)) return;
  edgeKeys.add(key);
  edges.push(edge);
}

function nearestOfType(source: GraphNode, types: string[], maxMeters: number): GraphNode | null {
  const candidates = geoNodes
    .filter((node) => node.id !== source.id && (!source.island || !node.island || node.island === source.island) && types.includes(node.type))
    .map((node) => ({ node, distance: meters(source, node) }))
    .filter((item) => item.distance <= maxMeters)
    .sort((a, b) => a.distance - b.distance);
  return candidates[0]?.node ?? null;
}

const relationshipTargets = [
  { type: "nearest_bus_stop", nodeTypes: ["bus_stop", "vitran_stop"], maxMeters: 2500 },
  { type: "nearest_transport", nodeTypes: ["bus_stop", "vitran_stop", "ferry_terminal", "airport", "cruise_port", "taxi_stand"], maxMeters: 3500 },
  { type: "nearest_school", nodeTypes: ["school"], maxMeters: 3500 },
  { type: "nearest_beach", nodeTypes: ["beach"], maxMeters: 5000 },
  { type: "nearest_hospital", nodeTypes: ["hospital"], maxMeters: 8000 },
  { type: "nearest_ferry", nodeTypes: ["ferry_terminal"], maxMeters: 10000 },
];

geoNodes.forEach(node => {
  relationshipTargets.forEach(target => {
    const nearest = nearestOfType(node, target.nodeTypes, target.maxMeters);
    if (nearest) addEdge({ id: `${node.id}->${nearest.id}:${target.type}`, from: node.id, to: nearest.id, type: target.type, distanceMeters: meters(node, nearest) });
  });
});

geoNodes.forEach(node => {
  const nearby = geoNodes
    .filter((other) => other.id !== node.id && (!node.island || !other.island || node.island === other.island))
    .map((other) => ({ node: other, distance: meters(node, other) }))
    .filter((item) => item.distance <= 750)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 8);
  nearby.forEach(item => addEdge({ id: `${node.id}->${item.node.id}:nearby`, from: node.id, to: item.node.id, type: "nearby", distanceMeters: item.distance }));
});

const stats = { generatedAt: new Date().toISOString(), totalNodes: nodes.length, geoNodes: geoNodes.length, totalEdges: edges.length };
const graph = { stats, nodes, edges };

// --- Write Artifacts ---
mkdirSync("public/data/graph", { recursive: true });
mkdirSync("src/data/graph", { recursive: true });

// 1. Static JSON (Vite/Rollup ignores this folder)
writeFileSync("public/data/graph/usviKnowledgeGraph.json", JSON.stringify(graph, null, 2));

// 2. Types/Loader (NO imports allowed here)
writeFileSync(
  "src/data/graph/index.ts",
  `export type UsviGraphNode = { id: string; name: string; type: string; island?: string; lat?: number; lng?: number; source: string; sourceId: string; };
export type UsviGraphEdge = { id: string; from: string; to: string; type: string; distanceMeters?: number; };
export type UsviKnowledgeGraph = { stats: any; nodes: UsviGraphNode[]; edges: UsviGraphEdge[]; };

export async function fetchUsviKnowledgeGraph(): Promise<UsviKnowledgeGraph> {
  const res = await fetch("/data/graph/usviKnowledgeGraph.json");
  if (!res.ok) throw new Error("Graph data not found.");
  return res.json();
}`
);

console.log("Graph built successfully. Types written to src/data/graph/index.ts");
