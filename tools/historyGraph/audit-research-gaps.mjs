import { pogyClusterGraph } from "../../src/data/historyGraph/index.ts";

console.log("=================================================================");
console.log("             ARCHIVAL RESEARCH GAP & DESIDERATA REPORT           ");
console.log("=================================================================\n");

const gaps = [];

for (const edge of pogyClusterGraph.edges) {
  const primaryEvidence = edge.evidence[0];
  const confidenceScore = primaryEvidence?.confidence?.score ?? 0;
  const confidenceLabel = primaryEvidence?.confidence?.label ?? "unknown";
  
  if (confidenceScore < 1.00 || edge.properties.requiresPrimaryDeed) {
    let actionItem = "Verify assertion.";
    let archivalTarget = "General Registry Search";

    // Actionable metadata injection for specific known gaps
    if (edge.id === "edge:sale:pogy:schifter:annas-retreat:1813") {
      actionItem = "Locate original primary deed (Skøde- og Pantebog entry) for St. Thomas, Year 1813.";
      archivalTarget = "Rigsarkivet (Danish National Archives) | Vestindiske lokalarkiver | St. Thomas og St. Jan Guvernementsarkiv | Panteprotokoller (Deed Registers)";
    } else if (edge.properties.requiresPrimaryDeed) {
      actionItem = "CRITICAL - Locate original primary deed / Pantebog entry.";
    }

    gaps.push({
      edgeId: edge.id,
      relationship: edge.type,
      source: edge.sourceNodeId,
      target: edge.targetNodeId,
      confidence: `${confidenceLabel} (${confidenceScore.toFixed(2)})`,
      currentSource: primaryEvidence?.sourceDocumentId || "Uncited",
      notes: primaryEvidence?.notes || "No context notes provided.",
      actionItem,
      archivalTarget
    });
  }
}

if (gaps.length === 0) {
  console.log("✓ All current graph relationships meet maximum confidence thresholds (1.00).");
} else {
  console.log(`Found ${gaps.length} relationship(s) requiring primary source verification:\n`);
  
  gaps.forEach((gap, index) => {
    console.log(`[Gap #${index + 1}] Edge: ${gap.edgeId}`);
    console.log(`  ├─ Relationship   : ${gap.source} --[${gap.relationship}]--> ${gap.target}`);
    console.log(`  ├─ Confidence     : ${gap.confidence}`);
    console.log(`  ├─ Cited By       : ${gap.currentSource}`);
    console.log(`  ├─ Action Item    : ${gap.actionItem}`);
    console.log(`  ├─ Archival Target: ${gap.archivalTarget}`);
    console.log(`  └─ Research Notes : ${gap.notes}\n`);
  });
}
