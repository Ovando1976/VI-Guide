import type { HistoryGraphPayload } from "./historyGraphTypes";
import { baselineDocuments } from "./nodes/baselineDocuments";
import { pogyClusterNodes } from "./nodes/pogyClusterNodes";
import { pogyClusterEdges } from "./edges/pogyClusterEdges";

export const pogyClusterGraph: HistoryGraphPayload = {
  nodes: [...baselineDocuments, ...pogyClusterNodes],
  edges: [...pogyClusterEdges],
};

export const pogyClusterGraphStatus = {
  nodes: pogyClusterGraph.nodes.length,
  edges: pogyClusterGraph.edges.length,
  confirmedEdges: pogyClusterGraph.edges.filter((edge) =>
    edge.evidence.some((item) => item.confidence.label === "confirmed"),
  ).length,
  needsPrimarySourceEdges: pogyClusterGraph.edges.filter(
    (edge) => edge.properties.requiresPrimaryDeed,
  ).length,
};
