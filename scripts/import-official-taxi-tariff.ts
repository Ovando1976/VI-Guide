import { readFile } from "node:fs/promises";

import { getAdminDb } from "../lib/firebase-admin";
import { getOfficialTaxiTariffValidationErrors } from "../lib/official-taxi-tariff-validation";
import type { OfficialTaxiTariff } from "../types/taxi-operations";

async function main() {
  const file = process.argv.find((argument) => argument.startsWith("--file="))?.slice(7);
  const apply = process.argv.includes("--apply");
  const activate = process.argv.includes("--activate");
  const provisional = process.argv.includes("--provisional");
  if (!file) throw new Error("Usage: npm run tariffs:import -- --file=path.json [--apply] [--provisional|--activate]");
  if (activate && provisional) throw new Error("Choose either --provisional or --activate, not both.");

  const tariff = JSON.parse(await readFile(file, "utf8")) as OfficialTaxiTariff;
  if (activate) tariff.status = "active";
  else if (provisional) tariff.status = "provisional";
  else if (tariff.status === "active") tariff.status = "draft";

  const errors = getOfficialTaxiTariffValidationErrors(tariff);
  if (errors.length) throw new Error(errors.join("\n"));

  console.table({ id: tariff.id, island: tariff.island, status: tariff.status, rules: tariff.rules.length, mode: apply ? "apply" : "dry-run" });
  if (!apply) return;

  const db = getAdminDb();
  await db.runTransaction(async (transaction) => {
    if (tariff.status === "active" || tariff.status === "provisional") {
      const sameStatus = await transaction.get(db.collection("taxiTariffs").where("island", "==", tariff.island).where("status", "==", tariff.status));
      for (const document of sameStatus.docs) {
        if (document.id !== tariff.id) transaction.update(document.ref, { status: "retired" });
      }
    }
    const { id, ...record } = tariff;
    transaction.set(db.collection("taxiTariffs").doc(id), record, { merge: false });
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
