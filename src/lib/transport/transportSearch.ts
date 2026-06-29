import type { IslandCode } from "../../types";
import { transportNodes } from "../../data/transport/transportNodes";
import type { TransportNode } from "../../data/transport/transportTypes";

function normalize(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function searchTransportNodes({
  query,
  island,
  limit = 20,
}: {
  query: string;
  island?: IslandCode;
  limit?: number;
}): TransportNode[] {
  const q = normalize(query);

  return transportNodes
    .filter((node) => !island || node.island === island)
    .map((node) => {
      const haystack = normalize([
        node.name,
        node.type,
        node.description,
        ...(node.aliases || []),
        ...(node.routes || []),
      ].join(" "));

      let score = 0;
      if (!q) score = 1;
      else if (normalize(node.name) === q) score += 100;
      else if (normalize(node.name).includes(q)) score += 70;
      else if (haystack.includes(q)) score += 40;

      return { node, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.node);
}
