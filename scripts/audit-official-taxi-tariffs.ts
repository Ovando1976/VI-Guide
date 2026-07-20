import { readFile, writeFile } from "node:fs/promises";

import { getAdminDb } from "../lib/firebase-admin";
import { getOfficialTaxiTariffValidationErrors } from "../lib/official-taxi-tariff-validation";
import type { OfficialTaxiTariff } from "../types/taxi-operations";
import type { IslandCode } from "../types/usvi";

const ISLANDS: IslandCode[] = ["stt", "stj", "stx"];

async function main() {
  const file = process.argv.find((argument) => argument.startsWith("--file="))?.slice(7);
  const tariffs = file
    ? normalizeFileTariffs(JSON.parse(await readFile(file, "utf8")))
    : await loadFirestoreTariffs();
  const errors: string[] = [];

  for (const island of ISLANDS) {
    const active = tariffs.filter((tariff) => tariff.island === island && tariff.status === "active");
    if (active.length !== 1) errors.push(`${island}: expected exactly one active tariff; found ${active.length}.`);
  }

  for (const tariff of tariffs.filter((candidate) => candidate.status === "active")) {
    getOfficialTaxiTariffValidationErrors(tariff).forEach((error) => errors.push(`${tariff.id}: ${error}`));
  }

  const sanitized = tariffs.map((tariff) => ({
    id: tariff.id,
    title: tariff.title,
    version: tariff.version,
    island: tariff.island,
    status: tariff.status,
    effectiveAt: tariff.effectiveAt,
    sourceUrl: tariff.sourceUrl,
    issuingAuthority: tariff.issuingAuthority,
    currency: tariff.currency,
    rules: tariff.rules,
  }));
  const exportPath = process.argv.find((argument) => argument.startsWith("--export="))?.slice("--export=".length);
  if (exportPath) await writeFile(exportPath, `${JSON.stringify(sanitized, null, 2)}\n`, "utf8");

  console.table({
    tariffs: tariffs.length,
    provisional: tariffs.filter((tariff) => tariff.status === "provisional").length,
    active: tariffs.filter((tariff) => tariff.status === "active").length,
    errors: errors.length,
  });
  if (errors.length) {
    errors.forEach((error) => console.error(`ERROR ${error}`));
    process.exitCode = 1;
  }
}

async function loadFirestoreTariffs() {
  const snapshot = await getAdminDb().collection("taxiTariffs").get();
  return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }) as OfficialTaxiTariff);
}

function normalizeFileTariffs(value: unknown): OfficialTaxiTariff[] {
  const tariffs = Array.isArray(value) ? value : [value];
  return tariffs as OfficialTaxiTariff[];
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
