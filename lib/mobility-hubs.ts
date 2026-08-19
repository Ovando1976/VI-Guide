import type { EstateRecord } from "@/types/usvi";

const STT_TERMINAL = { lat: 18.334993, lng: -64.971275 } as const;

export const CYRIL_E_KING_AIRPORT_GEOID = "mobility:stt:airport:stt";

export const CYRIL_E_KING_AIRPORT: EstateRecord = {
  id: CYRIL_E_KING_AIRPORT_GEOID,
  geoid: CYRIL_E_KING_AIRPORT_GEOID,
  estateCode: "STT-AIRPORT",
  baseName: "Cyril E. King Airport",
  fullName: "Cyril E. King Airport (STT)",
  county: "St. Thomas",
  island: "stt",
  centroid: STT_TERMINAL,
  internalPoint: STT_TERMINAL,
  geometry: {
    type: "Polygon",
    coordinates: [[
      [-64.97145, 18.33484],
      [-64.97110, 18.33484],
      [-64.97110, 18.33515],
      [-64.97145, 18.33515],
      [-64.97145, 18.33484],
    ]],
  },
  aliases: [
    "STT",
    "TIST",
    "Cyril E King Airport",
    "Cyril King Airport",
    "St. Thomas Airport",
    "St Thomas Airport",
    "Airport Terminal",
    "Airport",
  ],
  sources: ["Virgin Islands Port Authority", "OpenStreetMap terminal frontage"],
  roadContext: {
    intersectingRoads: [],
    primaryAccessRoad: {
      name: "Airport Road",
      fullname: "Airport Road / VI Route 302",
      strategy: "nearest",
    },
  },
  description: {
    short: "Cyril E. King Airport passenger terminal and ground-transport hub.",
    long: "Canonical STT airport mobility endpoint. Routing uses the public terminal frontage rather than the runway or airport polygon centroid.",
    source: "manual",
    sourceEntry: "Virgin Islands Port Authority — Cyril E. King Airport",
    confidence: "high",
  },
};

export function withMobilityHubs(estates: EstateRecord[]) {
  if (estates.some((estate) => estate.geoid === CYRIL_E_KING_AIRPORT_GEOID)) {
    return estates;
  }
  return [...estates, CYRIL_E_KING_AIRPORT];
}

export function resolveMobilityEndpoint(
  geoid: string,
  estates: EstateRecord[],
): EstateRecord | undefined {
  if (geoid === CYRIL_E_KING_AIRPORT_GEOID) return CYRIL_E_KING_AIRPORT;
  return estates.find((estate) => estate.geoid === geoid);
}
