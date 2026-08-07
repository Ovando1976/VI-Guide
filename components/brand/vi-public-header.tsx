import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { ViBrandMark } from "@/components/brand/vi-brand-mark";

export function ViPublicHeader({
  actionHref,
  actionLabel,
  actionIcon: ActionIcon,
  secondaryHref,
  secondaryLabel,
}: {
  actionHref: string;
  actionLabel: string;
  actionIcon?: LucideIcon;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-[24px] border border-white/70 bg-white/76 px-4 py-3 shadow-[0_14px_40px_rgba(4,51,49,.10)] backdrop-blur-xl sm:px-5">
      <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="VI Guide home">
        <ViBrandMark className="h-11 w-11 shrink-0" priority />
        <div className="min-w-0">
          <div className="truncate font-serif text-xl font-bold tracking-[.02em]">VI Guide</div>
          <div className="truncate text-[8px] font-black uppercase tracking-[.25em] text-[#b16a18]">
            U.S. Virgin Islands
          </div>
        </div>
      </Link>

      <div className="flex shrink-0 items-center gap-2">
        {secondaryHref && secondaryLabel ? (
          <Link
            href={secondaryHref}
            className="hidden rounded-full border border-[#0f766e]/20 bg-white/86 px-4 py-2.5 text-[10px] font-black uppercase tracking-[.15em] text-[#073b39] transition hover:border-[#0f766e]/35 hover:bg-white sm:inline-flex"
          >
            {secondaryLabel}
          </Link>
        ) : null}
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 rounded-full bg-[#f5c451] px-4 py-2.5 text-[10px] font-black uppercase tracking-[.15em] text-[#073b39] shadow-lg shadow-black/10 transition hover:-translate-y-0.5"
        >
          {ActionIcon ? <ActionIcon size={14} aria-hidden="true" /> : null}
          {actionLabel}
        </Link>
      </div>
    </header>
  );
}
