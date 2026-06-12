export type LatLng = {
    lat: number;
    lng: number;
  };
  
  export type StThomasZoneKey =
    | "HAVENSIGHT"
    | "CROWN_BAY"
    | "AIRPORT"
    | "CHARLOTTE_AMALIE"
    | "MAGENS_BAY"
    | "COKI"
    | "SAPPHIRE"
    | "RED_HOOK"
    | "FRENCHTOWN"
    | "PARADISE_POINT"
    | "CORAL_WORLD"
    | "MOUNTAIN_TOP";
  
  export type StThomasZone = {
    key: StThomasZoneKey;
    name: string;
    type:
      | "port"
      | "airport"
      | "town"
      | "beach"
      | "food"
      | "attraction"
      | "transport";
    coordinates: LatLng;
  };
  
  export const ST_THOMAS_ZONES: Record<StThomasZoneKey, StThomasZone> = {
    HAVENSIGHT: {
      key: "HAVENSIGHT",
      name: "Havensight Cruise Port",
      type: "port",
      coordinates: { lat: 18.3352, lng: -64.9186 },
    },
    CROWN_BAY: {
      key: "CROWN_BAY",
      name: "Crown Bay Cruise Port",
      type: "port",
      coordinates: { lat: 18.3356, lng: -64.9525 },
    },
    AIRPORT: {
      key: "AIRPORT",
      name: "Cyril E. King Airport",
      type: "airport",
      coordinates: { lat: 18.3373, lng: -64.9734 },
    },
    CHARLOTTE_AMALIE: {
      key: "CHARLOTTE_AMALIE",
      name: "Charlotte Amalie",
      type: "town",
      coordinates: { lat: 18.3419, lng: -64.9307 },
    },
    MAGENS_BAY: {
      key: "MAGENS_BAY",
      name: "Magens Bay",
      type: "beach",
      coordinates: { lat: 18.3614, lng: -64.9256 },
    },
    COKI: {
      key: "COKI",
      name: "Coki Point Beach",
      type: "beach",
      coordinates: { lat: 18.3497, lng: -64.8677 },
    },
    SAPPHIRE: {
      key: "SAPPHIRE",
      name: "Sapphire Beach",
      type: "beach",
      coordinates: { lat: 18.3347, lng: -64.8486 },
    },
    RED_HOOK: {
      key: "RED_HOOK",
      name: "Red Hook",
      type: "transport",
      coordinates: { lat: 18.3269, lng: -64.8506 },
    },
    FRENCHTOWN: {
      key: "FRENCHTOWN",
      name: "Frenchtown Dining",
      type: "food",
      coordinates: { lat: 18.3388, lng: -64.9403 },
    },
    PARADISE_POINT: {
      key: "PARADISE_POINT",
      name: "Paradise Point Skyride",
      type: "attraction",
      coordinates: { lat: 18.3336, lng: -64.9171 },
    },
    CORAL_WORLD: {
      key: "CORAL_WORLD",
      name: "Coral World Ocean Park",
      type: "attraction",
      coordinates: { lat: 18.3493, lng: -64.8667 },
    },
    MOUNTAIN_TOP: {
      key: "MOUNTAIN_TOP",
      name: "Mountain Top",
      type: "attraction",
      coordinates: { lat: 18.3668, lng: -64.9397 },
    },
  };
  
  export function getArrivalZone(arrival: "cruise" | "airport" | "ferry" | "hotel") {
    if (arrival === "airport") return ST_THOMAS_ZONES.AIRPORT;
    if (arrival === "ferry") return ST_THOMAS_ZONES.RED_HOOK;
    if (arrival === "hotel") return ST_THOMAS_ZONES.CHARLOTTE_AMALIE;
    return ST_THOMAS_ZONES.HAVENSIGHT;
  }