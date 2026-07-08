import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { MapPin, Search, Star, Utensils } from "lucide-react";

import stCroixRestaurants from "../data/restaurants-st-croix.json";
import stJohnRestaurants from "../data/restaurants-st-john.json";
import stThomasRestaurants from "../data/restaurants-st-thomas.json";
import waterIslandRestaurants from "../data/restaurants-water-island.json";
import { getPlacesByCategory } from "../lib/firestore/places";
import { isIslandCode } from "../lib/utils/islands";
import type { IslandCode, PlaceDoc } from "../types";

interface EatProps {
  onSelectPlace: (place: PlaceDoc) => void;
}

type RestaurantRecord = Record<string, unknown>;

const restaurantDataByIsland: Record<IslandCode, unknown[]> = {
  st_thomas: stThomasRestaurants as unknown[],
  st_john: stJohnRestaurants as unknown[],
  st_croix: stCroixRestaurants as unknown[],
  water_island: waterIslandRestaurants as unknown[],
};

const islandLabels: Record<IslandCode, string> = {
  st_thomas: "St. Thomas",
  st_john: "St. John",
  st_croix: "St. Croix",
  water_island: "Water Island",
};

function asText(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function asStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .slice(0, 8);
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 8);
  }

  return [];
}

function normalizeRestaurant(
  record: RestaurantRecord,
  islandCode: IslandCode,
  index: number
): PlaceDoc {
  const title =
    asText(record.title) ||
    asText(record.name) ||
    asText(record.restaurantName) ||
    `Restaurant ${index + 1}`;

  const slug =
    asText(record.slug) ||
    title
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const id =
    asText(record.id) ||
    asText(record.placeId) ||
    `${islandCode}-restaurant-${slug || index}`;

  const coverImage =
    asText(record.coverImage) ||
    asText(record.image) ||
    asText(record.imageUrl) ||
    asText(record.photoUrl) ||
    asText(record.thumbnail) ||
    `/images/places/${islandCode.replace("_", "-")}/${slug}-1.jpg`;

  const description =
    asText(record.shortDescription) ||
    asText(record.description) ||
    asText(record.summary) ||
    `A local dining option on ${islandLabels[islandCode]}.`;

  return {
    ...(record as Partial<PlaceDoc>),
    id,
    title,
    name: asText(record.name, title),
    slug,
    islandCode,
    island: islandCode,
    category: "restaurant",
    type: "restaurant",
    coverImage,
    image: coverImage,
    shortDescription: asText(record.shortDescription, description),
    description,
    areaSlug:
      asText(record.areaSlug) ||
      asText(record.neighborhood) ||
      asText(record.area) ||
      islandCode,
    address: asText(record.address),
    priceTier: asText(record.priceTier) || asText(record.price) || "",
    rating: asNumber(record.rating),
    tags: asStringArray(record.tags).length
      ? asStringArray(record.tags)
      : [
          asText(record.cuisine),
          asText(record.category),
          asText(record.neighborhood),
        ].filter(Boolean),
    lat: asNumber(record.lat) ?? asNumber(record.latitude),
    lng: asNumber(record.lng) ?? asNumber(record.longitude),
  } as PlaceDoc;
}

function getStaticRestaurants(islandCode: IslandCode) {
  return (restaurantDataByIsland[islandCode] || [])
    .filter((item): item is RestaurantRecord => Boolean(item) && typeof item === "object")
    .map((record, index) => normalizeRestaurant(record, islandCode, index));
}

export default function Eat({ onSelectPlace }: EatProps) {
  const [searchParams] = useSearchParams();
  const [places, setPlaces] = useState<PlaceDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const islandParam = searchParams.get("island");
  const islandCode: IslandCode = isIslandCode(islandParam)
    ? islandParam
    : "st_thomas";

  useEffect(() => {
    let cancelled = false;

    async function loadPlaces() {
      setLoading(true);

      try {
        const cloudData = await getPlacesByCategory("restaurant", islandCode);
        const localData = getStaticRestaurants(islandCode);

        const merged = cloudData?.length ? cloudData : localData;

        if (!cancelled) {
          setPlaces(merged);
        }
      } catch (error) {
        console.error("Error loading restaurants. Falling back to local JSON:", error);

        if (!cancelled) {
          setPlaces(getStaticRestaurants(islandCode));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPlaces();

    return () => {
      cancelled = true;
    };
  }, [islandCode]);

  const filteredPlaces = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    if (!cleanQuery) return places;

    return places.filter((place) => {
      const haystack = [
        place.title,
        place.name,
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

        <div className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
          {filteredPlaces.length} dining spots
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
                src={place.coverImage || place.image || "https://picsum.photos/seed/food/900/650"}
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
                  <span>{place.areaSlug?.replace(/-/g, " ") || islandLabels[islandCode]}</span>
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
