import { mkdirSync, writeFileSync } from "node:fs";

import { canonicalDiscoveries } from "../../src/data/canonical/discoveriesCanonical";
import { transportNodes } from "../../src/data/transport/transportNodes";
import { schoolTransportNodes } from "../../src/data/transport/schools";
import { sportsTransportNodes } from "../../src/data/transport/sportsFacilities";
import { vitranStopNodes } from "../../src/data/transport/vitranStops";
import type { IslandCode } from "../../src/types";

type GraphNodeType =
  | "airport"
  | "ferry_terminal"
  | "cruise_port"
  | "taxi_stand"
  | "vitran_stop"
  | "bus_stop"
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

type TransportGraphNode = {
  id: string;
  name: string;
  island: IslandCode;
  type: GraphNodeType;
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

type TransportGraphFile = {
  generatedAt: string;
  stats: {
    totalNodes: number;
    byIsland: Record<string, number>;
    byType: Record<string, number>;
  };
  nodes: TransportGraphNode[];
};

function normalizeIsland(value: unknown): IslandCode {
  const text = String(value ?? "").toLowerCase().trim();

  if (text === "stt" || text === "st_thomas" || text === "st. thomas") return "st_thomas";
  if (text === "stj" || text === "st_john" || text === "st. john") return "st_john";
  if (text === "stx" || text === "st_croix" || text === "st. croix") return "st_croix";
  if (text === "wat" || text === "water_island") return "water_island";

  return "st_thomas";
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slug(value: unknown) {
  return normalizeText(value).replace(/\s+/g, "-") || "unknown";
}

function validCoords(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
  );
}

function inferType(record: (typeof canonicalDiscoveries)[number]): GraphNodeType | null {
  const category = normalizeText(record.category);
  const type = normalizeText(record.type);
  const title = normalizeText(record.title);
  const haystack = `${category} ${type} ${title}`;

  if (haystack.includes("school") || haystack.includes("academy") || haystack.includes("university")) return "school";
  if (haystack.includes("ballpark") || haystack.includes("ball park") || haystack.includes("stadium") || haystack.includes("field")) return "ball_park";
  if (haystack.includes("hospital") || haystack.includes("clinic") || haystack.includes("medical")) return "hospital";
  if (haystack.includes("government") || haystack.includes("courthouse") || haystack.includes("office")) return "government";
  if (category === "shopping" || haystack.includes("mall") || haystack.includes("market")) return "shopping";
  if (category === "beach") return "beach";
  if (category === "history" || category === "historic site" || category === "historic") return "historic_site";
  if (category === "restaurant") return "restaurant";
  if (category === "transport" || category === "transportation") return "transport";
  if (category === "attraction") return "attraction";

  return null;
}

const sourceTransportNodes = [...transportNodes, ...schoolTransportNodes, ...sportsTransportNodes, ...vitranStopNodes];

const manualNodes: TransportGraphNode[] = sourceTransportNodes.map((node) => ({
  id: node.id,
  name: node.name,
  island: node.island,
  type: node.type,
  lat: node.lat,
  lng: node.lng,
  aliases: node.aliases,
  description: node.description,
  source: "transportNodes",
  sourceId: node.id,
  routes: node.routes ?? [],
  canPickup: node.canPickup,
  canDropoff: node.canDropoff,
  searchText: normalizeText([
    node.id,
    node.name,
    node.type,
    node.description,
    ...(node.aliases ?? []),
    ...(node.routes ?? []),
  ].join(" ")),
}));

const discoveredNodes: TransportGraphNode[] = canonicalDiscoveries
  .map((record) => {
    const type = inferType(record);
    if (!type) return null;
    if (!validCoords(record.lat, record.lng)) return null;

    const island = normalizeIsland(record.island);
    const name = record.title || "Unnamed transportation node";
    const id = `discovery-${type}-${island}-${slug(name)}`;

    return {
      id,
      name,
      island,
      type,
      lat: record.lat,
      lng: record.lng,
      aliases: [...new Set([...(record.tags ?? []), record.normalizedTitle].filter(Boolean))],
      description: record.description || `${name} transportation node.`,
      source: "canonicalDiscoveries" as const,
      sourceId: record.id,
      routes: [],
      canPickup: true,
      canDropoff: true,
      searchText: normalizeText([
        id,
        name,
        type,
        island,
        record.category,
        record.description,
        ...(record.tags ?? []),
        record.searchText,
      ].join(" ")),
    };
  })
  .filter((node): node is TransportGraphNode => Boolean(node));

const byKey = new Map<string, TransportGraphNode>();

for (const node of [...manualNodes, ...discoveredNodes]) {
  const key = `${node.island}:${normalizeText(node.name)}:${node.type}`;
  const existing = byKey.get(key);

  if (!existing) {
    byKey.set(key, node);
    continue;
  }

  byKey.set(key, {
    ...existing,
    aliases: [...new Set([...existing.aliases, ...node.aliases])],
    routes: [...new Set([...existing.routes, ...node.routes])],
    searchText: normalizeText(`${existing.searchText} ${node.searchText}`),
  });
}

const nodes = [...byKey.values()].sort((a, b) =>
  `${a.island}-${a.type}-${a.name}`.localeCompare(`${b.island}-${b.type}-${b.name}`),
);

const stats = {
  totalNodes: nodes.length,
  byIsland: {} as Record<string, number>,
  byType: {} as Record<string, number>,
};

for (const node of nodes) {
  stats.byIsland[node.island] = (stats.byIsland[node.island] ?? 0) + 1;
  stats.byType[node.type] = (stats.byType[node.type] ?? 0) + 1;
}

const graph: TransportGraphFile = {
  generatedAt: new Date().toISOString(),
  stats,
  nodes,
};

mkdirSync("public/data/transport", { recursive: true });
mkdirSync("src/data/transport", { recursive: true });

writeFileSync("public/data/transport/transportGraph.json", JSON.stringify(graph, null, 2));

writeFileSync(
  "src/data/transport/transportGraph.ts",
  `import transportGraphFile from "../../../public/data/transport/transportGraph.json";

export type TransportGraphNodeType =
  | "airport"
  | "ferry_terminal"
  | "cruise_port"
  | "taxi_stand"
  | "vitran_stop"
  | "bus_stop"
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
`,
);

console.log("Transport graph built.");
console.log(stats);
