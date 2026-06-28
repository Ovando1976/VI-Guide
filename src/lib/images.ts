export const IMAGE_FALLBACKS = {
  beach: "/images/placeholder-island.jpg",
  business: "/images/placeholder-island.jpg",
  dictionary: "/images/placeholder-island.jpg",
  estate: "/images/placeholder-island.jpg",
  event: "/images/placeholder-island.jpg",
  food: "/images/placeholder-island.jpg",
  historicSite: "/images/historicSite/placeholder-historic-site.svg",
  place: "/images/placeholder-island.jpg",
} as const;

export type ImageKind = keyof typeof IMAGE_FALLBACKS;

export function imageWithFallback(src: string | undefined | null, kind: ImageKind = "place") {
  return src && src.trim().length > 0 ? src : IMAGE_FALLBACKS[kind];
}

export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  kind: ImageKind = "place"
) {
  const img = event.currentTarget;
  const fallback = IMAGE_FALLBACKS[kind];

  if (img.src.endsWith(fallback)) return;

  img.src = fallback;
}