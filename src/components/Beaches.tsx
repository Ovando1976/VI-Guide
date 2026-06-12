import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BeachDoc, IslandCode } from "../types";
import { getBeachesByIsland } from "../lib/firestore/beaches";
import { isIslandCode } from "../lib/utils/islands";
import { MapPin, Palmtree, Plus, Route, Waves } from "lucide-react";
import { motion } from "motion/react";

interface BeachesProps {
  onSelectBeach: (beach: BeachDoc) => void;
}

const STORAGE_KEY = "viNavigatorDayPlan";

function getBeachId(beach: BeachDoc) {
  return (
    beach.slug || beach.id || beach.title.toLowerCase().replace(/\s+/g, "-")
  );
}

function addBeachToPlan(beach: BeachDoc) {
  if (!beach.coordinates) return;

  const stop = {
    id: getBeachId(beach),
    title: beach.title,
    type: "beach",
    lat: beach.coordinates.lat,
    lng: beach.coordinates.lng,
    description: beach.shortDescription || beach.description || "Beach stop.",
  };

  const existing = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");

  const next = existing.some((item: any) => item.id === stop.id)
    ? existing
    : [...existing, stop];

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function openDirections(beach: BeachDoc) {
  if (!beach.coordinates) return;

  window.open(
    `https://www.google.com/maps/search/?api=1&query=${beach.coordinates.lat},${beach.coordinates.lng}`,
    "_blank",
    "noopener,noreferrer"
  );
}

export default function Beaches({ onSelectBeach }: BeachesProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [beaches, setBeaches] = useState<BeachDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const islandParam = searchParams.get("island");
  const islandCode: IslandCode = isIslandCode(islandParam)
    ? islandParam
    : "st_thomas";

  useEffect(() => {
    let cancelled = false;

    async function loadBeaches() {
      setLoading(true);
      setLoadError("");

      try {
        const data = await getBeachesByIsland(islandCode);
        console.log("BEACHES LOADED:", islandCode, data);

        if (!cancelled) {
          setBeaches(data);
        }
      } catch (error) {
        console.error("Error loading beaches:", error);

        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Could not load beaches right now."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadBeaches();

    return () => {
      cancelled = true;
    };
  }, [islandCode]);

  const titleIsland = useMemo(
    () => islandCode.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    [islandCode]
  );

  return (
    <main className="min-h-screen bg-stone-50 px-4 pb-32 pt-6">
      <header className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-emerald-600">
          <Palmtree className="h-5 w-5" />
          <span className="text-sm font-black uppercase tracking-widest">
            Beaches
          </span>
        </div>

        <h1 className="text-3xl font-black text-stone-950">Island Shores</h1>

        <p className="mt-1 text-sm text-stone-500">
          The most beautiful beaches on {titleIsland}.
        </p>
      </header>

      {loading && (
        <div className="grid gap-6">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-72 animate-pulse rounded-3xl bg-stone-200"
            />
          ))}
        </div>
      )}

      {!loading && loadError && (
        <div className="rounded-3xl bg-red-50 p-5 text-sm font-bold text-red-700 shadow">
          {loadError}
        </div>
      )}

      {!loading && !loadError && beaches.length === 0 && (
        <div className="rounded-3xl bg-white p-8 text-center shadow-xl">
          <h3 className="text-xl font-bold text-stone-950">No beaches found</h3>
          <p className="mt-2 text-sm text-stone-500">
            Firestore returned zero beach records for {islandCode}.
          </p>
        </div>
      )}

      {!loading && !loadError && beaches.length > 0 && (
        <div className="grid gap-6">
          {beaches.map((beach, index) => (
            <motion.article
              key={getBeachId(beach)}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.04 }}
              className="overflow-hidden rounded-3xl border border-stone-100 bg-white shadow-xl"
            >
              <button
                onClick={() => onSelectBeach(beach)}
                className="block w-full text-left"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-stone-100">
                  <img
                    src={
                      beach.coverImage ||
                      `https://picsum.photos/seed/${getBeachId(beach)}/1000/700`
                    }
                    alt={beach.title}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />

                  <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-emerald-700 shadow backdrop-blur">
                    <Waves className="h-3 w-3" />
                    Beach
                  </div>
                </div>

                <div className="p-5">
                  <h2 className="text-2xl font-black text-stone-950">
                    {beach.title}
                  </h2>

                  <p className="mt-2 line-clamp-2 text-sm text-stone-500">
                    {beach.shortDescription || beach.description}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-bold text-stone-400">
                    {beach.areaSlug && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {beach.areaSlug.replaceAll("-", " ")}
                      </span>
                    )}

                    {beach.tags?.[0] && (
                      <span className="rounded-full bg-stone-100 px-3 py-1 uppercase tracking-widest">
                        {beach.tags[0]}
                      </span>
                    )}
                  </div>
                </div>
              </button>

              <div className="grid grid-cols-3 gap-2 border-t border-stone-100 p-3">
                <button
                  onClick={() => onSelectBeach(beach)}
                  className="rounded-2xl bg-stone-100 px-3 py-3 text-xs font-black text-stone-800"
                >
                  Details
                </button>

                <button
                  onClick={() => {
                    addBeachToPlan(beach);
                    navigate("/cruise");
                  }}
                  className="flex items-center justify-center gap-1 rounded-2xl bg-emerald-950 px-3 py-3 text-xs font-black text-white"
                >
                  <Plus className="h-3 w-3" />
                  Plan
                </button>

                <button
                  onClick={() => openDirections(beach)}
                  className="flex items-center justify-center gap-1 rounded-2xl bg-amber-300 px-3 py-3 text-xs font-black text-stone-950"
                >
                  <Route className="h-3 w-3" />
                  Map
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </main>
  );
}
