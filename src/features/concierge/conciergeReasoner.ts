import type { GeographicIndexItem } from "../../data/core/geographicIndex";
import type { ParsedConciergeIntent } from "../../lib/concierge/conciergeIntentEngine";

export type ConciergeReasonedAnswer = {
  text: string;
  results?: GeographicIndexItem[];
};

function label(item: GeographicIndexItem) {
  return item.displayName || item.name || item.id;
}

function itemType(item: GeographicIndexItem) {
  return item.type || item.category || item.source || "Atlas item";
}

function list(items: GeographicIndexItem[]) {
  return items
    .slice(0, 6)
    .map((item, index) => `${index + 1}. **${label(item)}** — ${itemType(item)}`)
    .join("\n");
}

export function reasonFromConciergeResults(input: {
  parsed: ParsedConciergeIntent;
  results: GeographicIndexItem[];
}): ConciergeReasonedAnswer | null {
  const { parsed, results } = input;
  if (results.length === 0) return null;

  const primary = results[0];

  if (parsed.intent === "history") {
  return {
    text: `I found **${label(primary)}** as the strongest match.

This appears to be a **${itemType(primary)}** record in VI Guide.

${primary.description || ""}

Related records:

${list(results)}

Open the estate card or history view to inspect linked archive and dictionary evidence.`,
    results,
  };
}

  if (parsed.intent === "nearby_beaches") {
    const beachLike = results.filter((item) => {
      const text = `${item.name} ${item.type} ${item.category} ${item.source}`.toLowerCase();
      return text.includes("beach") || text.includes("bay");
    });

    return {
      text:
        beachLike.length > 0
          ? `These are the best beach and bay matches I found:\n\n${list(beachLike)}`
          : `I found **${label(primary)}**, but I did not find strong beach matches in this result set yet.`,
      results: beachLike.length > 0 ? beachLike : results,
    };
  }
  

  if (parsed.intent === "dictionary") {
    return {
      text: `Here are the strongest dictionary or geographic index records I found:\n\n${list(results)}`,
      results,
    };
  }

  if (parsed.intent === "archives") {
    return {
      text: `I found **${label(primary)}**. The best next step is to open the archive knowledge view and connect Danish archive records, NARA records, maps, images, and dictionary references.`,
      results,
    };
  }

  if (parsed.intent === "directions" || parsed.intent === "taxi") {
    return {
      text: `I found the route entities. Open Mobility so VI Guide can resolve the pickup, destination, official fare, taxi zone, and route preview.`,
      results,
    };
  }

  return {
    text: `I found these VI Guide matches:\n\n${list(results)}`,
    results,
  };
}