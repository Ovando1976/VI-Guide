export function normalizeEstateName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^estate\s+/i, "")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugifyEstateName(name: string): string {
  return normalizeEstateName(name).replace(/\s+/g, "-");
}

export function normalizeIslandCode(island: string): string {
  const value = island.toLowerCase().trim();

  if (value === "stt" || value === "st_thomas") return "st_thomas";
  if (value === "stj" || value === "st_john") return "st_john";
  if (value === "stx" || value === "st_croix") return "st_croix";
  if (value === "wat" || value === "water_island") return "water_island";

  return value || "unknown";
}

export function buildStableEstateId(input: {
  island: string;
  name: string;
  quarter?: string;
  geoid?: string;
}): string {
  const island = normalizeIslandCode(input.island);
  const name = slugifyEstateName(input.name);
  const quarter = input.quarter ? slugifyEstateName(input.quarter) : "no-quarter";

  return `${island}:${name}:${quarter}`;
}

export function buildSearchText(
  name: string,
  aliases: string[] = [],
  quarter?: string,
  quarterGroup?: string
): string {
  return [name, ...aliases, quarter ?? "", quarterGroup ?? ""]
    .join(" ")
    .toLowerCase();
}