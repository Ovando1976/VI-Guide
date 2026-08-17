"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";

import type { EstateRecord, IslandCode } from "@/types/usvi";

type SearchResult = {
  id: string;
  canonicalName: string;
  featureType: string;
  island: string;
  shortDescription?: string;
  relatedEstateGeoids?: string[];
};

type Props = {
  value: string;
  placeholder: string;
  estates: EstateRecord[];
  island: IslandCode;
  onChange: (geoid: string) => void;
};

const COLLATOR = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

function islandCode(island: IslandCode) {
  const value = String(island).toUpperCase();
  if (value.includes("THOMAS") || value === "STT") return "STT";
  if (value.includes("JOHN") || value === "STJ") return "STJ";
  if (value.includes("CROIX") || value === "STX") return "STX";
  return value;
}

export function MobilityPlacePicker({ value, placeholder, estates, island, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const sortedEstates = useMemo(
    () => [...estates].sort((a, b) => COLLATOR.compare(a.baseName, b.baseName) || a.geoid.localeCompare(b.geoid)),
    [estates],
  );
  const selectedEstate = estates.find((estate) => estate.geoid === value) ?? null;

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          q: query.trim(),
          island: islandCode(island),
          type: "estate,district,settlement,harbor,landmark,bay,road,point",
          limit: "10",
        });
        const response = await fetch(`/api/geography/search?${params}`, { signal: controller.signal });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Place search unavailable");
        setResults(Array.isArray(payload.results) ? payload.results : []);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, island]);

  function chooseResult(result: SearchResult) {
    const mappedGeoid = result.relatedEstateGeoids?.find((geoid) => estates.some((estate) => estate.geoid === geoid));
    if (!mappedGeoid) return;
    onChange(mappedGeoid);
    setQuery(result.canonicalName);
    setOpen(false);
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-700" />
        <input
          value={open ? query : selectedEstate?.baseName ?? query}
          onFocus={() => { setOpen(true); if (selectedEstate && !query) setQuery(""); }}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
          placeholder={placeholder}
          aria-label={placeholder}
          autoComplete="off"
          className="w-full rounded-[20px] border border-slate-200 bg-[#f8f4ea] py-4 pl-11 pr-4 text-base font-black text-[#043331] outline-none transition placeholder:font-semibold placeholder:text-slate-400 focus:border-[#0f766e] focus:ring-4 focus:ring-teal-100"
        />
        {loading ? <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-teal-700" /> : null}
      </div>

      {open ? (
        <div className="absolute z-40 mt-2 max-h-80 w-full overflow-auto rounded-[20px] border border-slate-200 bg-white p-2 shadow-xl">
          {results.map((result) => {
            const mapped = result.relatedEstateGeoids?.some((geoid) => estates.some((estate) => estate.geoid === geoid));
            return (
              <button
                key={result.id}
                type="button"
                disabled={!mapped}
                onClick={() => chooseResult(result)}
                className="flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                <span className="min-w-0">
                  <span className="block text-sm font-black text-[#043331]">{result.canonicalName}</span>
                  <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[.1em] text-slate-400">
                    {result.featureType}{mapped ? " · official fare area matched" : " · fare area needs review"}
                  </span>
                </span>
              </button>
            );
          })}

          {query.trim().length >= 2 && !loading && results.length === 0 ? (
            <div className="px-3 py-4 text-sm font-semibold text-slate-500">No mapped places found. Choose the official fare area below.</div>
          ) : null}

          <div className="my-2 border-t border-slate-100" />
          <div className="px-3 pb-1 text-[9px] font-black uppercase tracking-[.14em] text-slate-400">Official fare areas</div>
          {sortedEstates.slice(0, query.trim() ? 40 : 12).filter((estate) => !query.trim() || estate.baseName.toLowerCase().includes(query.trim().toLowerCase())).map((estate) => (
            <button
              key={estate.geoid}
              type="button"
              onClick={() => { onChange(estate.geoid); setQuery(estate.baseName); setOpen(false); }}
              className="w-full rounded-xl px-3 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              {estate.baseName}
            </button>
          ))}
        </div>
      ) : null}
      <p className="mt-2 text-[10px] font-semibold leading-4 text-slate-500">Search a familiar place. We map it to the official taxi fare area before quoting.</p>
    </div>
  );
}
