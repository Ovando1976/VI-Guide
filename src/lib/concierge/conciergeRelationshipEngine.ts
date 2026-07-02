import type { IslandCode } from "../../types";
import {
  geographicIndexItems,
  type GeographicIndexItem,
} from "../../data/core/geographicIndex";
import {
  buildAtlasKnowledgeNode,
  type AtlasKnowledgeNode,
} from "../atlas/atlasKnowledgeGraph";
import type { ParsedConciergeIntent } from "./conciergeIntentEngine";

export type ConciergeRelationshipResult = {
  text: string;
  results?: GeographicIndexItem[];
  actions?: {
    type: "navigate" | "search";
    label: string;
    path?: string;
    query?: string;
  }[];
};

function clean(value: unknown): string {
  return String(value ?? "")
    .replace(/^Estate\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(value: unknown): string {
  return clean(value)
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isEstate(item: GeographicIndexItem) {
  const text = `${item.source || ""} ${item.type || ""} ${item.category || ""}`.toLowerCase();
  return text.includes("estate");
}

function matchesEntity(item: GeographicIndexItem, entity: string) {
  const target = normalize(entity);
  const targetNoEstate = normalize(entity.replace(/^Estate\s+/i, ""));
  if (!target) return false;

  const text = normalize(
    [
      item.id,
      item.name,
      item.displayName,
      item.canonicalName,
      item.baseName,
      item.estateName,
      item.estateId,
      item.searchText,
      item.description,
      ...(item.aliases || []),
    ].join(" "),
  );

  return text.includes(target) || text.includes(targetNoEstate);
}

function scoreMatch(item: GeographicIndexItem, entity: string) {
  const target = normalize(entity);
  const targetNoEstate = normalize(entity.replace(/^Estate\s+/i, ""));
  const name = normalize(item.name);
  const displayName = normalize(item.displayName);
  const estateName = normalize(item.estateName);
  const id = normalize(item.id);
  const estateId = normalize(item.estateId);

  let score = 0;

  if (isEstate(item)) score += 1000;
  if (name === target || name === targetNoEstate) score += 700;
  if (displayName === target || displayName === targetNoEstate) score += 650;
  if (estateName === target || estateName === targetNoEstate) score += 650;
  if (id === target || estateId === target) score += 400;

  if (name.includes(targetNoEstate)) score += 150;
  if (estateName.includes(targetNoEstate)) score += 150;

  const typeText = `${item.type || ""} ${item.category || ""}`.toLowerCase();
  if (typeText.includes("bay")) score -= 150;
  if (typeText.includes("point")) score -= 100;
  if (typeText.includes("school")) score -= 100;

  return score;
}

function findEntityMatches(
  entities: string[],
  island: IslandCode,
  limit = 10,
): GeographicIndexItem[] {
  const scored = geographicIndexItems
    .filter((item) => {
      const sameIsland =
        !item.island || item.island === island || String(item.island) === "all";

      return sameIsland && entities.some((entity) => matchesEntity(item, entity));
    })
    .map((item) => ({
      item,
      score: Math.max(...entities.map((entity) => scoreMatch(item, entity))),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const unique = new Map<string, GeographicIndexItem>();
  scored.forEach(({ item }) => unique.set(item.id, item));

  return [...unique.values()].slice(0, limit);
}

function formatItems(items: GeographicIndexItem[]) {
  return items
    .slice(0, 6)
    .map((item, index) => {
      const label = item.displayName || item.name;
      const type = item.type || item.category || item.source || "Atlas item";
      return `${index + 1}. **${label}** — ${type}`;
    })
    .join("\n");
}

function formatHistory(node: AtlasKnowledgeNode) {
  if (node.historyRecords.length === 0) {
    return `I found **${node.title}**, but I do not have direct linked estate-history records for it yet.`;
  }

  return `Here are linked history records for **${node.title}**:\n\n${node.historyRecords
    .slice(0, 5)
    .map(
      (record, index) =>
        `${index + 1}. **${record.dateRange || record.type || "Record"}** — ${record.title}\n${record.summary}`,
    )
    .join("\n\n")}`;
}

function formatDictionary(node: AtlasKnowledgeNode) {
  if (node.dictionaryMatches.length === 0) {
    return `I found **${node.title}**, but I do not have dictionary matches connected yet.`;
  }

  return `Dictionary and geographic-index records connected to **${node.title}**:\n\n${formatItems(
    node.dictionaryMatches,
  )}`;
}

function formatNearbyBeaches(node: AtlasKnowledgeNode) {
  const beaches = node.nearbyPlaces.filter((item) => {
    const text = `${item.name} ${item.type} ${item.category} ${item.source}`.toLowerCase();
    return text.includes("beach") || text.includes("bay");
  });

  if (beaches.length === 0) {
    return {
      text: `I found **${node.title}**, but I do not have nearby beach or bay matches within the graph radius yet.`,
      results: node.nearbyPlaces,
    };
  }

  return {
    text: `Nearby beach and bay matches around **${node.title}**:\n\n${formatItems(beaches)}`,
    results: beaches,
  };
}

export function answerConciergeRelationship(input: {
  parsed: ParsedConciergeIntent;
}): ConciergeRelationshipResult | null {
  const { parsed } = input;

  const entityMatches = findEntityMatches(parsed.entities, parsed.island, 10);
  const primary = entityMatches[0];

  if (parsed.intent === "directions" || parsed.intent === "taxi") {
    return {
      text: `I can route that through Mobility.

Origin: **${parsed.origin || parsed.entities[1] || "not resolved"}**
Destination: **${parsed.destination || parsed.entities[0] || "not resolved"}**

Open Mobility to resolve the estate, taxi zone, official fare, and route preview.`,
      results: entityMatches,
      actions: [
        {
          type: "navigate",
          label: "Open Mobility Route Planner",
          path: `/mobility?island=${parsed.island}&q=${encodeURIComponent(parsed.raw)}`,
        },
      ],
    };
  }

  if (!primary) return null;

  const node = buildAtlasKnowledgeNode(primary);

  if (parsed.intent === "history") {
    return {
      text: formatHistory(node),
      results: entityMatches,
      actions: [
        {
          type: "navigate",
          label: `Open ${node.title} History`,
          path: `/estates/${encodeURIComponent(primary.estateId || primary.id)} /history?island=${parsed.island}&context=${encodeURIComponent(node.title)}`.replace(
            " /history",
            "/history",
          ),
        },
      ],
    };
  }

  if (parsed.intent === "dictionary") {
    return {
      text: formatDictionary(node),
      results: node.dictionaryMatches.length ? node.dictionaryMatches : entityMatches,
    };
  }

  if (parsed.intent === "nearby_beaches") {
    return formatNearbyBeaches(node);
  }

  if (parsed.intent === "archives") {
    return {
      text: `Archive view for **${node.title}** is ready.

Known archive references:
${
  node.estateKnowledge?.relatedArchives?.length
    ? node.estateKnowledge.relatedArchives.map((item) => `- ${item}`).join("\n")
    : "- Geographic Dictionary of the Virgin Islands\n- Estate records\n- Maps and image evidence"
}`,
      results: entityMatches,
      actions: [
        {
          type: "navigate",
          label: "Open Archive Knowledge",
          path: `/history/knowledge?estate=${encodeURIComponent(primary.estateId || primary.id)}&island=${parsed.island}&context=${encodeURIComponent(node.title)}`,
        },
      ],
    };
  }

  if (parsed.intent === "nearby_places" || parsed.intent === "businesses") {
    return {
      text:
        node.nearbyPlaces.length > 0
          ? `Nearby Atlas places around **${node.title}**:\n\n${formatItems(node.nearbyPlaces)}`
          : `I found **${node.title}**, but I do not have nearby graph matches yet.`,
      results: node.nearbyPlaces.length ? node.nearbyPlaces : entityMatches,
    };
  }

  return {
    text: `I found **${node.title}**.

${node.summary}

Connected records:
- Dictionary matches: ${node.dictionaryMatches.length}
- History records: ${node.historyRecords.length}
- Nearby places: ${node.nearbyPlaces.length}`,
    results: entityMatches,
  };
}