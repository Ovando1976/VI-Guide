"use client";

import Link from "next/link";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { useSocialClient } from "@/components/social/use-social-client";
import type { SocialNotification } from "@/types/social";

export function SocialNotificationsScreen() {
  const { client, user, loading: authLoading } = useSocialClient();
  const [notifications, setNotifications] = useState<SocialNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    void client.notifications(80)
      .then((data) => { if (!cancelled) { setNotifications(data.notifications); setUnreadCount(data.unreadCount); } })
      .catch((cause) => !cancelled && setError(cause instanceof Error ? cause.message : "Notifications could not load."))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [client, user]);

  async function openNotification(notification: SocialNotification) {
    if (!notification.readAt) {
      try { await client.readNotification(notification.id); } catch {}
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item));
      setUnreadCount((count) => Math.max(0, count - 1));
    }
  }

  if (authLoading || loading) return <div className="grid min-h-[70vh] place-items-center bg-[#f5f8f7]"><Loader2 className="h-6 w-6 animate-spin text-teal-700" /></div>;
  if (!user) return <main className="grid min-h-[75vh] place-items-center bg-[#f5f8f7] px-4"><Link href="/login?next=%2Fnotifications" className="rounded-full bg-[#063d45] px-5 py-3 text-sm font-black text-white">Sign in to see notifications</Link></main>;

  return (
    <main className="min-h-[100dvh] bg-[#f5f8f7] pb-28 lg:pb-8 lg:pl-24">
      <header className="border-b border-slate-200 bg-white px-4 py-6 sm:px-6"><div className="mx-auto flex max-w-3xl items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.17em] text-teal-700">Your network</p><h1 className="mt-1 text-3xl font-black tracking-[-.04em]">Notifications</h1></div><div className="flex items-center gap-2 rounded-full bg-teal-50 px-3 py-2 text-xs font-black text-teal-700"><Bell className="h-4 w-4" /> {unreadCount} unread</div></div></header>
      <section className="mx-auto max-w-3xl px-3 py-5 sm:px-6">
        {error ? <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error}</div> : null}
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          {notifications.map((notification, index) => {
            const content = <div className={`flex items-start gap-3 p-4 sm:p-5 ${notification.readAt ? "bg-white" : "bg-teal-50/60"}`}><span className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${notification.readAt ? "bg-slate-100 text-slate-500" : "bg-teal-700 text-white"}`}>{notification.readAt ? <CheckCheck className="h-4 w-4" /> : <Bell className="h-4 w-4" />}</span><span className="min-w-0 flex-1"><span className="block text-sm font-black text-slate-900">{notification.title}</span><span className="mt-1 block text-xs font-medium leading-5 text-slate-500">{notification.body}</span><span className="mt-2 block text-[10px] font-semibold text-slate-400">{new Date(notification.createdAt).toLocaleString()}</span></span></div>;
            return notification.href ? <Link key={notification.id} href={notification.href} onClick={() => void openNotification(notification)} className={`block ${index ? "border-t border-slate-100" : ""}`}>{content}</Link> : <button key={notification.id} type="button" onClick={() => void openNotification(notification)} className={`block w-full text-left ${index ? "border-t border-slate-100" : ""}`}>{content}</button>;
          })}
          {!notifications.length ? <div className="p-8 text-center text-sm font-semibold text-slate-400">Nothing needs your attention yet.</div> : null}
        </div>
      </section>
    </main>
  );
}
