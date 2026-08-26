import {
  CYRIL_E_KING_AIRPORT_GEOID,
  RED_HOOK_FERRY_TERMINAL_GEOID,
} from "@/lib/mobility-hubs";

export type SttDispatchHub = {
  id: string;
  label: string;
  shortLabel: string;
  kind: "airport" | "ferry_terminal";
  island: "stt";
  queueModel: "association_physical_queue";
  queueStatusSource: "operator_confirmation_required";
  pricingEffect: "none";
  pricingAuthority: "official_usvi_taxi_tariff";
  dispatchNote: string;
};

export const STT_DISPATCH_HUBS: readonly SttDispatchHub[] = [
  {
    id: CYRIL_E_KING_AIRPORT_GEOID,
    label: "Cyril E. King Airport",
    shortLabel: "STT Airport",
    kind: "airport",
    island: "stt",
    queueModel: "association_physical_queue",
    queueStatusSource: "operator_confirmation_required",
    pricingEffect: "none",
    pricingAuthority: "official_usvi_taxi_tariff",
    dispatchNote:
      "Use the airport taxi stand and association queue procedure. USVI Explorer may surface paid demand, but it does not invent or bypass physical queue order.",
  },
  {
    id: RED_HOOK_FERRY_TERMINAL_GEOID,
    label: "Red Hook Ferry Terminal",
    shortLabel: "Red Hook Ferry",
    kind: "ferry_terminal",
    island: "stt",
    queueModel: "association_physical_queue",
    queueStatusSource: "operator_confirmation_required",
    pricingEffect: "none",
    pricingAuthority: "official_usvi_taxi_tariff",
    dispatchNote:
      "Use the terminal taxi stand and association queue procedure. Ferry demand can be grouped operationally, but queue position must come from the stand operator or an approved queue feed.",
  },
] as const;

const STT_DISPATCH_HUB_BY_ID = new Map(
  STT_DISPATCH_HUBS.map((hub) => [hub.id, hub] as const),
);

export function getSttDispatchHub(estateGeoid: string | null | undefined) {
  if (!estateGeoid) return null;
  return STT_DISPATCH_HUB_BY_ID.get(estateGeoid) ?? null;
}
