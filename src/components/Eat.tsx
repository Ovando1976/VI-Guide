import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { Database, MapPin, Search, Star, Utensils } from "lucide-react";

import { useRestaurantPlaces } from "../hooks/useRestaurantPlaces";
import { isIslandCode } from "../lib/utils/islands";
import type { IslandCode, PlaceDoc } from "../types";

interface EatProps {
  onSelectPlace: (place: PlaceDoc) => void;
}

const islandLabels: Record<IslandCode, string> = {
  st_thomas: "St. Thomas",
  st_john: "St. John",
  st_croix: "St. Croix",
  water_island: "Water Island",
};

export default function Eat({ onSelectPlace }: EatProps) {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState("");

  const islandParam = searchParams.get("island");
  const islandCode: IslandCode = isIslandCode(islandParam)
    ? islandParam
    : "st_thomas";

  const {
    restaurants: places,
    source,
    loading,
  } = useRestaurantPlaces(islandCode);

  const filteredPlaces = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    if (!cleanQuery) return places;

    return places.filter((place) => {
      const haystack = [
        place.title,
        place.description,
        place.shortDescription,
        place.areaSlug,
        place.address,
        ...(place.tags || []),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(cleanQuery);
    });
  }, [places, query]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-4 pb-32">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-[2rem] bg-zinc-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f0df] p-4 pb-32">
      <header className="mb-6 rounded-[2rem] bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center gap-2 text-emerald-700">
          <Utensils className="h-5 w-5" />
          <span className="text-sm font-black uppercase tracking-[0.22em]">
            Dining
          </span>
        </div>

        <h1 className="text-4xl font-black tracking-tight text-zinc-950">
          Local Flavors
        </h1>

        <p className="mt-2 text-sm font-semibold leading-6 text-zinc-500">
          Restaurants, beach bars, cafés, and local food spots on{" "}
          {islandLabels[islandCode]}.
        </p>

        <label className="mt-5 flex items-center gap-3 rounded-2xl bg-zinc-100 px-4 py-3 text-sm text-zinc-500">
          <Search className="h-4 w-4" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search restaurants, cuisine, area..."
            className="w-full bg-transparent font-semibold text-zinc-900 outline-none placeholder:text-zinc-400"
          />
        </label>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
          <span>{filteredPlaces.length} dining spots</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] text-zinc-500">
            <Database className="h-3 w-3" />
            {source === "firestore" ? "Firestore" : "Local fallback"}
          </span>
        </div>
      </header>

      <div className="grid gap-6">
        {filteredPlaces.map((place) => (
          <motion.div
            key={place.id}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onClick={() => onSelectPlace(place)}
            className="group cursor-pointer overflow-hidden rounded-[2rem] border border-zinc-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100">
              <img
                src={place.coverImage || "https://picsum.photos/seed/food/900/650"\}
                alt={place.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
                loading="lazy"
              />

              {place.priceTier ? (
                <div className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-zinc-900 shadow-sm backdrop-blur-md">
                  {place.priceTier}
                </div>
              ) : null}
            </div>

            <div className="p-5">
              <div className="mb-2 flex items-start justify-between gap-4">
                <h3 className="text-2xl font-black text-zinc-950">
                  {place.title}
                </h3>

                {place.rating ? (
                  <div className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-600">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-black">{place.rating}</span>
                  </div>
                ) : null}
              </div>

              <p className="mb-4 line-clamp-2 text-sm font-medium leading-6 text-zinc-500">
                {place.shortDescription || place.description}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-zinc-400">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>
                    {place.areaSlug?.replace(/-/g, " ") || islandLabels[islandCode]}
                  </span>
                </div>

                {place.tags?.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-emerald-50 px-2.5 py-1 uppercase tracking-[0.14em] text-emerald-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}

        {!filteredPlaces.length ? (
          <div className="rounded-[2rem] border border-dashed border-zinc-300 bg-white p-8 text-center">
            <Utensils className="mx-auto mb-3 h-8 w-8 text-zinc-400" />
            <h3 className="text-xl font-black text-zinc-950">
              No restaurants found
            </h3>
            <p className="mt-2 text-sm text-zinc-500">
              Try a different search or switch islands.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
