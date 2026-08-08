"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Clock3,
  Crown,
  Images,
  Landmark,
  Map,
  MapPin,
  Search,
} from "lucide-react";

import type { DirectoryItem } from "@/types/directory";

const ISLANDS = {
  all: "All islands",
  stt: "St. Thomas",
  stj: "St. John",
  stx: "St. Croix",
} as const;

type IslandFilter = keyof typeof ISLANDS;

const MODULES = [
  {
    title: "Historic places",
    imageTerms: ["fort", "estate", "church", "historic"],
    text: "Forts, estates, churches, districts, ruins, and cultural landscapes.",
    icon: Landmark,
    state: "Live",
    href: "/historic",
  },
  {
    title: "Governors",
    imageTerms: ["government house", "governor", "legislature", "administration"],
    text: "Follow naval, appointed, acting, and elected administrations from 1917 to today.",
    icon: Crown,
    state: "Live",
    href: "/heritage/governors",
  },
  {
    title: "Library of Congress gallery",
    imageTerms: ["charlotte amalie", "frederiksted", "christiansted", "archive"],
    text: "Explore the complete digitized 1941 U.S. Virgin Islands photographic collection.",
    icon: Images,
    state: "Live",
    href: "/heritage/library-of-congress",
  },
  {
    title: "Territory timeline",
    imageTerms: ["fort christian", "ruins", "plantation", "century"],
    text: "Move through eras, events, people, resistance, government, storms, and changing island life.",
    icon: Clock3,
    state: "Next",
    href: "/heritage/timeline",
  },
  {
    title: "Heritage map",
    imageTerms: ["estate", "district", "landscape", "quarter"],
    text: "Explore historic places and cultural context on the same territory map used throughout VI Guide.",
    icon: Map,
    state: "Live",
    href: "/map?filter=history",
  },
  {
    title: "Heritage search",
    imageTerms: ["synagogue", "church", "museum", "landmark"],
    text: "Search places, events, governors, estates, people, and source-backed historical knowledge.",
    icon: Search,
    state: "Live",
    href: "/search?type=heritage",
  },
  {
    title: "Ask the Heritage Guide",
    imageTerms: ["museum", "historic", "culture", "heritage"],
    text: "Ask what happened here, compare eras, or build a history-focused island experience.",
    icon: BookOpen,
    state: "Live",
    href: "/concierge?context=heritage",
  },
] as const;

export function HeritageExplorer({ items }: { items: DirectoryItem[] }) {
  const [query, setQuery] = useState("");
  const [island, setIsland] = useState<IslandFilter>("all");
  const [failedImages, setFailedImages] = useState<Set<string>>(() => new Set());
  const photoReadyItems = useMemo(
    () =>
      items.filter(
        (item) =>
          Boolean(item.heroImage) &&
          !item.heroImage.includes("/placeholder") &&
          item.imageStatus !== "pending" &&
          !failedImages.has(item.heroImage),
      ),
    [failedImages, items],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    return photoReadyItems.filter((item) => {
      const matchesIsland = island === "all" || item.island === island;
      const haystack = [
        item.name,
        item.category,
        item.description,
        item.address,
        ...item.tags,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesIsland && (!term || haystack.includes(term));
    });
  }, [island, photoReadyItems, query]);

  const featured = filtered.slice(0, 12);
  const moduleImages = useMemo(() => {
    const candidates = photoReadyItems;
    const used = new Set<string>();

    return MODULES.map((module, index) => {
      const ranked = candidates
        .filter((item) => !used.has(item.heroImage))
        .map((item) => {
          const subject = [
            item.name,
            item.category,
            item.description,
            ...item.tags,
          ]
            .join(" ")
            .toLowerCase();

          return {
            item,
            score: Array.from(module.imageTerms).reduce(
              (total, term) => total + (subject.includes(term) ? 1 : 0),
              0,
            ),
          };
        })
        .sort((left, right) => right.score - left.score);

      const selected =
        ranked.find(({ score }) => score > 0)?.item ??
        ranked[0]?.item ??
        candidates[index % Math.max(candidates.length, 1)];

      if (selected?.heroImage) {
        used.add(selected.heroImage);
      }

      return selected?.heroImage ?? "";
    });
  }, [photoReadyItems]);

  return (
    <main className="min-h-screen bg-[#f7f2e7] pb-36 text-[#082f2d]">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_18%_12%,rgba(245,196,81,.25),transparent_28%),radial-gradient(circle_at_84%_18%,rgba(45,212,191,.16),transparent_30%),linear-gradient(145deg,#032d2c,#074b4a_54%,#08282f)] text-white">
        <div className="absolute inset-0 opacity-[.12] [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:46px_46px]" />
        <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-10 sm:px-8 lg:px-10 lg:pb-24 lg:pt-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-100/20 bg-amber-50/10 px-4 py-2 text-[10px] font-black uppercase tracking-[.22em] text-amber-100 backdrop-blur">
            <Landmark size={14} /> U.S. Virgin Islands Heritage
          </span>

          <div className="mt-12 grid items-end gap-10 lg:grid-cols-[1.25fr_.75fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[.28em] text-[#f5c451]">
                The territory remembers
              </p>
              <h1 className="mt-4 max-w-4xl text-4xl font-black leading-[.94] tracking-[-.055em] sm:text-6xl lg:text-7xl">
                One connected guide to Virgin Islands place, people, and memory.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-white/72 sm:text-lg">
                Heritage connects historic places, governors, archival photographs, the
                territory timeline, maps, search, transportation, and the VI Concierge.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/12 bg-white/[.08] p-5 shadow-2xl backdrop-blur-xl">
              <p className="text-[10px] font-black uppercase tracking-[.2em] text-white/45">
                Connected territory knowledge
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Stat value={String(items.length)} label="Sites" />
                <Stat value="461" label="LOC prints" />
                <Stat value="1" label="Guide" />
              </div>
              <p className="mt-4 text-sm leading-6 text-white/60">
                Start anywhere, then move naturally between stories, photographs, maps,
                nearby places, rides, and concierge guidance.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {MODULES.map(({ title, text, icon: Icon, state, href }, index) => (
            <Link
              key={title}
              href={href}
              className="group overflow-hidden rounded-[26px] border border-[#0b4b46]/10 bg-white shadow-[0_18px_50px_rgba(4,51,49,.09)] transition hover:-translate-y-1 hover:shadow-[0_26px_65px_rgba(4,51,49,.16)]"
            >
              <div className="relative h-44 overflow-hidden bg-[#0b4b46]">
                {moduleImages[index] ? (
                  <Image
                    src={moduleImages[index]}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                    onError={() => {
                      const failedImage = moduleImages[index];

                      if (!failedImage) return;

                      setFailedImages((current) => {
                        if (current.has(failedImage)) return current;

                        const next = new Set(current);
                        next.add(failedImage);
                        return next;
                      });
                    }}
                  />
                ) : null}
                <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,45,44,.08),rgba(3,45,44,.82))]" />
                <span className="absolute inset-x-0 top-0 flex items-start justify-between gap-4 p-4">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/30 bg-white/90 text-[#075e58] shadow-lg backdrop-blur">
                    <Icon size={21} />
                  </span>
                  <span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[.14em] shadow-lg ${
                    state === "Live"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-[#f6e7b5] text-[#72520b]"
                  }`}>
                    {state}
                  </span>
                </span>
                <span className="absolute bottom-4 left-5 text-[9px] font-black uppercase tracking-[.16em] text-[#f5c451]">
                  U.S. Virgin Islands heritage
                </span>
              </div>
              <div className="p-5">
                <h2 className="text-xl font-black tracking-[-.03em]">{title}</h2>
                <p className="mt-2 min-h-[4.5rem] text-sm font-semibold leading-6 text-slate-600">{text}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.15em] text-[#075e58]">
                  Open <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-5 rounded-[30px] border border-[#0b4b46]/10 bg-white p-5 shadow-sm sm:p-7 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#075e58]/45" size={20} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search forts, estates, churches, districts, ruins…"
              className="h-14 w-full rounded-2xl border border-slate-200 bg-[#fbfaf6] pl-12 pr-4 text-sm font-semibold outline-none focus:border-teal-600/40 focus:ring-4 focus:ring-teal-600/10"
            />
          </label>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {(Object.keys(ISLANDS) as IslandFilter[]).map((key) => (
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
                {ISLANDS[key]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.22em] text-amber-700">
              Historic places
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-.04em]">
              Start with the places around you
            </h2>
          </div>
          <Link
            href="/historic"
            className="hidden items-center gap-2 text-xs font-black uppercase tracking-[.16em] text-[#075e58] sm:inline-flex"
          >
            View complete catalog <ArrowRight size={15} />
          </Link>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {featured.map((item) => (
            <Link
              key={item.id}
              href={`/historic/${item.slug}`}
              className="group overflow-hidden rounded-[28px] border border-[#0b4b46]/10 bg-white shadow-[0_20px_60px_rgba(4,51,49,.09)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(4,51,49,.14)]"
            >
              <div className="relative h-48 overflow-hidden bg-[#0b4b46]">
                <Image
                  src={item.heroImage}
                  alt={`${item.name} in ${ISLANDS[item.island]}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className="object-cover transition duration-500 group-hover:scale-[1.025]"
                  onError={() => {
                    setFailedImages((current) => {
                      if (current.has(item.heroImage)) return current;

                      const next = new Set(current);
                      next.add(item.heroImage);
                      return next;
                    });
                  }}
                />
                <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,51,49,.02),rgba(4,51,49,.48))]" />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-[.18em] text-amber-700">
                    {ISLANDS[item.island]}
                  </p>
                  <MapPin size={16} className="text-[#075e58]" />
                </div>
                <h3 className="mt-2 text-2xl font-black tracking-[-.035em]">{item.name}</h3>
                <p className="mt-3 line-clamp-3 text-sm font-semibold leading-6 text-slate-600">
                  {item.description}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.17em] text-[#075e58]">
                  Explore this place <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {!featured.length ? (
          <div className="mt-8 rounded-[28px] border border-dashed border-slate-300 bg-white p-12 text-center">
            <Landmark className="mx-auto text-slate-300" size={38} />
            <h2 className="mt-4 text-xl font-black">No heritage places match that search</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Try a site name, island, estate, or category.
            </p>
          </div>
        ) : null}

        <section className="mt-12 overflow-hidden rounded-[30px] border border-[#0b4b46]/10 bg-[linear-gradient(135deg,#043331,#075e58)] p-6 text-white shadow-[0_24px_70px_rgba(4,51,49,.18)] sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#f5c451]">
                Complete photographic archive
              </p>
              <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-[-.04em] sm:text-4xl">
                Open the full 1941 Library of Congress Virgin Islands collection.
              </h2>
              <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-white/70">
                Browse the complete digitized collection, search its captions and places,
                and preserve the original source record alongside VI Guide corrections.
              </p>
            </div>
            <Link
              href="/heritage/library-of-congress"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f5c451] px-6 py-4 text-[10px] font-black uppercase tracking-[.18em] text-[#043331] transition hover:brightness-105"
            >
              Open complete gallery <ArrowRight size={15} />
            </Link>
          </div>
        </section>

        <Link
          href="/historic"
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#043331] px-5 py-4 text-[10px] font-black uppercase tracking-[.18em] text-white sm:hidden"
        >
          View complete catalog <ArrowRight size={15} />
        </Link>
      </section>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 px-3 py-4">
      <strong className="block text-lg font-black text-[#f5c451]">{value}</strong>
      <span className="mt-1 block text-[9px] font-black uppercase tracking-[.16em] text-white/45">
        {label}
      </span>
    </div>
  );
}
