import { getAllHeritageRecords } from "@/lib/heritage/knowledge";
import { getTravelKnowledge, type TravelKnowledgeKind } from "@/lib/travel-knowledge";
import type { DirectoryItem } from "@/types/directory";
import type {
  IntelligenceAction,
  IntelligenceContext,
  IntelligenceMemory,
  IntelligencePlanStop,
  IntelligenceRecommendation,
  IntelligenceRequest,
  IntelligenceResponse,
} from "@/types/intelligence";

const STOP_WORDS = new Set([
  "about",
  "after",
  "before",
  "build",
  "could",
  "from",
  "have",
  "help",
  "into",
  "island",
  "make",
  "plan",
  "please",
  "show",
  "that",
  "their",
  "there",
  "these",
  "this",
  "want",
  "what",
  "when",
  "where",
  "with",
  "would",
]);

function tokens(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function inferIntent(message: string) {
  const text = message.toLowerCase();
  if (/book|reserve|ticket|room/.test(text)) return "booking";
  if (/ride|taxi|pickup|drop.?off|ferry|transport/.test(text)) return "mobility";
  if (/day|itinerary|schedule|cruise|plan/.test(text)) return "day_plan";
  if (/history|historic|governor|timeline|heritage/.test(text)) return "knowledge";
  if (/where|nearby|recommend|best|find/.test(text)) return "recommendation";
  return "discovery";
}

function normalizeContext(context: IntelligenceContext): IntelligenceContext {
  return {
    ...context,
    timezone: "America/St_Thomas",
    party: {
      adults: Math.max(1, context.party?.adults || context.memory.party?.adults || 1),
      children: Math.max(0, context.party?.children || context.memory.party?.children || 0),
      accessibilityNeeds:
        context.party?.accessibilityNeeds ?? context.memory.party?.accessibilityNeeds ?? [],
    },
    preferences: {
      interests: Array.from(
        new Set([
          ...(context.memory.preferences?.interests ?? []),
          ...(context.preferences?.interests ?? []),
        ]),
      ),
      pace: context.preferences?.pace ?? context.memory.preferences?.pace ?? "balanced",
      budget: context.preferences?.budget ?? context.memory.preferences?.budget ?? "moderate",
      food: context.preferences?.food ?? context.memory.preferences?.food ?? [],
      avoid: context.preferences?.avoid ?? context.memory.preferences?.avoid ?? [],
    },
  };
}

function itemText(item: DirectoryItem) {
  return [
    item.name,
    item.category,
    item.description,
    item.address,
    ...item.tags,
    ...(item.bestFor ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function scoreItem(item: DirectoryItem, queryTokens: string[], context: IntelligenceContext) {
  if (item.island !== context.island) return -100;
  const haystack = itemText(item);
  let score = item.featured ? 8 : 2;

  for (const token of queryTokens) {
    if (item.name.toLowerCase().includes(token)) score += 10;
    if (haystack.includes(token)) score += 3;
  }

  for (const interest of context.preferences.interests) {
    if (haystack.includes(interest.toLowerCase())) score += 4;
  }

  if (context.memory.savedPlaceIds?.includes(item.id)) score += 5;
  if (context.memory.recentPlaceIds?.includes(item.id)) score -= 2;
  return score;
}

function recommendationHref(kind: TravelKnowledgeKind, item: DirectoryItem) {
  if (kind === "beaches") return `/beaches/${item.slug}`;
  if (kind === "stays") return `/accommodations/${item.slug}`;
  if (kind === "historic") return `/historic/${item.slug}`;
  return `/places/${item.slug}`;
}

function buildRecommendations(
  request: IntelligenceRequest,
  context: IntelligenceContext,
): IntelligenceRecommendation[] {
  const queryTokens = tokens(`${request.message} ${context.preferences.interests.join(" ")}`);
  const kinds: TravelKnowledgeKind[] = ["places", "beaches", "stays", "historic"];
  const ranked: IntelligenceRecommendation[] = [];

  for (const kind of kinds) {
    for (const item of getTravelKnowledge(kind)) {
      const score = scoreItem(item, queryTokens, context);
      if (score <= 0) continue;
      const href = recommendationHref(kind, item);
      ranked.push({
        id: `${kind}:${item.id}`,
        title: item.name,
        kind,
        island: item.island,
        summary: item.description,
        score,
        reasons: [
          item.island === context.island ? `Matches ${context.island.toUpperCase()}` : "",
          item.featured ? "Featured in VI Guide" : "",
          queryTokens.some((token) => itemText(item).includes(token))
            ? "Matches the request"
            : "",
        ].filter(Boolean),
        href,
        mapHref: `/map?island=${item.island}&lens=${kind === "historic" ? "historic" : kind === "stays" ? "stays" : kind === "beaches" ? "beaches" : "places"}&q=${encodeURIComponent(item.name)}`,
      });
    }
  }

  const heritageQuery = request.message.toLowerCase();
  if (/history|historic|heritage|governor|timeline|emancipation|transfer/.test(heritageQuery)) {
    for (const record of getAllHeritageRecords().slice(0, 300)) {
      const haystack = [record.title, record.summary, record.category, ...record.searchTerms]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const score = queryTokens.reduce(
        (total, token) => total + (record.title.toLowerCase().includes(token) ? 10 : 0) + (haystack.includes(token) ? 3 : 0),
        0,
      );
      if (score <= 0) continue;
      ranked.push({
        id: record.id,
        title: record.title,
        kind: record.type,
        island: record.island ?? context.island,
        summary: record.summary,
        score: score + 3,
        reasons: ["Matches VI Guide heritage knowledge"],
        href: record.href,
        mapHref: record.map
          ? `/map?island=${record.island ?? context.island}&lens=historic&place=${encodeURIComponent(record.id)}&placeName=${encodeURIComponent(record.title)}&placeType=historic&placeLat=${record.map.lat}&placeLng=${record.map.lng}`
          : `/map?island=${record.island ?? context.island}&lens=historic&q=${encodeURIComponent(record.title)}`,
      });
    }
  }

  return ranked
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .filter((item, index, list) => list.findIndex((candidate) => candidate.id === item.id) === index)
    .slice(0, 8);
}

function inferCruiseWindow(context: IntelligenceContext) {
  const arrival = context.memory.cruise?.arrivalTime;
  const allAboard = context.memory.cruise?.allAboardTime;
  return { arrival, allAboard };
}

function buildPlan(
  intent: string,
  context: IntelligenceContext,
  recommendations: IntelligenceRecommendation[],
): IntelligencePlanStop[] {
  if (intent !== "day_plan" && intent !== "mobility" && intent !== "booking") return [];

  const { arrival, allAboard } = inferCruiseWindow(context);
  const startHour = arrival?.slice(0, 5) || "09:00";
  const stops = recommendations.slice(0, 3);

  return stops.map((item, index) => {
    const start = index === 0 ? startHour : undefined;
    return {
      id: `stop_${index + 1}_${item.id.replace(/[^a-zA-Z0-9_-]/g, "_")}`,
      title: item.title,
      startTime: start,
      durationMinutes: index === 0 ? 90 : 75,
      island: item.island,
      kind: item.kind,
      summary: item.summary,
      placeId: item.id,
      href: item.href,
      mapHref: item.mapHref,
      bookingHref: item.kind === "stays" ? item.href : undefined,
      mobility: {
        from:
          index === 0
            ? context.memory.cruise?.port?.name ?? context.pickup?.name ?? context.currentLocation?.name
            : stops[index - 1]?.title,
        to: item.title,
        mode: context.memory.cruise?.port ? "taxi" : "transfer",
      },
    };
  });
}

function buildActions(
  context: IntelligenceContext,
  plan: IntelligencePlanStop[],
  recommendations: IntelligenceRecommendation[],
): IntelligenceAction[] {
  const actions: IntelligenceAction[] = [];
  const first = recommendations[0];

  if (first?.href) {
    actions.push({
      id: "open_top_recommendation",
      type: "open_place",
      label: `Open ${first.title}`,
      href: first.href,
      requiresConfirmation: false,
    });
  }
  if (first?.mapHref) {
    actions.push({
      id: "open_intelligent_map",
      type: "open_map",
      label: "View the plan on the map",
      href: first.mapHref,
      requiresConfirmation: false,
    });
  }
  if (plan.length) {
    const destination = plan[0].title;
    actions.push({
      id: "plan_transport",
      type: "plan_ride",
      label: `Plan transportation to ${destination}`,
      href: `/mobility?island=${context.island}&destination=${encodeURIComponent(destination)}`,
      requiresConfirmation: false,
    });
    actions.push({
      id: "save_intelligent_plan",
      type: "save_plan",
      label: "Save this plan",
      payload: { plan },
      requiresConfirmation: true,
    });
  }
  return actions;
}

function buildMemoryPatch(
  context: IntelligenceContext,
  recommendations: IntelligenceRecommendation[],
): IntelligenceMemory {
  return {
    preferredIsland: context.island,
    party: context.party,
    preferences: context.preferences,
    recentPlaceIds: Array.from(
      new Set([
        ...(context.memory.recentPlaceIds ?? []),
        ...recommendations.slice(0, 4).map((item) => item.id),
      ]),
    ).slice(-20),
  };
}

export function runIntelligenceEngine(request: IntelligenceRequest): IntelligenceResponse {
  const context = normalizeContext(request.context);
  const intent = inferIntent(request.message);
  const recommendations = buildRecommendations(request, context);
  const plan = buildPlan(intent, context, recommendations);
  const actions = buildActions(context, plan, recommendations);
  const warnings: string[] = [];

  if (context.memory.cruise?.allAboardTime && plan.length) {
    warnings.push(`Return-to-ship planning must preserve the ${context.memory.cruise.allAboardTime} all-aboard time.`);
  }
  if (!recommendations.length) {
    warnings.push("No strong reviewed match was found in the current VI Guide knowledge index.");
  }

  const answer = plan.length
    ? `I built a ${context.preferences.pace} ${context.island.toUpperCase()} plan with ${plan.length} connected stops, map handoffs, and transportation actions.`
    : recommendations.length
      ? `I found ${recommendations.length} VI Guide recommendations that match the request and current context.`
      : "I could not produce a reliable recommendation from the current knowledge index.";

  return {
    runId: crypto.randomUUID(),
    answer,
    intent,
    confidence: recommendations.length >= 3 ? "high" : recommendations.length ? "medium" : "low",
    context,
    plan,
    recommendations,
    actions,
    memoryPatch: buildMemoryPatch(context, recommendations),
    warnings,
    generatedAt: new Date().toISOString(),
  };
}
