import { NextResponse } from "next/server";

import { getActiveTaxiTariff } from "@/lib/usvi-taxi-tariffs";
import { selectOfficialTaxiFareRule } from "@/lib/official-taxi-fare-engine";

export const dynamic = "force-dynamic";

/**
 * Temporary, read-only Phase 1 diagnostic.
 *
 * Deliberately returns no credentials and no tariff table. It only reports
 * whether the active governed STT tariff can resolve the known airport smoke
 * route used by PR #384.
 */
export async function GET() {
  try {
    const tariff = await getActiveTaxiTariff("st_thomas");

    if (!tariff) {
      return NextResponse.json({
        ok: false,
        island: "st_thomas",
        activeTariffFound: false,
        smokeRoute: {
          from: "Airport Terminal",
          to: "Red Hook",
          matched: false,
        },
      });
    }

    const rule = selectOfficialTaxiFareRule(tariff, {
      fromName: "Airport Terminal",
      toName: "Red Hook",
    });

    return NextResponse.json({
      ok: Boolean(rule),
      island: "st_thomas",
      activeTariffFound: true,
      tariff: {
        id: tariff.id ?? null,
        version: tariff.version ?? null,
        status: tariff.status ?? null,
      },
      smokeRoute: {
        from: "Airport Terminal",
        to: "Red Hook",
        matched: Boolean(rule),
        ruleId: rule?.id ?? null,
        pricingModel: rule?.pricingModel ?? null,
        requiresConfirmation: rule?.requiresConfirmation ?? null,
      },
    });
  } catch (error) {
    console.error("[tariff-diagnostic] failed", error);
    return NextResponse.json(
      {
        ok: false,
        island: "st_thomas",
        activeTariffFound: null,
        smokeRoute: {
          from: "Airport Terminal",
          to: "Red Hook",
          matched: false,
        },
        error: "tariff_diagnostic_failed",
      },
      { status: 500 },
    );
  }
}
