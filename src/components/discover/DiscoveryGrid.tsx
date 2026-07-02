import type { DiscoveryItem } from "./discoveryTypes";
import DiscoveryCard from "./DiscoveryCard";

export default function DiscoveryGrid({
  items,
  onOpen,
}: {
  items: DiscoveryItem[];
  onOpen: (item: DiscoveryItem) => void;
}) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <DiscoveryCard
          key={`${item.collectionName}-${item.id}`}
          item={item}
          onOpen={onOpen}
        />
      ))}
    </section>
  );
}
