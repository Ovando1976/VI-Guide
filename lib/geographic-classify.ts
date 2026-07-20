import type { GeographicFeatureType, GeographicIslandCode } from "@/types/geographic";

export function inferFeatureType(
  name: string,
  description = ""
): GeographicFeatureType {
  const haystack = `${name} ${description}`.toLowerCase();

  if (/\bestate\b/.test(haystack)) return "estate";
  if (/\bquarter\b/.test(haystack)) return "quarter";
  if (/\bharbor\b/.test(haystack)) return "harbor";
  if (/\bbay\b/.test(haystack)) return "bay";
  if (/\bcay\b/.test(haystack)) return "cay";
  if (/\bisland\b/.test(haystack)) return "island";
  if (/\bpoint\b/.test(haystack)) return "point";
  if (/\bhill\b/.test(haystack)) return "hill";
  if (/\bgut\b/.test(haystack)) return "gut";
  if (/\breef\b/.test(haystack)) return "reef";
  if (/\bshoal\b/.test(haystack)) return "shoal";
  if (/\bdistrict\b/.test(haystack)) return "district";
  if (/\bsettlement\b/.test(haystack)) return "settlement";
  if (/\broad\b|\bstreet\b/.test(haystack)) return "road";
  if (/\bfort\b|\bchurch\b|\bmuseum\b|\bmonument\b|\blandmark\b|\bcastle\b/.test(haystack)) {
    return "landmark";
  }

  return "other";
}

export function inferIsland(
  text: string,
  fallback: GeographicIslandCode = "UNKNOWN"
): GeographicIslandCode {
  const value = text.toLowerCase();

  if (value.includes("st. thomas") || value.includes("saint thomas") || value.includes("st thomas")) {
    return "STT";
  }
  if (value.includes("st. john") || value.includes("saint john") || value.includes("st john")) {
    return "STJ";
  }
  if (value.includes("st. croix") || value.includes("saint croix") || value.includes("st croix")) {
    return "STX";
  }

  return fallback;
}