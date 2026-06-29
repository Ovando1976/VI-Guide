import { mkdirSync, writeFileSync } from "node:fs";
import { transportGraphNodes, transportGraphStats } from "../../src/data/transport/transportGraph";

const missingCoords = transportGraphNodes.filter(
  (node) => !Number.isFinite(node.lat) || !Number.isFinite(node.lng),
);

const busStopNodes = transportGraphNodes.filter(
  (node) => node.type === "vitran_stop" || node.type === "bus_stop",
);

const vitranWithoutRoutes = busStopNodes.filter(
  (node) => node.routes.length === 0,
);

const lowCoverageWarnings = [
  busStopNodes.length < 50
    ? `VITRAN/bus stop coverage is too low: ${busStopNodes.length}`
    : null,
  transportGraphStats.byType.school < 40
    ? `School coverage is too low: ${transportGraphStats.byType.school ?? 0}`
    : null,
  transportGraphStats.byType.ball_park < 20
    ? `Ball park coverage is too low: ${transportGraphStats.byType.ball_park ?? 0}`
    : null,
].filter(Boolean);

const duplicateNameKeys = new Map<string, string[]>();

for (const node of transportGraphNodes) {
  const key = `${node.island}:${node.type}:${node.name.toLowerCase().trim()}`;
  duplicateNameKeys.set(key, [...(duplicateNameKeys.get(key) ?? []), node.id]);
}

const duplicateNames = [...duplicateNameKeys.entries()]
  .filter(([, ids]) => ids.length > 1)
  .map(([key, ids]) => ({ key, ids }));

const audit = {
  generatedAt: new Date().toISOString(),
  stats: transportGraphStats,
  issues: {
    missingCoords,
    vitranWithoutRoutes,
    duplicateNames,
    lowCoverageWarnings,
  },
};

mkdirSync("generated", { recursive: true });

writeFileSync(
  "generated/transport-graph-audit.json",
  JSON.stringify(audit, null, 2),
);

writeFileSync(
  "generated/transport-graph-audit.md",
  `# Transport Graph Audit

Generated: ${audit.generatedAt}

## Stats

- Total nodes: ${transportGraphStats.totalNodes}
- By island: ${JSON.stringify(transportGraphStats.byIsland)}
- By type: ${JSON.stringify(transportGraphStats.byType)}

## Issues

- Missing coordinates: ${missingCoords.length}
- VITRAN stops without routes: ${vitranWithoutRoutes.length}
- Duplicate names: ${duplicateNames.length}

## Coverage warnings

${lowCoverageWarnings.map((item) => `- ${item}`).join("\n") || "- None"}
`,
);

console.log("Transport graph audit complete.");
console.log(audit.issues.lowCoverageWarnings);
