import { tariffZones, type TaxiZoneId } from "../../data/mobility/tariffRules";
import type { IslandCode } from "../../types";

export type TariffDropdownOption =
  | {
      label: string;
      value: "header";
      isHeader: true;
    }
  | {
      label: string;
      value: TaxiZoneId;
      isHeader?: false;
    };

export function getDropdownOptionsForIsland(
  island: IslandCode,
): TariffDropdownOption[] {
  const zones = tariffZones
    .filter((zone) => zone.island === island)
    .sort((a, b) => a.name.localeCompare(b.name));

  return [
    { label: "OFFICIAL ZONES", value: "header", isHeader: true },
    ...zones.map((zone) => ({
      label: zone.name,
      value: zone.id,
    })),
  ];
}
