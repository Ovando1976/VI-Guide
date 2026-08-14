import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  MapPinned,
  Route,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";
import { AddToJourneyButton } from "@/components/journey/add-to-journey-button";
import {
  COMMUNITY_STORIES,
  getCommunityStory,
  islandLabel,
} from "@/lib/community-stories";

type Props = { params: Promise<{ postId: string }> };

export function generateStaticParams() {
  return COMMUNITY_STORIES.map((story) => ({ postId: story.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { postId } = await params;
  const story = getCommunityStory(postId);
  if (!story) return { title: "Community | USVI Explorer" };

  return {
    title: `${story.title} | USVI Explorer Community`,
    description: story.summary,
  };
}

export default async function CommunityPostPage({ params }: Props) {
  const { postId } = await params;
  const story = getCommunityStory(postId);
  if (!story) notFound();

  const island = islandLabel(story.island);
  const storyHref = `/community/${story.slug}`;
  const conciergePrompt = [
    `Help me use this USVI Explorer community field note about ${story.placeName} on ${island}.`,
    story.summary,
    "Connect it to realistic timing, transportation, nearby places, cultural context, and the rest of my trip.",
  ].join(" ");
  const journeyStop = {
    id: story.id,
    title: story.placeName,
    island: story.island,
    kind: "community context",
    summary: story.summary,
    href: storyHref,
    mapHref: story.mapHref,
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f0e6] pb-32 text-[#032f2d]">
      <section className="relative isolate overflow-hidden bg-[#032f2d] px-4 pb-14 pt-5 text-white sm:px-7 lg:px-10">
        <Image
          src={story.image}
          alt={story.imageAlt}
          fill
          priority
          sizes="100vw"
          className="-z-30 object-cover object-center"
        />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(2,31,29,.98),rgba(3,47,45,.9)_56%,rgba(3,47,45,.42))]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(2,31,29,.05),rgba(2,31,29,.62))]" />

        <ViPublicHeader
          actionHref={`/concierge?island=${story.island}&prompt=${encodeURIComponent(conciergePrompt)}`}
          actionLabel="Ask Concierge"
          actionIcon={Sparkles}
          secondaryHref="/community"
          secondaryLabel="Community"
        />

        <div className="mx-auto max-w-5xl pb-6 pt-16 lg:pt-24">
          <div className="vi-eyebrow text-[#f5c451]">{story.eyebrow}</div>
          <h1 className="vi-display mt-4 max-w-4xl text-5xl font-bold leading-[.9] sm:text-7xl">
            {story.title}
          </h1>
          <p className="mt-6 max-w-3xl text-base font-semibold leading-7 text-white/72 sm:text-lg">
            {story.summary}
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            {story.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/14 bg-white/[.08] px-3 py-2 text-[8px] font-black uppercase tracking-[.14em] text-white/72 backdrop-blur"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-7 lg:px-10 lg:py-12">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/community"
            className="inline-flex items-center gap-2 rounded-full border border-[#d9e6e2] bg-[#fffdf8] px-4 py-2 text-[9px] font-black uppercase tracking-[.15em] shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" /> All field notes
          </Link>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.08fr_.92fr]">
            <article className="rounded-[34px] border border-[#d9e6e2] bg-[#fffdf8] p-6 shadow-[0_18px_50px_rgba(3,47,45,.08)] sm:p-9">
              <div className="vi-eyebrow text-[#0f766e]">Read the place</div>
              <div className="mt-5 space-y-6 text-base font-semibold leading-8 text-[#526865]">
                {story.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>

              <div className="mt-8 border-t border-[#e1ebe8] pt-7">
                <p className="text-[9px] font-black uppercase tracking-[.16em] text-[#0f766e]">
                  Make the context actionable
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <AddToJourneyButton stop={journeyStop} />
                  <Link
                    href={story.mapHref}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#d9e6e2] bg-white px-5 text-[9px] font-black uppercase tracking-[.14em] text-[#032f2d]"
                  >
                    <MapPinned className="h-4 w-4 text-[#0f766e]" /> Open Living Map
                  </Link>
                  <Link
                    href="/trips"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#d9e6e2] bg-white px-5 text-[9px] font-black uppercase tracking-[.14em] text-[#032f2d]"
                  >
                    <Route className="h-4 w-4 text-[#0f766e]" /> My Trip
                  </Link>
                </div>
              </div>
            </article>

            <aside className="space-y-5">
              <section className="rounded-[30px] bg-[#032f2d] p-6 text-white shadow-[0_20px_55px_rgba(3,47,45,.15)] sm:p-7">
                <div className="vi-eyebrow text-[#f5c451]">Plan with context</div>
                <h2 className="vi-display mt-3 text-3xl font-bold leading-[.96]">
                  Turn the field note into a better island day.
                </h2>
                <p className="mt-4 text-sm font-semibold leading-6 text-white/62">
                  Ask Concierge to connect this place to timing, mobility, food, nearby stops,
                  and the trip you already have in progress.
                </p>
                <Link
                  href={`/concierge?island=${story.island}&prompt=${encodeURIComponent(conciergePrompt)}`}
                  className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#f5c451] px-5 text-[9px] font-black uppercase tracking-[.14em] text-[#032f2d]"
                >
                  <Sparkles className="h-4 w-4" /> Plan this context
                </Link>
              </section>

              <section className="rounded-[30px] border border-teal-200 bg-teal-50 p-6 sm:p-7">
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[.16em] text-teal-700">
                      Context source
                    </p>
                    <h2 className="mt-2 text-xl font-black tracking-[-.03em]">
                      {story.sourceLabel}
                    </h2>
                    <p className="mt-3 text-xs font-semibold leading-6 text-teal-950/65">
                      USVI Explorer verified this source on {story.verifiedAt}. The field note turns
                      source-backed place context into practical traveler guidance rather than
                      presenting it as a social post or live condition report.
                    </p>
                    <a
                      href={story.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-5 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.14em] text-teal-800"
                    >
                      Open source <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
