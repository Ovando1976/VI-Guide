"use client";

import Link from "next/link";
import { Bell, Compass, Loader2, MapPin, MessageCircle, Plus, Search, Sparkles, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { SocialAvatar } from "@/components/social/social-avatar";
import { SocialPostCard } from "@/components/social/social-post-card";
import { useSocialClient } from "@/components/social/use-social-client";
import type { PublicSocialProfile, SocialCommunity, SocialPostView } from "@/types/social";

type FeedMode = "following" | "local" | "for_you";

const MODES: Array<{ id: FeedMode; label: string }> = [
  { id: "following", label: "Following" },
  { id: "for_you", label: "For You" },
  { id: "local", label: "Local" },
];

export function SocialHomeScreen() {
  const { client, user, loading: authLoading } = useSocialClient();
  const [profile, setProfile] = useState<PublicSocialProfile | null>(null);
  const [posts, setPosts] = useState<SocialPostView[]>([]);
  const [communities, setCommunities] = useState<SocialCommunity[]>([]);
  const [mode, setMode] = useState<FeedMode>("for_you");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void Promise.all([
      client.feed(mode, 30),
      client.communities(""),
      user ? client.myProfile() : Promise.resolve(null),
    ])
      .then(([feed, communityList, nextProfile]) => {
        if (cancelled) return;
        setPosts([...feed.posts]);
        setCommunities(communityList.slice(0, 6));
        setProfile(nextProfile);
      })
      .catch((cause) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Social Home could not load.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [client, mode, user]);

  return (
    <main className="min-h-[100dvh] bg-[#f4f8f7] pb-28 text-slate-950 lg:pb-8 lg:pl-24">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-[#f4f8f7]/92 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.2em] text-teal-700">Island Social</p>
            <h1 className="text-xl font-black tracking-[-.04em] sm:text-2xl">Home</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/discover" className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm" aria-label="Search Island">
              <Search className="h-5 w-5" />
            </Link>
            <Link href="/notifications" className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-3 py-4 sm:px-6 lg:grid-cols-[minmax(0,680px)_320px] lg:justify-center lg:gap-7 lg:py-7">
        <section className="min-w-0 space-y-4">
          <div className="overflow-hidden rounded-[28px] bg-gradient-to-br from-[#063d45] via-[#075e61] to-[#0d8d88] p-5 text-white shadow-[0_20px_60px_rgba(4,61,69,.18)] sm:p-6">
            <div className="flex items-center gap-3">
              <SocialAvatar src={profile?.avatarUrl ?? user?.photoURL} name={profile?.displayName ?? user?.displayName ?? "Island member"} size={48} />
              <Link href={user ? "/create" : "/login?next=%2Fsocial"} className="flex min-h-12 flex-1 items-center rounded-full border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white/75 backdrop-blur transition hover:bg-white/15">
                What&apos;s happening in the islands?
              </Link>
              <Link href="/create" className="grid h-12 w-12 place-items-center rounded-full bg-[#f4c955] text-[#063d45]" aria-label="Create post">
                <Plus className="h-5 w-5" />
              </Link>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-black">
              <Link href="/create?type=photo" className="rounded-full bg-white/10 px-3 py-2">Photo</Link>
              <Link href="/create?type=poll" className="rounded-full bg-white/10 px-3 py-2">Poll</Link>
              <Link href="/create?type=event" className="rounded-full bg-white/10 px-3 py-2">Event</Link>
              <Link href="/chats" className="rounded-full bg-white/10 px-3 py-2">Ask Island AI</Link>
            </div>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
            {MODES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id)}
                className={`min-h-10 flex-1 whitespace-nowrap rounded-xl px-4 text-xs font-black transition ${mode === item.id ? "bg-[#063d45] text-white" : "text-slate-500 hover:bg-slate-50"}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>
          ) : null}

          {loading || authLoading ? (
            <div className="grid min-h-52 place-items-center rounded-[28px] border border-slate-200 bg-white">
              <Loader2 className="h-6 w-6 animate-spin text-teal-700" />
            </div>
          ) : posts.length ? (
            posts.map((post) => (
              <SocialPostCard
                key={post.id}
                post={post}
                client={client}
                onUpdate={(updated) => setPosts((current) => current.map((item) => (item.id === updated.id ? updated : item)))}
              />
            ))
          ) : (
            <div className="rounded-[30px] border border-slate-200 bg-white p-7 text-center shadow-sm">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-teal-50 text-teal-700"><Sparkles className="h-6 w-6" /></div>
              <h2 className="mt-4 text-xl font-black">Start the conversation.</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                This feed gets better as people post, follow one another and join local communities. Be one of the first voices here.
              </p>
              <Link href={user ? "/create" : "/login?next=%2Fsocial"} className="mt-5 inline-flex min-h-11 items-center rounded-full bg-[#063d45] px-5 text-sm font-black text-white">
                Create the first post
              </Link>
            </div>
          )}
        </section>

        <aside className="hidden space-y-4 lg:block">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.17em] text-teal-700">Island Pulse</p>
                <h2 className="mt-1 text-lg font-black">Find your people</h2>
              </div>
              <Compass className="h-5 w-5 text-teal-700" />
            </div>
            <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">
              Follow communities to shape Local and For You around what actually matters to you.
            </p>
            <Link href="/discover" className="mt-4 inline-flex items-center gap-2 text-xs font-black text-teal-700">
              Explore the network <Users className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="px-1 pb-2 text-xs font-black text-slate-900">Communities to join</div>
            <div className="space-y-1">
              {communities.map((community) => (
                <Link key={community.id} href={`/communities/${community.id}`} className="flex items-center gap-3 rounded-2xl px-2 py-3 transition hover:bg-slate-50">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#e5f4f1] text-teal-700">
                    {community.island ? <MapPin className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-black text-slate-900">{community.name}</span>
                    <span className="mt-0.5 block truncate text-[10px] font-semibold text-slate-400">{community.memberCount} members · {community.category}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <Link href="/chats" className="flex items-center gap-3 rounded-[24px] bg-[#063d45] p-4 text-white shadow-lg">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10"><MessageCircle className="h-5 w-5" /></span>
            <span><span className="block text-xs font-black">Island AI is part of the network</span><span className="mt-1 block text-[10px] font-semibold text-white/60">Ask privately or bring it into a group.</span></span>
          </Link>
        </aside>
      </div>
    </main>
  );
}
