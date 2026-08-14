import type { IntelligenceResponse } from "@/types/intelligence";

export function buildGroundedAnswer(
  message: string,
  response: IntelligenceResponse,
): string {
  const matches = response.recommendations.slice(0, 4);
  const island = islandName(response.context.island);

  if (!matches.length) {
    return `I could not find a strong reviewed match for “${clean(message)}” in the current USVI Explorer knowledge index for ${island}. Try naming a beach, estate, historic site, restaurant, accommodation, or activity.`;
  }

  const names = matches.map((item) => item.title);
  const lead =
    response.intent === "knowledge"
      ? `From USVI Explorer’s own heritage and place records, the strongest match is ${names[0]}.`
      : response.intent === "mobility"
        ? `For this transportation request on ${island}, start with ${names[0]}.`
        : response.intent === "booking"
          ? `For this booking request, USVI Explorer found ${names[0]} as the strongest reviewed match.`
          : response.intent === "day_plan"
            ? `I built a connected ${island} plan around ${joinNames(names.slice(0, 3))}.`
            : `The strongest USVI Explorer matches are ${joinNames(names)}.`;

  const detail = matches[0]?.summary?.trim();
  const navigation = response.plan.length
    ? "The itinerary below includes direct place, map, and transportation actions."
    : "Use the place and map actions below to navigate directly through the app.";

  return [lead, detail, navigation].filter(Boolean).join(" ");
}

function islandName(island: IntelligenceResponse["context"]["island"]) {
  if (island === "stj") return "St. John";
  if (island === "stx") return "St. Croix";
  return "St. Thomas";
}

function joinNames(values: string[]) {
  if (values.length <= 1) return values[0] ?? "the available records";
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

function clean(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 180);
}
