import { TaxiTariffAuditPanel } from "@/components/taxi-tariff-audit-panel";
import { TaxiTariffBoard } from "@/components/taxi-tariff-board";
import { TaxiTariffFareRepairPanel } from "@/components/taxi-tariff-fare-repair-panel";
import { TaxiTariffPromotionPanel } from "@/components/taxi-tariff-promotion-panel";

// Preview validation intentionally exercises the admin tariff audit surface.
export default function TaxiTariffsPage() {
  return (
    <>
      <TaxiTariffBoard />
      <TaxiTariffAuditPanel />
      <TaxiTariffFareRepairPanel />
      <TaxiTariffPromotionPanel />
    </>
  );
}
