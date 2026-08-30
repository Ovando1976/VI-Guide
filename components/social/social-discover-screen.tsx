"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, CalendarDays, Compass, Loader2, MapPin, MessageCircle, Search, UserPlus, Users } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { SocialAvatar } from "@/components/social/social-avatar";
import { useSocialClient } from "@/components/social/use-social-client";
import type { PublicSocialProfile, SocialCommunity } from "@/types/social";

type DiscoverTab = "all" | "people" | "communities" | "events" | "places" | "businesses";
const TABS: Array<{ id: DiscoverTab; label: string }> = [
  { id: "all", label: "All" },
  { id: "people", label: "People" },
  { id: "communities", label: "Communities" },
  { id: "events", label: "Events" },
  { id: "places", label: "Places" },
  { id: "businesses", label: "Businesses" },
];

export function SocialDiscoverScreen() {
  const { client, user } = useSocialClient();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [tab, setTab] = useState<DiscoverTab>("all");
  const [people, setPeople] = useState<PublicSocialProfile[]>([]);
  const [communities, setCommunities] = useState<SocialCommunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void Promise.all([client.searchPeople(submitted, 30), client.communities(submitted)])
      .then(([profiles, communityList]) => {
        if (cancelled) return;
        setPeople(profiles.filter((profile) => profile.userId !== user?.uid));
        setCommunities(communityList.slice(0, 30));
      })
      .catch((cause) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Discover could not load.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [client, submitted, user?.uid]);

  function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(query.trim());
  }

  async function message(profile: PublicSocialProfile) {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/discover?q=${query}`)}`);
      return;
    }
    setWorkingId(profile.userId);
    setError(null);
    try {
      const conversation = await client.startDirect(profile.userId);
      router.push(`/chats?conversation=${encodeURIComponent(conversation.conversationId)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Conversation could not start.");
    } finally {
      setWorkingId(null);
    }
  }

  async function follow(profile: PublicSocialProfile) {
    if (!user) {
      router.push("/login?next=%2Fdiscover");
      return;
    }
    setWorkingId(profile.userId);
    try { await client.follow(profile.userId); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Follow failed."); }
    finally { setWorkingId(null); }
  }

  const showPeople = tab === "all" || tab === "people";
  const showCommunities = tab === "all" || tab === "communities";

  return (
    <main className="min-h-[100dvh] bg-[#f5f8f7] pb-28 lg:pb-8 lg:pl-24">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,#0b7b78,#063d45_62%)] px-4 pb-8 pt-7 text-white sm:px-6 lg:pt-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#f5cd63]">Search the Virgin Islands</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-.055em] sm:text-5xl">Discover people, communities and island life.</h1>
          <form onSubmit={submit} className="mt-6 flex max-w-3xl items-center gap-2 rounded-[22px] border border-white/20 bg-white/12 p-2 backdrop-blur-xl">
            <Search className="ml-2 h-5 w-5 text-white/65" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search people, communities, events, businesses or places"
              className="min-h-11 min-w-0 flex-1 bg-transparent px-2 text-sm font-semibold text-white outline-none placeholder:text-white/45"
            />
            <button className="min-h-11 rounded-2xl bg-[#f5cd63] px-5 text-xs font-black text-[#063d45]">Search</button>
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-3 py-5 sm:px-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`min-h-10 whitespace-nowrap rounded-full px-4 text-xs font-black ${tab === item.id ? "bg-[#063d45] text-white" : "border border-slate-200 bg-white text-slate-600"}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {error ? <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div> : null}
        {loading ? <div className="grid min-h-48 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-teal-700" /></div> : null}

        {!loading && showPeople ? (
          <section className="mt-5">
            <div className="flex items-center justify-between">
              <div><p className="text-[10px] font-black uppercase tracking-[.16em] text-teal-700">Network</p><h2 className="mt-1 text-2xl font-black">People</h2></div>
              <Users className="h-5 w-5 text-teal-700" />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {people.length ? people.map((profile) => (
                <article key={profile.userId} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <Link href={`/u/${profile.handle}`}><SocialAvatar src={profile.avatarUrl} name={profile.displayName} size={52} /></Link>
                    <div className="min-w-0 flex-1">
                      <Link href={`/u/${profile.handle}`} className="block truncate text-sm font-black text-slate-950 hover:underline">{profile.displayName}</Link>
                      <p className="truncate text-xs font-semibold text-slate-400">@{profile.handle}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-teal-700">{profile.primaryIsland.replaceAll("_", " ")}</p>
                    </div>
                  </div>
                  {profile.bio ? <p className="mt-3 line-clamp-2 text-xs font-medium leading-5 text-slate-500">{profile.bio}</p> : null}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button type="button" disabled={workingId === profile.userId} onClick={() => void follow(profile)} className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 text-xs font-black text-slate-700 hover:bg-slate-50"><UserPlus className="h-4 w-4" /> Follow</button>
                    <button type="button" disabled={workingId === profile.userId} onClick={() => void message(profile)} className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#063d45] text-xs font-black text-white"><MessageCircle className="h-4 w-4" /> Message</button>
                  </div>
                </article>
              )) : <p className="col-span-full rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">No people match this search yet.</p>}
            </div>
          </section>
        ) : null}

        {!loading && showCommunities ? (
          <section className="mt-8">
            <div><p className="text-[10px] font-black uppercase tracking-[.16em] text-teal-700">Belong somewhere</p><h2 className="mt-1 text-2xl font-black">Communities</h2></div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {communities.map((community) => (
                <Link key={community.id} href={`/communities/${community.id}`} className="group rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e4f4f1] text-teal-700"><Users className="h-5 w-5" /></span>
                  <h3 className="mt-3 text-base font-black">{community.name}</h3>
                  <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-slate-500">{community.description}</p>
                  <p className="mt-3 text-[10px] font-black uppercase tracking-wide text-teal-700">{community.memberCount} members · {community.category}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {(tab === "all" || ["events", "places", "businesses"].includes(tab)) ? (
          <section className="mt-8 grid gap-3 sm:grid-cols-3">
            {(tab === "all" || tab === "events") ? <Link href={`/events${submitted ? `?q=${encodeURIComponent(submitted)}` : ""}`} className="rounded-[24px] bg-[#fff2c9] p-5 text-[#573f00]"><CalendarDays className="h-6 w-6" /><h3 className="mt-4 font-black">Events</h3><p className="mt-1 text-xs font-semibold opacity-70">Find what is happening and bring it into a conversation.</p></Link> : null}
            {(tab === "all" || tab === "places") ? <Link href={`/places${submitted ? `?q=${encodeURIComponent(submitted)}` : ""}`} className="rounded-[24px] bg-[#ddf1ee] p-5 text-[#064a48]"><MapPin className="h-6 w-6" /><h3 className="mt-4 font-black">Places</h3><p className="mt-1 text-xs font-semibold opacity-70">Search the existing USVI geographic and place intelligence.</p></Link> : null}
            {(tab === "all" || tab === "businesses") ? <Link href={`/places${submitted ? `?q=${encodeURIComponent(submitted)}&type=business` : "?type=business"}`} className="rounded-[24px] bg-[#e5ebf7] p-5 text-[#17365d]"><Building2 className="h-6 w-6" /><h3 className="mt-4 font-black">Businesses</h3><p className="mt-1 text-xs font-semibold opacity-70">Discover local businesses and service providers.</p></Link> : null}
          </section>
        ) : null}

        <Link href="/map" className="mt-5 flex items-center justify-between rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
          <div><p className="text-[10px] font-black uppercase tracking-[.16em] text-teal-700">Map mode</p><h3 className="mt-1 text-lg font-black">Discover geographically</h3><p className="mt-1 text-xs font-semibold text-slate-500">Open the Living Map without exposing your precise location.</p></div>
          <Compass className="h-6 w-6 text-teal-700" />
        </Link>
      </div>
    </main>
  );
}
