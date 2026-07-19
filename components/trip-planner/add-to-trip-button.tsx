"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Plus, Route } from "lucide-react";
import { TRIP_STORAGE_KEY, type TripItem, type TripItemKind } from "./trip-types";

type Props = {
  item: {
    id: string;
    slug: string;
    name: string;
    kind: TripItemKind;
    island: "stt" | "stj" | "stx";
    image?: string;
    description?: string;
    href: string;
  };
  className?: string;
};

export function AddToTripButton({ item, className = "" }: Props) {
  const [saved, setSaved] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const items = readTrip();
    setSaved(items.some((entry) => entry.id === item.id && entry.kind === item.kind));
    setCount(items.length);
  }, [item.id, item.kind]);

  function add() {
    const items = readTrip();
    const exists = items.some((entry) => entry.id === item.id && entry.kind === item.kind);
    if (!exists) {
      const next: TripItem[] = [
        ...items,
        {
          ...item,
          day: 1,
          timeOfDay: "flexible",
          addedAt: new Date().toISOString(),
        },
      ];
      localStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("vi-guide-trip-updated"));
      setCount(next.length);
    }
    setSaved(true);
  }

  return (
    <div className={`grid gap-2 sm:grid-cols-2 ${className}`}>
      <button
        type="button"
        onClick={add}
        disabled={saved}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#f5b942] px-5 py-3 text-[10px] font-black uppercase tracking-[.17em] text-[#043331] transition hover:bg-[#ffca55] disabled:cursor-default disabled:bg-emerald-100 disabled:text-emerald-800"
      >
        {saved ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        {saved ? "Added to trip" : "Add to trip"}
      </button>
      <Link
        href="/plan"
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-[10px] font-black uppercase tracking-[.17em] text-[#043331] transition hover:border-teal-700"
      >
        <Route className="h-4 w-4" /> View trip{count ? ` (${count})` : ""}
      </Link>
    </div>
  );
}

function readTrip(): TripItem[] {
  try {
    const raw = localStorage.getItem(TRIP_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TripItem[]) : [];
  } catch {
    return [];
  }
}
