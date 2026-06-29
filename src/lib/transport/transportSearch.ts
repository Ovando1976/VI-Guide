import type { IslandCode } from "../../types";
import {
  transportGraphNodes,
  type TransportGraphNode,
  type TransportGraphNodeType,
} from "../../data/transport/transportGraph";

function normalize(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function searchTransportNodes({
  query,
  island,
  types,
  limit = 20,
}: {
  query: string;
  island?: IslandCode;
  types?: TransportGraphNodeType[];
  limit?: number;
}): TransportGraphNode[] {
  const q = normalize(query);

  return transportGraphNodes
    .filter((node) => !island || node.island === island)
    .filter((node) => !types?.length || types.includes(node.type))
    .map((node) => {
      const name = normalize(node.name);
      const haystack = normalize([
        node.name,
        node.type,
        node.description,
        node.searchText,
        ...(node.aliases ?? []),
        ...(node.routes ?? []),
      ].join(" "));

      let score = 0;

      if (!q) score = 1;
      else if (name === q) score += 120;
      else if (name.startsWith(q)) score += 90;
      else if (name.includes(q)) score += 70;
      else if (haystack.includes(q)) score += 40;

      if (node.canPickup && node.canDropoff) score += 5;
      if (node.type === "vitran_stop") score += 8;
      if (node.type === "school" || node.type === "ball_park") score += 6;

      return { node, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.node.name.localeCompare(b.node.name))
    .slice(0, limit)
    .map((item) => item.node);
}

export function getTransportNodeById(id: string): TransportGraphNode | undefined {
  return transportGraphNodes.find((node) => node.id === id);
}
