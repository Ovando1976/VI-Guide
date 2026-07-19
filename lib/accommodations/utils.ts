import type { AccommodationRecord, CatalogSeed } from "./types";
import accommodationImageSources from "@/data/accommodation-image-sources.json";

type AccommodationImageSource = {
  localPath?: string;
};

const IMAGE_SOURCES = accommodationImageSources as Record<
  string,
  AccommodationImageSource
>;

export function slugifyAccommodation(value: string): string {
  return value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function accommodationIslandName(
  island: AccommodationRecord["island"]
): string {
  return island === "stt"
    ? "St. Thomas"
    : island === "stj"
      ? "St. John"
      : "St. Croix";
}

export function resolveAccommodationHeroImage(
  seed: CatalogSeed,
  slug: string
): string {
  if (seed.heroImage) return seed.heroImage;

  const recoveredImage = IMAGE_SOURCES[slug]?.localPath;

  if (recoveredImage) return recoveredImage;

  return `/images/stays/${seed.island}/${slug}.svg`;
}