import "server-only";

import fs from "node:fs";
import path from "node:path";
import { getAdminDb } from "@/lib/firebase-admin";

/**
 * Read-only bridge from production Firestore tariff documents to the
 * repository tariff-route audit. This script never writes to Firestore.
 *
 * Usage:
 *   npx tsx scripts/export-production-taxi-tariffs.ts
 *   npx tsx scripts/audit-taxi-tariff-routes.ts artifacts/production-taxi-tariffs.json
 */
async function main() {
  const snapshot = await getAdminDb().collection("taxiTariffs").get();
  const tariffs = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((tariff: any) => ["stt", "stj", "stx"].includes(tariff.island))
    .sort((a: any, b: any) => `${a.island}:${a.version ?? ""}:${a.id}`.localeCompare(`${b.island}:${b.version ?? ""}:${b.id}`));

  const output = path.resolve("artifacts/production-taxi-tariffs.json");
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(tariffs, null, 2) + "\n");

  const byIsland = tariffs.reduce<Record<string, { tariffs: number; rules: number }>>((acc, tariff: any) => {
    const current = acc[tariff.island] ?? { tariffs: 0, rules: 0 };
    current.tariffs += 1;
    current.rules += Array.isArray(tariff.rules) ? tariff.rules.length : 0;
    acc[tariff.island] = current;
    return acc;
  }, {});

  console.log(JSON.stringify({
    output,
    readOnly: true,
    tariffDocuments: tariffs.length,
    byIsland,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
