import { getArrivalZone, ST_THOMAS_ZONES, LatLng } from "../data/stThomasZones";

export type VisitorMode = "cruise_day" | "hotel_airline";
export type ArrivalType = "cruise" | "airport" | "ferry" | "hotel";
export type TimeWindow = "4" | "6" | "8" | "full";
export type TripLength = "day" | "2_days" | "3_days" | "5_days" | "week";

export type Interest =
  | "beach"
  | "food"
  | "shopping"
  | "history"
  | "family"
  | "snorkeling";

export type SavedPlanStop = {
  id: string;
  title: string;
  type: string;
  lat: number;
  lng: number;
  description: string;
};

export type ItineraryStop = {
  id: string;
  title: string;
  type: string;
  description: string;
  time: string;
  durationMinutes: number;
  duration: string;
  travelMinutes: number;
  travelTime: string;
  costLow: number;
  costHigh: number;
  cost: string;
  coordinates?: LatLng;
};

export type ItineraryDay = {
  id: string;
  title: string;
  subtitle: string;
  items: ItineraryStop[];
  routeCoordinates: LatLng[];
};

export type ItineraryPlan = {
  mode: VisitorMode;
  days: ItineraryDay[];
  items: ItineraryStop[];
  safeReturnTime: string;
  totalCostLow: number;
  totalCostHigh: number;
  totalCostLabel: string;
  routeCoordinates: LatLng[];
};

function addMinutes(base: Date, minutes: number) {
  return new Date(base.getTime() + minutes * 60_000);
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStartTime(arrival: ArrivalType, dayIndex = 0) {
  const date = new Date();
  date.setDate(date.getDate() + dayIndex);
  date.setHours(arrival === "cruise" ? 8 : 9, 0, 0, 0);
  return date;
}

function getMaxMinutes(time: TimeWindow) {
  if (time === "4") return 240;
  if (time === "6") return 360;
  if (time === "8") return 480;
  return 600;
}

function getTripDayCount(length: TripLength) {
  if (length === "2_days") return 2;
  if (length === "3_days") return 3;
  if (length === "5_days") return 5;
  if (length === "week") return 7;
  return 1;
}

function estimateTravelMinutes() {
  return 20;
}

function estimateDurationMinutes(type: string) {
  if (type === "beach") return 90;
  if (type === "food" || type === "restaurant") return 60;
  if (type === "history") return 45;
  if (type === "shopping") return 45;
  if (type === "transport") return 20;
  if (type === "arrival" || type === "return" || type === "hotel") return 15;
  return 60;
}

function estimateCost(type: string) {
  if (type === "beach") return { low: 0, high: 7, label: "$0–$7" };
  if (type === "food" || type === "restaurant")
    return { low: 20, high: 45, label: "$20–$45" };
  if (type === "history") return { low: 0, high: 15, label: "$0–$15" };
  if (type === "shopping") return { low: 0, high: 100, label: "Variable" };
  if (type === "transport") return { low: 0, high: 0, label: "Taxi varies" };
  if (type === "arrival" || type === "return" || type === "hotel")
    return { low: 0, high: 0, label: "$0" };

  return { low: 0, high: 35, label: "$0–$35" };
}

function fallbackStops(interests: Interest[]): SavedPlanStop[] {
  const stops: SavedPlanStop[] = [];

  if (interests.includes("history")) {
    stops.push({
      id: "fort-christian",
      title: "Fort Christian",
      type: "history",
      lat: 18.3411,
      lng: -64.9302,
      description: "Historic Charlotte Amalie landmark.",
    });
  }

  if (interests.includes("beach")) {
    stops.push({
      id: "magens-bay",
      title: "Magens Bay",
      type: "beach",
      lat: ST_THOMAS_ZONES.MAGENS_BAY.coordinates.lat,
      lng: ST_THOMAS_ZONES.MAGENS_BAY.coordinates.lng,
      description: "Iconic calm-water beach.",
    });
  }

  if (interests.includes("snorkeling")) {
    stops.push({
      id: "coki-beach",
      title: "Coki Point Beach",
      type: "beach",
      lat: ST_THOMAS_ZONES.COKI.coordinates.lat,
      lng: ST_THOMAS_ZONES.COKI.coordinates.lng,
      description: "Popular snorkeling stop near Coral World.",
    });
  }

  if (interests.includes("family")) {
    stops.push({
      id: "coral-world",
      title: "Coral World Ocean Park",
      type: "attraction",
      lat: ST_THOMAS_ZONES.CORAL_WORLD.coordinates.lat,
      lng: ST_THOMAS_ZONES.CORAL_WORLD.coordinates.lng,
      description: "Family-friendly marine attraction beside Coki Point.",
    });
  }

  if (interests.includes("food")) {
    stops.push({
      id: "frenchtown-dining",
      title: "Frenchtown Dining",
      type: "food",
      lat: ST_THOMAS_ZONES.FRENCHTOWN.coordinates.lat,
      lng: ST_THOMAS_ZONES.FRENCHTOWN.coordinates.lng,
      description: "Waterfront dining near Charlotte Amalie.",
    });
  }

  if (interests.includes("shopping")) {
    stops.push({
      id: "downtown-shopping",
      title: "Downtown Charlotte Amalie",
      type: "shopping",
      lat: ST_THOMAS_ZONES.CHARLOTTE_AMALIE.coordinates.lat,
      lng: ST_THOMAS_ZONES.CHARLOTTE_AMALIE.coordinates.lng,
      description: "Shopping, history, food, and waterfront walking.",
    });
  }

  return stops.slice(0, 4);
}

function hotelDayStops(dayIndex: number, interests: Interest[]): SavedPlanStop[] {
  if (dayIndex === 0) {
    return [
      {
        id: "hotel-checkin",
        title: "Hotel / Villa Check-In",
        type: "hotel",
        lat: ST_THOMAS_ZONES.CHARLOTTE_AMALIE.coordinates.lat,
        lng: ST_THOMAS_ZONES.CHARLOTTE_AMALIE.coordinates.lng,
        description: "Settle in, drop bags, and keep the first day light.",
      },
      {
        id: "frenchtown-dinner",
        title: "Easy Dinner Stop",
        type: "food",
        lat: ST_THOMAS_ZONES.FRENCHTOWN.coordinates.lat,
        lng: ST_THOMAS_ZONES.FRENCHTOWN.coordinates.lng,
        description: "Start with a relaxed waterfront dinner.",
      },
    ];
  }

  if (dayIndex === 1) {
    return [
      {
        id: "magens-bay",
        title: "Magens Bay Beach Day",
        type: "beach",
        lat: ST_THOMAS_ZONES.MAGENS_BAY.coordinates.lat,
        lng: ST_THOMAS_ZONES.MAGENS_BAY.coordinates.lng,
        description: "Classic St. Thomas beach day with calm water.",
      },
      {
        id: "mountain-top",
        title: "Mountain Top Overlook",
        type: "attraction",
        lat: ST_THOMAS_ZONES.MOUNTAIN_TOP.coordinates.lat,
        lng: ST_THOMAS_ZONES.MOUNTAIN_TOP.coordinates.lng,
        description: "Scenic overlook stop with island views.",
      },
    ];
  }

  if (dayIndex === 2) {
    return [
      {
        id: "red-hook",
        title: "Red Hook / Ferry Option",
        type: "transport",
        lat: ST_THOMAS_ZONES.RED_HOOK.coordinates.lat,
        lng: ST_THOMAS_ZONES.RED_HOOK.coordinates.lng,
        description: "Use this as a St. John ferry day or East End food stop.",
      },
      {
        id: "sapphire-beach",
        title: "Sapphire Beach",
        type: "beach",
        lat: ST_THOMAS_ZONES.SAPPHIRE.coordinates.lat,
        lng: ST_THOMAS_ZONES.SAPPHIRE.coordinates.lng,
        description: "Great views toward St. John and nearby islands.",
      },
    ];
  }

  return fallbackStops(interests).slice(0, 3);
}

function createStop(
  stop: SavedPlanStop,
  time: Date,
  travelMinutes: number
): ItineraryStop {
  const durationMinutes = estimateDurationMinutes(stop.type);
  const cost = estimateCost(stop.type);

  return {
    id: stop.id,
    title: stop.title,
    type: stop.type,
    description: stop.description,
    time: formatTime(time),
    durationMinutes,
    duration: `${durationMinutes} min`,
    travelMinutes,
    travelTime: `${travelMinutes} min`,
    costLow: cost.low,
    costHigh: cost.high,
    cost: cost.label,
    coordinates: { lat: stop.lat, lng: stop.lng },
  };
}

function buildDay({
  id,
  title,
  subtitle,
  arrival,
  stops,
  startTime,
  returnTitle,
  returnDescription,
  safeReturnDate,
}: {
  id: string;
  title: string;
  subtitle: string;
  arrival: ArrivalType;
  stops: SavedPlanStop[];
  startTime: Date;
  returnTitle: string;
  returnDescription: string;
  safeReturnDate: Date;
}): ItineraryDay {
  const startZone = getArrivalZone(arrival);
  let cursor = startTime;
  const items: ItineraryStop[] = [];

  items.push({
    id: `${id}-arrival`,
    title: startZone.name,
    type: arrival === "hotel" ? "hotel" : "arrival",
    description:
      arrival === "hotel"
        ? "Begin from your hotel or villa base."
        : "Begin your island day and confirm your return time.",
    time: formatTime(cursor),
    durationMinutes: 15,
    duration: "15 min",
    travelMinutes: 0,
    travelTime: "0 min",
    costLow: 0,
    costHigh: 0,
    cost: "$0",
    coordinates: startZone.coordinates,
  });

  cursor = addMinutes(cursor, 15);

  stops.forEach((stop) => {
    const travelMinutes = estimateTravelMinutes();
    cursor = addMinutes(cursor, travelMinutes);

    const itineraryStop = createStop(stop, cursor, travelMinutes);
    items.push(itineraryStop);

    cursor = addMinutes(cursor, itineraryStop.durationMinutes);
  });

  items.push({
    id: `${id}-return`,
    title: returnTitle,
    type: "return",
    description: returnDescription,
    time: formatTime(safeReturnDate),
    durationMinutes: 30,
    duration: "30 min",
    travelMinutes: 25,
    travelTime: "20–30 min",
    costLow: 0,
    costHigh: 0,
    cost: "Taxi varies",
    coordinates: startZone.coordinates,
  });

  const routeCoordinates = items
    .map((item) => item.coordinates)
    .filter((coord): coord is LatLng => Boolean(coord));

  return {
    id,
    title,
    subtitle,
    items,
    routeCoordinates,
  };
}

export function buildSmartItinerary({
  mode,
  arrival,
  time,
  tripLength,
  interests,
  savedStops,
}: {
  mode: VisitorMode;
  arrival: ArrivalType;
  time: TimeWindow;
  tripLength: TripLength;
  interests: Interest[];
  savedStops: SavedPlanStop[];
}): ItineraryPlan {
  if (mode === "hotel_airline") {
    const dayCount = getTripDayCount(tripLength);
    const days: ItineraryDay[] = [];

    for (let i = 0; i < dayCount; i += 1) {
      const startTime = getStartTime(i === 0 ? "airport" : "hotel", i);
      const safeReturnDate = addMinutes(startTime, 540);

      const stops =
        i === 0 && savedStops.length > 0
          ? savedStops
          : hotelDayStops(i, interests);

      days.push(
        buildDay({
          id: `day-${i + 1}`,
          title: i === 0 ? "Arrival Day" : `Day ${i + 1}`,
          subtitle:
            i === 0
              ? "Airport arrival, check-in, and easy evening."
              : "Island exploration from your hotel base.",
          arrival: i === 0 ? "airport" : "hotel",
          stops,
          startTime,
          returnTitle: "Return to hotel / villa",
          returnDescription: "Return to your lodging and reset for the next day.",
          safeReturnDate,
        })
      );
    }

    const items = days.flatMap((day) => day.items);
    const routeCoordinates = days[0]?.routeCoordinates ?? [];

    const totalCostLow = items.reduce((sum, item) => sum + item.costLow, 0);
    const totalCostHigh = items.reduce((sum, item) => sum + item.costHigh, 0);

    return {
      mode,
      days,
      items,
      safeReturnTime: days[0]?.items.at(-1)?.time ?? "",
      totalCostLow,
      totalCostHigh,
      totalCostLabel: `$${totalCostLow}–$${totalCostHigh}`,
      routeCoordinates,
    };
  }

  const startTime = getStartTime(arrival);
  const maxMinutes = getMaxMinutes(time);
  const safeReturnBuffer = arrival === "cruise" ? 90 : 45;
  const safeReturnDate = addMinutes(startTime, maxMinutes - safeReturnBuffer);

  const selectedStops =
    savedStops.length > 0 ? savedStops : fallbackStops(interests);

  const day = buildDay({
    id: "cruise-day",
    title: "Cruise Day",
    subtitle: "A safe one-day island plan with return buffer.",
    arrival,
    stops: selectedStops,
    startTime,
    returnTitle: arrival === "cruise" ? "Return to ship" : "Return to start",
    returnDescription:
      arrival === "cruise"
        ? "Return at least 60–90 minutes before departure."
        : "Return safely with enough buffer for traffic.",
    safeReturnDate,
  });

  const totalCostLow = day.items.reduce((sum, item) => sum + item.costLow, 0);
  const totalCostHigh = day.items.reduce((sum, item) => sum + item.costHigh, 0);

  return {
    mode,
    days: [day],
    items: day.items,
    safeReturnTime: formatTime(safeReturnDate),
    totalCostLow,
    totalCostHigh,
    totalCostLabel: `$${totalCostLow}–$${totalCostHigh}`,
    routeCoordinates: day.routeCoordinates,
  };
}