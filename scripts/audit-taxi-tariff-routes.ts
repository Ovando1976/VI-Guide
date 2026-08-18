import fs from "node:fs";
import path from "node:path";

import {
  auditTaxiTariffRoutes,
  type TariffAuditDocument,
} from "../lib/taxi-tariff-route-audit";

function main() {
  const input = process.argv[2];
  if (!input) {
    throw new Error(
      "Usage: tsx scripts/audit-taxi-tariff-routes.ts <tariff-json>",
    );
  }

  const absolute = path.resolve(input);
  const parsed = JSON.parse(fs.readFileSync(absolute, "utf8"));
  const tariffs: TariffAuditDocument[] = Array.isArray(parsed)
    ? parsed
    : [parsed];
  const report = auditTaxiTariffRoutes(tariffs);

  const output = path.resolve("artifacts/tariff-route-audit.json");
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + "\n");

  console.log(
    JSON.stringify(
      {
        output,
        tariffCount: report.tariffCount,
        ruleCount: report.ruleCount,
        blockingFindings: report.blockingFindings,
        byIsland: report.byIsland,
      },
      null,
      2,
    ),
  );

  if (report.blockingFindings > 0) process.exitCode = 1;
}

main();
