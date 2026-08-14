import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Compass,
  Landmark,
  MapPinned,
  MessageCircleMore,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";
import {
  COMMUNITY_STORIES,
  islandLabel,
} from "@/lib/community-stories";

const ISLAND_STORIES = [
  {
    code: "STT",
    name: "St. Thomas",
    line: "Harbor neighborhoods, food, music, history, and the everyday life behind the visitor map.",
    image: "/images/usvi-harbor-hero.jpg",
    href: "/map?island=stt",
  },
  {
    code: "STJ",
    name: "St. John",
    line: "Cruz Bay, Coral Bay, park communities, trails, coves, and the people who connect them.",
    image: "/images/places/st-john/trunk-bay-overlook-1.jpg",
    href: "/map?island=stj",
  },
  {
    code: "STX",
    name: "St. Croix",
    line: "Christiansted, Frederiksted, foodways, heritage, coastlines, and a deeper island rhythm.",
    image: "/images/places/st-croix/cane-bay-beach-1.jpg",
    href: "/map?island=stx",
  },
] as const;

const COMMUNITY_LAYERS = [
  {
    icon: MessageCircleMore,
    title: "Local field notes",
    copy: "Short, useful stories about places, customs, timing, neighborhoods, and what travelers should understand before they arrive.",
  },
  {
    icon: Landmark,
    title: "Heritage in context",
    copy: "Connect community memory to the historic sites, archival material, estates, and cultural landscapes already inside USVI Explorer.",
  },
  {
    icon: Compass,
    title: "Stories you can act on",
    copy: "Community knowledge should lead somewhere useful: a map location, a respectful visit, a trip stop, a local business, or a better question for Concierge.",
  },
] as const;

export default function CommunityPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f0e6] pb-32 text-[#032f2d]">
      <section className="relative isolate overflow-hidden bg-[#032f2d] px-4 pb-12 pt-5 text-white sm:px-7 lg:px-10 lg:pb-16">
        <Image
          src="/images/usvi-harbor-hero.jpg"
          alt="Charlotte Amalie harbor and hillside communities in St. Thomas"
          fill
          priority
          sizes="100vw"
          className="-z-30 object-cover object-[68%_center]"
        />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(2,31,29,.98)_0%,rgba(3,47,45,.93)_43%,rgba(3,47,45,.54)_76%,rgba(3,47,45,.24)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_18%,rgba(115,227,217,.2),transparent_27%),linear-gradient(180deg,rgba(2,31,29,.06),rgba(2,31,29,.5))]" />

        <ViPublicHeader
          actionHref="/concierge?prompt=Help%20me%20understand%20the%20local%20culture%20and%20community%20context%20for%20my%20Virgin%20Islands%20trip"
          actionLabel="Ask Concierge"
          actionIcon={Sparkles}
          secondaryHref="/"
          secondaryLabel="Home"
        />

        <div className="mx-auto grid max-w-7xl gap-10 pb-3 pt-14 lg:grid-cols-[1.08fr_.92fr] lg:items-end lg:gap-14 lg:pt-24">
          <div>
            <div className="vi-eyebrow inline-flex items-center gap-2 rounded-full border border-[#f5c451]/30 bg-[#f5c451]/10 px-4 py-2 text-[#f9d875] backdrop-blur-xl">
              <UsersRound size={14} /> Community · local context
            </div>
            <h1 className="vi-display mt-7 max-w-4xl text-[clamp(3.7rem,8vw,7rem)] font-bold leading-[.84] text-white">
              Know the islands
              <span className="block italic text-[#73e3d9]">beyond the itinerary.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base font-semibold leading-7 text-white/76 sm:text-xl sm:leading-8">
              USVI Explorer Community connects source-backed field notes, cultural context,
              neighborhood knowledge, and traveler decisions directly to the map and the trip.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="#field-notes"
                className="inline-flex min-h-13 items-center gap-2 rounded-full bg-[#f5c451] px-6 py-3.5 text-[10px] font-black uppercase tracking-[.16em] text-[#032f2d] shadow-[0_16px_40px_rgba(245,196,81,.24)] transition hover:-translate-y-0.5 hover:bg-[#ffdc76]"
              >
                Read field notes <ArrowRight size={15} />
              </Link>
              <Link
                href="/heritage"
                className="vi-glass inline-flex min-h-13 items-center gap-2 rounded-full px-6 py-3.5 text-[10px] font-black uppercase tracking-[.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/[.16]"
              >
                <Landmark size={17} className="text-[#73e3d9]" /> Explore heritage
              </Link>
            </div>
          </div>

          <aside className="vi-glass rounded-[32px] p-6 sm:p-7">
            <div className="vi-eyebrow text-[#f5c451]">Publishing status</div>
            <h2 className="vi-display mt-3 text-3xl font-bold text-white sm:text-4xl">
              Local publishing is live — and deliberately curated.
            </h2>
            <p className="mt-4 text-sm font-semibold leading-6 text-white/62">
              Community starts with place-connected notes that help a traveler understand
              geography, timing, history, and context before adding more noise to the feed.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-2">
              <StatusStat value={String(COMMUNITY_STORIES.length)} label="field notes" />
              <StatusStat value="3" label="islands" />
              <StatusStat value="1" label="shared map" />
            </div>
          </aside>
        </div>
      </section>

      <section id="field-notes" className="scroll-mt-6 px-4 py-10 sm:px-7 lg:px-10 lg:py-14">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="vi-eyebrow text-[#0f766e]">Published field notes</div>
            <h2 className="vi-display mt-3 text-4xl font-bold leading-[.95] sm:text-5xl">
              Start with context you can use today.
            </h2>
            <p className="mt-4 text-sm font-semibold leading-7 text-[#607370] sm:text-base">
              Each note is tied to a real place, an explicit source, the Living Map,
              Concierge, and My Trip so reading immediately improves the travel plan.
            </p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {COMMUNITY_STORIES.map((story) => (
              <Link
                key={story.id}
                href={`/community/${story.slug}`}
                className="group flex min-h-[30rem] flex-col overflow-hidden rounded-[32px] border border-[#d9e6e2] bg-[#fffdf8] shadow-[0_18px_50px_rgba(3,47,45,.1)] transition hover:-translate-y-1 hover:border-[#aad7d0] hover:shadow-[0_28px_70px_rgba(3,47,45,.16)]"
              >
                <div className="relative min-h-64 overflow-hidden bg-[#032f2d]">
                  <Image
                    src={story.image}
                    alt={story.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,31,29,.08),rgba(2,31,29,.78))]" />
                  <span className="absolute inset-x-5 bottom-5 text-white">
                    <span className="text-[8px] font-black uppercase tracking-[.18em] text-[#f5c451]">
                      {islandLabel(story.island)} · community field note
                    </span>
                    <strong className="vi-display mt-2 block text-3xl font-bold leading-[.95]">
                      {story.placeName}
                    </strong>
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="vi-display text-3xl font-bold leading-[.96] tracking-[-.04em]">
                    {story.title}
                  </h3>
                  <p className="mt-4 flex-1 text-sm font-semibold leading-7 text-[#607370]">
                    {story.summary}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.15em] text-[#0f766e]">
                    Read the field note <ArrowRight size={15} className="transition group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-10 sm:px-7 lg:px-10 lg:pb-14">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="vi-eyebrow text-[#0f766e]">Start with place</div>
            <h2 className="vi-display mt-3 text-4xl font-bold leading-[.95] sm:text-5xl">
              Every community story belongs somewhere.
            </h2>
            <p className="mt-4 text-sm font-semibold leading-7 text-[#607370] sm:text-base">
              Choose an island to move directly into its Living Map. Community notes use
              these island views as the geographic spine for stories, businesses, heritage,
              and local recommendations.
            </p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {ISLAND_STORIES.map((island) => (
              <Link
                key={island.code}
                href={island.href}
                className="group relative min-h-[25rem] overflow-hidden rounded-[32px] border border-white/40 text-white shadow-[0_18px_50px_rgba(3,47,45,.14)] transition hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(3,47,45,.2)]"
              >
                <Image
                  src={island.image}
                  alt={`${island.name} in the U.S. Virgin Islands`}
                  fill
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className="object-cover transition duration-700 group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,31,29,.06)_18%,rgba(2,31,29,.38)_58%,rgba(2,31,29,.96)_100%)]" />
                <span className="relative flex min-h-[25rem] flex-col justify-end p-6 sm:p-7">
                  <span className="inline-flex w-fit rounded-full bg-[#f5c451] px-3 py-1.5 text-[8px] font-black uppercase tracking-[.16em] text-[#032f2d]">
                    {island.code} · island community
                  </span>
                  <strong className="vi-display mt-4 text-4xl font-bold">{island.name}</strong>
                  <span className="mt-3 block text-sm font-semibold leading-6 text-white/72">
                    {island.line}
                  </span>
                  <span className="mt-5 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.16em] text-[#f8d77c]">
                    Explore this island <ArrowRight size={15} />
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-10 sm:px-7 lg:px-10 lg:pb-14">
        <div className="mx-auto max-w-7xl rounded-[36px] bg-[#032f2d] p-6 text-white shadow-[0_24px_70px_rgba(3,47,45,.16)] sm:p-9 lg:p-11">
          <div className="grid gap-8 lg:grid-cols-[.82fr_1.18fr] lg:items-center">
            <div>
              <div className="vi-eyebrow text-[#f5c451]">The community layer</div>
              <h2 className="vi-display mt-3 text-4xl font-bold leading-[.95] sm:text-5xl">
                Not another feed. A local intelligence layer.
              </h2>
              <p className="mt-4 text-sm font-semibold leading-7 text-white/62">
                The goal is useful local context that strengthens discovery, planning,
                mobility, and cultural understanding across the rest of USVI Explorer.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {COMMUNITY_LAYERS.map(({ icon: Icon, title, copy }) => (
                <article key={title} className="rounded-[26px] border border-white/10 bg-white/[.07] p-5">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#73e3d9]/12 text-[#73e3d9]">
                    <Icon size={19} />
                  </span>
                  <h3 className="mt-5 text-lg font-black">{title}</h3>
                  <p className="mt-2 text-xs font-semibold leading-6 text-white/58">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-7 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 rounded-[34px] border border-[#d9e6e2] bg-[#fffdf8] p-6 shadow-[0_18px_50px_rgba(3,47,45,.08)] sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <div className="vi-eyebrow text-[#0f766e]">Need local context now?</div>
            <h2 className="vi-display mt-2 text-3xl font-bold">Ask the Concierge with your trip attached.</h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#607370]">
              Ask about etiquette, neighborhoods, history, timing, transportation, or how a place fits into the day you are already building.
            </p>
          </div>
          <Link
            href="/concierge?prompt=Give%20me%20local%20community%20and%20cultural%20context%20for%20the%20places%20in%20my%20Virgin%20Islands%20trip"
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[#032f2d] px-6 text-[9px] font-black uppercase tracking-[.15em] text-white transition hover:-translate-y-0.5 hover:bg-[#075e58]"
          >
            <Sparkles size={16} className="text-[#73e3d9]" /> Ask VI Concierge
          </Link>
        </div>
      </section>
    </main>
  );
}

function StatusStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white/[.08] px-3 py-4 text-center">
      <strong className="vi-display block text-2xl font-bold text-white">{value}</strong>
      <span className="mt-1 block text-[8px] font-black uppercase tracking-[.14em] text-white/48">{label}</span>
    </div>
  );
}
