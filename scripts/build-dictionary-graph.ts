#!/usr/bin/env tsx

import fs from "node:fs/promises";
import path from "node:path";

const ENGINE_JSON = path.join(
  process.cwd(),
  "generated",
  "dictionary-knowledge-engine.json"
);
const QUARTERS_JSON = path.join(
  process.cwd(),
  "generated",
  "quarter-feature-links.deduped.json"
);

const OUT_JSON = path.join(process.cwd(), "generated", "dictionary-graph.json");
const OUT_TS = path.join(process.cwd(), "src/data/dictionaryGraph.ts");

type NodeType =
  | "dictionary_entry"
  | "estate"
  | "quarter"
  | "coordinate"
  | "standalone_place";

type RelationshipType =
  | "describes"
  | "has_feature"
  | "inside_quarter"
  | "has_coordinate"
  | "standalone_place"
  | "mentions";

type GraphNode = {
  id: string;
  type: NodeType;
  label: string;
  island: string | null;
  quarter: string | null;
  featureType: string | null;
  description: string | null;
  lat?: number | null;
  lng?: number | null;
};

type GraphRelationship = {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  confidence: number;
  source: string;
};

type Graph = {
  generatedAt: string;
  stats: {
    nodes: number;
    relationships: number;
    dictionaryEntries: number;
    estates: number;
    quarters: number;
    coordinates: number;
    standalonePlaces: number;
  };
  nodes: GraphNode[];
  relationships: GraphRelationship[];
};

function slug(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function addNode(map: Map<string, GraphNode>, node: GraphNode) {
  if (!map.has(node.id)) map.set(node.id, node);
}

function addRel(
  map: Map<string, GraphRelationship>,
  rel: Omit<GraphRelationship, "id">
) {
  const id = `${rel.type}:${rel.sourceId}->${rel.targetId}`;
  if (!map.has(id)) map.set(id, { id, ...rel });
}

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await fs.readFile(file, "utf8")) as T;
}

async function main() {
  const engine = await readJson<any>(ENGINE_JSON);

  const quarters = await readJson<any>(QUARTERS_JSON).catch(() => ({
    quarterFeatureLinks: engine.quarterFeatureLinks ?? [],
  }));

  const nodes = new Map<string, GraphNode>();
  const rels = new Map<string, GraphRelationship>();

  for (const entry of engine.dictionaryEntries ?? []) {
    addNode(nodes, {
      id: `entry:${entry.id}`,
      type: "dictionary_entry",
      label: entry.cleanedName || entry.sourceName || entry.id,
      island: entry.island ?? null,
      quarter: entry.quarterGroup ?? entry.quarter ?? null,
      featureType: entry.featureType ?? null,
      description: entry.cleanedDescription ?? entry.description ?? null,
    });
  }

  for (const estateLink of engine.estateFeatureLinks ?? []) {
    const estateId = `estate:${estateLink.estateGeoid}`;

    addNode(nodes, {
      id: estateId,
      type: "estate",
      label: estateLink.estateName,
      island: estateLink.island ?? null,
      quarter: estateLink.quarterGroup ?? estateLink.quarter ?? null,
      featureType: "estate",
      description: null,
    });

    const quarterLabel = estateLink.quarterGroup ?? estateLink.quarter ?? null;

    if (quarterLabel) {
      const quarterId = `quarter:${estateLink.island}:${slug(quarterLabel)}`;

      addNode(nodes, {
        id: quarterId,
        type: "quarter",
        label: quarterLabel,
        island: estateLink.island ?? null,
        quarter: quarterLabel,
        featureType: "quarter",
        description: null,
      });

      addRel(rels, {
        sourceId: estateId,
        targetId: quarterId,
        type: "inside_quarter",
        confidence: 100,
        source: "estate dataset",
      });
    }

    for (const feature of estateLink.features ?? []) {
      const entryId = `entry:${feature.entryId}`;

      addRel(rels, {
        sourceId: estateId,
        targetId: entryId,
        type: "has_feature",
        confidence: feature.confidence ?? 100,
        source: "Geographic Dictionary of the Virgin Islands",
      });

      addRel(rels, {
        sourceId: entryId,
        targetId: estateId,
        type: "describes",
        confidence: feature.confidence ?? 100,
        source: "Geographic Dictionary of the Virgin Islands",
      });
    }
  }

  for (const quarterLink of quarters.quarterFeatureLinks ?? []) {
    const quarterId = `quarter:${quarterLink.island}:${slug(quarterLink.quarter)}`;

    addNode(nodes, {
      id: quarterId,
      type: "quarter",
      label: quarterLink.quarter,
      island: quarterLink.island ?? null,
      quarter: quarterLink.quarter ?? null,
      featureType: "quarter",
      description: null,
    });

    for (const feature of quarterLink.features ?? []) {
      const entryId = `entry:${feature.entryId}`;

      addRel(rels, {
        sourceId: quarterId,
        targetId: entryId,
        type: "has_feature",
        confidence: feature.confidence ?? 100,
        source: "Geographic Dictionary of the Virgin Islands",
      });
    }
  }

  for (const coord of engine.dictionaryCoordinates ?? []) {
    const coordId = `coord:${coord.entryId}:${coord.lat}:${coord.lng}`;
    const entryId = `entry:${coord.entryId}`;
    const estateId = `estate:${coord.linkedEstateGeoid}`;

    addNode(nodes, {
      id: coordId,
      type: "coordinate",
      label: coord.sourceName,
      island: null,
      quarter: null,
      featureType: "coordinate",
      description: coord.description ?? null,
      lat: coord.lat,
      lng: coord.lng,
    });

    addRel(rels, {
      sourceId: entryId,
      targetId: coordId,
      type: "has_coordinate",
      confidence: coord.confidence ?? 100,
      source: "Geographic Dictionary of the Virgin Islands",
    });

    addRel(rels, {
      sourceId: estateId,
      targetId: coordId,
      type: "has_coordinate",
      confidence: coord.confidence ?? 100,
      source: "point-in-estate-polygon",
    });
  }

  for (const place of engine.standaloneDictionaryPlaces ?? []) {
    const placeId = `place:${place.entryId}`;
    const entryId = `entry:${place.entryId}`;

    addNode(nodes, {
      id: placeId,
      type: "standalone_place",
      label: place.name,
      island: place.island ?? null,
      quarter: place.quarter ?? null,
      featureType: place.type ?? null,
      description: place.description ?? null,
    });

    addRel(rels, {
      sourceId: placeId,
      targetId: entryId,
      type: "standalone_place",
      confidence: 100,
      source: "Geographic Dictionary of the Virgin Islands",
    });
  }

  const graph: Graph = {
    generatedAt: new Date().toISOString(),
    stats: {
      nodes: nodes.size,
      relationships: rels.size,
      dictionaryEntries: [...nodes.values()].filter(
        (node) => node.type === "dictionary_entry"
      ).length,
      estates: [...nodes.values()].filter((node) => node.type === "estate").length,
      quarters: [...nodes.values()].filter((node) => node.type === "quarter").length,
      coordinates: [...nodes.values()].filter(
        (node) => node.type === "coordinate"
      ).length,
      standalonePlaces: [...nodes.values()].filter(
        (node) => node.type === "standalone_place"
      ).length,
    },
    nodes: [...nodes.values()],
    relationships: [...rels.values()],
  };

  await fs.writeFile(OUT_JSON, JSON.stringify(graph, null, 2));

  const ts = `export type DictionaryGraphNode = {
  id: string;
  type:
    | "dictionary_entry"
    | "estate"
    | "quarter"
    | "coordinate"
    | "standalone_place";
  label: string;
  island: string | null;
  quarter: string | null;
  featureType: string | null;
  description: string | null;
  lat?: number | null;
  lng?: number | null;
};

export type DictionaryGraphRelationship = {
  id: string;
  sourceId: string;
  targetId: string;
  type:
    | "describes"
    | "has_feature"
    | "inside_quarter"
    | "has_coordinate"
    | "standalone_place"
    | "mentions";
  confidence: number;
  source: string;
};

export type DictionaryGraph = {
  generatedAt: string;
  stats: {
    nodes: number;
    relationships: number;
    dictionaryEntries: number;
    estates: number;
    quarters: number;
    coordinates: number;
    standalonePlaces: number;
  };
  nodes: DictionaryGraphNode[];
  relationships: DictionaryGraphRelationship[];
};

export const dictionaryGraph = ${JSON.stringify(graph, null, 2)} as DictionaryGraph;

export function getDictionaryNodeById(id: string) {
  return dictionaryGraph.nodes.find((node) => node.id === id) ?? null;
}

export function getRelationshipsForNode(id: string) {
  return dictionaryGraph.relationships.filter(
    (rel) => rel.sourceId === id || rel.targetId === id
  );
}

export function getConnectedDictionaryNodes(id: string) {
  const relationships = getRelationshipsForNode(id);
  const ids = new Set(
    relationships
      .flatMap((rel) => [rel.sourceId, rel.targetId])
      .filter((nodeId) => nodeId !== id)
  );

  return dictionaryGraph.nodes.filter((node) => ids.has(node.id));
}

export function searchDictionaryGraph(query: string) {
  const q = query.trim().toLowerCase();

  if (!q) {
    return dictionaryGraph.nodes.slice(0, 300);
  }

  return dictionaryGraph.nodes
    .filter((node) =>
      node.label.toLowerCase().includes(q) ||
      String(node.description ?? "").toLowerCase().includes(q)
    )
    .slice(0, 300);
}
`;

  await fs.writeFile(OUT_TS, ts);

  console.log("Dictionary graph built");
  console.log(graph.stats);
  console.log("Wrote", OUT_JSON);
  console.log("Wrote", OUT_TS);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});