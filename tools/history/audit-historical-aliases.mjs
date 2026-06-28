import { historicalAliasIndex, findHistoricalAliasMatch } from "../../src/data/history/aliases/index.ts";
import { knoxEarlyEstateLinks } from "../../src/data/history/generated/knoxEarlyEstateLinks.ts";

console.log(`Historical alias records: ${historicalAliasIndex.length}`);

for (const record of historicalAliasIndex) {
  console.log(`\n${record.modernName} [${record.confidence}]`);
  console.log(`Island: ${record.island}`);
  console.log(`Historical names: ${record.historicalNames.join(", ")}`);
  console.log(`Proprietors: ${record.proprietorNames.join(", ")}`);
}

console.log("\nEARLY ESTATE LINK MATCHES:");

for (const link of knoxEarlyEstateLinks) {
  const match =
    findHistoricalAliasMatch(link.originalEstateName || "") ||
    findHistoricalAliasMatch(link.colonistName || "");

  console.log(
    `- ${link.colonistName}: ${link.originalEstateName || "unknown"} → ${
      match ? `${match.modernName} (${match.confidence})` : "unresolved"
    }`
  );
}
