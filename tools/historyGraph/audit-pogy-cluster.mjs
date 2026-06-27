import {
  pogyClusterGraph,
  pogyClusterGraphStatus,
} from "../../src/data/historyGraph/index.ts";

console.log("Pogy Cluster Graph");
console.log(pogyClusterGraphStatus);

console.log("\nNODES:");
for (const node of pogyClusterGraph.nodes) {
  console.log(`- ${node.id} | ${node.type} | ${node.label}`);
}

console.log("\nEDGES:");
for (const edge of pogyClusterGraph.edges) {
  const confidence = edge.evidence[0]?.confidence?.label ?? "unknown";
  console.log(`- ${edge.id} | ${edge.type} | ${edge.sourceNodeId} -> ${edge.targetNodeId} [${confidence}]`);
}
