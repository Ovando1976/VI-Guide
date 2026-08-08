import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Home, ShieldAlert, UserRound } from "lucide-react";

import { ViBrandMark } from "@/components/brand/vi-brand-mark";

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen bg-[#f8f4ea] p-4 text-[#043331] sm:p-6 lg:p-8">
      <section className="relative isolate mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-[38px] border border-white/20 bg-[#043331] text-white shadow-[0_32px_100px_rgba(4,51,49,.18)] sm:min-h-[calc(100vh-3rem)] lg:rounded-[44px]">
        <Image
          src="/images/usvi-harbor-hero.jpg"
          alt="Charlotte Amalie harbor and the hills of St. Thomas"
          fill
          priority
          sizes="(min-width: 1200px) 1200px, 100vw"
          className="-z-30 object-cover"
        />
        <span className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(2,38,37,.96)_0%,rgba(2,38,37,.8)_52%,rgba(2,38,37,.4)_100%)]" />
        <span className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(2,38,37,.94)_0%,rgba(2,38,37,.2)_65%,transparent_100%)]" />

        <div className="flex w-full flex-col justify-between p-5 sm:p-8 lg:p-10">
          <Link
            href="/"
            className="flex w-fit items-center gap-3 rounded-full border border-white/15 bg-[#032f2d]/58 px-3 py-2 pr-5 backdrop-blur-md"
            aria-label="VI Guide home"
          >
            <ViBrandMark className="h-11 w-11" priority />
            <span>
              <span className="block text-lg font-black tracking-[-.035em]">VI Guide</span>
              <span className="mt-0.5 block text-[8px] font-black uppercase tracking-[.19em] text-[#9fe7df]">
                Virgin Islands travel OS
              </span>
            </span>
          </Link>

          <div className="max-w-2xl rounded-[30px] border border-white/16 bg-[#032f2d]/82 p-6 shadow-[0_22px_70px_rgba(2,31,29,.24)] backdrop-blur-xl sm:p-8">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-300/14 text-[#f8d77c] ring-1 ring-white/10">
              <ShieldAlert className="h-6 w-6" />
            </span>
            <p className="mt-5 text-[9px] font-black uppercase tracking-[.2em] text-[#f5c451]">
              Access restricted · account protected
            </p>
            <h1 className="vi-display mt-2 text-4xl font-black leading-[.95] tracking-[-.05em] sm:text-5xl">
              This account cannot open that workspace.
            </h1>
            <p className="mt-4 text-sm font-semibold leading-7 text-white/68">
              The page you requested requires a role or listing assignment that is not attached to this account. Your traveler access is still available; protected operational tools remain closed until the required access is assigned.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link
                href="/"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#f5c451] px-6 text-[9px] font-black uppercase tracking-[.15em] text-[#043331] transition hover:bg-[#ffdc76]"
              >
                <Home className="h-4 w-4" /> Return to VI Guide
              </Link>
              <Link
                href="/profile"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[.08] px-6 text-[9px] font-black uppercase tracking-[.15em] text-white transition hover:bg-white/[.13]"
              >
                <UserRound className="h-4 w-4 text-[#8ef0e7]" /> Open traveler profile
              </Link>
            </div>

            <div className="mt-6 flex items-start gap-3 border-t border-white/12 pt-5">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/[.08] text-[#8ef0e7]">
                <ShieldAlert className="h-4 w-4" />
              </span>
              <p className="text-xs font-semibold leading-5 text-white/58">
                If you expected business, driver, dispatcher, or administrator access, ask the VI Guide administrator responsible for that workspace to verify your assigned role or listing access.
              </p>
            </div>

            <Link
              href="/"
              className="mt-5 inline-flex items-center gap-2 text-[8px] font-black uppercase tracking-[.14em] text-[#9fe7df]"
            >
              Continue as a traveler <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
