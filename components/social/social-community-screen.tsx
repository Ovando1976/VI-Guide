"use client";

import { useRouter } from "next/navigation";
import { Loader2, MessageCircle, Send, ShieldCheck, Sparkles, Users } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";

import { SocialPostCard } from "@/components/social/social-post-card";
import { useSocialClient } from "@/components/social/use-social-client";
import type { SocialCommunity, SocialCommunityMembership, SocialPostView } from "@/types/social";

export function SocialCommunityScreen({ communityId }: { communityId: string }) {
  const { client, user } = useSocialClient();
  const router = useRouter();
  const [community, setCommunity] = useState<SocialCommunity | null>(null);
  const [membership, setMembership] = useState<SocialCommunityMembership | null>(null);
  const [posts, setPosts] = useState<SocialPostView[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const headers: Record<string, string> = {};
    if (user) headers.Authorization = `Bearer ${await user.getIdToken()}`;
    const response = await fetch(`/api/social/communities/${encodeURIComponent(communityId)}`, { headers, cache: "no-store" });
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error ?? "Community could not load.");
    }
    const data = (await response.json()) as { community: SocialCommunity; membership: SocialCommunityMembership | null; posts: SocialPostView[] };
    setCommunity(data.community);
    setMembership(data.membership);
    setPosts(data.posts);
  }, [communityId, user]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void load().catch((cause) => !cancelled && setError(cause instanceof Error ? cause.message : "Community could not load."))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [load]);

  async function toggleMembership() {
    if (!user) { router.push(`/login?next=${encodeURIComponent(`/communities/${communityId}`)}`); return; }
    setBusy(true);
    try {
      if (membership?.status === "active" || membership?.status === "pending") await client.leaveCommunity(communityId);
      else await client.joinCommunity(communityId);
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Membership could not update."); }
    finally { setBusy(false); }
  }

  async function publish(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim() || !community) return;
    if (!user) { router.push(`/login?next=${encodeURIComponent(`/communities/${communityId}`)}`); return; }
    setBusy(true);
    try {
      const post = await client.createPost({ body: draft, type: "community", communityId, visibility: "community", island: community.island });
      setPosts((current) => [post, ...current]);
      setDraft("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Post could not publish."); }
    finally { setBusy(false); }
  }

  if (loading) return <div className="grid min-h-[70vh] place-items-center bg-[#f5f8f7]"><Loader2 className="h-6 w-6 animate-spin text-teal-700" /></div>;
  if (!community) return <main className="grid min-h-[70vh] place-items-center bg-[#f5f8f7]">{error ?? "Community unavailable."}</main>;
  const active = membership?.status === "active";

  return (
    <main className="min-h-[100dvh] bg-[#f5f8f7] pb-28 lg:pb-8 lg:pl-24">
      <section className="bg-[radial-gradient(circle_at_top_left,#118e88,#063d45_65%)] px-4 pb-9 pt-9 text-white sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-start justify-between gap-4">
            <div className="max-w-3xl"><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#f5cd63]">{community.category}</p><h1 className="mt-2 text-4xl font-black tracking-[-.055em] sm:text-5xl">{community.name}</h1><p className="mt-3 text-sm font-medium leading-6 text-white/75">{community.description}</p><p className="mt-4 text-xs font-bold text-white/60">{community.memberCount} members · {community.postCount} posts · {community.visibility}</p></div>
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/10"><Users className="h-6 w-6" /></span>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <button onClick={() => void toggleMembership()} disabled={busy} className={`min-h-11 rounded-full px-5 text-xs font-black ${active ? "border border-white/25 bg-white/10 text-white" : "bg-[#f5cd63] text-[#063d45]"}`}>{membership?.status === "pending" ? "Requested" : active ? "Joined" : "Join community"}</button>
            {active && community.conversationId ? <button onClick={() => router.push(`/chats?conversation=${encodeURIComponent(community.conversationId!)}`)} className="flex min-h-11 items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 text-xs font-black"><MessageCircle className="h-4 w-4" /> Community chat</button> : null}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-5 px-3 py-5 sm:px-6 lg:grid-cols-[minmax(0,680px)_280px]">
        <section className="space-y-4">
          {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error}</div> : null}
          {active ? (
            <form onSubmit={publish} className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm">
              <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={3} maxLength={5000} placeholder={`Share with ${community.name}…`} className="w-full resize-none rounded-2xl bg-slate-50 p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500/30" />
              <div className="mt-3 flex justify-end"><button disabled={busy || !draft.trim()} className="flex min-h-10 items-center gap-2 rounded-full bg-[#063d45] px-4 text-xs font-black text-white disabled:opacity-50"><Send className="h-4 w-4" /> Post</button></div>
            </form>
          ) : null}
          {posts.length ? posts.map((post) => <SocialPostCard key={post.id} post={post} client={client} onUpdate={(updated) => setPosts((current) => current.map((item) => item.id === updated.id ? updated : item))} />) : <div className="rounded-[26px] border border-slate-200 bg-white p-7 text-center text-sm text-slate-500">No visible community posts yet.</div>}
        </section>

        <aside className="space-y-3">
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><ShieldCheck className="h-5 w-5 text-teal-700" /><h3 className="mt-3 text-sm font-black">Community rules</h3><p className="mt-2 text-xs font-semibold leading-5 text-slate-500">Keep discussion useful, local and respectful. Blocking and reporting apply here just like everywhere else on Island.</p></div>
          <div className="rounded-[24px] bg-[#063d45] p-5 text-white"><Sparkles className="h-5 w-5 text-[#f5cd63]" /><h3 className="mt-3 text-sm font-black">@IslandAI in community chat</h3><p className="mt-2 text-xs font-semibold leading-5 text-white/60">Mention Island AI when you want help summarizing or planning. It receives only authorized community chat context.</p></div>
        </aside>
      </div>
    </main>
  );
}
