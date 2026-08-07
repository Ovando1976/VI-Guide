"use client";

import { Bookmark, Check } from "lucide-react";
import { useEffect, useState } from "react";

import {
  SAVED_PLACES_UPDATED_EVENT,
  isPlaceSaved,
  toggleSavedPlace,
  type SavedPlaceInput,
} from "@/lib/saved-places";

export function SavePlaceButton({
  place,
  className = "",
  compact = false,
}: {
  place: SavedPlaceInput;
  className?: string;
  compact?: boolean;
}) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    function refresh() {
      setSaved(isPlaceSaved(place.id));
    }

    refresh();
    window.addEventListener(SAVED_PLACES_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(SAVED_PLACES_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [place.id]);

  function toggle() {
    setSaved(toggleSavedPlace(place));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full border px-4 text-[10px] font-black uppercase tracking-[.15em] transition hover:-translate-y-0.5 ${
        saved
          ? "border-emerald-200 bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
          : "border-slate-200 bg-[#f8f4ea] text-[#043331] hover:border-[#0f766e] hover:bg-white"
      } ${className}`}
    >
      {saved ? <Check className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
      {compact ? (saved ? "Saved" : "Save") : saved ? "Saved place" : "Save place"}
    </button>
  );
}
