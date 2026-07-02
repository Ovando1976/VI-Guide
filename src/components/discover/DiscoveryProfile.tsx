// src/components/discover/DiscoveryProfile.tsx

import type { ComponentType, ReactNode } from "react";
import {
  Accessibility,
  Bot,
  Camera,
  Compass,
  Heart,
  Info,
  MapPin,
  Navigation,
  ParkingCircle,
  Phone,
  Share2,
  Sparkles,
  Star,
  Waves,
  X,
} from "lucide-react";

import type { DiscoveryItem } from "./discoveryTypes";

const FALLBACK_IMAGE = "/images/beaches/magens-bay.jpg";

type IconType = ComponentType<{ className?: string }>;

function titleCase(value: unknown) {
  return String(value ?? "")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function safeImage(value: unknown) {
  const src = String(value ?? "").trim();
  return src && src !== "undefined" && src !== "null" ? src : FALLBACK_IMAGE;
}

function openDirections(item: DiscoveryItem) {
  const destination =
    item.coordinates
      ? `${item.coordinates.lat},${item.coordinates.lng}`
      : encodeURIComponent(item.title);

  window.open(
    `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
    "_blank",
    "noopener,noreferrer",
  );
}

function distanceMiles(a: DiscoveryItem, b: DiscoveryItem) {
  if (!a.coordinates || !b.coordinates) return Number.POSITIVE_INFINITY;

  const R = 3958.8;
  const lat1 = (a.coordinates.lat * Math.PI) / 180;
  const lat2 = (b.coordinates.lat * Math.PI) / 180;
  const dLat = ((b.coordinates.lat - a.coordinates.lat) * Math.PI) / 180;
  const dLng = ((b.coordinates.lng - a.coordinates.lng) * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
}

function nearbyByCategory(
  item: DiscoveryItem,
  allItems: DiscoveryItem[],
  categories: string[],
) {
  return allItems
    .filter(
      (candidate) =>
        candidate.id !== item.id &&
        candidate.coordinates &&
        categories.includes(candidate.category),
    )
    .map((candidate) => ({
      item: candidate,
      miles: distanceMiles(item, candidate),
    }))
    .filter((entry) => Number.isFinite(entry.miles))
    .sort((a, b) => a.miles - b.miles)
    .slice(0, 3);
}

export default function DiscoveryProfile({
  item,
  allItems = [],
  onClose,
}: {
  item: DiscoveryItem;
  allItems?: DiscoveryItem[];
  onClose: () => void;
}) {
  const category = titleCase(item.displayCategory ?? item.category);
  const island = titleCase(item.islandCode);
  const coverImage = safeImage(item.coverImage);

  const gallery = Array.from(
    new Set([coverImage, ...(Array.isArray(item.gallery) ? item.gallery : [])]),
  )
    .map(safeImage)
    .slice(0, 6);

  const nearbyFood = nearbyByCategory(item, allItems, ["restaurant"]);
  const nearbyBeaches = nearbyByCategory(item, allItems, ["beach"]);
  const nearbyHistory = nearbyByCategory(item, allItems, ["history", "attraction"]);  

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 px-3 py-5 backdrop-blur-xl sm:px-5"
      onClick={onClose}
    >
      <article
        className="mx-auto w-full max-w-6xl overflow-hidden rounded-[2.25rem] bg-[#07131b] text-white shadow-2xl ring-1 ring-white/10"
        onClick={(event) => event.stopPropagation()}
      >
        <section className="relative min-h-[34rem] overflow-hidden sm:min-h-[39rem]">
          <img
            src={coverImage}
            alt={item.title}
            className="absolute inset-0 h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.src = FALLBACK_IMAGE;
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[#07131b] via-black/55 to-black/20" />

          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 z-20 grid h-12 w-12 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black"
            aria-label="Close profile"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="absolute bottom-0 left-0 right-0 z-10 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <Badge>{category}</Badge>

              <span className="flex items-center gap-2 rounded-full bg-black/45 px-4 py-2 text-sm font-black backdrop-blur">
                <Star className="h-4 w-4 fill-white" />
                4.8
              </span>

              <span className="rounded-full bg-black/45 px-4 py-2 text-sm font-black backdrop-blur">
                Open now
              </span>
            </div>

            <h2 className="mt-5 max-w-5xl text-5xl font-black leading-none tracking-tight sm:text-7xl">
              {item.title}
            </h2>

            <p className="mt-4 flex items-center gap-2 text-sm font-black text-white/85">
              <MapPin className="h-4 w-4" />
              {island}
            </p>
          </div>
        </section>

        <section className="grid gap-5 p-5 sm:p-8 lg:grid-cols-[1.45fr_0.8fr]">
          <div className="space-y-5">
            <Panel icon={Sparkles} title="AI Summary">
              <p className="text-base leading-relaxed text-white/72">
                {item.description}
              </p>
            </Panel>

            <Panel icon={Camera} title="Gallery">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {gallery.map((image, index) => (
                  <div
                    key={`${image}-${index}`}
                    className="h-32 overflow-hidden rounded-2xl bg-white/10 sm:h-36"
                  >
                    <img
                      src={image}
                      alt={`${item.title} ${index + 1}`}
                      className="h-full w-full object-cover transition duration-500 hover:scale-105"
                      onError={(event) => {
                        event.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                  </div>
                ))}
              </div>
            </Panel>

            <Panel icon={Compass} title="Nearby Intelligence">
              <div className="grid gap-4">
                <NearbyGroup title="Nearby Food" items={nearbyFood} />
                <NearbyGroup title="Nearby Beaches" items={nearbyBeaches} />
                <NearbyGroup title="Historic Sites" items={nearbyHistory} />
              </div>
           </Panel>
          </div>

          <div className="space-y-5">
            <Panel icon={Info} title="Details">
              <div className="space-y-3 text-sm font-bold text-white/70">
                <Detail label="Island" value={island} />
                <Detail label="Category" value={category} />
                {item.areaSlug ? <Detail label="Area" value={titleCase(item.areaSlug)} /> : null}
                {item.coordinates ? (
                  <Detail
                    label="Coordinates"
                    value={`${item.coordinates.lat.toFixed(5)}, ${item.coordinates.lng.toFixed(5)}`}
                  />
                ) : null}
              </div>
            </Panel>

            <Panel icon={Waves} title="Live Signals">
              <div className="grid gap-3">
                <IntelTile title="Conditions" value="Good" />
                <IntelTile title="Drive Time" value="12 min" />
                <IntelTile title="AI Status" value="Ready" />
              </div>
            </Panel>

            <Panel icon={Accessibility} title="Visitor Fit">
              <div className="grid gap-3">
                <IntelTile title="Parking" value="Check before going" icon={ParkingCircle} />
                <IntelTile title="Family Friendly" value="Likely" />
                <IntelTile title="Accessibility" value="Verify locally" />
              </div>
            </Panel>

            <div className="grid gap-3">
              <Action
                icon={Navigation}
                label="Directions"
                onClick={() => openDirections(item)}
              />
              <Action icon={Heart} label="Save" />
              <Action icon={Share2} label="Share" />
              <Action icon={Bot} label={`Ask about ${item.title}`} strong />
            </div>
          </div>
        </section>
      </article>
    </div>
  );
}

function NearbyGroup({
  title,
  items,
}: {
  title: string;
  items: { item: DiscoveryItem; miles: number }[];
}) {
  return (
    <div className="rounded-2xl bg-white/[0.07] p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
        {title}
      </p>

      {items.length === 0 ? (
        <p className="mt-2 text-sm font-bold text-white/45">No nearby matches yet.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {items.map(({ item, miles }) => (
            <div
              key={`${item.collectionName}-${item.id}`}
              className="flex items-center justify-between gap-3 rounded-xl bg-black/20 px-3 py-2"
            >
              <span className="text-sm font-black text-white">{item.title}</span>
              <span className="shrink-0 text-xs font-bold text-white/45">
                {miles.toFixed(1)} mi
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-emerald-300 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-slate-950">
      {children}
    </span>
  );
}

function Panel({
  icon: Icon,
  title,
  children,
}: {
  icon: IconType;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-300 text-slate-950">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-black">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
      <span className="text-white/40">{label}</span>
      <span className="text-right text-white">{value}</span>
    </div>
  );
}

function IntelTile({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon?: IconType;
}) {
  return (
    <div className="rounded-2xl bg-white/[0.07] p-4">
      <div className="flex items-center gap-2">
        {Icon ? <Icon className="h-4 w-4 text-emerald-300" /> : null}
        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
          {title}
        </p>
      </div>
      <p className="mt-2 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function Action({
  icon: Icon,
  label,
  strong,
  onClick,
}: {
  icon: IconType;
  label: string;
  strong?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        strong
          ? "flex items-center justify-center gap-3 rounded-2xl bg-emerald-300 px-5 py-4 text-sm font-black text-slate-950 transition hover:bg-emerald-200"
          : "flex items-center justify-center gap-3 rounded-2xl bg-white/10 px-5 py-4 text-sm font-black text-white transition hover:bg-white/15"
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}