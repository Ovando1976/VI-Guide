import { historyGraphNodes, getHistoryGraphForEntity } from "../../src/data/history/generated/historyGraph.ts";

for (const entity of historyGraphNodes) {
  const graph = getHistoryGraphForEntity(entity.id);

  console.log(`\n${entity.kind.toUpperCase()}: ${entity.name}`);
  console.log(`ID: ${entity.id}`);
  console.log(`Records: ${graph.records.length}`);

  for (const record of graph.records.slice(0, 5)) {
    console.log(`- ${record.title} (${record.source.title}, ${record.source.pages})`);
  }
}
