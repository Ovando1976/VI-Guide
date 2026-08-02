import type {
  IntelligenceContext,
  IntelligencePlanStop,
  IntelligenceRecommendation,
} from "@/types/intelligence";

export type IntelligenceMapFocus = {
  island: IntelligenceContext["island"];
  center?: { lat: number; lng: number };
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  placeIds: string[];
};

export type IntelligencePresentation = {
  mapFocus: IntelligenceMapFocus;
  followUps: string[];
};

function buildMapFocus(
  context: IntelligenceContext,
  plan: IntelligencePlanStop[],
  recommendations: IntelligenceRecommendation[],
): IntelligenceMapFocus {
  const locations = [...plan, ...recommendations]
    .filter(
      (item): item is typeof item & { lat: number; lng: number } =>
        typeof item.lat === "number" && typeof item.lng === "number",
    )
    .filter(
      (item, index, list) =>
        list.findIndex(
          (candidate) =>
            candidate.lat === item.lat && candidate.lng === item.lng,
        ) === index,
    )
    .slice(0, 8);

  const placeIds = Array.from(
    new Set([
      ...plan.map((item) => item.placeId).filter(Boolean),
      ...recommendations.map((item) => item.id),
    ]),
  ).slice(0, 12) as string[];

  if (!locations.length) {
    return { island: context.island, placeIds };
  }

  if (locations.length === 1) {
    return {
      island: context.island,
      center: { lat: locations[0].lat, lng: locations[0].lng },
      placeIds,
    };
  }

  const latitudes = locations.map((item) => item.lat);
  const longitudes = locations.map((item) => item.lng);

  return {
    island: context.island,
    center: {
      lat: latitudes.reduce((sum, value) => sum + value, 0) / latitudes.length,
      lng: longitudes.reduce((sum, value) => sum + value, 0) / longitudes.length,
    },
    bounds: {
      north: Math.max(...latitudes),
      south: Math.min(...latitudes),
      east: Math.max(...longitudes),
      west: Math.min(...longitudes),
    },
    placeIds,
  };
}

function buildFollowUps(
  intent: string,
  context: IntelligenceContext,
  plan: IntelligencePlanStop[],
  recommendations: IntelligenceRecommendation[],
): string[] {
  const top = recommendations[0]?.title;
  const prompts: string[] = [];

  if (plan.length) {
    prompts.push("Make this plan more relaxed");
    prompts.push("Show me a rain-safe alternative");
    prompts.push("Estimate transportation between every stop");
  } else if (top) {
    prompts.push(`Build a half-day plan around ${top}`);
    prompts.push(`Show food and activities near ${top}`);
  } else {
    prompts.push(`Show the best-reviewed options on ${context.island.toUpperCase()}`);
    prompts.push("Ask me a few questions and build a personalized plan");
  }

  if (intent !== "mobility") prompts.push("Add transportation to this recommendation");
  if (intent !== "booking") prompts.push("Which parts of this can I book now?");

  return Array.from(new Set(prompts)).slice(0, 4);
}

export function buildIntelligencePresentation(
  intent: string,
  context: IntelligenceContext,
  plan: IntelligencePlanStop[],
  recommendations: IntelligenceRecommendation[],
): IntelligencePresentation {
  return {
    mapFocus: buildMapFocus(context, plan, recommendations),
    followUps: buildFollowUps(intent, context, plan, recommendations),
  };
}
