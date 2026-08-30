"use client";

import Image from "next/image";
import Link from "next/link";
import { Bookmark, Heart, MapPin, MessageCircle, Share2 } from "lucide-react";
import { useState } from "react";

import { SocialAvatar } from "@/components/social/social-avatar";
import type { SocialClient } from "@/lib/social/client";
import type { SocialPostView } from "@/types/social";

const ISLAND_LABELS: Record<string, string> = {
  stt: "St. Thomas",
  stj: "St. John",
  stx: "St. Croix",
  water_island: "Water Island",
  diaspora: "USVI Diaspora",
  visitor: "Visiting USVI",
};

function relativeTime(value: string) {
  const date = new Date(value);
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  if (Math.abs(seconds) < 60) return formatter.format(seconds, "second");
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
  return formatter.format(Math.round(hours / 24), "day");
}

export function SocialPostCard({
  post,
  client,
  onUpdate,
}: {
  post: SocialPostView;
  client: SocialClient;
  onUpdate?: (post: SocialPostView) => void;
}) {
  const [busy, setBusy] = useState(false);
  const liked = post.viewerReaction === "❤️";

  async function toggleLike() {
    if (busy) return;
    setBusy(true);
    try {
      if (liked) {
        await client.unreact("post", post.id);
        onUpdate?.({ ...post, viewerReaction: null, reactionCount: Math.max(0, post.reactionCount - 1) });
      } else {
        await client.react("post", post.id, "❤️");
        onUpdate?.({
          ...post,
          viewerReaction: "❤️",
          reactionCount: post.reactionCount + (post.viewerReaction ? 0 : 1),
        });
      }
    } finally {
      setBusy(false);
    }
  }

  async function toggleSave() {
    if (busy) return;
    setBusy(true);
    try {
      await client.savePost(post.id, !post.viewerSaved);
      onUpdate?.({
        ...post,
        viewerSaved: !post.viewerSaved,
        saveCount: Math.max(0, post.saveCount + (post.viewerSaved ? -1 : 1)),
      });
    } finally {
      setBusy(false);
    }
  }

  const image = post.media.find((item) => item.type === "image");

  return (
    <article className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_14px_45px_rgba(5,48,54,.08)]">
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Link href={`/u/${post.author.handle}`} aria-label={`View ${post.author.displayName}'s profile`}>
            <SocialAvatar src={post.author.avatarUrl} name={post.author.displayName} size={46} />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Link href={`/u/${post.author.handle}`} className="truncate text-sm font-black text-slate-950 hover:underline">
                {post.author.displayName}
              </Link>
              <span className="truncate text-xs font-semibold text-slate-400">@{post.author.handle}</span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-slate-500">
              <span>{relativeTime(post.createdAt)}</span>
              {post.island ? <><span>·</span><span>{ISLAND_LABELS[post.island] ?? post.island}</span></> : null}
              {post.place ? <><span>·</span><span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{post.place.name}</span></> : null}
            </div>
          </div>
        </div>

        {post.body ? (
          <p className="mt-4 whitespace-pre-wrap text-[15px] font-medium leading-6 text-slate-800 sm:text-base sm:leading-7">
            {post.body}
          </p>
        ) : null}
      </div>

      {image ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 sm:aspect-[16/10]">
          <Image
            src={image.url}
            alt={image.alt ?? "Post image"}
            fill
            sizes="(min-width: 900px) 650px, 100vw"
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="flex items-center border-t border-slate-100 px-2 py-1.5 sm:px-3">
        <button
          type="button"
          onClick={() => void toggleLike()}
          className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl text-xs font-black transition hover:bg-rose-50 ${liked ? "text-rose-600" : "text-slate-500"}`}
          aria-pressed={liked}
        >
          <Heart className={`h-[18px] w-[18px] ${liked ? "fill-current" : ""}`} />
          {post.reactionCount || "Like"}
        </button>
        <Link
          href={`/post/${post.id}`}
          className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl text-xs font-black text-slate-500 transition hover:bg-teal-50"
        >
          <MessageCircle className="h-[18px] w-[18px]" />
          {post.commentCount || "Comment"}
        </Link>
        <button
          type="button"
          onClick={async () => {
            if (navigator.share) await navigator.share({ title: `Post by ${post.author.displayName}`, url: `${location.origin}/post/${post.id}` }).catch(() => {});
            else await navigator.clipboard?.writeText(`${location.origin}/post/${post.id}`);
          }}
          className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl text-xs font-black text-slate-500 transition hover:bg-teal-50"
        >
          <Share2 className="h-[18px] w-[18px]" /> Share
        </button>
        <button
          type="button"
          onClick={() => void toggleSave()}
          className={`grid h-11 w-11 place-items-center rounded-2xl transition hover:bg-amber-50 ${post.viewerSaved ? "text-amber-600" : "text-slate-500"}`}
          aria-label={post.viewerSaved ? "Remove saved post" : "Save post"}
          aria-pressed={post.viewerSaved}
        >
          <Bookmark className={`h-[18px] w-[18px] ${post.viewerSaved ? "fill-current" : ""}`} />
        </button>
      </div>
    </article>
  );
}
