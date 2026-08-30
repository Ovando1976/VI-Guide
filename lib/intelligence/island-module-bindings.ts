import { BOOKABLE_EXPERIENCES, type BookableExperience } from "@/lib/bookable-experiences";
import { CAR_RENTAL_OPERATORS, type CarRentalOperator } from "@/lib/car-rentals";
import { getDiningDirectoryItems } from "@/lib/dining";
import { formatEventDate, getUpcomingEvents, USVI_EVENTS, type UsviEvent } from "@/lib/events";
import {
  CAR_BARGE_ROUTES,
  FERRY_PORTS,
  FERRY_ROUTES,
  type FerryRoute,
} from "@/lib/ferry-planner-current";
import {
  GENERIC_DIRECTORY_IMAGES,
  getIslandContextImage,
  isLocalIslandImage,
} from "@/lib/intelligence/island-ui-images";
import type { DirectoryItem } from "@/types/directory";
import type {
  IntelligenceIsland,
  IntelligenceRequest,
  IntelligenceResponse,
} from "@/types/intelligence";
import type {
  IslandCatalogKind,
  IslandDataProvenance,
  IslandTrustedBinding,
  IslandTrustedImage,
} from "@/types/island-workspace";

const MAX_CATALOG_BINDINGS = 8;
const STOP_WORDS = new Set([
  "about", "after", "best", "build", "could", "find", "from", "have",
  "help", "island", "please", "show", "that", "the", "their", "there",
  "these", "this", "through", "trip", "want", "what", "when", "where",
  "with", "would", "your",
]);

const GROUP_PATTERNS: Readonly<Record<IslandCatalogKind, RegExp>> = Object.freeze({
  experience: /\b(activity|activities|experience|tour|snorkel|snorkeling|scuba|dive|diving|sail|sailing|charter|kayak|hike|hiking|zipline|parasail|fishing|jet.?ski|paddle|horseback|excursion)\b/i,
  event: /\b(event|events|festival|calendar|concert|music|race|races|weekend|tonight|happening|celebration)\b/i,
  car_rental: /\b(car rental|rental car|rent a car|rent.*vehicle|jeep|4x4|rental vehicle|drive myself)\b/i,
  ferry: /\b(ferry|ferries|barge|water island|red hook|cruz bay|crown bay|gallows bay|inter.?island|boat transfer)\b/i,
  dining: /\b(dining|restaurant|restaurants|food|eat|lunch|dinner|breakfast|brunch|cafe|coffee)\b/i,
});

const GENERIC_DISCOVERY = /\b(plan|day|itinerary|explore|discover|recommend|things to do|vacation)\b/i;

function compact(values: Array<string | undefined>) {
  return Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean))) as string[];
}

function tokens(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function scoreText(queryTokens: readonly string[], value: string, bonus = 0) {
  const normalized = value.toLowerCase();
  return queryTokens.reduce(
    (score, token) => score + (normalized.includes(token) ? 8 : 0),
    bonus,
  );
}

function itemContextImage(
  island: IntelligenceIsland,
  title: string,
  kind: string,
): IslandTrustedImage {
  const context = getIslandContextImage(island);
  return Object.freeze({
    ...context,
    alt: `${islandName(island)} context image for ${title}; not a ${kind}-specific photograph`,
  });
}

function trustedDiningImage(item: DirectoryItem): IslandTrustedImage {
  const local =
    isLocalIslandImage(item.heroImage) &&
    !GENERIC_DIRECTORY_IMAGES.has(item.heroImage);
  const hasSource = Boolean(item.imageSourceUrl?.trim());
  if (local && (item.imageStatus === "verified" || hasSource)) {
    return Object.freeze({
      src: item.heroImage,
      alt: `${item.name} in the U.S. Virgin Islands`,
      status:
        item.imageStatus === "verified"
          ? ("verified" as const)
          : ("sourced" as const),
      ...(hasSource ? { sourceUrl: item.imageSourceUrl } : {}),
    });
  }
  return itemContextImage(item.island, item.name, "restaurant");
}

function provenance(
  sourceSystem: IslandDataProvenance["sourceSystem"],
  sourceId: string,
  reviewStatus: string,
  sourceUrls: readonly string[],
  sourceLabel?: string,
  verifiedAt?: string,
): IslandDataProvenance {
  return Object.freeze({
    sourceSystem,
    sourceId,
    reviewStatus,
    ...(sourceLabel ? { sourceLabel } : {}),
    sourceUrls: Object.freeze(compact([...sourceUrls])),
    ...(verifiedAt ? { verifiedAt } : {}),
  });
}

function experienceBinding(item: BookableExperience): IslandTrustedBinding {
  return Object.freeze({
    id: `catalog:experience:${item.id}`,
    title: item.name,
    kind: "experience",
    island: item.island,
    summary: item.summary,
    image: itemContextImage(item.island, item.name, "experience"),
    provenance: provenance(
      "experience-catalog",
      item.id,
      item.availabilityStatus,
      [item.sourceUrl],
      item.sourceLabel,
      item.verifiedAt,
    ),
    meta: Object.freeze(compact([item.operator, item.duration, item.location])),
    status: item.availabilityStatus,
    href: "/activities",
  });
}

function eventBinding(item: UsviEvent): IslandTrustedBinding {
  return Object.freeze({
    id: `catalog:event:${item.id}`,
    title: item.name,
    kind: "event",
    island: item.island,
    summary: item.description,
    image: itemContextImage(item.island, item.name, "event"),
    provenance: provenance(
      "event-catalog",
      item.id,
      "source-verified",
      [item.sourceUrl],
      item.sourceLabel,
      item.verifiedAt,
    ),
    meta: Object.freeze(
      compact([formatEventDate(item), item.timeLabel, item.location]),
    ),
    status: "source-verified",
    href: `/events/${item.slug}`,
  });
}

function carRentalBinding(item: CarRentalOperator): IslandTrustedBinding {
  return Object.freeze({
    id: `catalog:car_rental:${item.id}`,
    title: item.name,
    kind: "car_rental",
    island: item.island,
    summary: `${item.location}. ${item.features.slice(0, 3).join(" · ")}`,
    image: itemContextImage(item.island, item.name, "car-rental-company"),
    provenance: provenance(
      "car-rental-catalog",
      item.id,
      "source-verified",
      [item.website],
      item.sourceLabel,
      item.verifiedAt,
    ),
    meta: Object.freeze(
      compact([
        item.location,
        `${item.pickupType} pickup`,
        item.vehicleTypes.slice(0, 4).join(" · "),
      ]),
    ),
    status: "source-verified",
    href: "/car-rentals",
  });
}

const PORT_ISLAND = new Map(
  FERRY_PORTS.map((port) => [port.id, port.island] as const),
);

function intelligenceIslandForPort(portId: FerryRoute["from"]): IntelligenceIsland | null {
  const label = PORT_ISLAND.get(portId);
  if (label === "St. Thomas" || label === "Water Island") return "stt";
  if (label === "St. John") return "stj";
  if (label === "St. Croix") return "stx";
  return null;
}

function ferryIsland(route: FerryRoute): IntelligenceIsland | null {
  return intelligenceIslandForPort(route.from) ?? intelligenceIslandForPort(route.to);
}

function ferryBinding(route: FerryRoute): IslandTrustedBinding | null {
  const island = ferryIsland(route);
  if (!island) return null;
  const summary = route.scheduleNotice
    ? `${route.fromLabel} → ${route.toLabel}. ${route.scheduleNotice}`
    : `${route.fromLabel} → ${route.toLabel}. ${route.operatingDays}.`;
  return Object.freeze({
    id: `catalog:ferry:${route.id}`,
    title: `${route.fromLabel} → ${route.toLabel}`,
    kind: "ferry",
    island,
    summary,
    image: itemContextImage(island, route.serviceLabel, "ferry-route"),
    provenance: provenance(
      "ferry-schedule",
      route.id,
      route.scheduleStatus,
      [route.sourceUrl],
      route.sourceAuthority || route.sourceLabel,
      route.verifiedAt,
    ),
    meta: Object.freeze(
      compact([
        route.serviceLabel,
        `${route.durationMinutes} min`,
        route.operatingDays,
      ]),
    ),
    status: route.scheduleStatus,
    href: "/ferry",
  });
}

function diningBinding(item: DirectoryItem): IslandTrustedBinding {
  return Object.freeze({
    id: `catalog:dining:${item.id}`,
    title: item.name,
    kind: "dining",
    island: item.island,
    summary: item.description,
    image: trustedDiningImage(item),
    provenance: provenance(
      "dining-directory",
      item.id,
      item.verifiedAt ? "verified-record" : "catalog-record",
      [...(item.sourceUrls ?? []), item.sourceUrl ?? ""],
      item.sourceLabel,
      item.verifiedAt,
    ),
    meta: Object.freeze(
      compact([item.address, item.hours?.[0], item.tags.slice(0, 3).join(" · ")]),
    ),
    status: item.verifiedAt ? "verified-record" : "catalog-record",
    href: `/places/${item.slug}`,
  });
}

function ferryRoutesForIsland(island: IntelligenceIsland) {
  return [...FERRY_ROUTES, ...CAR_BARGE_ROUTES].filter((route) => {
    const from = intelligenceIslandForPort(route.from);
    const to = intelligenceIslandForPort(route.to);
    return from === island || to === island;
  });
}

function ranked<T>(
  items: readonly T[],
  score: (item: T) => number,
  title: (item: T) => string,
) {
  return [...items].sort(
    (left, right) =>
      score(right) - score(left) || title(left).localeCompare(title(right)),
  );
}

function selectGroups(
  request: IntelligenceRequest,
  response: IntelligenceResponse,
): Map<IslandCatalogKind, IslandTrustedBinding[]> {
  const message = request.message;
  const queryTokens = tokens(message);
  const island = request.context.island;
  const generic =
    GENERIC_DISCOVERY.test(message) ||
    response.intent === "day_plan" ||
    response.intent === "discovery" ||
    response.intent === "recommendation";
  const mobility = response.intent === "mobility";
  const groups = new Map<IslandCatalogKind, IslandTrustedBinding[]>();

  if (GROUP_PATTERNS.experience.test(message) || generic) {
    const candidates = ranked(
      BOOKABLE_EXPERIENCES.filter((item) => item.island === island),
      (item) =>
        scoreText(
          queryTokens,
          [item.name, item.operator, item.category, item.location, item.summary, ...item.highlights].join(" "),
          item.availabilityStatus === "operator-listed" ? 3 : 0,
        ),
      (item) => item.name,
    )
      .slice(0, 4)
      .map(experienceBinding);
    if (candidates.length) groups.set("experience", candidates);
  }

  if (GROUP_PATTERNS.event.test(message) || generic) {
    const today = request.context.now.slice(0, 10);
    const candidates = ranked(
      getUpcomingEvents(today).filter((item) => item.island === island),
      (item) =>
        scoreText(
          queryTokens,
          [item.name, item.category, item.location, item.description, ...item.tags].join(" "),
          item.featured ? 4 : 0,
        ),
      (item) => item.name,
    )
      .slice(0, 4)
      .map(eventBinding);
    if (candidates.length) groups.set("event", candidates);
  }

  if (GROUP_PATTERNS.dining.test(message) || generic) {
    const candidates = ranked(
      getDiningDirectoryItems().filter((item) => item.island === island),
      (item) =>
        scoreText(
          queryTokens,
          [item.name, item.category, item.description, item.address ?? "", ...item.tags].join(" "),
          item.featured ? 4 : 0,
        ),
      (item) => item.name,
    )
      .slice(0, 4)
      .map(diningBinding);
    if (candidates.length) groups.set("dining", candidates);
  }

  if (GROUP_PATTERNS.car_rental.test(message)) {
    const candidates = ranked(
      CAR_RENTAL_OPERATORS.filter((item) => item.island === island),
      (item) =>
        scoreText(
          queryTokens,
          [item.name, item.location, item.pickupType, ...item.vehicleTypes, ...item.features].join(" "),
        ),
      (item) => item.name,
    )
      .slice(0, 4)
      .map(carRentalBinding);
    if (candidates.length) groups.set("car_rental", candidates);
  }

  if (GROUP_PATTERNS.ferry.test(message) || mobility) {
    const candidates = ranked(
      ferryRoutesForIsland(island),
      (route) =>
        scoreText(
          queryTokens,
          [
            route.fromLabel,
            route.toLabel,
            route.serviceLabel,
            route.operatorName ?? "",
            route.operatingDays,
            route.scheduleStatus,
          ].join(" "),
          intelligenceIslandForPort(route.from) === island ? 2 : 0,
        ),
      (route) => `${route.fromLabel}-${route.toLabel}`,
    )
      .slice(0, 4)
      .map(ferryBinding)
      .filter((binding): binding is IslandTrustedBinding => Boolean(binding));
    if (candidates.length) groups.set("ferry", candidates);
  }

  return groups;
}

function roundRobinBindings(
  groups: Map<IslandCatalogKind, IslandTrustedBinding[]>,
  limit = MAX_CATALOG_BINDINGS,
) {
  const orderedKinds: IslandCatalogKind[] = [
    "experience",
    "event",
    "dining",
    "car_rental",
    "ferry",
  ];
  const selected: IslandTrustedBinding[] = [];
  for (let index = 0; selected.length < limit; index += 1) {
    let added = false;
    for (const kind of orderedKinds) {
      const candidate = groups.get(kind)?.[index];
      if (!candidate) continue;
      selected.push(candidate);
      added = true;
      if (selected.length >= limit) break;
    }
    if (!added) break;
  }
  return selected;
}

export function buildIslandModuleBindings(
  request: IntelligenceRequest,
  response: IntelligenceResponse,
): Readonly<Record<string, IslandTrustedBinding>> {
  const selected = roundRobinBindings(selectGroups(request, response));
  return Object.freeze(
    Object.fromEntries(selected.map((binding) => [binding.id, binding])),
  );
}

export function buildAllIslandModuleBindings(): readonly IslandTrustedBinding[] {
  const values: IslandTrustedBinding[] = [
    ...BOOKABLE_EXPERIENCES.map(experienceBinding),
    ...USVI_EVENTS.map(eventBinding),
    ...CAR_RENTAL_OPERATORS.map(carRentalBinding),
    ...[...FERRY_ROUTES, ...CAR_BARGE_ROUTES]
      .map(ferryBinding)
      .filter((binding): binding is IslandTrustedBinding => Boolean(binding)),
    ...getDiningDirectoryItems().map(diningBinding),
  ];
  const byId = new Map(values.map((binding) => [binding.id, binding]));
  return Object.freeze([...byId.values()]);
}

function islandName(island: IntelligenceIsland) {
  return island === "stt"
    ? "St. Thomas"
    : island === "stj"
      ? "St. John"
      : "St. Croix";
}
