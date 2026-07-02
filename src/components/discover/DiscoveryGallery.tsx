import type { DiscoveryItem } from "./discoveryTypes";

export default function DiscoveryGallery({ item }: { item: DiscoveryItem }) {
  const images = [item.coverImage, ...(item.gallery ?? [])].filter(Boolean);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {images.map((image, index) => (
        <img
          key={`${image}-${index}`}
          src={image}
          alt={item.title}
          className="h-48 w-full rounded-2xl object-cover"
        />
      ))}
    </div>
  );
}
