import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPinned, Sparkles } from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";

export default function CommunityPostPage({
  params,
}: {
  params: { postId: string };
}) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f0e6] pb-32 text-[#032f2d]">
      <section className="relative isolate overflow-hidden bg-[#032f2d] px-4 pb-14 pt-5 text-white sm:px-7 lg:px-10">
        <Image
          src="/images/usvi-harbor-hero.jpg"
          alt="Charlotte Amalie harbor and hillside communities in St. Thomas"
          fill
          priority
          sizes="100vw"
          className="-z-30 object-cover object-[68%_center]"
        />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(2,31,29,.98),rgba(3,47,45,.88)_56%,rgba(3,47,45,.42))]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(2,31,29,.05),rgba(2,31,29,.55))]" />

        <ViPublicHeader
          actionHref="/concierge?prompt=Help%20me%20find%20local%20community%20and%20cultural%20context%20for%20my%20Virgin%20Islands%20trip"
          actionLabel="Ask Concierge"
          actionIcon={Sparkles}
          secondaryHref="/community"
          secondaryLabel="Community"
        />

        <div className="mx-auto max-w-5xl pb-6 pt-16 lg:pt-24">
          <div className="vi-eyebrow text-[#f5c451]">Community story · {params.postId}</div>
          <h1 className="vi-display mt-4 max-w-4xl text-5xl font-bold leading-[.9] sm:text-7xl">
            This story is not published yet.
          </h1>
          <p className="mt-6 max-w-2xl text-base font-semibold leading-7 text-white/70 sm:text-lg">
            VI Guide is curating community publishing around useful local context rather than exposing empty or unverified posts. You can keep exploring the island now and return when this story is available.
          </p>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-7 lg:px-10 lg:py-14">
        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2">
          <Link
            href="/community"
            className="group rounded-[30px] border border-[#d9e6e2] bg-[#fffdf8] p-6 shadow-[0_16px_45px_rgba(3,47,45,.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(3,47,45,.13)]"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#032f2d] text-[#f5c451]">
              <ArrowLeft size={18} />
            </span>
            <h2 className="vi-display mt-5 text-3xl font-bold">Back to Community</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#607370]">
              Choose an island and continue through the local-context gateway.
            </p>
          </Link>

          <Link
            href="/map"
            className="group rounded-[30px] bg-[#032f2d] p-6 text-white shadow-[0_20px_55px_rgba(3,47,45,.16)] transition hover:-translate-y-1 hover:bg-[#075e58]"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#73e3d9]/12 text-[#73e3d9]">
              <MapPinned size={18} />
            </span>
            <h2 className="vi-display mt-5 text-3xl font-bold">Open Living Map</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-white/62">
              Keep exploring places, estates, beaches, heritage, mobility, and the trip from the map.
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
}
