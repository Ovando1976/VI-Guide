import { readFileSync, writeFileSync } from "node:fs";

type Island = "stt" | "stj" | "stx";

type TariffFile = {
  island: Island;
  effectiveDate: string;
  reviewStatus: "needs_review" | "verified_operational" | "verified_official";
  source: {
    label: string;
    sourceType: "secondary_published_sheet" | "vipa_official" | "manual_admin_entry";
  };
  routes: [string, string, number, number][];
};

const configs: Array<{
  input: string;
  output: string;
  exportName: string;
  island: Island;
}> = [
  {
    input: "data/tariffs/stt-tariff-2022.json",
    output: "src/data/taxiFareRulesSTT.ts",
    exportName: "taxiFareRulesSTT",
    island: "stt",
  },
  {
    input: "data/tariffs/stj-tariff-2022.json",
    output: "src/data/taxiFareRulesSTJ.ts",
    exportName: "taxiFareRulesSTJ",
    island: "stj",
  },
  {
    input: "data/tariffs/stx-tariff-2022.json",
    output: "src/data/taxiFareRulesSTX.ts",
    exportName: "taxiFareRulesSTX",
    island: "stx",
  },
];

function toId(from: string, to: string, effectiveDate: string) {
  const year = effectiveDate.slice(0, 4);
  return `${from}_to_${to}_${year}`.replace(/[^a-zA-Z0-9_]/g, "_");
}

function generate(file: TariffFile, exportName: string) {
  const isStx = file.island === "stx";

  const routeLines = file.routes
    .map(([from, to, one, multi]) => {
      const id = toId(from, to, file.effectiveDate);

      return isStx
        ? `  rule("${id}", "${from}", "${to}", ${one}, ${multi}),`
        : `  rule("${id}", "${from}", "${to}", ${one}, ${multi}),`;
    })
    .join("\n");

  const amountNames = isStx
    ? "oneOrTwoPeopleTotalAmount: number,\n  threePlusPerPersonAmount: number"
    : "onePersonAmount: number,\n  twoPlusPerPersonAmount: number";

  const returnAmounts = isStx
    ? "oneOrTwoPeopleTotalAmount,\n    threePlusPerPersonAmount"
    : "onePersonAmount,\n    twoPlusPerPersonAmount";

  const computationMode = isStx
    ? "one_or_two_total_vs_three_plus_each"
    : "one_person_vs_two_plus_per_person";

  const extraCommon = file.island === "stj"
    ? `  exclusivityRule: "negotiated" as const,\n`
    : file.island === "stx"
      ? `  exclusivityRule: "pay_four_passengers" as const,\n`
      : "";

  const waitingAmount = file.island === "stj" ? 1 : 2;

  return `import type { TaxiFareRule } from "../lib/mobility/taxi/types";

const accessedAt = "2026-06-16T00:00:00-04:00";

const source = {
  label: ${JSON.stringify(file.source.label)},
  sourceType: ${JSON.stringify(file.source.sourceType)} as const,
  effectiveDate: ${JSON.stringify(file.effectiveDate)},
  accessedAt,
};

const common = {
  island: ${JSON.stringify(file.island)} as const,
  computationMode: ${JSON.stringify(computationMode)} as const,
  luggagePerBagAmount: 3,
  oversizeBagMaxAmount: 6,
  waitingPerMinuteAmount: ${waitingAmount},
  waitingGraceMinutes: 5,
  lateNightPerPersonAmount: 3,
  lateNightWindow: { start: "00:00", end: "06:00" },
${extraCommon}  serviceClass: "either" as const,
  source,
  reviewStatus: ${JSON.stringify(file.reviewStatus)} as const,
};

function rule(
  id: string,
  originZoneId: string,
  destinationZoneId: string,
  ${amountNames}
): TaxiFareRule {
  return {
    id,
    ...common,
    originZoneId,
    destinationZoneId,
    ${returnAmounts},
  };
}

export const ${exportName}: TaxiFareRule[] = [
${routeLines}
];
`;
}

for (const config of configs) {
  const raw = readFileSync(config.input, "utf8");
  const file = JSON.parse(raw) as TariffFile;

  if (file.island !== config.island) {
    throw new Error(`${config.input} island mismatch. Expected ${config.island}, got ${file.island}`);
  }

  const output = generate(file, config.exportName);
  writeFileSync(config.output, output);

  console.log(`Wrote ${config.output}: ${file.routes.length} routes`);
}

writeFileSync(
  "src/data/taxiFareRules.ts",
  `import { taxiFareRulesSTT } from "./taxiFareRulesSTT";
import { taxiFareRulesSTJ } from "./taxiFareRulesSTJ";
import { taxiFareRulesSTX } from "./taxiFareRulesSTX";
import type { TaxiFareRule } from "../lib/mobility/taxi/types";

export const taxiFareRules: TaxiFareRule[] = [
  ...taxiFareRulesSTT,
  ...taxiFareRulesSTJ,
  ...taxiFareRulesSTX,
];
`
);

console.log("Wrote src/data/taxiFareRules.ts");