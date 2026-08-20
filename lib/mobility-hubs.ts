import type { EstateRecord, LngLat } from "@/types/usvi";

const STT_TERMINAL = { lat: 18.334993, lng: -64.971275 } as const;
const RED_HOOK_CDP = { lat: 18.3265081, lng: -64.8461621 } as const;
const RED_HOOK_FERRY = { lat: 18.32621, lng: -64.84967 } as const;

const SMITH_BAY_ESTATE_GEOID = "7803072500";
const SMITH_BAY_ESTATE_NAME = "Smith Bay";

function pointGeometry(point: LngLat): GeoJSON.Polygon {
  const d = 0.00008;
  return {
    type: "Polygon",
    coordinates: [[
      [point.lng - d, point.lat - d],
      [point.lng + d, point.lat - d],
      [point.lng + d, point.lat + d],
      [point.lng - d, point.lat + d],
      [point.lng - d, point.lat - d],
    ]],
  };
}

export const CYRIL_E_KING_AIRPORT_GEOID = "mobility:stt:airport:stt";
export const RED_HOOK_GEOID = "mobility:stt:place:red-hook";
export const RED_HOOK_FERRY_TERMINAL_GEOID =
  "mobility:stt:terminal:red-hook-passenger-ferry";

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
  geometry: pointGeometry(STT_TERMINAL),
  recordKind: "mobility_hub",
  tariffEndpointName: "Airport Terminal",
  tariffResolution: "direct",
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
  spatialVerification: {
    status: "verified",
    coordinateSource: "public terminal frontage map point",
    notes: "Routing anchor is the passenger-terminal frontage, not the runway centroid.",
  },
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

export const RED_HOOK: EstateRecord = {
  id: RED_HOOK_GEOID,
  geoid: RED_HOOK_GEOID,
  estateCode: "STT-RED-HOOK",
  baseName: "Red Hook",
  fullName: "Red Hook, Estate Smith Bay",
  county: "St. Thomas",
  island: "stt",
  centroid: RED_HOOK_CDP,
  internalPoint: RED_HOOK_CDP,
  geometry: pointGeometry(RED_HOOK_CDP),
  recordKind: "mobility_place",
  parentEstateGeoid: SMITH_BAY_ESTATE_GEOID,
  parentEstateName: SMITH_BAY_ESTATE_NAME,
  tariffEndpointName: "Red Hook",
  tariffResolution: "direct",
  aliases: ["Redhook", "Red Hook town", "Red Hook St Thomas"],
  sources: [
    "U.S. Census Bureau — Red Hook CDP",
    "U.S. Census Bureau — Estate Smith Bay",
  ],
  spatialVerification: {
    status: "verified",
    coordinateSource: "U.S. Census Bureau Red Hook CDP centroid",
    estateSource: "U.S. Census Bureau Estate Smith Bay GEOID 7803072500",
    notes:
      "Red Hook is geographically grouped under Estate Smith Bay, but retains the direct Red Hook tariff endpoint when the published tariff names Red Hook.",
  },
  description: {
    short: "Red Hook commercial and ferry district within Estate Smith Bay.",
    long: "Passenger-facing Red Hook place record. Geography remains tied to Estate Smith Bay while regulated fare matching preserves the direct Red Hook tariff identity.",
    source: "manual",
    sourceEntry: "Census Red Hook CDP / Estate Smith Bay",
    confidence: "high",
  },
};

export const RED_HOOK_FERRY_TERMINAL: EstateRecord = {
  id: RED_HOOK_FERRY_TERMINAL_GEOID,
  geoid: RED_HOOK_FERRY_TERMINAL_GEOID,
  estateCode: "STT-RED-HOOK-FERRY",
  baseName: "Red Hook Ferry Terminal",
  fullName: "Urman V. Fredericks Marine Terminal — Red Hook",
  county: "St. Thomas",
  island: "stt",
  centroid: RED_HOOK_FERRY,
  internalPoint: RED_HOOK_FERRY,
  geometry: pointGeometry(RED_HOOK_FERRY),
  recordKind: "mobility_hub",
  parentEstateGeoid: SMITH_BAY_ESTATE_GEOID,
  parentEstateName: SMITH_BAY_ESTATE_NAME,
  tariffEndpointName: "Red Hook",
  tariffResolution: "direct",
  aliases: [
    "Urman Victor Fredericks Marine Terminal",
    "Urman V Fredericks Marine Terminal",
    "Red Hook passenger ferry",
    "Red Hook ferry dock",
    "Red Hook ferry",
  ],
  sources: [
    "Virgin Islands Port Authority — Urman Victor Fredericks Marine Terminal",
    "OpenStreetMap ferry-terminal point",
    "U.S. Census Bureau — Estate Smith Bay",
  ],
  spatialVerification: {
    status: "verified",
    coordinateSource: "OpenStreetMap way 522497662 ferry-terminal point",
    estateSource: "U.S. Census Bureau Estate Smith Bay GEOID 7803072500",
    notes:
      "Use this terminal point for passenger ferry transfers. Fare identity remains Red Hook rather than inheriting the broader Smith Bay fare.",
  },
  roadContext: {
    intersectingRoads: [],
    primaryAccessRoad: {
      name: "Route 32",
      fullname: "VI Route 32 — Red Hook",
      strategy: "nearest",
    },
  },
  description: {
    short: "Passenger ferry terminal for St. John and BVI connections in Red Hook.",
    long: "VIPA's Urman V. Fredericks Marine Terminal. This point is used for passenger drop-off and pickup routing while official taxi fare matching resolves to the published Red Hook endpoint.",
    source: "manual",
    sourceEntry: "Virgin Islands Port Authority — Urman Victor Fredericks Marine Terminal",
    confidence: "high",
  },
};

const MOBILITY_ENDPOINTS = [
  CYRIL_E_KING_AIRPORT,
  RED_HOOK,
  RED_HOOK_FERRY_TERMINAL,
] as const;

export function withMobilityHubs(estates: EstateRecord[]) {
  const existing = new Set(estates.map((estate) => estate.geoid));
  return [
    ...estates,
    ...MOBILITY_ENDPOINTS.filter((endpoint) => !existing.has(endpoint.geoid)),
  ];
}

export function resolveMobilityEndpoint(
  geoid: string,
  estates: EstateRecord[],
): EstateRecord | undefined {
  return (
    MOBILITY_ENDPOINTS.find((endpoint) => endpoint.geoid === geoid) ??
    estates.find((estate) => estate.geoid === geoid)
  );
}
