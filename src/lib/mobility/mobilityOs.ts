export type MobilityIsland =
  | "st_thomas"
  | "st_john"
  | "st_croix"
  | "water_island";

export type MobilityServiceType =
  | "airport_transfer"
  | "cruise_pickup"
  | "ferry_transfer"
  | "beach_trip"
  | "dinner_nightlife"
  | "private_group"
  | "custom_ride";

export type MobilityRequestStatus =
  | "new"
  | "quoted"
  | "accepted"
  | "driver_en_route"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled";

export type MobilityZonePreset = {
  id: string;
  name: string;
  description: string;
  island: MobilityIsland;
};

export type MobilityDriver = {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  island: MobilityIsland;
  status: "available" | "busy" | "offline";
  notes: string;
};

export type MobilityFareInput = {
  serviceType: MobilityServiceType;
  island: MobilityIsland;
  pickup: string;
  dropoff: string;
  passengers: number;
  luggage: number;
};

export const islandLabels: Record<MobilityIsland, string> = {
  st_thomas: "St. Thomas",
  st_john: "St. John",
  st_croix: "St. Croix",
  water_island: "Water Island",
};

export const serviceLabels: Record<MobilityServiceType, string> = {
  airport_transfer: "Airport Transfer",
  cruise_pickup: "Cruise Pickup",
  ferry_transfer: "Ferry Transfer",
  beach_trip: "Beach Trip",
  dinner_nightlife: "Dinner / Nightlife",
  private_group: "Private / Group Ride",
  custom_ride: "Custom Ride",
};

export const statusLabels: Record<MobilityRequestStatus, string> = {
  new: "New",
  quoted: "Quoted",
  accepted: "Accepted",
  driver_en_route: "Driver En Route",
  arrived: "Arrived",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const statusFlow: MobilityRequestStatus[] = [
  "new",
  "quoted",
  "accepted",
  "driver_en_route",
  "arrived",
  "in_progress",
  "completed",
];

export const mobilityServices: Array<{
  id: MobilityServiceType;
  title: string;
  subtitle: string;
  icon: string;
  defaultPickup?: string;
  defaultDropoff?: string;
}> = [
  {
    id: "airport_transfer",
    title: "Airport Transfer",
    subtitle: "Airport to hotel, villa, ferry, or town.",
    icon: "plane",
    defaultPickup: "Cyril E. King Airport",
    defaultDropoff: "Red Hook Ferry Terminal",
  },
  {
    id: "cruise_pickup",
    title: "Cruise Pickup",
    subtitle: "Havensight / Crown Bay visitor movement.",
    icon: "ship",
    defaultPickup: "Havensight Cruise Port",
    defaultDropoff: "Magens Bay",
  },
  {
    id: "ferry_transfer",
    title: "Ferry Transfer",
    subtitle: "Airport, hotel, or villa to ferry timing.",
    icon: "navigation",
    defaultPickup: "Red Hook Ferry Terminal",
    defaultDropoff: "Cruz Bay Ferry Dock",
  },
  {
    id: "beach_trip",
    title: "Beach Trip",
    subtitle: "Beach day pickup and return coordination.",
    icon: "waves",
    defaultPickup: "Hotel / Villa Pickup",
    defaultDropoff: "Magens Bay",
  },
  {
    id: "dinner_nightlife",
    title: "Dinner / Nightlife",
    subtitle: "Evening ride request with return option.",
    icon: "utensils",
    defaultPickup: "Sapphire Beach",
    defaultDropoff: "Red Hook Restaurants",
  },
  {
    id: "private_group",
    title: "Private / Group",
    subtitle: "Family, group, event, and custom transfers.",
    icon: "users",
    defaultPickup: "Custom Pickup",
    defaultDropoff: "Custom Dropoff",
  },
];

export const zonePresets: Record<MobilityIsland, MobilityZonePreset[]> = {
  st_thomas: [
    {
      id: "stt-airport",
      name: "Cyril E. King Airport",
      description: "Airport arrivals and departures",
      island: "st_thomas",
    },
    {
      id: "stt-red-hook",
      name: "Red Hook Ferry Terminal",
      description: "Ferry transfer hub",
      island: "st_thomas",
    },
    {
      id: "stt-havensight",
      name: "Havensight Cruise Port",
      description: "Cruise visitor pickup",
      island: "st_thomas",
    },
    {
      id: "stt-magens",
      name: "Magens Bay",
      description: "Beach day destination",
      island: "st_thomas",
    },
    {
      id: "stt-sapphire",
      name: "Sapphire Beach",
      description: "Hotel / villa / beach pickup",
      island: "st_thomas",
    },
    {
      id: "stt-charlotte-amalie",
      name: "Charlotte Amalie",
      description: "Town, shopping, hotels",
      island: "st_thomas",
    },
  ],
  st_john: [
    {
      id: "stj-cruz-bay",
      name: "Cruz Bay Ferry Dock",
      description: "Main ferry and taxi hub",
      island: "st_john",
    },
    {
      id: "stj-coral-bay",
      name: "Coral Bay",
      description: "East End / Coral Bay",
      island: "st_john",
    },
    {
      id: "stj-trunk",
      name: "Trunk Bay",
      description: "Beach day destination",
      island: "st_john",
    },
  ],
  st_croix: [
    {
      id: "stx-airport",
      name: "Henry E. Rohlsen Airport",
      description: "Airport arrivals and departures",
      island: "st_croix",
    },
    {
      id: "stx-christiansted",
      name: "Christiansted",
      description: "Town, hotels, boardwalk",
      island: "st_croix",
    },
    {
      id: "stx-frederiksted",
      name: "Frederiksted",
      description: "Cruise pier and west end",
      island: "st_croix",
    },
  ],
  water_island: [
    {
      id: "wat-ferry",
      name: "Water Island Ferry",
      description: "Water Island ferry movement",
      island: "water_island",
    },
    {
      id: "wat-honeymoon",
      name: "Honeymoon Beach",
      description: "Beach day destination",
      island: "water_island",
    },
  ],
};

export const mobilityDrivers: MobilityDriver[] = [
  {
    id: "driver-001",
    name: "Joseph Thomas",
    phone: "(340) 555-1101",
    vehicle: "Van 12 · STT Taxi",
    island: "st_thomas",
    status: "available",
    notes: "Airport / Red Hook specialist",
  },
  {
    id: "driver-002",
    name: "Marsha Francis",
    phone: "(340) 555-1102",
    vehicle: "SUV 7 · East End",
    island: "st_thomas",
    status: "available",
    notes: "Hotel, dinner, beach trips",
  },
  {
    id: "driver-003",
    name: "David Benjamin",
    phone: "(340) 555-1103",
    vehicle: "Van 20 · Cruise",
    island: "st_thomas",
    status: "busy",
    notes: "Cruise group movement",
  },
  {
    id: "driver-004",
    name: "Alicia George",
    phone: "(340) 555-2201",
    vehicle: "SUV 5 · STJ",
    island: "st_john",
    status: "available",
    notes: "Cruz Bay / North Shore",
  },
  {
    id: "driver-005",
    name: "Marcus Henry",
    phone: "(340) 555-3301",
    vehicle: "Van 10 · STX",
    island: "st_croix",
    status: "available",
    notes: "Christiansted / Frederiksted",
  },
];

export function nextMobilityStatus(status: MobilityRequestStatus) {
  if (status === "cancelled" || status === "completed") return status;
  const index = statusFlow.indexOf(status);
  if (index < 0 || index === statusFlow.length - 1) return status;
  return statusFlow[index + 1];
}

export function estimateMobilityFare(input: MobilityFareInput) {
  const serviceBase: Record<MobilityServiceType, number> = {
    airport_transfer: 32,
    cruise_pickup: 28,
    ferry_transfer: 35,
    beach_trip: 24,
    dinner_nightlife: 26,
    private_group: 60,
    custom_ride: 30,
  };

  const islandPremium: Record<MobilityIsland, number> = {
    st_thomas: 0,
    st_john: 8,
    st_croix: 4,
    water_island: 12,
  };

  const passengerCharge = Math.max(input.passengers - 1, 0) * 6;
  const luggageCharge = Math.max(input.luggage - 1, 0) * 3;

  const airportOrFerry =
    /airport|ferry|red hook|cruz bay/i.test(`${input.pickup} ${input.dropoff}`)
      ? 6
      : 0;

  const cruise =
    /cruise|havensight|crown bay|frederiksted/i.test(
      `${input.pickup} ${input.dropoff}`
    )
      ? 5
      : 0;

  const total =
    serviceBase[input.serviceType] +
    islandPremium[input.island] +
    passengerCharge +
    luggageCharge +
    airportOrFerry +
    cruise;

  return Math.max(18, Math.round(total));
}

export function formatMoney(value: number | string | undefined) {
  const amount = Number(value || 0);
  return `$${amount.toLocaleString()}`;
}

export function formatDateTime(value: number | string | undefined) {
  if (!value) return "Unknown time";

  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}
