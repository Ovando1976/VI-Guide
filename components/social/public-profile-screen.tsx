"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Lock, MessageCircle, MoreHorizontal, ShieldCheck, UserCheck, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";

import { SocialAvatar } from "@/components/social/social-avatar";
import { SocialPostCard } from "@/components/social/social-post-card";
import { useSocialClient } from "@/components/social/use-social-client";
import type { PublicSocialProfile, SocialFollow, SocialPostView } from "@/types/social";

export function PublicSocialProfileScreen({ handle }: { handle: string }) {
  const { client, user } = useSocialClient();
  const router = useRouter();
  const [profile, setProfile] = useState<PublicSocialProfile | null>(null);
  const [posts, setPosts] = useState<SocialPostView[]>([]);
  const [follow, setFollow] = useState<SocialFollow | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void client.profileByHandle(handle)
      .then(async (next) => {
        if (cancelled) return;
        setProfile(next);
        const headers: Record<string, string> = {};
        if (user) headers.Authorization = `Bearer ${await user.getIdToken()}`;
        const response = await fetch(`/api/social/people/${encodeURIComponent(next.userId)}/posts`, { headers, cache: "no-store" });
        if (response.ok) {
          const data = (await response.json()) as { posts: SocialPostView[] };
          if (!cancelled) setPosts(data.posts);
        }
        if (user && user.uid !== next.userId) {
          const relationship = await client.relationship(next.userId);
          if (!cancelled) {
            setFollow(relationship.outgoing);
            setBlocked(relationship.blocked);
          }
        }
      })
      .catch((cause) => !cancelled && setError(cause instanceof Error ? cause.message : "Profile could not load."))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [client, handle, user]);

  async function toggleFollow() {
    if (!profile) return;
    if (!user) { router.push(`/login?next=${encodeURIComponent(`/u/${handle}`)}`); return; }
    setBusy(true);
    try {
      if (follow?.status === "accepted" || follow?.status === "pending") {
        await client.unfollow(profile.userId);
        setFollow(null);
      } else setFollow(await client.follow(profile.userId));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Follow failed."); }
    finally { setBusy(false); }
  }

  async function startMessage() {
    if (!profile) return;
    if (!user) { router.push(`/login?next=${encodeURIComponent(`/u/${handle}`)}`); return; }
    setBusy(true);
    try {
      const conversation = await client.startDirect(profile.userId);
      router.push(`/chats?conversation=${encodeURIComponent(conversation.conversationId)}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Message could not start."); }
    finally { setBusy(false); }
  }

  async function toggleBlock() {
    if (!profile || !user) return;
    setBusy(true);
    try {
      if (blocked) await client.unblock(profile.userId);
      else await client.block(profile.userId);
      setBlocked(!blocked);
      if (!blocked) setFollow(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Block setting failed."); }
    finally { setBusy(false); }
  }

  if (loading) return <div className="grid min-h-[75vh] place-items-center bg-[#f5f8f7]"><Loader2 className="h-6 w-6 animate-spin text-teal-700" /></div>;
  if (!profile) return <main className="grid min-h-[75vh] place-items-center bg-[#f5f8f7] px-4"><div className="text-center"><h1 className="text-2xl font-black">Profile unavailable</h1><p className="mt-2 text-sm text-slate-500">{error}</p></div></main>;
  const self = user?.uid === profile.userId;

  return (
    <main className="min-h-[100dvh] bg-[#f5f8f7] pb-28 lg:pb-8 lg:pl-24">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,#149a94,#063d45_65%)] px-4 pb-8 pt-10 text-white sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
            <SocialAvatar src={profile.avatarUrl} name={profile.displayName} size={96} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2"><h1 className="truncate text-4xl font-black tracking-[-.055em]">{profile.displayName}</h1>{profile.verification.length ? <ShieldCheck className="h-5 w-5 text-[#f5cd63]" /> : null}</div>
              <p className="mt-1 text-sm font-semibold text-white/65">@{profile.handle}</p>
              {profile.bio ? <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/80">{profile.bio}</p> : null}
              <div className="mt-4 flex gap-5 text-xs font-semibold text-white/65"><span><strong className="text-white">{profile.followerCount}</strong> followers</span><span><strong className="text-white">{profile.followingCount}</strong> following</span><span><strong className="text-white">{profile.postCount}</strong> posts</span></div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {self ? <Link href="/profile/social" className="min-h-11 rounded-full bg-white px-5 py-3 text-xs font-black text-[#063d45]">Edit profile</Link> : <>
              <button disabled={busy || blocked} onClick={() => void toggleFollow()} className="flex min-h-11 items-center gap-2 rounded-full bg-white px-5 text-xs font-black text-[#063d45] disabled:opacity-50">{follow?.status === "accepted" ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}{follow?.status === "accepted" ? "Following" : follow?.status === "pending" ? "Requested" : "Follow"}</button>
              <button disabled={busy || blocked} onClick={() => void startMessage()} className="flex min-h-11 items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 text-xs font-black"><MessageCircle className="h-4 w-4" /> Message</button>
              <button onClick={() => void toggleBlock()} className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-white/10" aria-label={blocked ? "Unblock user" : "Block user"}>{blocked ? <Lock className="h-4 w-4" /> : <MoreHorizontal className="h-4 w-4" />}</button>
            </>}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[680px] space-y-4 px-3 py-5 sm:px-6">
        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error}</div> : null}
        {profile.privacyMode === "private" && !self && follow?.status !== "accepted" ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-7 text-center shadow-sm"><Lock className="mx-auto h-6 w-6 text-teal-700" /><h2 className="mt-3 text-lg font-black">Private profile</h2><p className="mt-2 text-sm text-slate-500">Follow this person to see follower-only posts.</p></div>
        ) : posts.length ? posts.map((post) => <SocialPostCard key={post.id} post={post} client={client} onUpdate={(updated) => setPosts((current) => current.map((item) => item.id === updated.id ? updated : item))} />) : (
          <div className="rounded-[28px] border border-slate-200 bg-white p-7 text-center text-sm text-slate-500">No visible posts yet.</div>
        )}
      </section>
    </main>
  );
}
