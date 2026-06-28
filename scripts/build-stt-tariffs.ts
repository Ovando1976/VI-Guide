import { writeFileSync } from "node:fs";

const rows = [
  ["airport", "charlotte_amalie", 11, 9],
  ["airport", "havensight", 12, 8],
  ["airport", "crown_bay", 8, 6],
  ["airport", "red_hook", 23, 17],
  ["airport", "magens_bay", 18, 15],
  ["airport", "smith_bay", 22, 16],
  ["airport", "tutu", 17, 13],
];

function id(a: string, b: string) {
  return `stt_${a}_to_${b}_2022`;
}

const body = `import type { TaxiFareRule } from "../lib/mobility/taxi/types";

const accessedAt = "2026-06-16T00:00:00-04:00";

const source = {
  label: "Published 2022 St. Thomas taxi rate sheet capture",
  sourceType: "secondary_published_sheet" as const,
  effectiveDate: "2022-10-24",
  accessedAt,
};

const common = {
  island: "stt" as const,
  computationMode: "one_person_vs_two_plus_per_person" as const,
  luggagePerBagAmount: 3,
  oversizeBagMaxAmount: 6,
  waitingPerMinuteAmount: 2,
  waitingGraceMinutes: 5,
  lateNightPerPersonAmount: 3,
  lateNightWindow: { start: "00:00", end: "06:00" },
  serviceClass: "either" as const,
  source,
  reviewStatus: "needs_review" as const,
};

function rule(id: string, originZoneId: string, destinationZoneId: string, onePersonAmount: number, twoPlusPerPersonAmount: number): TaxiFareRule {
  return { id, ...common, originZoneId, destinationZoneId, onePersonAmount, twoPlusPerPersonAmount };
}

export const taxiFareRulesSTT: TaxiFareRule[] = [
${rows
  .map(
    ([a, b, one, multi]) =>
      `  rule("${id(String(a), String(b))}", "stt_${a}", "stt_${b}", ${one}, ${multi}),`
  )
  .join("\n")}
];
`;

writeFileSync("src/data/taxiFareRulesSTT.ts", body);
console.log(`Wrote ${rows.length} STT tariff rules`);