"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Landmark,
  Loader2,
  Search,
  X,
  ZoomIn,
} from "lucide-react";

type Island = "all" | "stt" | "stx" | "stj" | "unknown";

type GalleryItem = {
  id: string;
  title: string;
  date: string;
  creator: string;
  imageUrl: string;
  thumbnailUrl: string;
  sourceUrl: string;
  location: string[];
  subjects: string[];
  rights: string[];
  reproductionNumber: string;
  collection: string[];
  originalCaption: string;
  editorialNote?: string;
};

type CollectionResponse = {
  ok: boolean;
  collectionTitle: string;
  lotNumber: string;
  physicalPrintCount: number;
  indexedRecordCount: number;
  page: number;
  pageSize: number;
  total: number | null;
  hasNextPage: boolean;
  items: GalleryItem[];
  sourceUrl: string;
  rightsSummary: string;
  error?: string;
};

const ISLAND_LABELS: Record<Island, string> = {
  all: "All islands",
  stt: "St. Thomas",
  stx: "St. Croix",
  stj: "St. John",
  unknown: "Territory-wide / unclassified",
};

const PAGE_SIZE = 100;
const MAX_COLLECTION_PAGES = 10;

export default function LibraryOfCongressGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [metadata, setMetadata] = useState<CollectionResponse | null>(null);
  const [island, setIsland] = useState<Island>("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadedPages, setLoadedPages] = useState(0);
  const [error, setError] = useState("");
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  useEffect(() => {
    let active = true;

    async function loadCompleteCollection() {
      setLoading(true);
      setError("");
      const collected = new Map<string, GalleryItem>();

      try {
        for (let page = 1; page <= MAX_COLLECTION_PAGES; page += 1) {
          const response = await fetch(
            `/api/heritage/library-of-congress?page=${page}&count=${PAGE_SIZE}`,
          );
          const payload = (await response.json()) as CollectionResponse;

          if (!response.ok || !payload.ok) {
            throw new Error(
              payload.error || "The Library of Congress gallery could not be loaded.",
            );
          }

          if (!active) return;
          if (!metadata) setMetadata(payload);

          for (const item of payload.items) collected.set(item.id, item);
          setItems(Array.from(collected.values()));
          setLoadedPages(page);

          if (!payload.hasNextPage || payload.items.length === 0) break;
        }
      } catch (loadError) {
        if (!active) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "The Library of Congress gallery could not be loaded.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadCompleteCollection();
    return () => {
      active = false;
    };
  }, []);

  const visibleItems = useMemo(() => {
    const term = query.trim().toLowerCase();
    return items.filter((item) => {
      const itemIsland = inferIsland(item);
      const matchesIsland = island === "all" || itemIsland === island;
      const haystack = [
        item.title,
        item.creator,
        item.date,
        item.reproductionNumber,
        ...item.location,
        ...item.subjects,
      ]
        .join(" ")
        .toLowerCase();
      return matchesIsland && (!term || haystack.includes(term));
    });
  }, [island, items, query]);

  const islandCounts = useMemo(() => {
    const counts: Record<Island, number> = {
      all: items.length,
      stt: 0,
      stx: 0,
      stj: 0,
      unknown: 0,
    };
    for (const item of items) counts[inferIsland(item)] += 1;
    return counts;
  }, [items]);

  const selectedIndex = selectedItem
    ? visibleItems.findIndex((item) => item.id === selectedItem.id)
    : -1;

  function showPrevious() {
    if (selectedIndex < 0 || !visibleItems.length) return;
    const nextIndex = (selectedIndex - 1 + visibleItems.length) % visibleItems.length;
    setSelectedItem(visibleItems[nextIndex]);
  }

  function showNext() {
    if (selectedIndex < 0 || !visibleItems.length) return;
    const nextIndex = (selectedIndex + 1) % visibleItems.length;
    setSelectedItem(visibleItems[nextIndex]);
  }

  useEffect(() => {
    if (!selectedItem) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedItem(null);
      if (event.key === "ArrowLeft") showPrevious();
      if (event.key === "ArrowRight") showNext();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedItem, selectedIndex, visibleItems]);

  return (
    <main className="min-h-screen bg-[#f5efe2] pb-36 text-[#092f2d]">
      <header className="overflow-hidden bg-[radial-gradient(circle_at_12%_10%,rgba(245,196,81,.25),transparent_30%),linear-gradient(145deg,#062d2c,#07524d)] text-white">
        <div className="mx-auto max-w-7xl px-5 pb-14 pt-8 sm:px-8 lg:px-10 lg:pb-20 lg:pt-12">
          <Link
            href="/heritage"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.16em] text-white/65 hover:text-white"
          >
            <ArrowLeft size={15} /> Back to Heritage
          </Link>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-100/20 bg-amber-50/10 px-4 py-2 text-[10px] font-black uppercase tracking-[.2em] text-amber-100">
                <Landmark size={14} /> Library of Congress · U.S. Virgin Islands
              </span>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[.95] tracking-[-.055em] sm:text-6xl">
                The complete online Virgin Islands collection.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-white/72 sm:text-lg">
                Jack Delano&apos;s December 1941 photographic record of St. Thomas,
                St. Croix, and St. John—presented as a complete searchable gallery,
                not a small editorial selection.
              </p>
            </div>

            <div className="grid min-w-[270px] grid-cols-3 gap-2 rounded-[26px] border border-white/12 bg-white/[.08] p-4 backdrop-blur-xl">
              <Stat value="461" label="Physical prints" />
              <Stat value="452" label="Indexed records" />
              <Stat value={String(items.length)} label="Loaded online" />
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
        <div className="rounded-[28px] border border-[#0b4b46]/10 bg-white p-5 shadow-[0_18px_50px_rgba(4,51,49,.07)] sm:p-7">
          <label className="relative block">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#075e58]/45"
              size={20}
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search people, places, institutions, estates, work, streets…"
              className="h-14 w-full rounded-2xl border border-slate-200 bg-[#fbfaf6] pl-12 pr-4 text-sm font-semibold outline-none focus:border-teal-600/40 focus:ring-4 focus:ring-teal-600/10"
            />
          </label>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {(Object.keys(ISLAND_LABELS) as Island[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setIsland(key)}
                className={`whitespace-nowrap rounded-full px-4 py-3 text-xs font-black transition ${
                  island === key
                    ? "bg-[#075e58] text-white"
                    : "border border-slate-200 bg-[#fbfaf6] text-slate-600 hover:bg-slate-100"
                }`}
              >
                {ISLAND_LABELS[key]} · {islandCounts[key]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-[24px] border border-amber-900/10 bg-[#fff9e8] px-5 py-4 text-sm font-semibold leading-6 text-[#5f4b1e]">
          <strong>Collection scope:</strong> the Library of Congress lot record describes
          461 photographic prints and 452 indexed records. This page loads every
          digitized item returned by the Library&apos;s public API. Tap any photograph to
          open a large, immersive view and move through the collection.
        </div>

        {loading ? (
          <div className="mt-8 flex items-center justify-center gap-3 rounded-[28px] border border-[#0b4b46]/10 bg-white p-10 text-sm font-black text-[#075e58]">
            <Loader2 className="animate-spin" size={20} /> Loading the complete collection…
            {loadedPages ? ` ${items.length} items loaded` : ""}
          </div>
        ) : null}

        {error ? (
          <div className="mt-8 rounded-[28px] border border-red-200 bg-red-50 p-8 text-center text-sm font-bold text-red-800">
            {error}
          </div>
        ) : null}

        <div className="mt-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.22em] text-amber-700">
              Full online gallery
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-.04em]">
              {visibleItems.length} photographs shown
            </h2>
          </div>
          <p className="hidden text-sm font-semibold text-slate-500 sm:block">
            Tap a photograph to enlarge
          </p>
        </div>

        <div className="mt-6 columns-1 gap-5 sm:columns-2 xl:columns-3">
          {visibleItems.map((item) => {
            const itemIsland = inferIsland(item);
            return (
              <article
                key={item.id}
                className="mb-5 break-inside-avoid overflow-hidden rounded-[26px] border border-[#0b4b46]/10 bg-white shadow-[0_18px_50px_rgba(4,51,49,.08)]"
              >
                <button
                  type="button"
                  onClick={() => setSelectedItem(item)}
                  className="group relative block w-full cursor-zoom-in overflow-hidden text-left"
                  aria-label={`Enlarge ${item.title}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    loading="lazy"
                    className="h-auto w-full bg-[#d9d1c1] object-cover transition duration-500 group-hover:scale-[1.025]"
                  />
                  <span className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-2 text-[9px] font-black uppercase tracking-[.14em] text-white backdrop-blur">
                    <ZoomIn size={13} /> Enlarge
                  </span>
                </button>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[9px] font-black uppercase tracking-[.17em] text-amber-700">
                      {ISLAND_LABELS[itemIsland]}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400">
                      {item.date || "1941"}
                    </span>
                  </div>
                  <h3 className="mt-2 text-xl font-black leading-tight tracking-[-.03em]">
                    {item.title}
                  </h3>
                  {item.location.length ? (
                    <p className="mt-2 text-xs font-bold text-[#075e58]">
                      {item.location.slice(0, 3).join(" · ")}
                    </p>
                  ) : null}
                  <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">
                    {item.creator || "Jack Delano"}
                    {item.reproductionNumber ? ` · ${item.reproductionNumber}` : ""}
                  </p>

                  {item.editorialNote ? (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-900">
                      <strong>VI Guide correction:</strong> {item.editorialNote}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-[#075e58]"
                  >
                    View enlarged image <ZoomIn size={13} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {!loading && !visibleItems.length && !error ? (
          <div className="mt-8 rounded-[28px] border border-dashed border-slate-300 bg-white p-12 text-center">
            <ImageIcon className="mx-auto text-slate-300" size={38} />
            <h2 className="mt-4 text-xl font-black">No photographs match that search</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Try a place, institution, occupation, estate, or island.
            </p>
          </div>
        ) : null}

        <div className="mt-10 rounded-[28px] border border-[#0b4b46]/10 bg-[#043331] p-6 text-white sm:p-8">
          <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#f5c451]">
            Rights and historical context
          </p>
          <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-white/72">
            {metadata?.rightsSummary ||
              "The FSA/OWI black-and-white negatives are public domain. Library of Congress attribution is preserved with every image."}
          </p>
          <p className="mt-4 text-xs font-bold text-white/50">
            Credit: Library of Congress, Prints & Photographs Division, Farm Security
            Administration/Office of War Information Collection. Photographer: Jack Delano.
          </p>
        </div>
      </section>

      {selectedItem ? (
        <div
          className="fixed inset-0 z-[3000] flex items-center justify-center bg-[#031716]/95 p-3 backdrop-blur-md sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={selectedItem.title}
          onClick={() => setSelectedItem(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedItem(null)}
            className="absolute right-4 top-4 z-20 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur hover:bg-black/65"
            aria-label="Close enlarged image"
          >
            <X size={22} />
          </button>

          {visibleItems.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showPrevious();
                }}
                className="absolute left-3 top-1/2 z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur hover:bg-black/65 sm:left-6"
                aria-label="Previous photograph"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showNext();
                }}
                className="absolute right-3 top-1/2 z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur hover:bg-black/65 sm:right-6"
                aria-label="Next photograph"
              >
                <ChevronRight size={28} />
              </button>
            </>
          ) : null}

          <div
            className="flex max-h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#071f1e] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex min-h-0 flex-1 items-center justify-center bg-black/35 p-2 sm:p-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedItem.imageUrl}
                alt={selectedItem.title}
                className="max-h-[72vh] max-w-full object-contain"
              />
            </div>
            <div className="border-t border-white/10 bg-[#071f1e] px-5 py-4 text-white sm:px-7 sm:py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-4xl">
                  <p className="text-[9px] font-black uppercase tracking-[.18em] text-[#f5c451]">
                    {ISLAND_LABELS[inferIsland(selectedItem)]} · {selectedItem.date || "1941"}
                  </p>
                  <h2 className="mt-2 text-xl font-black tracking-[-.03em] sm:text-2xl">
                    {selectedItem.title}
                  </h2>
                  {selectedItem.location.length ? (
                    <p className="mt-2 text-xs font-semibold text-white/60">
                      {selectedItem.location.slice(0, 4).join(" · ")}
                    </p>
                  ) : null}
                </div>
                <p className="text-xs font-bold text-white/45">
                  {selectedIndex + 1} of {visibleItems.length}
                </p>
              </div>
              <p className="mt-3 text-xs font-semibold leading-5 text-white/55">
                {selectedItem.creator || "Jack Delano"}
                {selectedItem.reproductionNumber
                  ? ` · ${selectedItem.reproductionNumber}`
                  : ""}
              </p>
              {selectedItem.editorialNote ? (
                <div className="mt-4 rounded-2xl border border-amber-200/20 bg-amber-50/10 p-3 text-xs font-semibold leading-5 text-amber-100">
                  <strong>VI Guide correction:</strong> {selectedItem.editorialNote}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function inferIsland(item: GalleryItem): Exclude<Island, "all"> {
  const haystack = [item.title, ...item.location, ...item.subjects]
    .join(" ")
    .toLowerCase();

  if (
    haystack.includes("saint thomas") ||
    haystack.includes("st. thomas") ||
    haystack.includes("charlotte amalie")
  ) {
    return "stt";
  }
  if (
    haystack.includes("saint croix") ||
    haystack.includes("st. croix") ||
    haystack.includes("christiansted") ||
    haystack.includes("frederiksted") ||
    haystack.includes("la vallee") ||
    haystack.includes("bethlehem")
  ) {
    return "stx";
  }
  if (
    haystack.includes("saint john") ||
    haystack.includes("st. john") ||
    haystack.includes("cruz bay")
  ) {
    return "stj";
  }
  return "unknown";
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 px-3 py-4 text-center">
      <strong className="block text-lg font-black text-[#f5c451]">{value}</strong>
      <span className="mt-1 block text-[8px] font-black uppercase tracking-[.13em] text-white/45">
        {label}
      </span>
    </div>
  );
}
