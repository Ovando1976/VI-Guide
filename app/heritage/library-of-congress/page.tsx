"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  Image as ImageIcon,
  Landmark,
  Search,
} from "lucide-react";

type Island = "all" | "stt" | "stx" | "stj";

type GalleryItem = {
  id: string;
  title: string;
  island: Exclude<Island, "all">;
  place: string;
  year: string;
  photographer: string;
  imageUrl: string;
  sourceUrl: string;
  digitalId: string;
  category: string;
  description: string;
  editorialNote?: string;
};

const ISLAND_LABELS: Record<Island, string> = {
  all: "All islands",
  stt: "St. Thomas",
  stx: "St. Croix",
  stj: "St. John",
};

const ITEMS: GalleryItem[] = [
  {
    id: "loc-woman-garden",
    title: "Woman in her garden",
    island: "stx",
    place: "St. Croix",
    year: "1941",
    photographer: "Jack Delano",
    imageUrl:
      "https://tile.loc.gov/storage-services/service/pnp/fsac/1a33000/1a33900/1a33973v.jpg",
    sourceUrl: "https://www.loc.gov/item/2017877868/",
    digitalId: "LC-DIG-fsac-1a33973",
    category: "People and daily life",
    description:
      "A color portrait of an island resident in her garden, part of Delano's December 1941 documentation of life in the territory.",
  },
  {
    id: "loc-fort-frederik",
    title: "Inside Fort Frederik",
    island: "stx",
    place: "Frederiksted",
    year: "1941",
    photographer: "Jack Delano",
    imageUrl:
      "https://tile.loc.gov/storage-services/service/pnp/fsac/1a33000/1a33900/1a33985v.jpg",
    sourceUrl: "https://www.loc.gov/item/2017877880/",
    digitalId: "LC-DIG-fsac-1a33985",
    category: "Architecture and public places",
    description:
      "A color view inside Fort Frederik, one of the defining historic structures of Frederiksted.",
    editorialNote:
      "The original agency caption incorrectly called this a French fort. Fort Frederik was built under Danish colonial rule.",
  },
  {
    id: "loc-sugar-mill-color",
    title: "Sugar mill and plantation ruins",
    island: "stx",
    place: "Near Christiansted",
    year: "1941",
    photographer: "Jack Delano",
    imageUrl:
      "https://tile.loc.gov/storage-services/service/pnp/fsac/1a33000/1a33900/1a33953v.jpg",
    sourceUrl: "https://www.loc.gov/item/2017877849/",
    digitalId: "LC-DIG-fsac-1a33953",
    category: "Agriculture and estates",
    description:
      "Color documentation of the ruins of a sugar mill and plantation house near Christiansted.",
  },
  {
    id: "loc-christiansted-street-color",
    title: "Christiansted street scene",
    island: "stx",
    place: "Christiansted",
    year: "1941",
    photographer: "Jack Delano",
    imageUrl:
      "https://tile.loc.gov/storage-services/service/pnp/fsac/1a33000/1a33900/1a33982v.jpg",
    sourceUrl: "https://www.loc.gov/item/2017877877/",
    digitalId: "LC-DIG-fsac-1a33982",
    category: "Towns and streets",
    description:
      "A rare color view of Christiansted's streets and built environment during the early 1940s.",
  },
  {
    id: "loc-cultivating-cane",
    title: "Cultivating sugar cane",
    island: "stx",
    place: "Bethlehem",
    year: "1941",
    photographer: "Jack Delano",
    imageUrl:
      "https://tile.loc.gov/storage-services/service/pnp/fsac/1a33000/1a33900/1a33962v.jpg",
    sourceUrl: "https://www.loc.gov/item/2017877857/",
    digitalId: "LC-DIG-fsac-1a33962",
    category: "Agriculture and labor",
    description:
      "Workers cultivating sugar cane on Virgin Islands Company land near Bethlehem, St. Croix.",
  },
  {
    id: "loc-frederiksted-street-color",
    title: "Frederiksted street",
    island: "stx",
    place: "Frederiksted",
    year: "1941",
    photographer: "Jack Delano",
    imageUrl:
      "https://tile.loc.gov/storage-services/service/pnp/fsac/1a33000/1a33900/1a33929v.jpg",
    sourceUrl: "https://www.loc.gov/item/2017877900/",
    digitalId: "LC-DIG-fsac-1a33929",
    category: "Towns and streets",
    description:
      "A color street view in Frederiksted showing the town's historic scale, architecture, and everyday activity.",
  },
  {
    id: "loc-christiansted-harbor",
    title: "Christiansted Harbor",
    island: "stx",
    place: "Christiansted",
    year: "1941",
    photographer: "Jack Delano",
    imageUrl:
      "https://tile.loc.gov/storage-services/service/pnp/fsa/8a37000/8a37600/8a37605v.jpg",
    sourceUrl: "https://www.loc.gov/item/2017751331/",
    digitalId: "LC-DIG-fsa-8a37605",
    category: "Harbors and maritime life",
    description:
      "A broad view of Christiansted Harbor, documenting the relationship between the waterfront and the town.",
  },
  {
    id: "loc-charlotte-amalie-main-street",
    title: "Along the main street",
    island: "stt",
    place: "Charlotte Amalie",
    year: "1941",
    photographer: "Jack Delano",
    imageUrl:
      "https://tile.loc.gov/storage-services/service/pnp/fsa/8a37000/8a37800/8a37899v.jpg",
    sourceUrl: "https://www.loc.gov/item/2017751623/",
    digitalId: "LC-DIG-fsa-8a37899",
    category: "Towns and streets",
    description:
      "Charlotte Amalie's main street in December 1941, showing commercial life, pedestrians, and the urban streetscape.",
  },
  {
    id: "loc-charlotte-amalie-corner",
    title: "At a street corner",
    island: "stt",
    place: "Charlotte Amalie",
    year: "1941",
    photographer: "Jack Delano",
    imageUrl:
      "https://tile.loc.gov/storage-services/service/pnp/fsa/8a38000/8a38100/8a38110v.jpg",
    sourceUrl: "https://www.loc.gov/item/2017751831/",
    digitalId: "LC-DIG-fsa-8a38110",
    category: "People and daily life",
    description:
      "Residents gathered at a Charlotte Amalie street corner, preserving a candid view of public life in the capital.",
  },
  {
    id: "loc-sugar-mill-black-white",
    title: "Ruins of an old sugar mill",
    island: "stx",
    place: "Near Christiansted",
    year: "1941",
    photographer: "Jack Delano",
    imageUrl:
      "https://tile.loc.gov/storage-services/service/pnp/fsa/8c07000/8c07900/8c07919v.jpg",
    sourceUrl: "https://www.loc.gov/item/2017797234/",
    digitalId: "LC-DIG-fsa-8c07919",
    category: "Agriculture and estates",
    description:
      "A black-and-white view of plantation and sugar-mill ruins in the Christiansted area.",
  },
  {
    id: "loc-la-vallee-village",
    title: "Village of La Vallee",
    island: "stx",
    place: "La Vallee",
    year: "1941",
    photographer: "Jack Delano",
    imageUrl:
      "https://tile.loc.gov/storage-services/service/pnp/fsa/8c07000/8c07900/8c07986v.jpg",
    sourceUrl: "https://www.loc.gov/item/2017797302/",
    digitalId: "LC-DIG-fsa-8c07986",
    category: "Communities and housing",
    description:
      "The historic village of La Vallee, documented by the FSA/OWI project in December 1941.",
    editorialNote:
      "The Library's historical title uses period terminology. VI Guide presents the image with respectful modern context while preserving the source record.",
  },
  {
    id: "loc-la-vallee-meeting",
    title: "Community meeting at La Vallee",
    island: "stx",
    place: "La Vallee",
    year: "1941",
    photographer: "Jack Delano",
    imageUrl:
      "https://tile.loc.gov/storage-services/service/pnp/fsa/8c08000/8c08000/8c08022v.jpg",
    sourceUrl: "https://www.loc.gov/item/2017797339/",
    digitalId: "LC-DIG-fsa-8c08022",
    category: "Community and public life",
    description:
      "Residents attending a Farm Security Administration group meeting in La Vallee.",
  },
  {
    id: "loc-women-park",
    title: "Women in the park",
    island: "stt",
    place: "Charlotte Amalie",
    year: "1941",
    photographer: "Jack Delano",
    imageUrl:
      "https://tile.loc.gov/storage-services/service/pnp/fsa/8c29000/8c29200/8c29291v.jpg",
    sourceUrl: "https://www.loc.gov/item/2017797791/",
    digitalId: "LC-DIG-fsa-8c29291",
    category: "People and daily life",
    description:
      "Women gathered in a Charlotte Amalie park, part of the 1941 photographic record of territorial life.",
  },
  {
    id: "loc-charlotte-amalie-hospital",
    title: "The hospital",
    island: "stt",
    place: "Charlotte Amalie",
    year: "1941",
    photographer: "Jack Delano",
    imageUrl:
      "https://tile.loc.gov/storage-services/service/pnp/fsa/8c35000/8c35500/8c35565v.jpg",
    sourceUrl: "https://www.loc.gov/item/2017797538/",
    digitalId: "LC-DIG-fsa-8c35565",
    category: "Health and public institutions",
    description:
      "The territorial hospital in Charlotte Amalie, photographed as part of Delano's documentation of public institutions.",
  },
];

export default function LibraryOfCongressGalleryPage() {
  const [island, setIsland] = useState<Island>("all");
  const [query, setQuery] = useState("");

  const visibleItems = useMemo(() => {
    const term = query.trim().toLowerCase();
    return ITEMS.filter((item) => {
      const matchesIsland = island === "all" || item.island === island;
      const haystack = [
        item.title,
        item.place,
        item.category,
        item.description,
        item.photographer,
      ]
        .join(" ")
        .toLowerCase();
      return matchesIsland && (!term || haystack.includes(term));
    });
  }, [island, query]);

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
                The territory in photographs, 1941.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-white/72 sm:text-lg">
                A curated window into St. Thomas and St. Croix through Jack Delano's
                Farm Security Administration and Office of War Information photographs.
                This is one archival source inside VI Guide's broader, locally led heritage collection.
              </p>
            </div>

            <div className="rounded-[26px] border border-white/12 bg-white/[.08] p-5 text-sm text-white/70 backdrop-blur">
              <strong className="block text-3xl font-black text-[#f5c451]">{ITEMS.length}</strong>
              <span className="mt-1 block text-[10px] font-black uppercase tracking-[.16em]">
                curated records
              </span>
              <p className="mt-4 max-w-xs leading-6">
                Public-domain FSA/OWI photographs with item-level source links and editorial corrections.
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        <div className="rounded-[28px] border border-[#0b4b46]/10 bg-white p-4 shadow-[0_18px_45px_rgba(4,51,49,.08)] sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <label className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#075e58]/45"
                size={19}
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search people, places, streets, agriculture, public life…"
                className="h-13 w-full rounded-2xl border border-slate-200 bg-[#fbfaf6] py-3 pl-11 pr-4 text-sm font-semibold outline-none focus:border-teal-600/40 focus:ring-4 focus:ring-teal-600/10"
              />
            </label>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {(Object.keys(ISLAND_LABELS) as Island[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setIsland(key)}
                  className={`whitespace-nowrap rounded-full px-4 py-3 text-xs font-black transition ${
                    island === key
                      ? "bg-[#043331] text-white"
                      : "border border-slate-200 bg-[#fbfaf6] text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {ISLAND_LABELS[key]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-7 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.2em] text-amber-700">
              Curated archive gallery
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-[-.035em] sm:text-3xl">
              {visibleItems.length} photographs
            </h2>
          </div>
          <a
            href="https://www.loc.gov/item/13655408/"
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-2 text-[10px] font-black uppercase tracking-[.15em] text-[#075e58] sm:inline-flex"
          >
            Open full LOC group <ExternalLink size={14} />
          </a>
        </div>

        <div className="mt-5 columns-1 gap-5 sm:columns-2 xl:columns-3">
          {visibleItems.map((item) => (
            <article
              key={item.id}
              className="mb-5 break-inside-avoid overflow-hidden rounded-[26px] border border-[#0b4b46]/10 bg-white shadow-[0_18px_50px_rgba(4,51,49,.08)]"
            >
              <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="group block">
                <div className="relative overflow-hidden bg-[#123f3c]">
                  {/* The Library of Congress supplies these public-domain presentation files. */}
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    loading="lazy"
                    className="h-auto w-full transition duration-500 group-hover:scale-[1.02]"
                  />
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.12em] text-white backdrop-blur">
                    View source <ExternalLink size={11} />
                  </span>
                </div>
              </a>

              <div className="p-5">
                <div className="flex flex-wrap items-center gap-2 text-[9px] font-black uppercase tracking-[.14em]">
                  <span className="rounded-full bg-[#e4f2ee] px-3 py-1.5 text-[#075e58]">
                    {ISLAND_LABELS[item.island]}
                  </span>
                  <span className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-800">
                    {item.category}
                  </span>
                </div>

                <h3 className="mt-4 text-xl font-black tracking-[-.03em]">{item.title}</h3>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {item.place} · {item.year} · {item.photographer}
                </p>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                  {item.description}
                </p>

                {item.editorialNote ? (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-900">
                    <strong className="block text-[9px] font-black uppercase tracking-[.14em]">
                      VI Guide editorial note
                    </strong>
                    <span className="mt-1 block">{item.editorialNote}</span>
                  </div>
                ) : null}

                <div className="mt-4 border-t border-slate-100 pt-4 text-[10px] leading-5 text-slate-500">
                  <strong className="text-slate-700">Credit:</strong> Library of Congress,
                  Prints &amp; Photographs Division, FSA/OWI Collection. {item.digitalId}.
                </div>
              </div>
            </article>
          ))}
        </div>

        {!visibleItems.length ? (
          <div className="mt-8 rounded-[28px] border border-dashed border-slate-300 bg-white p-12 text-center">
            <ImageIcon className="mx-auto text-slate-300" size={40} />
            <h2 className="mt-4 text-xl font-black">No photographs match that search</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Try another place, topic, or island.
            </p>
          </div>
        ) : null}

        <section className="mt-10 rounded-[28px] border border-[#0b4b46]/10 bg-[#043331] p-6 text-white sm:p-8">
          <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#f5c451]">
            Collection context
          </p>
          <h2 className="mt-3 text-2xl font-black tracking-[-.035em]">
            An important archive—not the whole Virgin Islands story.
          </h2>
          <p className="mt-4 max-w-4xl text-sm font-semibold leading-7 text-white/70">
            The Library of Congress group contains hundreds of 1941 photographs covering harbors,
            towns, schools, clinics, agriculture, labor, celebrations, government, housing, and portraits
            of island residents. VI Guide will preserve this material with accurate attribution while also
            expanding the heritage experience with territorial archives, family collections, oral histories,
            governors, and unsung heroes.
          </p>
        </section>
      </section>
    </main>
  );
}
