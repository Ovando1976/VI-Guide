"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, Check, Loader2, MessageCircle, Send, Users } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { SocialAvatar } from "@/components/social/social-avatar";
import { useSocialClient } from "@/components/social/use-social-client";
import type { PublicSocialProfile } from "@/types/social";

type CreateMode = "post" | "community" | "group" | "event";

export function SocialCreateScreen() {
  const { client, user, loading: authLoading } = useSocialClient();
  const router = useRouter();
  const params = useSearchParams();
  const initial = params.get("type");
  const [mode, setMode] = useState<CreateMode>(initial === "event" ? "event" : initial === "group" ? "group" : initial === "community" ? "community" : "post");
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [communityName, setCommunityName] = useState("");
  const [communityDescription, setCommunityDescription] = useState("");
  const [groupTitle, setGroupTitle] = useState("");
  const [peopleQuery, setPeopleQuery] = useState("");
  const [people, setPeople] = useState<PublicSocialProfile[]>([]);
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "group") return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void client.searchPeople(peopleQuery, 20).then((profiles) => {
        if (!cancelled) setPeople(profiles.filter((profile) => profile.userId !== user?.uid));
      }).catch(() => {});
    }, 180);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [client, mode, peopleQuery, user?.uid]);

  const selectedSet = useMemo(() => new Set(selectedPeople), [selectedPeople]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!user) {
      router.push("/login?next=%2Fcreate");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (mode === "post") {
        const post = await client.createPost({ type: "text", body, visibility });
        router.push(`/post/${post.id}`);
      } else if (mode === "community") {
        const community = await client.createCommunity({
          name: communityName,
          description: communityDescription,
          visibility: "public",
          category: "community",
        });
        router.push(`/communities/${community.id}`);
      } else if (mode === "group") {
        const group = await client.createGroup(groupTitle, selectedPeople);
        router.push(`/chats?conversation=${encodeURIComponent(group.conversationId)}`);
      } else {
        router.push("/events");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Creation failed.");
    } finally {
      setBusy(false);
    }
  }

  if (authLoading) return <div className="grid min-h-[70vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-teal-700" /></div>;

  return (
    <main className="min-h-[100dvh] bg-[radial-gradient(circle_at_top,#dff3ef,#f6f8f7_45%)] px-3 pb-28 pt-5 lg:pb-8 lg:pl-24">
      <section className="mx-auto max-w-3xl overflow-hidden rounded-[32px] border border-white/80 bg-white shadow-[0_24px_80px_rgba(5,48,54,.12)]">
        <div className="bg-[#063d45] p-5 text-white sm:p-7">
          <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#f5cd63]">Create on Island</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-.05em] sm:text-4xl">Share, organize or start something.</h1>
          <div className="mt-5 grid grid-cols-4 gap-1 rounded-2xl bg-white/10 p-1">
            {([
              ["post", "Post"],
              ["community", "Community"],
              ["group", "Group"],
              ["event", "Event"],
            ] as const).map(([id, label]) => (
              <button key={id} type="button" onClick={() => setMode(id)} className={`min-h-10 rounded-xl text-[11px] font-black ${mode === id ? "bg-white text-[#063d45]" : "text-white/70"}`}>{label}</button>
            ))}
          </div>
        </div>

        <form onSubmit={submit} className="p-5 sm:p-7">
          {!user ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
              You can explore Island without signing in, but you need an account to create or message.
            </div>
          ) : null}
          {error ? <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div> : null}

          {mode === "post" ? (
            <div>
              <label className="text-xs font-black text-slate-700">What&apos;s happening?</label>
              <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={8} maxLength={5000} placeholder="Share something useful, interesting or local…" className="mt-2 w-full resize-none rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-base font-medium outline-none focus:border-teal-500 focus:bg-white" />
              <div className="mt-4 flex items-center justify-between gap-3">
                <select value={visibility} onChange={(event) => setVisibility(event.target.value)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700">
                  <option value="public">Public</option>
                  <option value="followers">Followers</option>
                  <option value="private">Only me</option>
                </select>
                <span className="text-[11px] font-semibold text-slate-400">{body.length}/5000</span>
              </div>
            </div>
          ) : null}

          {mode === "community" ? (
            <div className="space-y-4">
              <div><label className="text-xs font-black text-slate-700">Community name</label><input value={communityName} onChange={(event) => setCommunityName(event.target.value)} placeholder="USVI Photography" className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 px-4 font-semibold outline-none focus:border-teal-500" /></div>
              <div><label className="text-xs font-black text-slate-700">What is this community for?</label><textarea value={communityDescription} onChange={(event) => setCommunityDescription(event.target.value)} rows={5} placeholder="Describe the people and conversations this community should bring together." className="mt-2 w-full rounded-2xl border border-slate-200 p-4 font-medium outline-none focus:border-teal-500" /></div>
            </div>
          ) : null}

          {mode === "group" ? (
            <div className="space-y-4">
              <div><label className="text-xs font-black text-slate-700">Group name</label><input value={groupTitle} onChange={(event) => setGroupTitle(event.target.value)} placeholder="Saturday crew" className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 px-4 font-semibold outline-none focus:border-teal-500" /></div>
              <div><label className="text-xs font-black text-slate-700">Add people</label><input value={peopleQuery} onChange={(event) => setPeopleQuery(event.target.value)} placeholder="Search by name or handle" className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 px-4 font-semibold outline-none focus:border-teal-500" /></div>
              <div className="max-h-72 space-y-1 overflow-y-auto rounded-2xl border border-slate-200 p-2">
                {people.map((profile) => {
                  const selected = selectedSet.has(profile.userId);
                  return (
                    <button key={profile.userId} type="button" onClick={() => setSelectedPeople((current) => selected ? current.filter((id) => id !== profile.userId) : [...current, profile.userId])} className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-slate-50">
                      <SocialAvatar src={profile.avatarUrl} name={profile.displayName} size={40} />
                      <span className="min-w-0 flex-1"><span className="block truncate text-xs font-black">{profile.displayName}</span><span className="block truncate text-[10px] font-semibold text-slate-400">@{profile.handle}</span></span>
                      <span className={`grid h-6 w-6 place-items-center rounded-full border ${selected ? "border-teal-700 bg-teal-700 text-white" : "border-slate-300"}`}>{selected ? <Check className="h-3.5 w-3.5" /> : null}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs font-semibold text-slate-500">Island AI is added to new groups in mention-only mode. It does not read unrelated private chats.</p>
            </div>
          ) : null}

          {mode === "event" ? (
            <div className="rounded-[24px] bg-[#fff3cc] p-5 text-[#5b4504]">
              <CalendarDays className="h-7 w-7" />
              <h2 className="mt-4 text-xl font-black">Create or manage an event</h2>
              <p className="mt-2 text-sm font-semibold leading-6 opacity-75">The existing USVI Events system remains the event source while we connect social RSVPs and event chat to it.</p>
            </div>
          ) : null}

          <button type="submit" disabled={busy} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#063d45] px-5 text-sm font-black text-white disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "group" ? <MessageCircle className="h-4 w-4" /> : mode === "community" ? <Users className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            {mode === "post" ? "Publish post" : mode === "community" ? "Create community" : mode === "group" ? "Start group" : "Open Events"}
          </button>
        </form>
      </section>
    </main>
  );
}
