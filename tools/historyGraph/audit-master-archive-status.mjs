import {
  naraRg55ExtractionTargets,
  moravianExtractionTargets,
  rigsarkivetExtractionTargets,
  usviRecorderExtractionTargets,
  generatedEstateArchiveTargets,
} from "../../src/data/historyGraph/index.ts";

const workflow = ["open", "in_progress", "extracted", "verified", "blocked"];
const MAX_VISIBLE_PER_STATUS = 25;

const batches = [
  ["Rigsarkivet", rigsarkivetExtractionTargets],
  ["NARA RG 55", naraRg55ExtractionTargets],
  ["Moravian Archives", moravianExtractionTargets],
  ["USVI Recorder", usviRecorderExtractionTargets],
  ["Generated Estate Targets", generatedEstateArchiveTargets],
];

const allTargets = batches.flatMap(([archive, targets]) =>
  targets.filter(Boolean).map((target) => ({ archive, ...target }))
);

console.log("Master archive status audit");
console.log("===========================");
console.log(`Archives: ${batches.length}`);
console.log(`Targets: ${allTargets.length}`);

console.log("\nBy archive:");
for (const [archive, targets] of batches) {
  console.log(`\n${archive}: ${targets.length}`);
  for (const status of workflow) {
    const count = targets.filter((target) => target.status === status).length;
    if (count) console.log(`- ${status}: ${count}`);
  }
}

console.log("\nOverall by status:");
for (const status of workflow) {
  const count = allTargets.filter((target) => target.status === status).length;
  console.log(`- ${status}: ${count}`);
}

console.log("\nWorkflow board:");

for (const status of workflow) {
  const statusTargets = allTargets.filter((target) => target.status === status);

  console.log(`\n${status.toUpperCase()} (${statusTargets.length})`);

  const visibleTargets = statusTargets.slice(0, MAX_VISIBLE_PER_STATUS);

  for (const target of visibleTargets) {
    const priority = target.priority ?? "?";
    const archive = target.archive ?? "Unknown archive";
    const estateName = target.estateName ?? target.estate ?? target.name ?? "Unknown estate";
    const series = target.series ?? target.recordFamily ?? target.type ?? "No series";
    const goal =
      target.goal ??
      target.extractionGoal ??
      target.researchGoal ??
      target.description ??
      "No goal provided";

    console.log(`#${priority} ${archive} | ${estateName} | ${series}`);
    console.log(`  Goal: ${goal}`);
  }

  if (statusTargets.length > visibleTargets.length) {
    console.log(
      `... ${statusTargets.length - visibleTargets.length} more ${status.toLowerCase()} targets hidden`
    );
  }
}
