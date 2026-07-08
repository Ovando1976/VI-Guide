export type DemoMobilityServiceType =
  | "airport"
  | "cruise"
  | "ferry_transfer"
  | "beach_day"
  | "dinner"
  | "island_tour";

export type DemoMobilityRequestStatus =
  | "new"
  | "quoted"
  | "accepted"
  | "driver_en_route"
  | "arrived"
  | "completed"
  | "cancelled";

export type DemoMobilityIsland = "st_thomas" | "st_john" | "st_croix" | "water_island";

export type DemoMobilityRequest = {
  id: string;
  island: DemoMobilityIsland;
  serviceType: DemoMobilityServiceType;
  pickup: string;
  dropoff: string;
  pickupTime: string;
  passengers: number;
  luggage: number;
  visitorName: string;
  visitorPhone: string;
  notes: string;
  estimatedFare: number;
  status: DemoMobilityRequestStatus;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "vi-guide-demo-mobility-requests";

export const serviceLabels: Record<DemoMobilityServiceType, string> = {
  airport: "Airport Transfer",
  cruise: "Cruise Pickup",
  ferry_transfer: "Ferry Transfer",
  beach_day: "Beach Day Ride",
  dinner: "Dinner / Nightlife",
  island_tour: "Island Tour",
};

export const statusLabels: Record<DemoMobilityRequestStatus, string> = {
  new: "New",
  quoted: "Quoted",
  accepted: "Accepted",
  driver_en_route: "Driver En Route",
  arrived: "Arrived",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const islandLabels: Record<DemoMobilityIsland, string> = {
  st_thomas: "St. Thomas",
  st_john: "St. John",
  st_croix: "St. Croix",
  water_island: "Water Island",
};

export function canUseMobilityStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readDemoMobilityRequests(): DemoMobilityRequest[] {
  if (!canUseMobilityStorage()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedDemoMobilityRequests();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeDemoMobilityRequests(requests: DemoMobilityRequest[]) {
  if (!canUseMobilityStorage()) return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  window.dispatchEvent(new CustomEvent("vi-guide-demo-mobility-updated"));
}

export function calculateDemoFare(input: {
  serviceType: DemoMobilityServiceType;
  passengers: number;
  luggage: number;
}) {
  const baseByType: Record<DemoMobilityServiceType, number> = {
    airport: 28,
    cruise: 24,
    ferry_transfer: 32,
    beach_day: 36,
    dinner: 30,
    island_tour: 95,
  };

  const passengerFee = Math.max(0, input.passengers - 1) * 8;
  const luggageFee = Math.max(0, input.luggage - 1) * 4;

  return baseByType[input.serviceType] + passengerFee + luggageFee;
}

export function createDemoMobilityRequest(
  input: Omit<DemoMobilityRequest, "id" | "estimatedFare" | "status" | "createdAt" | "updatedAt">
) {
  const now = new Date().toISOString();

  const request: DemoMobilityRequest = {
    ...input,
    id: `mobility-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    estimatedFare: calculateDemoFare({
      serviceType: input.serviceType,
      passengers: input.passengers,
      luggage: input.luggage,
    }),
    status: "new",
    createdAt: now,
    updatedAt: now,
  };

  const existing = readDemoMobilityRequests();
  writeDemoMobilityRequests([request, ...existing].slice(0, 100));

  return request;
}

export function updateDemoMobilityRequestStatus(
  id: string,
  status: DemoMobilityRequestStatus
) {
  const now = new Date().toISOString();

  const next = readDemoMobilityRequests().map((request) =>
    request.id === id ? { ...request, status, updatedAt: now } : request
  );

  writeDemoMobilityRequests(next);
}

export function clearDemoMobilityRequests() {
  if (!canUseMobilityStorage()) return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("vi-guide-demo-mobility-updated"));
}

export function seedDemoMobilityRequests() {
  const now = Date.now();

  const requests: DemoMobilityRequest[] = [
    {
      id: "seed-airport-red-hook",
      island: "st_thomas",
      serviceType: "airport",
      pickup: "Cyril E. King Airport",
      dropoff: "Red Hook Ferry Terminal",
      pickupTime: "Today · 4:30 PM",
      passengers: 2,
      luggage: 2,
      visitorName: "Demo Visitor",
      visitorPhone: "(340) 555-1010",
      notes: "Needs ferry-aware transfer timing.",
      estimatedFare: 40,
      status: "new",
      createdAt: new Date(now - 1000 * 60 * 12).toISOString(),
      updatedAt: new Date(now - 1000 * 60 * 12).toISOString(),
    },
    {
      id: "seed-cruise-magens",
      island: "st_thomas",
      serviceType: "cruise",
      pickup: "Havensight Cruise Port",
      dropoff: "Magens Bay",
      pickupTime: "Today · 10:15 AM",
      passengers: 4,
      luggage: 0,
      visitorName: "Cruise Family",
      visitorPhone: "(340) 555-2020",
      notes: "Round trip beach day request.",
      estimatedFare: 48,
      status: "accepted",
      createdAt: new Date(now - 1000 * 60 * 80).toISOString(),
      updatedAt: new Date(now - 1000 * 60 * 45).toISOString(),
    },
    {
      id: "seed-dinner-red-hook",
      island: "st_thomas",
      serviceType: "dinner",
      pickup: "Sapphire Beach",
      dropoff: "Red Hook Restaurants",
      pickupTime: "Tonight · 7:00 PM",
      passengers: 3,
      luggage: 0,
      visitorName: "Dinner Guest",
      visitorPhone: "(340) 555-3030",
      notes: "Wants pickup after dinner too.",
      estimatedFare: 46,
      status: "driver_en_route",
      createdAt: new Date(now - 1000 * 60 * 140).toISOString(),
      updatedAt: new Date(now - 1000 * 60 * 15).toISOString(),
    },
  ];

  if (canUseMobilityStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  }

  return requests;
}
