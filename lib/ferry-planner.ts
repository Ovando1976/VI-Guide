export type FerryPortId = "red-hook" | "cruz-bay" | "charlotte-amalie" | "gallows-bay" | "crown-bay" | "phillips-landing" | "road-town" | "west-end" | "spanish-town" | "trellis-bay" | "great-harbour" | "setting-point" | "enighed-pond";
export type FerryMode = "passenger" | "car-barge";

export type FerryFare = {
  currency: "USD";
  adultOneWay: number;
  adultRoundTrip?: number;
  childOneWay?: number;
  residentOneWay?: number;
  residentSeniorOneWay?: number;
  bagOneWay?: number;
};

export type FerryRoute = {
  id: string;
  mode?: FerryMode;
  from: FerryPortId;
  to: FerryPortId;
  fromLabel: string;
  toLabel: string;
  serviceLabel: string;
  durationMinutes: number;
  departures: string[];
  weekdayDepartures?: string[];
  weekendDepartures?: string[];
  saturdayDepartures?: string[];
  sundayDepartures?: string[];
  operatingDays: string;
  serviceDays?: number[];
  fareNote: string;
  fare?: FerryFare;
  checkInMinutes: number;
  sourceLabel: string;
  sourceUrl: string;
  operatorName?: string;
  operatorPhones?: string[];
  terminalName?: string;
  terminalNote?: string;
  requiresPassport?: boolean;
  bookingUrl?: string;
  goodToKnow?: string[];
  vehicleFare?: { oneWay: number; roundTrip: number; note: string };
  seasonal?: boolean;
};

export type NextFerryDeparture = {
  label: string;
  dayLabel: string;
  minutesUntil: number;
  leaveForTerminalInMinutes: number;
};

export const FERRY_PORTS = [
  { id: "red-hook" as const, label: "Red Hook", island: "St. Thomas" },
  { id: "charlotte-amalie" as const, label: "Charlotte Amalie", island: "St. Thomas" },
  { id: "cruz-bay" as const, label: "Cruz Bay", island: "St. John" },
  { id: "gallows-bay" as const, label: "Gallows Bay / Christiansted", island: "St. Croix" },
  { id: "crown-bay" as const, label: "Crown Bay", island: "St. Thomas" },
  { id: "phillips-landing" as const, label: "Phillips Landing", island: "Water Island" },
  { id: "road-town" as const, label: "Road Town", island: "Tortola, BVI" },
  { id: "west-end" as const, label: "West End", island: "Tortola, BVI" },
  { id: "spanish-town" as const, label: "Spanish Town", island: "Virgin Gorda, BVI" },
  { id: "trellis-bay" as const, label: "Trellis Bay", island: "Beef Island, BVI" },
  { id: "great-harbour" as const, label: "Great Harbour", island: "Jost Van Dyke, BVI" },
  { id: "setting-point" as const, label: "Setting Point", island: "Anegada, BVI" },
  { id: "enighed-pond" as const, label: "Enighed Pond", island: "St. John" },
];

const VIPA = "https://www.viport.com/schedules-ferrycargoschedules";
const BVI_TOURISM = "https://www.bvitourism.com/ferry-schedules";
const WATER_ISLAND = "https://waterislandferry.com/";
const INTER_ISLAND = "https://www.interislandboatservices.com/";
const LOVE_CITY = "https://www.lovecitycarferries.com/schedule.html";
const DAILY = [0, 1, 2, 3, 4, 5, 6];
const THURSDAY_TO_MONDAY = [0, 1, 4, 5, 6];
const MONDAY_WEDNESDAY_FRIDAY = [1, 3, 5];
const SATURDAY = [6];
const RED_HOOK_WEEKDAYS = ["5:30 AM", "6:30 AM", "7:30 AM", "8:30 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM", "11:00 PM", "11:30 PM"];
const RED_HOOK_WEEKENDS = RED_HOOK_WEEKDAYS.slice(1);
const CRUZ_BAY_WEEKDAYS = ["6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "11:00 AM", "1:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM", "11:00 PM"];
const CRUZ_BAY_WEEKENDS = ["6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM", "11:00 PM"];
const CROWN_BAY_WATER_ISLAND = ["7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM"];
const WATER_ISLAND_CROWN_BAY = ["7:15 AM", "8:15 AM", "9:15 AM", "10:15 AM", "11:15 AM", "12:15 PM", "1:15 PM", "2:15 PM", "3:15 PM", "4:15 PM", "5:15 PM", "6:15 PM"];

const RED_HOOK_FARE: FerryFare = {
  currency: "USD",
  adultOneWay: 8.15,
  adultRoundTrip: 16.3,
  childOneWay: 1,
  residentOneWay: 6,
  residentSeniorOneWay: 1.5,
  bagOneWay: 4,
};

export const FERRY_ROUTES: FerryRoute[] = [
  {
    id: "red-hook-cruz-bay",
    from: "red-hook",
    to: "cruz-bay",
    fromLabel: "Red Hook, St. Thomas",
    toLabel: "Cruz Bay, St. John",
    serviceLabel: "Passenger ferry",
    durationMinutes: 20,
    departures: RED_HOOK_WEEKDAYS,
    weekdayDepartures: RED_HOOK_WEEKDAYS,
    weekendDepartures: RED_HOOK_WEEKENDS,
    operatingDays: "Daily; weekday and weekend schedules differ",
    serviceDays: DAILY,
    fareNote: "VIPA lists $8.15 non-resident adult, $6 resident, $1 child and $4 per bag each way.",
    fare: RED_HOOK_FARE,
    checkInMinutes: 15,
    sourceLabel: "Virgin Islands Port Authority / Department of Public Works",
    sourceUrl: VIPA,
    operatorName: "Transportation Services & Varlack Ventures",
    operatorPhones: ["(340) 776-6282", "(340) 776-6412"],
    terminalName: "Urman V. Fredericks Marine Terminal",
    terminalNote: "Open 6 AM–midnight. The first 15 minutes of parking are free.",
    bookingUrl: "https://stjohnticketing.com/",
    goodToKnow: ["No reservation is normally needed; boarding is first come, first served.", "Tickets purchased in advance are valid for up to 10 days.", "One personal item is free; additional bags are $4 each."],
  },
  {
    id: "cruz-bay-red-hook",
    from: "cruz-bay",
    to: "red-hook",
    fromLabel: "Cruz Bay, St. John",
    toLabel: "Red Hook, St. Thomas",
    serviceLabel: "Passenger ferry",
    durationMinutes: 20,
    departures: CRUZ_BAY_WEEKDAYS,
    weekdayDepartures: CRUZ_BAY_WEEKDAYS,
    weekendDepartures: CRUZ_BAY_WEEKENDS,
    operatingDays: "Daily; weekday and weekend schedules differ",
    serviceDays: DAILY,
    fareNote: "VIPA lists $8.15 non-resident adult, $6 resident, $1 child and $4 per bag each way.",
    fare: RED_HOOK_FARE,
    checkInMinutes: 15,
    sourceLabel: "Virgin Islands Port Authority / Department of Public Works",
    sourceUrl: VIPA,
    operatorName: "Transportation Services & Varlack Ventures",
    operatorPhones: ["(340) 776-6282", "(340) 776-6412"],
    terminalName: "Loredon L. Boynes Sr. Dock",
    terminalNote: "Main St. John passenger dock with ticket booth, restroom and open-air waiting area.",
    bookingUrl: "https://stjohnticketing.com/",
    goodToKnow: ["No reservation is normally needed; boarding is first come, first served.", "Tickets purchased in advance are valid for up to 10 days.", "One personal item is free; additional bags are $4 each."],
  },
  {
    id: "charlotte-amalie-cruz-bay",
    from: "charlotte-amalie",
    to: "cruz-bay",
    fromLabel: "Charlotte Amalie, St. Thomas",
    toLabel: "Cruz Bay, St. John",
    serviceLabel: "Passenger ferry",
    durationMinutes: 40,
    departures: ["10:00 AM", "3:00 PM", "5:30 PM"],
    operatingDays: "Service is subject to seasonal change",
    serviceDays: DAILY,
    fareNote: "VIPA publishes current operator schedules and rates; verify before travel.",
    checkInMinutes: 15,
    sourceLabel: "Virgin Islands Port Authority",
    sourceUrl: VIPA,
    terminalName: "Edward W. Blyden IV Marine Terminal",
    terminalNote: "Arrive at least 15 minutes early. Seasonal service must be confirmed.",
    seasonal: true,
  },
  {
    id: "cruz-bay-charlotte-amalie",
    from: "cruz-bay",
    to: "charlotte-amalie",
    fromLabel: "Cruz Bay, St. John",
    toLabel: "Charlotte Amalie, St. Thomas",
    serviceLabel: "Passenger ferry",
    durationMinutes: 40,
    departures: ["8:45 AM", "11:15 AM", "3:45 PM"],
    operatingDays: "Service is subject to seasonal change",
    serviceDays: DAILY,
    fareNote: "VIPA publishes current operator schedules and rates; verify before travel.",
    checkInMinutes: 15,
    sourceLabel: "Virgin Islands Port Authority",
    sourceUrl: VIPA,
    terminalName: "Loredon L. Boynes Sr. Dock",
    terminalNote: "Main St. John passenger dock with ticket booth, restroom and open-air waiting area.",
    seasonal: true,
  },
  {
    id: "charlotte-amalie-gallows-bay",
    from: "charlotte-amalie",
    to: "gallows-bay",
    fromLabel: "Charlotte Amalie, St. Thomas",
    toLabel: "Gallows Bay / Christiansted, St. Croix",
    serviceLabel: "Inter-island passenger ferry",
    durationMinutes: 130,
    departures: ["3:00 PM"],
    operatingDays: "Thursday, Friday, Saturday, Sunday and Monday",
    serviceDays: THURSDAY_TO_MONDAY,
    fareNote: "$60 one way listed by VIPA; verify current fare before travel.",
    fare: { currency: "USD", adultOneWay: 60 },
    checkInMinutes: 30,
    sourceLabel: "Virgin Islands Port Authority",
    sourceUrl: VIPA,
    operatorName: "QE IV Ferry",
    terminalName: "Edward W. Blyden IV Marine Terminal",
  },
  {
    id: "gallows-bay-charlotte-amalie",
    from: "gallows-bay",
    to: "charlotte-amalie",
    fromLabel: "Gallows Bay / Christiansted, St. Croix",
    toLabel: "Charlotte Amalie, St. Thomas",
    serviceLabel: "Inter-island passenger ferry",
    durationMinutes: 130,
    departures: ["8:00 AM"],
    operatingDays: "Thursday, Friday, Saturday, Sunday and Monday",
    serviceDays: THURSDAY_TO_MONDAY,
    fareNote: "$60 one way listed by VIPA; verify current fare before travel.",
    fare: { currency: "USD", adultOneWay: 60 },
    checkInMinutes: 30,
    sourceLabel: "Virgin Islands Port Authority",
    sourceUrl: VIPA,
    operatorName: "QE IV Ferry",
    terminalName: "Gallows Bay Marine Facility",
  },
  {
    id: "crown-bay-cruz-bay",
    from: "crown-bay",
    to: "cruz-bay",
    fromLabel: "Crown Bay, St. Thomas",
    toLabel: "Cruz Bay, St. John",
    serviceLabel: "Passenger ferry",
    durationMinutes: 35,
    departures: ["3:30 PM", "5:30 PM"],
    operatingDays: "Daily; 9:45 AM and 2:15 PM also run Friday–Sunday",
    serviceDays: DAILY,
    fareNote: "$20 adult, $15 senior, $10 child; infants two and under ride free.",
    fare: { currency: "USD", adultOneWay: 20, childOneWay: 10, residentSeniorOneWay: 15, bagOneWay: 5 },
    checkInMinutes: 30,
    sourceLabel: "Inter Island Boat Services",
    sourceUrl: INTER_ISLAND,
    operatorName: "Inter Island Boat Services",
    operatorPhones: ["(340) 776-6597"],
    terminalName: "Crown Bay Marina",
    terminalNote: "About five minutes from Cyril E. King Airport; check in 30 minutes early.",
    bookingUrl: "https://www.interislandboatservices.com/ferry-trips/crown-bay-to-cruz-bay/",
    goodToKnow: ["One personal item is free.", "Additional luggage up to 50 pounds requires a luggage tag.", "Friday–Sunday add 9:45 AM and 2:15 PM departures."],
  },
  {
    id: "cruz-bay-crown-bay",
    from: "cruz-bay",
    to: "crown-bay",
    fromLabel: "Cruz Bay, St. John",
    toLabel: "Crown Bay, St. Thomas",
    serviceLabel: "Passenger ferry",
    durationMinutes: 35,
    departures: ["11:00 AM", "4:15 PM"],
    operatingDays: "Daily; 8:30 AM and 1:15 PM also run Friday–Sunday",
    serviceDays: DAILY,
    fareNote: "$20 adult, $15 senior, $10 child; infants two and under ride free.",
    fare: { currency: "USD", adultOneWay: 20, childOneWay: 10, residentSeniorOneWay: 15, bagOneWay: 5 },
    checkInMinutes: 30,
    sourceLabel: "Inter Island Boat Services",
    sourceUrl: INTER_ISLAND,
    operatorName: "Inter Island Boat Services",
    operatorPhones: ["(340) 776-6597"],
    terminalName: "Cruz Bay Creek",
    terminalNote: "Check in 30 minutes before departure.",
    bookingUrl: "https://www.interislandboatservices.com/ferry-trips/cruz-bay-to-crown-bay/",
    goodToKnow: ["One personal item is free.", "Additional luggage up to 50 pounds requires a luggage tag.", "Friday–Sunday add 8:30 AM and 1:15 PM departures."],
  },
  {
    id: "crown-bay-phillips-landing",
    from: "crown-bay",
    to: "phillips-landing",
    fromLabel: "Crown Bay Marina, St. Thomas",
    toLabel: "Phillips Landing, Water Island",
    serviceLabel: "Water Island passenger ferry",
    durationMinutes: 10,
    departures: CROWN_BAY_WATER_ISLAND,
    saturdayDepartures: CROWN_BAY_WATER_ISLAND.slice(1),
    sundayDepartures: CROWN_BAY_WATER_ISLAND.slice(2),
    operatingDays: "Daily; 7 AM weekdays, 8 AM Saturday, 9 AM Sunday/holidays",
    serviceDays: DAILY,
    fareNote: "$10 visitor one-way, $20 visitor round trip; resident and child rates available.",
    fare: { currency: "USD", adultOneWay: 10, adultRoundTrip: 20, childOneWay: 5, residentOneWay: 6, bagOneWay: 2 },
    checkInMinutes: 10,
    sourceLabel: "Water Island Ferry",
    sourceUrl: WATER_ISLAND,
    operatorName: "Water Island Ferry",
    operatorPhones: ["(340) 690-4159"],
    terminalName: "Crown Bay Marina ferry slip",
    terminalNote: "In front of Tickles Dockside Restaurant.",
    bookingUrl: WATER_ISLAND,
    goodToKnow: ["Sunday schedule also applies on major public holidays.", "Small bags are $2 each way; larger cargo costs more.", "USVI resident ID is required for resident pricing."],
  },
  {
    id: "phillips-landing-crown-bay",
    from: "phillips-landing",
    to: "crown-bay",
    fromLabel: "Phillips Landing, Water Island",
    toLabel: "Crown Bay Marina, St. Thomas",
    serviceLabel: "Water Island passenger ferry",
    durationMinutes: 10,
    departures: WATER_ISLAND_CROWN_BAY,
    saturdayDepartures: WATER_ISLAND_CROWN_BAY.slice(1),
    sundayDepartures: WATER_ISLAND_CROWN_BAY.slice(2),
    operatingDays: "Daily; 7:15 AM weekdays, 8:15 AM Saturday, 9:15 AM Sunday/holidays",
    serviceDays: DAILY,
    fareNote: "$10 visitor one-way, $20 visitor round trip; resident and child rates available.",
    fare: { currency: "USD", adultOneWay: 10, adultRoundTrip: 20, childOneWay: 5, residentOneWay: 6, bagOneWay: 2 },
    checkInMinutes: 10,
    sourceLabel: "Water Island Ferry",
    sourceUrl: WATER_ISLAND,
    operatorName: "Water Island Ferry",
    operatorPhones: ["(340) 690-4159"],
    terminalName: "Phillips Landing public dock",
    bookingUrl: WATER_ISLAND,
    goodToKnow: ["Sunday schedule also applies on major public holidays.", "Small bags are $2 each way; larger cargo costs more.", "USVI resident ID is required for resident pricing."],
  },
  {
    id: "charlotte-amalie-road-town",
    from: "charlotte-amalie",
    to: "road-town",
    fromLabel: "Charlotte Amalie, St. Thomas",
    toLabel: "Road Town, Tortola",
    serviceLabel: "International passenger ferry",
    durationMinutes: 60,
    departures: ["9:00 AM", "2:00 PM", "4:00 PM", "5:30 PM"],
    operatingDays: "Daily; operators alternate by day",
    serviceDays: DAILY,
    fareNote: "International fares, taxes and port fees vary by operator; verify before booking.",
    checkInMinutes: 60,
    sourceLabel: "British Virgin Islands Tourist Board",
    sourceUrl: BVI_TOURISM,
    operatorName: "Road Town Fast Ferry / Native Son / Smith's Ferry",
    terminalName: "Edward W. Blyden IV Marine Terminal",
    terminalNote: "International trip: allow time for check-in, immigration and customs.",
    requiresPassport: true,
    goodToKnow: ["A valid passport is required.", "Ticket prices may exclude port, environmental and departure taxes.", "Operators alternate service while published departure times remain scheduled."],
  },
  {
    id: "road-town-charlotte-amalie",
    from: "road-town",
    to: "charlotte-amalie",
    fromLabel: "Road Town, Tortola",
    toLabel: "Charlotte Amalie, St. Thomas",
    serviceLabel: "International passenger ferry",
    durationMinutes: 60,
    departures: ["7:30 AM", "10:00 AM", "11:30 AM", "3:30 PM"],
    operatingDays: "Daily; operators alternate by day",
    serviceDays: DAILY,
    fareNote: "International fares, taxes and port fees vary by operator; verify before booking.",
    checkInMinutes: 60,
    sourceLabel: "British Virgin Islands Tourist Board",
    sourceUrl: BVI_TOURISM,
    operatorName: "Road Town Fast Ferry / Native Son / Smith's Ferry",
    terminalName: "Road Town Ferry Terminal",
    terminalNote: "International trip: allow time for check-in, immigration and customs.",
    requiresPassport: true,
    goodToKnow: ["A valid passport is required.", "BVI departure taxes and other fees may be collected separately.", "Confirm the operating company before travel."],
  },
  {
    id: "red-hook-west-end",
    from: "red-hook",
    to: "west-end",
    fromLabel: "Red Hook, St. Thomas",
    toLabel: "West End, Tortola",
    serviceLabel: "International passenger ferry",
    durationMinutes: 45,
    departures: ["8:30 AM", "9:15 AM", "1:45 PM", "2:30 PM", "5:45 PM"],
    operatingDays: "Daily; selected departures do not run Tuesday or Wednesday",
    serviceDays: DAILY,
    fareNote: "International fares, taxes and port fees vary by operator; verify before booking.",
    checkInMinutes: 60,
    sourceLabel: "British Virgin Islands Tourist Board",
    sourceUrl: BVI_TOURISM,
    operatorName: "Aquatic Rentals / Road Town Fast Ferry",
    terminalName: "Urman V. Fredericks Marine Terminal",
    requiresPassport: true,
    goodToKnow: ["A valid passport is required.", "Some Aquatic Ferry Service departures do not operate Tuesdays or Wednesdays.", "International taxes and port fees may be separate."],
  },
  {
    id: "west-end-red-hook",
    from: "west-end",
    to: "red-hook",
    fromLabel: "West End, Tortola",
    toLabel: "Red Hook, St. Thomas",
    serviceLabel: "International passenger ferry",
    durationMinutes: 45,
    departures: ["7:15 AM", "8:15 AM", "10:00 AM", "11:00 AM", "3:30 PM", "4:00 PM"],
    operatingDays: "Daily; selected departures do not run Tuesday or Wednesday",
    serviceDays: DAILY,
    fareNote: "International fares, taxes and port fees vary by operator; verify before booking.",
    checkInMinutes: 60,
    sourceLabel: "British Virgin Islands Tourist Board",
    sourceUrl: BVI_TOURISM,
    operatorName: "Aquatic Rentals / Road Town Fast Ferry",
    terminalName: "West End Ferry Terminal",
    requiresPassport: true,
    goodToKnow: ["A valid passport is required.", "BVI departure taxes and other fees may be collected separately.", "Some departures do not operate Tuesdays or Wednesdays."],
  },
  {
    id: "road-town-spanish-town",
    from: "road-town",
    to: "spanish-town",
    fromLabel: "Road Town, Tortola",
    toLabel: "Spanish Town, Virgin Gorda",
    serviceLabel: "BVI domestic passenger ferry",
    durationMinutes: 30,
    departures: ["6:45 AM", "8:30 AM", "10:00 AM", "12:30 PM", "3:30 PM", "5:00 PM"],
    operatingDays: "Daily; operator schedules vary",
    serviceDays: DAILY,
    fareNote: "Verify current fare directly with Speedy's or Road Town Fast Ferry.",
    checkInMinutes: 30,
    sourceLabel: "British Virgin Islands Tourist Board",
    sourceUrl: BVI_TOURISM,
    operatorName: "Speedy's Ferry / Road Town Fast Ferry",
    terminalName: "Road Town Ferry Terminal",
    goodToKnow: ["This is domestic BVI travel.", "Published schedules differ by operator and day.", "Confirm the operating vessel before leaving."],
  },
  {
    id: "spanish-town-road-town",
    from: "spanish-town",
    to: "road-town",
    fromLabel: "Spanish Town, Virgin Gorda",
    toLabel: "Road Town, Tortola",
    serviceLabel: "BVI domestic passenger ferry",
    durationMinutes: 30,
    departures: ["7:30 AM", "9:30 AM", "11:00 AM", "1:30 PM", "4:30 PM", "6:00 PM"],
    operatingDays: "Daily; operator schedules vary",
    serviceDays: DAILY,
    fareNote: "Verify current fare directly with Speedy's or Road Town Fast Ferry.",
    checkInMinutes: 30,
    sourceLabel: "British Virgin Islands Tourist Board",
    sourceUrl: BVI_TOURISM,
    operatorName: "Speedy's Ferry / Road Town Fast Ferry",
    terminalName: "Spanish Town Ferry Terminal",
    goodToKnow: ["This is domestic BVI travel.", "Published schedules differ by operator and day.", "Confirm the operating vessel before leaving."],
  },
  {
    id: "west-end-great-harbour",
    from: "west-end",
    to: "great-harbour",
    fromLabel: "West End, Tortola",
    toLabel: "Great Harbour, Jost Van Dyke",
    serviceLabel: "BVI domestic passenger ferry",
    durationMinutes: 25,
    departures: ["8:00 AM", "10:00 AM", "1:00 PM", "4:00 PM", "6:00 PM"],
    operatingDays: "Daily",
    serviceDays: DAILY,
    fareNote: "Verify current fare with New Horizon Ferry.",
    checkInMinutes: 30,
    sourceLabel: "British Virgin Islands Tourist Board",
    sourceUrl: BVI_TOURISM,
    operatorName: "New Horizon Ferry",
    terminalName: "West End Ferry Terminal",
  },
  {
    id: "great-harbour-west-end",
    from: "great-harbour",
    to: "west-end",
    fromLabel: "Great Harbour, Jost Van Dyke",
    toLabel: "West End, Tortola",
    serviceLabel: "BVI domestic passenger ferry",
    durationMinutes: 25,
    departures: ["7:00 AM", "9:00 AM", "12:00 PM", "2:00 PM", "5:00 PM"],
    operatingDays: "Daily",
    serviceDays: DAILY,
    fareNote: "Verify current fare with New Horizon Ferry.",
    checkInMinutes: 30,
    sourceLabel: "British Virgin Islands Tourist Board",
    sourceUrl: BVI_TOURISM,
    operatorName: "New Horizon Ferry",
    terminalName: "Great Harbour Ferry Dock",
  },
  {
    id: "trellis-bay-spanish-town",
    from: "trellis-bay",
    to: "spanish-town",
    fromLabel: "Trellis Bay, Beef Island",
    toLabel: "Spanish Town, Virgin Gorda",
    serviceLabel: "BVI domestic passenger ferry",
    durationMinutes: 20,
    departures: ["6:30 AM", "9:00 AM", "1:00 PM", "4:30 PM", "6:30 PM", "9:00 PM"],
    operatingDays: "Daily; additional late trips run Friday–Sunday",
    serviceDays: DAILY,
    fareNote: "Verify current fare with Speedy's Ferry.",
    checkInMinutes: 30,
    sourceLabel: "British Virgin Islands Tourist Board",
    sourceUrl: BVI_TOURISM,
    operatorName: "Speedy's Ferry",
    terminalName: "Trellis Bay Ferry Dock",
  },
  {
    id: "spanish-town-trellis-bay",
    from: "spanish-town",
    to: "trellis-bay",
    fromLabel: "Spanish Town, Virgin Gorda",
    toLabel: "Trellis Bay, Beef Island",
    serviceLabel: "BVI domestic passenger ferry",
    durationMinutes: 20,
    departures: ["6:00 AM", "8:30 AM", "10:30 AM", "3:00 PM", "5:30 PM", "8:00 PM"],
    operatingDays: "Daily; additional late trips run Friday–Sunday",
    serviceDays: DAILY,
    fareNote: "Verify current fare with Speedy's Ferry.",
    checkInMinutes: 30,
    sourceLabel: "British Virgin Islands Tourist Board",
    sourceUrl: BVI_TOURISM,
    operatorName: "Speedy's Ferry",
    terminalName: "Spanish Town Ferry Terminal",
  },
  {
    id: "road-town-setting-point",
    from: "road-town",
    to: "setting-point",
    fromLabel: "Road Town, Tortola",
    toLabel: "Setting Point, Anegada",
    serviceLabel: "BVI domestic passenger ferry via Virgin Gorda",
    durationMinutes: 75,
    departures: ["7:00 AM", "3:30 PM"],
    operatingDays: "Monday, Wednesday and Friday; stops at Virgin Gorda",
    serviceDays: MONDAY_WEDNESDAY_FRIDAY,
    fareNote: "Verify current fare with Smith's Ferry Service.",
    checkInMinutes: 30,
    sourceLabel: "British Virgin Islands Tourist Board",
    sourceUrl: BVI_TOURISM,
    operatorName: "Smith's Ferry Service",
    terminalName: "Road Town Ferry Terminal",
    goodToKnow: ["Service runs Monday, Wednesday and Friday.", "The ferry stops at Virgin Gorda for passenger pickup and drop-off.", "Confirm sea conditions and the operator before travel."],
  },
  {
    id: "setting-point-road-town",
    from: "setting-point",
    to: "road-town",
    fromLabel: "Setting Point, Anegada",
    toLabel: "Road Town, Tortola",
    serviceLabel: "BVI domestic passenger ferry via Virgin Gorda",
    durationMinutes: 75,
    departures: ["8:30 AM", "5:00 PM"],
    operatingDays: "Monday, Wednesday and Friday; stops at Virgin Gorda",
    serviceDays: MONDAY_WEDNESDAY_FRIDAY,
    fareNote: "Verify current fare with Smith's Ferry Service.",
    checkInMinutes: 30,
    sourceLabel: "British Virgin Islands Tourist Board",
    sourceUrl: BVI_TOURISM,
    operatorName: "Smith's Ferry Service",
    terminalName: "Setting Point Ferry Dock",
    goodToKnow: ["Service runs Monday, Wednesday and Friday.", "The ferry stops at Virgin Gorda for passenger pickup and drop-off.", "Confirm sea conditions and the operator before travel."],
  },
  {
    id: "charlotte-amalie-spanish-town",
    from: "charlotte-amalie",
    to: "spanish-town",
    fromLabel: "Charlotte Amalie, St. Thomas",
    toLabel: "Spanish Town, Virgin Gorda",
    serviceLabel: "International passenger ferry",
    durationMinutes: 90,
    departures: ["4:00 PM"],
    operatingDays: "Saturday only",
    serviceDays: SATURDAY,
    fareNote: "International fares, taxes and port fees vary; verify with Speedy's Ferry.",
    checkInMinutes: 60,
    sourceLabel: "British Virgin Islands Tourist Board",
    sourceUrl: BVI_TOURISM,
    operatorName: "Speedy's Ferry",
    terminalName: "Edward W. Blyden IV Marine Terminal",
    requiresPassport: true,
    goodToKnow: ["A valid passport is required.", "Published direct service operates Saturday only.", "International taxes and port fees may be separate."],
  },
  {
    id: "spanish-town-charlotte-amalie",
    from: "spanish-town",
    to: "charlotte-amalie",
    fromLabel: "Spanish Town, Virgin Gorda",
    toLabel: "Charlotte Amalie, St. Thomas",
    serviceLabel: "International passenger ferry",
    durationMinutes: 90,
    departures: ["8:30 AM"],
    operatingDays: "Saturday only",
    serviceDays: SATURDAY,
    fareNote: "International fares, taxes and port fees vary; verify with Speedy's Ferry.",
    checkInMinutes: 60,
    sourceLabel: "British Virgin Islands Tourist Board",
    sourceUrl: BVI_TOURISM,
    operatorName: "Speedy's Ferry",
    terminalName: "Spanish Town Ferry Terminal",
    requiresPassport: true,
    goodToKnow: ["A valid passport is required.", "Published direct service operates Saturday only.", "International taxes and port fees may be separate."],
  },
];

export const CAR_BARGE_ROUTES: FerryRoute[] = [
  {
    id: "red-hook-enighed-car-barge",
    mode: "car-barge",
    from: "red-hook",
    to: "enighed-pond",
    fromLabel: "Red Hook car ferry dock, St. Thomas",
    toLabel: "Enighed Pond, St. John",
    serviceLabel: "Vehicle ferry",
    durationMinutes: 25,
    departures: ["7:00 AM", "7:30 AM", "9:00 AM", "9:30 AM", "11:00 AM", "11:30 AM", "1:00 PM", "1:30 PM", "3:00 PM", "3:30 PM", "5:00 PM", "5:30 PM", "7:00 PM", "7:30 PM"],
    operatingDays: "Daily; early and evening departures may be seasonal or excluded on holidays",
    serviceDays: DAILY,
    fareNote: "Love City lists car/SUV/small truck fares from $50 one way or $65 round trip; competing operator fares differ.",
    vehicleFare: { oneWay: 50, roundTrip: 65, note: "Starting Love City fare; operator and vehicle class affect total." },
    checkInMinutes: 30,
    sourceLabel: "Love City Car Ferries",
    sourceUrl: LOVE_CITY,
    operatorName: "Love City Car Ferries / Big Red Barge",
    operatorPhones: ["(340) 779-4000"],
    terminalName: "Noel Boynes Sr. Car Ferry Dock",
    terminalNote: "Arrive at least 30 minutes early; holiday and seasonal schedules vary.",
    bookingUrl: LOVE_CITY,
    goodToKnow: ["Reservations are operator-specific.", "Port Authority ramp fees are separate from the vessel operator fare.", "Vehicle size and type can change the fare."],
  },
  {
    id: "enighed-red-hook-car-barge",
    mode: "car-barge",
    from: "enighed-pond",
    to: "red-hook",
    fromLabel: "Enighed Pond, St. John",
    toLabel: "Red Hook car ferry dock, St. Thomas",
    serviceLabel: "Vehicle ferry",
    durationMinutes: 25,
    departures: ["6:15 AM", "6:30 AM", "8:00 AM", "8:30 AM", "10:00 AM", "10:30 AM", "12:00 PM", "12:30 PM", "2:00 PM", "2:30 PM", "4:00 PM", "4:30 PM", "6:15 PM", "6:30 PM"],
    operatingDays: "Daily; early and evening departures may be seasonal or excluded on holidays",
    serviceDays: DAILY,
    fareNote: "Love City lists car/SUV/small truck fares from $50 one way or $65 round trip; competing operator fares differ.",
    vehicleFare: { oneWay: 50, roundTrip: 65, note: "Starting Love City fare; operator and vehicle class affect total." },
    checkInMinutes: 30,
    sourceLabel: "Love City Car Ferries",
    sourceUrl: LOVE_CITY,
    operatorName: "Love City Car Ferries / Big Red Barge",
    operatorPhones: ["(340) 779-4000"],
    terminalName: "Theovald E. Moorehead Dock at Enighed Pond",
    terminalNote: "Arrive at least 30 minutes early; holiday and seasonal schedules vary.",
    bookingUrl: LOVE_CITY,
    goodToKnow: ["Reservations are operator-specific.", "Port Authority ramp fees are separate from the vessel operator fare.", "Vehicle size and type can change the fare."],
  },
];

const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function islandClock(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/St_Thomas",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return { weekday: WEEKDAY_INDEX[value("weekday")], minutes: Number(value("hour")) * 60 + Number(value("minute")) };
}

function departureMinutes(label: string) {
  const match = label.replace("*", "").match(/^(\d{1,2}):(\d{2})\s(AM|PM)$/);
  if (!match) return null;
  let hour = Number(match[1]) % 12;
  if (match[3] === "PM") hour += 12;
  return hour * 60 + Number(match[2]);
}

export function getDeparturesForWeekday(route: FerryRoute, weekday: number) {
  if (weekday === 0) return route.sundayDepartures ?? route.weekendDepartures ?? route.departures;
  if (weekday === 6) return route.saturdayDepartures ?? route.weekendDepartures ?? route.departures;
  return route.weekdayDepartures ?? route.departures;
}

export function getNextFerryDeparture(route: FerryRoute, now = new Date()): NextFerryDeparture | null {
  const clock = islandClock(now);
  const dayFormatter = new Intl.DateTimeFormat("en-US", { timeZone: "America/St_Thomas", weekday: "short" });

  for (let dayOffset = 0; dayOffset < 8; dayOffset += 1) {
    const weekday = (clock.weekday + dayOffset) % 7;
    if (route.serviceDays && !route.serviceDays.includes(weekday)) continue;

    for (const departure of getDeparturesForWeekday(route, weekday)) {
      if (departure.endsWith("*") && (weekday === 0 || weekday === 6)) continue;
      const minutes = departureMinutes(departure);
      if (minutes === null) continue;
      const minutesUntil = dayOffset * 1440 + minutes - clock.minutes;
      if (minutesUntil < 0) continue;
      const dayLabel = dayOffset === 0 ? "Today" : dayOffset === 1 ? "Tomorrow" : dayFormatter.format(new Date(now.getTime() + dayOffset * 86400000));
      return {
        label: departure.replace("*", ""),
        dayLabel,
        minutesUntil,
        leaveForTerminalInMinutes: minutesUntil - route.checkInMinutes,
      };
    }
  }

  return null;
}

export function ferryRoutesFrom(from: FerryPortId, mode: FerryMode = "passenger") {
  const routes = mode === "car-barge" ? CAR_BARGE_ROUTES : FERRY_ROUTES;
  return routes.filter((route) => route.from === from);
}

export function findFerryRoute(from: FerryPortId, to: FerryPortId, mode: FerryMode = "passenger") {
  const routes = mode === "car-barge" ? CAR_BARGE_ROUTES : FERRY_ROUTES;
  return routes.find((route) => route.from === from && route.to === to) ?? null;
}
