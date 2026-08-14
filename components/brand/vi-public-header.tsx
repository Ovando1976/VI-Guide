import Link from "next/link";
import { Crown, MapPinned } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { ViBrandMark } from "@/components/brand/vi-brand-mark";

export function ViPublicHeader({
  actionHref,
  actionLabel,
  actionIcon: ActionIcon,
  secondaryHref,
  secondaryLabel,
  secondaryActions,
}: {
  actionHref: string;
  actionLabel: string;
  actionIcon?: LucideIcon;
  secondaryHref?: string;
  secondaryLabel?: string;
  secondaryActions?: ReactNode;
}) {
  return (
    <header className="vi-public-header vi-public-header--cinematic mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-[26px] border border-white/12 bg-[#043331]/95 px-3 py-3 text-white shadow-[0_22px_70px_rgba(2,31,29,.24)] backdrop-blur-2xl sm:px-4">
      <Link href="/" className="group flex min-w-0 items-center gap-3" aria-label="USVI Explorer home">
        <ViBrandMark className="h-12 w-12 shrink-0 transition duration-300 group-hover:-rotate-3 group-hover:scale-105" priority />
        <div className="min-w-0">
          <div className="vi-wordmark truncate text-[19px] font-black tracking-[-.035em] text-white sm:text-xl">
            USVI Explorer
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 truncate text-[8px] font-black uppercase tracking-[.22em] text-[#9fe7df]">
            <MapPinned size={10} aria-hidden="true" /> Discover · plan · move
          </div>
        </div>
      </Link>

      <nav aria-label="Discover the Virgin Islands" className="hidden items-center gap-1 rounded-full border border-white/10 bg-black/10 p-1.5 lg:flex">
        <Link href="/explore" className="rounded-full px-4 py-2 text-[9px] font-black uppercase tracking-[.15em] text-white/62 transition hover:bg-white/10 hover:text-white">Explore</Link>
        <Link href="/map" className="rounded-full px-4 py-2 text-[9px] font-black uppercase tracking-[.15em] text-white/62 transition hover:bg-white/10 hover:text-white">Live map</Link>
        <Link href="/accommodations" className="rounded-full px-4 py-2 text-[9px] font-black uppercase tracking-[.15em] text-white/62 transition hover:bg-white/10 hover:text-white">Stays</Link>
        <Link href="/mobility" className="rounded-full px-4 py-2 text-[9px] font-black uppercase tracking-[.15em] text-white/62 transition hover:bg-white/10 hover:text-white">Ride</Link>
      </nav>

      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/plus"
          className="hidden items-center gap-1.5 rounded-full border border-[#f5c451]/35 bg-[#f5c451]/10 px-4 py-2.5 text-[9px] font-black uppercase tracking-[.15em] text-[#f8d77c] transition hover:-translate-y-0.5 hover:bg-[#f5c451]/18 sm:inline-flex"
        >
          <Crown size={13} aria-hidden="true" /> Plus
        </Link>
        {secondaryActions ??
          (secondaryHref && secondaryLabel ? (
            <Link
              href={secondaryHref}
              className="hidden rounded-full border border-white/12 bg-white/[.07] px-4 py-2.5 text-[9px] font-black uppercase tracking-[.15em] text-white/82 transition hover:-translate-y-0.5 hover:bg-white/[.12] sm:inline-flex"
            >
              {secondaryLabel}
            </Link>
          ) : null)}
        <Link
          href={actionHref}
          className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#f5c451] px-4 py-2.5 text-[9px] font-black uppercase tracking-[.15em] text-[#043331] shadow-[0_10px_30px_rgba(245,196,81,.22)] transition hover:-translate-y-0.5 hover:bg-[#ffdc76]"
        >
          {ActionIcon ? <ActionIcon size={14} aria-hidden="true" /> : null}
          <span className="max-w-[132px] truncate sm:max-w-none">{actionLabel}</span>
        </Link>
      </div>
    </header>
  );
}
