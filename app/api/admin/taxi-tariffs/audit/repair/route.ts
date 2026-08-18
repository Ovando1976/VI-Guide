import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import type { OfficialTaxiRateRule } from "@/types/taxi-operations";

type RepairRow = {
  tariffId: string;
  ruleId: string;
  onePassengerFare: number;
  perPersonFare: number;
};

type TariffData = {
  island?: string;
  version?: string;
  rules?: OfficialTaxiRateRule[];
};

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(["admin"]);
    const rows = parseRepairCsv(await request.text());
    if (!rows.length) {
      return NextResponse.json({ error: "No fare repair rows were found." }, { status: 400 });
    }

    const apply = request.nextUrl.searchParams.get("apply") === "true";
    const grouped = new Map<string, RepairRow[]>();
    for (const row of rows) {
      const bucket = grouped.get(row.tariffId) ?? [];
      bucket.push(row);
      grouped.set(row.tariffId, bucket);
    }

    const db = getAdminDb();
    const updates: Array<{
      tariffId: string;
      island: string;
      version: string;
      rules: OfficialTaxiRateRule[];
      repaired: number;
    }> = [];

    for (const [tariffId, repairRows] of grouped) {
      const snapshot = await db.collection("taxiTariffs").doc(tariffId).get();
      if (!snapshot.exists) {
        return NextResponse.json(
          { error: `Tariff no longer exists: ${tariffId}. Re-export before repairing.` },
          { status: 409 },
        );
      }

      const data = snapshot.data() as TariffData;
      const rules = Array.isArray(data.rules) ? data.rules.map((rule) => ({ ...rule })) : [];
      const byId = new Map(rules.map((rule, index) => [rule.id, index]));
      let repaired = 0;

      for (const row of repairRows) {
        const index = byId.get(row.ruleId);
        if (index === undefined) {
          return NextResponse.json(
            { error: `Tariff rule no longer exists: ${tariffId}/${row.ruleId}. Re-export before repairing.` },
            { status: 409 },
          );
        }
        const rule = rules[index];
        if (rule.onePassengerFare !== row.onePassengerFare) {
          return NextResponse.json(
            { error: `Base fare changed for ${row.ruleId}; expected ${row.onePassengerFare}, found ${rule.onePassengerFare}. Re-export before repairing.` },
            { status: 409 },
          );
        }
        if (typeof rule.perPersonFare === "number" || typeof rule.additionalPassengerFare === "number") {
          return NextResponse.json(
            { error: `Group pricing already exists for ${row.ruleId}; this repair never overwrites existing fares.` },
            { status: 409 },
          );
        }
        rules[index] = { ...rule, perPersonFare: row.perPersonFare };
        repaired += 1;
      }

      updates.push({
        tariffId,
        island: data.island ?? "unknown",
        version: data.version ?? "unknown",
        rules,
        repaired,
      });
    }

    const repaired = updates.reduce((sum, update) => sum + update.repaired, 0);
    if (!apply) {
      return NextResponse.json({
        ok: true,
        dryRun: true,
        tariffCount: updates.length,
        repaired,
        note: "Validation passed. No data was changed. Re-submit with apply=true to fill only missing perPersonFare values.",
      });
    }

    const batch = db.batch();
    for (const update of updates) {
      batch.update(db.collection("taxiTariffs").doc(update.tariffId), {
        rules: update.rules,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    const auditRef = db.collection("taxiTariffAudit").doc();
    batch.set(auditRef, {
      action: "tariff_group_fares_repaired",
      actorId: session.uid,
      tariffCount: updates.length,
      repairedRuleCount: repaired,
      tariffs: updates.map(({ tariffId, island, version, repaired }) => ({
        tariffId,
        island,
        version,
        repaired,
      })),
      createdAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();

    return NextResponse.json({
      ok: true,
      dryRun: false,
      tariffCount: updates.length,
      repaired,
      note: "Only previously-missing perPersonFare values were filled. Base fares, route endpoints, governance state, activation state, and quote activation were not changed.",
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("taxi tariff fare repair error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to repair tariff group fares." },
      { status: 400 },
    );
  }
}

function parseRepairCsv(input: string): RepairRow[] {
  const records = parseCsv(input);
  return records.map((row, index) => {
    const tariffId = row.tariffId?.trim();
    const ruleId = row.ruleId?.trim();
    const onePassengerFare = Number(row.onePassengerFare);
    const perPersonFare = Number(row.perPersonFare);
    if (!tariffId || !ruleId) throw new Error(`Row ${index + 2} is missing tariffId or ruleId.`);
    if (!Number.isFinite(onePassengerFare) || onePassengerFare < 0) {
      throw new Error(`Row ${index + 2} has an invalid onePassengerFare.`);
    }
    if (!Number.isFinite(perPersonFare) || perPersonFare <= 0) {
      throw new Error(`Row ${index + 2} has an invalid perPersonFare.`);
    }
    return { tariffId, ruleId, onePassengerFare, perPersonFare };
  });
}

function parseCsv(input: string): Array<Record<string, string>> {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (quoted) {
      if (char === '"' && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else field += char;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else field += char;
  }
  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  const [headers, ...data] = rows.filter((candidate) => candidate.some((cell) => cell.trim()));
  if (!headers) return [];
  return data.map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header.trim(), cells[index] ?? ""])),
  );
}
