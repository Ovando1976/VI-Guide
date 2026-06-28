import type { IslandCode } from "../../types";
import type { GeographicIndexItem } from "../../data/core/geographicIndex";
import { queryConciergeKnowledge } from "./conciergeKnowledge";
import { buildConciergeActions } from "./conciergeActions";

export type ConciergeIntent =
  | "search"
  | "route"
  | "booking"
  | "history"
  | "nearby"
  | "business"
  | "compare"
  | "explain"
  | "unknown";

export type ConciergeAction =
  | {
      type: "navigate";
      label: string;
      path: string;
    }
  | {
      type: "search";
      label: string;
      query: string;
    }
  | {
      type: "book";
      label: string;
      intent: "tour" | "ride" | "bundle";
    };

export type ConciergeBrainResult = {
  intent: ConciergeIntent;
  answer: string;
  results: GeographicIndexItem[];
  actions: ConciergeAction[];
  confidence: number;
};

type BrainInput = {
  message: string;
  island: IslandCode;
  routeName: string;
  path: string;
  contextTitle?: string | null;
  userLocation?: { lat: number; lng: number } | null;
};

function detectIntent(message: string): ConciergeIntent {
  const text = message.toLowerCase();

  if (/(taxi|ride|route|directions|drive|pickup|dropoff|red hook|airport)/.test(text)) {
    return "route";
  }

  if (/(book|reserve|schedule|tour|bundle|ticket|price)/.test(text)) {
    return "booking";
  }

  if (/(history|historic|archive|estate|danish|fort|church|plantation)/.test(text)) {
    return "history";
  }

  if (/(near|nearby|around me|closest|walking distance)/.test(text)) {
    return "nearby";
  }

  if (/(business|restaurant|contractor|taxi|service|company|merchant)/.test(text)) {
    return "business";
  }

  if (/(compare|better|best|which one|versus|vs)/.test(text)) {
    return "compare";
  }

  if (/(what is|explain|tell me|why|how)/.test(text)) {
    return "explain";
  }

  return "search";
}

function buildAnswer(input: BrainInput, intent: ConciergeIntent, results: GeographicIndexItem[]) {
  const top = results[0];

  if (!top) {
    return `I checked the VI Guide geographic index from your current context: **${input.routeName}**.

I did not find a strong match yet. Try giving me an estate name, beach, business type, historic site, road, parcel, or landmark.`;
  }

  const related = results.slice(1, 4);

  let answer = `I found **${top.name}**. It appears in VI Guide as **${top.source || top.category || top.type || "Place"}**.`;

  if (top.description) {
    answer += `\n\n${top.description}`;
  }

  if (intent === "route") {
    answer += `\n\nFor movement, I can help route you there, estimate a taxi path, or connect this to the Mobility system.`;
  }

  if (intent === "history") {
    answer += `\n\nHistorically, this can connect to estate records, dictionary entries, archive material, and nearby historic sites.`;
  }

  if (intent === "booking") {
    answer += `\n\nThis looks bookable. I can turn this into a tour lead, taxi lead, or bundled island experience.`;
  }

  if (intent === "business") {
    answer += `\n\nI can also connect this to local businesses nearby, including restaurants, taxis, tours, and services.`;
  }

  if (related.length > 0) {
    answer += `\n\nRelated signals:\n${related
      .map((item) => `- **${item.name}** — ${item.source || item.category || item.type || "Place"}`)
      .join("\n")}`;
  }

  answer += `\n\nContext understood: **${input.routeName}**, island **${input.island}**${
    input.contextTitle ? `, currently viewing **${input.contextTitle}**` : ""
  }.`;

  return answer;
}

export function runConciergeBrain(input: BrainInput): ConciergeBrainResult {
  const intent = detectIntent(input.message);

  const searchQuery = [input.message, input.contextTitle]
    .filter(Boolean)
    .join(" ");

  const knowledge = queryConciergeKnowledge({
    query: searchQuery,
    island: input.island,
    contextTitle: input.contextTitle,
    limit: 10,
  });

  return {
    intent,
    results: knowledge.items,
    actions: buildConciergeActions({
      intent,
      island: input.island,
      results: knowledge.items,
    }),
    answer: buildAnswer(input, intent, knowledge.items),
    confidence: knowledge.confidence,
  };
}