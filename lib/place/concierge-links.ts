type ContextualConciergeHrefInput = {
  name: string;
  island: string;
  prompt: string;
  mapHref?: string;
};

export function buildContextualConciergeHref({
  name,
  island,
  prompt,
  mapHref,
}: ContextualConciergeHrefInput) {
  const params = new URLSearchParams(extractQuery(mapHref));

  params.set("concierge", "open");
  params.set("prompt", prompt);

  if (!params.has("placeName")) params.set("placeName", name);
  if (!params.has("island")) params.set("island", islandToCode(island));

  return `/map?${params.toString()}`;
}

function extractQuery(href?: string) {
  if (!href) return "";
  const queryIndex = href.indexOf("?");
  return queryIndex >= 0 ? href.slice(queryIndex + 1) : "";
}

function islandToCode(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "stj" || normalized.includes("john")) return "stj";
  if (normalized === "stx" || normalized.includes("croix")) return "stx";
  return "stt";
}
