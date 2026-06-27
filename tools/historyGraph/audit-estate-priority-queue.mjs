import { generatedEstateArchiveTargets } from "../../src/data/historyGraph/extractionTargets/generatedEstateArchiveTargets.ts";

const forcedTop = [
  "ANNA'S RETREAT",
  "NEW HERNHUT",
  "NISKY",
  "TABOR & HARMONY",
    "ZUFRIENDENHEIT",
  "PETERBORG",
  "LOVENLUND",
  "CATHERINEBERG",
  "HAMMER FARM",
  "LAMESHUR",
  "CINNAMON",
  "ANNABERG",
  "CAROLINA",
  "CANEEL BAY",
  "REEF BAY",
  "BORDEAUX",
  "SMITH BAY",
  "SOLBERG",
  "CARET BAY",
  "DOROTHEA",
  "NADIR",
];

function normalize(value) {
  return String(value ?? "").toUpperCase().replace(/\s+/g, " ").trim();
}

function scoreTarget(target) {
  const haystack = normalize([
    target.estateName,
    target.estateCanonicalId,
    ...(target.searchNames ?? []),
  ].join(" "));

  let score = 0;

  forcedTop.forEach((name, index) => {
    if (haystack.includes(name)) score += 5000 - index * 100;
  });

  if (target.island === "st_thomas") score += 300;
  if (target.island === "st_john") score += 250;
  if (target.archive === "NARA RG 55") score += 200;
  if (target.archive === "Moravian Archives") score += 175;
  if (target.archive === "Rigsarkivet") score += 100;

  return score;
}

const queue = generatedEstateArchiveTargets
  .map((target) => ({ ...target, queueScore: scoreTarget(target) }))
  .sort((a, b) => b.queueScore - a.queueScore || a.estateName.localeCompare(b.estateName));

console.log("Estate archival priority queue");
console.log("==============================");
console.log(`Targets: ${queue.length}`);

for (const target of queue.slice(0, 50)) {
  console.log(`#${target.queueScore} ${target.archive} | ${target.estateName} | ${target.series}`);
  console.log(`  Goal: ${target.extractionGoal}`);
}
