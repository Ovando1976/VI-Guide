import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "src/data/history/generated/historyGraph.ts");

const output = `import { historyKnowledge } from "../books/historyKnowledge";
import { canonicalHistoryEntities } from "../entities";
import { knoxAppendixAEntities } from "./knoxAppendixAEntities";

const appendixARecordId =
  "knox-ocr-253-262-006-1678-appendix-a-lists-st-thomas-colonists-and-estate-holders";

function entityAliasMatches(text: string, name: string) {
  const normalized = name.trim().toLowerCase();

  if (!normalized || normalized.length < 4) return false;

  if (/^frederik\\s+v$/.test(normalized)) {
    return text.includes("king frederik v") || text.includes("frederik the fifth");
  }

  if (/^christian\\s+vii$/.test(normalized)) {
    return text.includes("king christian vii") || text.includes("christian vii");
  }

  return text.includes(normalized);
}

export const historyGraphNodes = [
  ...canonicalHistoryEntities,
  ...knoxAppendixAEntities,
];

const appendixAEntityIds = new Set(knoxAppendixAEntities.map((entity) => entity.id));

const automaticHistoryGraphEdges = historyKnowledge.flatMap((record) => {
  const text = [
    record.title,
    record.summary,
    record.significance,
    ...record.relatedPlaces,
    ...record.searchTerms,
  ].join(" ").toLowerCase();

  return historyGraphNodes
    .filter((entity) => {
      if (appendixAEntityIds.has(entity.id)) return false;

      return [entity.name, ...entity.aliases].some((name) =>
        entityAliasMatches(text, name),
      );
    })
    .map((entity) => ({
      id: \`\${record.id}--mentions--\${entity.id}\`,
      fromId: record.id,
      toId: entity.id,
      kind: "mentions" as const,
      sourceRecordId: record.id,
      confidence: entity.confidence,
    }));
});

const forcedAppendixAEdges = knoxAppendixAEntities.map((entity) => ({
  id: \`\${appendixARecordId}--documents--\${entity.id}\`,
  fromId: appendixARecordId,
  toId: entity.id,
  kind: "documented_by" as const,
  sourceRecordId: appendixARecordId,
  confidence: entity.confidence,
}));

export const historyGraphEdges = [
  ...automaticHistoryGraphEdges,
  ...forcedAppendixAEdges,
];

export function getHistoryGraphForEntity(entityId: string) {
  const edges = historyGraphEdges.filter((edge) => edge.toId === entityId);
  const recordIds = new Set(edges.map((edge) => edge.sourceRecordId));
  const records = historyKnowledge.filter((record) => recordIds.has(record.id));

  return {
    entity: historyGraphNodes.find((node) => node.id === entityId) ?? null,
    edges,
    records,
  };
}

export function getHistoryEntitiesForRecord(recordId: string) {
  const edges = historyGraphEdges.filter((edge) => edge.sourceRecordId === recordId);
  const entityIds = new Set(edges.map((edge) => edge.toId));

  return historyGraphNodes.filter((node) => entityIds.has(node.id));
}
`;

fs.writeFileSync(OUT, output);
console.log("Wrote", OUT);
