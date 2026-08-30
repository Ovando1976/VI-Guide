"use client";

import Link from "next/link";
import { Check, Loader2, Lock, Settings, ShieldCheck, Sparkles, Users } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { SocialAvatar } from "@/components/social/social-avatar";
import { useSocialClient } from "@/components/social/use-social-client";
import type { PublicSocialProfile, SocialIsland } from "@/types/social";

const ISLANDS: Array<{ value: SocialIsland; label: string }> = [
  { value: "stt", label: "St. Thomas" },
  { value: "stj", label: "St. John" },
  { value: "stx", label: "St. Croix" },
  { value: "water_island", label: "Water Island" },
  { value: "diaspora", label: "USVI Diaspora" },
  { value: "visitor", label: "Visitor" },
];

export function SocialProfileScreen() {
  const { client, user, loading: authLoading } = useSocialClient();
  const [profile, setProfile] = useState<PublicSocialProfile | null>(null);
  const [form, setForm] = useState({
    handle: "",
    displayName: "",
    bio: "",
    primaryIsland: "visitor" as SocialIsland,
    interests: "",
    profession: "",
    hometown: "",
    privacyMode: "public" as "public" | "private",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    void client.myProfile()
      .then((next) => {
        if (cancelled) return;
        setProfile(next);
        setForm({
          handle: next.handle,
          displayName: next.displayName,
          bio: next.bio,
          primaryIsland: next.primaryIsland,
          interests: next.interests.join(", "),
          profession: next.profession ?? "",
          hometown: next.hometown ?? "",
          privacyMode: next.privacyMode,
        });
      })
      .catch((cause) => !cancelled && setError(cause instanceof Error ? cause.message : "Profile could not load."))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [client, user]);

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const next = await client.updateProfile({
        ...form,
        interests: form.interests.split(",").map((item) => item.trim()).filter(Boolean),
      });
      setProfile(next);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Profile could not save.");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) return <div className="grid min-h-[70vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-teal-700" /></div>;
  if (!user) return <main className="grid min-h-[80vh] place-items-center bg-[#f5f8f7] px-4"><div className="max-w-md rounded-[28px] border border-slate-200 bg-white p-7 text-center shadow-sm"><Users className="mx-auto h-8 w-8 text-teal-700" /><h1 className="mt-4 text-2xl font-black">Create your Island identity.</h1><p className="mt-2 text-sm text-slate-500">Sign in to build your profile, follow people and join conversations.</p><Link href="/login?next=%2Fprofile%2Fsocial" className="mt-5 inline-flex min-h-11 items-center rounded-full bg-[#063d45] px-5 text-sm font-black text-white">Sign in</Link></div></main>;
  if (!profile) return <main className="p-8">{error ?? "Profile unavailable."}</main>;

  return (
    <main className="min-h-[100dvh] bg-[#f5f8f7] pb-28 lg:pb-8 lg:pl-24">
      <section className="bg-[linear-gradient(135deg,#063d45,#0b807c)] px-4 pb-10 pt-8 text-white sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
            <SocialAvatar src={profile.avatarUrl} name={profile.displayName} size={92} />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#f5cd63]">Your social identity</p>
              <h1 className="mt-2 truncate text-4xl font-black tracking-[-.05em]">{profile.displayName}</h1>
              <p className="mt-1 text-sm font-semibold text-white/65">@{profile.handle}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold text-white/70">
                <span><strong className="text-white">{profile.followerCount}</strong> followers</span>
                <span><strong className="text-white">{profile.followingCount}</strong> following</span>
                <span><strong className="text-white">{profile.postCount}</strong> posts</span>
              </div>
            </div>
            <Link href={`/u/${profile.handle}`} className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 text-xs font-black">View public profile</Link>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-5 px-3 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <form onSubmit={save} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-teal-700">Profile</p><h2 className="mt-1 text-2xl font-black">How people see you</h2></div><Settings className="h-5 w-5 text-teal-700" /></div>
          {error ? <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error}</div> : null}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Display name"><input value={form.displayName} onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))} className="social-field" /></Field>
            <Field label="Handle"><div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-3"><span className="text-slate-400">@</span><input value={form.handle} onChange={(e) => setForm((f) => ({ ...f, handle: e.target.value }))} className="min-h-12 min-w-0 flex-1 bg-transparent px-1 font-semibold outline-none" /></div></Field>
            <Field label="Island identity"><select value={form.primaryIsland} onChange={(e) => setForm((f) => ({ ...f, primaryIsland: e.target.value as SocialIsland }))} className="social-field">{ISLANDS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
            <Field label="Privacy"><select value={form.privacyMode} onChange={(e) => setForm((f) => ({ ...f, privacyMode: e.target.value as "public" | "private" }))} className="social-field"><option value="public">Public profile</option><option value="private">Private · approve followers</option></select></Field>
            <Field label="Profession"><input value={form.profession} onChange={(e) => setForm((f) => ({ ...f, profession: e.target.value }))} className="social-field" /></Field>
            <Field label="Hometown"><input value={form.hometown} onChange={(e) => setForm((f) => ({ ...f, hometown: e.target.value }))} className="social-field" /></Field>
          </div>
          <Field label="Bio" className="mt-4"><textarea rows={4} maxLength={500} value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} className="social-field resize-none p-3" /></Field>
          <Field label="Interests · separated by commas" className="mt-4"><input value={form.interests} onChange={(e) => setForm((f) => ({ ...f, interests: e.target.value }))} className="social-field" /></Field>
          <button disabled={saving} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#063d45] text-sm font-black text-white disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}{saved ? "Saved" : "Save social profile"}</button>
        </form>

        <aside className="space-y-3">
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><ShieldCheck className="h-5 w-5 text-teal-700" /><h3 className="mt-3 text-sm font-black">Privacy is independent</h3><p className="mt-2 text-xs font-semibold leading-5 text-slate-500">Your social profile does not expose exact home location, private conversations or traveler memory.</p></div>
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><Lock className="h-5 w-5 text-teal-700" /><h3 className="mt-3 text-sm font-black">Travel profile remains separate</h3><p className="mt-2 text-xs font-semibold leading-5 text-slate-500">Trip preferences and AI travel memory remain available without becoming public social fields.</p><Link href="/profile" className="mt-3 inline-flex text-xs font-black text-teal-700">Open traveler settings</Link></div>
          <Link href="/chats" className="block rounded-[24px] bg-[#063d45] p-5 text-white shadow-lg"><Sparkles className="h-5 w-5 text-[#f5cd63]" /><h3 className="mt-3 text-sm font-black">Talk with Island AI</h3><p className="mt-2 text-xs font-semibold leading-5 text-white/60">Your private AI chat and social identity use separate permission scopes.</p></Link>
        </aside>
      </div>
      <style jsx>{`.social-field{min-height:3rem;width:100%;border-radius:1rem;border:1px solid rgb(226 232 240);background:rgb(248 250 252);padding:0 .85rem;font-weight:600;outline:none}.social-field:focus{border-color:rgb(13 148 136);background:white}`}</style>
    </main>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`block ${className}`}><span className="mb-2 block text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</span>{children}</label>;
}
