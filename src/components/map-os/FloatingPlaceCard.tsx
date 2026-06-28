import { Car, MapPin, ShieldCheck, Star, X } from "lucide-react";

import type { IslandCode } from "../../types";
import type { SelectedMapItem } from "./mapTypes";
import { getItemTitle, getItemType, go, slugify } from "./mapUtils";

type Props = {
  item: SelectedMapItem;
  currentIsland: string;
  selectedIsland: IslandCode;
  onClose: () => void;
};

function getDetailPath(item: SelectedMapItem, title: string) {
  const isBusiness = item.type === "business" || item.source === "business";
  const isEstate = item.isEstate || item.type === "estate";
  const isHistoric = item.type === "historic" || item.source === "historicSite";
  const isDictionary = item.type === "dictionary" || item.source === "dictionary";
  const isBeach = item.type === "beach" || item.source === "beach";

  if (isBusiness) return `/businesses/${item.id || slugify(title)}`;

  if (isEstate) {
    return `/estates/${encodeURIComponent(
      String(item.geoid || item.id || slugify(title)),
    )}`;
  }

  if (isHistoric) {
    return `/historic-sites/${encodeURIComponent(String(item.id || slugify(title)))}`;
  }

  if (isDictionary) {
    return `/dictionary?q=${encodeURIComponent(title)}`;
  }

  if (isBeach) {
    return `/beaches?search=${encodeURIComponent(title)}`;
  }

  return `/map?search=${encodeURIComponent(title)}`;
}

export default function FloatingPlaceCard({
  item,
  currentIsland,
  selectedIsland,
  onClose,
}: Props) {
  const title = getItemTitle(item);
  const type = getItemType(item);
  const encodedTitle = encodeURIComponent(title);
  const detailPath = getDetailPath(item, title);

  const image =
    item.imageUrl ||
    item.coverImage ||
    item.thumbnailUrl ||
    (item.type === "business" ? "/images/business/restaurants.jpg" : "");

  return (
    <section className="absolute right-[120px] top-[210px] z-40 hidden w-[430px] overflow-hidden rounded-[2rem] border border-white/15 bg-[#050b18]/90 shadow-[0_30px_90px_rgba(0,0,0,0.55)] backdrop-blur-2xl xl:block">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/40 text-white/80 backdrop-blur"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="grid grid-cols-[150px_1fr]">
        <div className="relative min-h-[190px] bg-slate-900">
          {image ? (
            <img src={String(image)} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center bg-emerald-400/10">
              <MapPin className="h-10 w-10 text-emerald-300" />
            </div>
          )}
        </div>

        <div className="p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-300">
            {type}
          </p>

          <h2 className="mt-2 text-2xl font-black">{title}</h2>

          <p className="mt-2 flex items-center gap-2 text-sm font-bold text-white/65">
            <MapPin className="h-4 w-4 text-emerald-300" />
            {item.estate || currentIsland}
          </p>

          <div className="mt-4 flex items-center gap-2 text-sm font-bold text-white/75">
            <ShieldCheck className="h-5 w-5 text-emerald-300" />
            Verified
          </div>

          <div className="mt-3 flex items-center gap-2 text-sm font-bold text-white/75">
            <Star className="h-5 w-5 fill-amber-300 text-amber-300" />
            4.8 recommended
          </div>

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => go(detailPath)}
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black"
            >
              View Details
            </button>

            <button
              type="button"
              onClick={() =>
                go(`/mobility?island=${selectedIsland}&destination=${encodedTitle}`)
              }
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-[#022c22]"
            >
              <Car className="h-4 w-4" />
              Get Ride
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}