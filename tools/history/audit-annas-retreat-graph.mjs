import { annasRetreatTutuGraph } from "../../src/data/history/graph/index.ts";

console.log("Anna's Retreat / Tutu graph");
console.log(`Nodes: ${annasRetreatTutuGraph.nodes.length}`);
console.log(`Edges: ${annasRetreatTutuGraph.edges.length}`);

console.log("\nNODES:");
for (const node of annasRetreatTutuGraph.nodes) {
  console.log(`- ${node.type}: ${node.label} [${node.confidence}]`);
}

console.log("\nEDGES:");
for (const edge of annasRetreatTutuGraph.edges) {
  console.log(`- ${edge.from} -> ${edge.to}: ${edge.label} [${edge.confidence}]`);
}
