export type BeachImageSet = {
  cover: string;
  gallery: string[];
  source?: string;
};

function localBeachImage(islandFolder: string, slug: string, index = 1) {
  return `/images/beaches/${islandFolder}/${slug}-${index}.jpg`;
}

function imageSet(
  islandFolder: string,
  slug: string,
  count = 1
): BeachImageSet {
  return {
    cover: localBeachImage(islandFolder, slug, 1),
    gallery: Array.from({ length: count }, (_, i) =>
      localBeachImage(islandFolder, slug, i + 1)
    ),
  };
}

export const BEACH_IMAGES: Record<string, BeachImageSet> = {
  // St. Thomas
  "magens-bay": imageSet("st-thomas", "magens-bay", 3),
  "coki-point-beach": imageSet("st-thomas", "coki-point-beach", 3),
  "sapphire-beach": imageSet("st-thomas", "sapphire-beach", 3),
  "lindquist-beach": imageSet("st-thomas", "lindquist-beach", 2),
  "lindbergh-bay": imageSet("st-thomas", "lindbergh-bay", 2),
  "brewers-bay": imageSet("st-thomas", "brewers-bay", 2),
  "secret-harbour": imageSet("st-thomas", "secret-harbour", 2),
  "bolongo-bay": imageSet("st-thomas", "bolongo-bay", 2),
  "morningstar-beach": imageSet("st-thomas", "morningstar-beach", 2),
  "limetree-beach": imageSet("st-thomas", "limetree-beach", 2),
  "hull-bay": imageSet("st-thomas", "hull-bay", 2),
  "dorothea-beach": imageSet("st-thomas", "dorothea-beach", 1),
  "mandahl-bay": imageSet("st-thomas", "mandahl-bay", 1),
  "vessup-bay": imageSet("st-thomas", "vessup-bay", 1),

  // Water Island
  "honeymoon-beach-water-island": imageSet(
    "water-island",
    "honeymoon-beach-water-island",
    2
  ),
  "sprat-bay": imageSet("water-island", "sprat-bay", 1),

  // St. John
  "trunk-bay": imageSet("st-john", "trunk-bay", 3),
  "cinnamon-bay": imageSet("st-john", "cinnamon-bay", 2),
  "maho-bay": imageSet("st-john", "maho-bay", 2),
  "hawksnest-bay": imageSet("st-john", "hawksnest-bay", 2),
  "honeymoon-beach-st-john": imageSet("st-john", "honeymoon-beach-st-john", 2),
  "salomon-beach": imageSet("st-john", "salomon-beach", 1),
  "gibney-beach": imageSet("st-john", "gibney-beach", 1),
  "francis-bay": imageSet("st-john", "francis-bay", 1),
  "leinster-bay": imageSet("st-john", "leinster-bay", 1),
  "waterlemon-cay": imageSet("st-john", "waterlemon-cay", 1),
  "salt-pond-bay": imageSet("st-john", "salt-pond-bay", 1),
  "drunk-bay": imageSet("st-john", "drunk-bay", 1),
  "lameshur-bay": imageSet("st-john", "lameshur-bay", 1),
  "little-lameshur-bay": imageSet("st-john", "little-lameshur-bay", 1),
  "hansen-bay": imageSet("st-john", "hansen-bay", 1),
  "great-cruz-bay": imageSet("st-john", "great-cruz-bay", 1),

  // St. Croix
  "buck-island": imageSet("st-croix", "buck-island", 3),
  "sandy-point": imageSet("st-croix", "sandy-point", 2),
  "rainbow-beach": imageSet("st-croix", "rainbow-beach", 2),
  "cane-bay": imageSet("st-croix", "cane-bay", 2),
  "shoys-beach": imageSet("st-croix", "shoys-beach", 1),
  "chenay-bay": imageSet("st-croix", "chenay-bay", 1),
  "tamarind-reef": imageSet("st-croix", "tamarind-reef", 1),
  "buccaneer-beach": imageSet("st-croix", "buccaneer-beach", 1),
  "protestant-cay": imageSet("st-croix", "protestant-cay", 1),
  "haypenny-beach": imageSet("st-croix", "haypenny-beach", 1),
  "grapetree-bay": imageSet("st-croix", "grapetree-bay", 1),
  "jack-bay": imageSet("st-croix", "jack-bay", 1),
  "isaac-bay": imageSet("st-croix", "isaac-bay", 1),
  "dorsch-beach": imageSet("st-croix", "dorsch-beach", 1),
};

export function getBeachImages(slug: string, islandFolder: string) {
  return (
    BEACH_IMAGES[slug] ?? {
      cover: localBeachImage(islandFolder, slug, 1),
      gallery: [localBeachImage(islandFolder, slug, 1)],
    }
  );
}
