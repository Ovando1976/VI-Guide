"use client";

import Link from "next/link";
import { Loader2, Send } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { SocialAvatar } from "@/components/social/social-avatar";
import { SocialPostCard } from "@/components/social/social-post-card";
import { useSocialClient } from "@/components/social/use-social-client";
import type { PublicSocialProfile, SocialComment, SocialPostView } from "@/types/social";

export function SocialPostDetailScreen({ postId }: { postId: string }) {
  const { client, user } = useSocialClient();
  const [post, setPost] = useState<SocialPostView | null>(null);
  const [comments, setComments] = useState<SocialComment[]>([]);
  const [authors, setAuthors] = useState<Record<string, PublicSocialProfile>>({});
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [nextPost, nextComments] = await Promise.all([client.post(postId), client.comments(postId)]);
    setPost(nextPost);
    setComments(nextComments);
    const ids = Array.from(new Set(nextComments.map((comment) => comment.authorId)));
    const pairs = await Promise.all(ids.map(async (id) => {
      const response = await fetch(`/api/social/profile?userId=${encodeURIComponent(id)}`, { cache: "no-store" });
      if (!response.ok) return null;
      const data = (await response.json()) as { profile: PublicSocialProfile };
      return [id, data.profile] as const;
    }));
    setAuthors(Object.fromEntries(pairs.filter(Boolean) as Array<readonly [string, PublicSocialProfile]>));
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void load().catch((cause) => !cancelled && setError(cause instanceof Error ? cause.message : "Post could not load."))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [postId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim()) return;
    setBusy(true);
    try {
      const comment = await client.comment(postId, draft);
      setComments((current) => [...current, comment]);
      if (user && !authors[user.uid]) {
        try {
          const profile = await client.myProfile();
          setAuthors((current) => ({ ...current, [user.uid]: profile }));
        } catch {}
      }
      setDraft("");
      if (post) setPost({ ...post, commentCount: post.commentCount + 1 });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Comment could not publish."); }
    finally { setBusy(false); }
  }

  if (loading) return <div className="grid min-h-[70vh] place-items-center bg-[#f5f8f7]"><Loader2 className="h-6 w-6 animate-spin text-teal-700" /></div>;
  if (!post) return <main className="grid min-h-[70vh] place-items-center bg-[#f5f8f7] px-4 text-center"><div><h1 className="text-2xl font-black">Post unavailable</h1><p className="mt-2 text-sm text-slate-500">{error}</p></div></main>;

  return (
    <main className="min-h-[100dvh] bg-[#f5f8f7] pb-28 lg:pb-8 lg:pl-24">
      <div className="mx-auto max-w-[680px] space-y-4 px-3 py-5 sm:px-6 lg:py-8">
        <SocialPostCard post={post} client={client} onUpdate={setPost} />
        <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-lg font-black">Conversation</h2>
          {error ? <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error}</div> : null}
          <form onSubmit={submit} className="mt-4 flex items-end gap-2">
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={2} maxLength={2000} placeholder={user ? "Add to the conversation…" : "Sign in to comment"} disabled={!user} className="min-w-0 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium outline-none focus:border-teal-500 disabled:opacity-60" />
            <button disabled={!user || busy || !draft.trim()} className="grid h-11 w-11 place-items-center rounded-2xl bg-[#063d45] text-white disabled:opacity-40" aria-label="Post comment">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button>
          </form>
          <div className="mt-5 space-y-4">
            {comments.map((comment) => {
              const author = authors[comment.authorId];
              return (
                <div key={comment.id} className="flex items-start gap-3 border-t border-slate-100 pt-4 first:border-0 first:pt-0">
                  {author ? <Link href={`/u/${author.handle}`}><SocialAvatar src={author.avatarUrl} name={author.displayName} size={38} /></Link> : <SocialAvatar name="Island member" size={38} />}
                  <div className="min-w-0 flex-1 rounded-2xl bg-slate-50 px-3 py-2.5">
                    <div className="flex items-center gap-2"><span className="text-xs font-black text-slate-900">{author?.displayName ?? "Island member"}</span>{author ? <span className="text-[10px] font-semibold text-slate-400">@{author.handle}</span> : null}</div>
                    <p className="mt-1 whitespace-pre-wrap text-sm font-medium leading-5 text-slate-700">{comment.body}</p>
                  </div>
                </div>
              );
            })}
            {!comments.length ? <p className="py-5 text-center text-sm text-slate-400">No comments yet. Start the conversation.</p> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
