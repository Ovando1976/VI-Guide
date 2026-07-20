"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { BookOpenCheck, Send, Sparkles, X } from "lucide-react";

import type {
  ConciergeChatRequest,
  ConciergeContext,
  ConciergeMessage,
  ConciergeReply,
} from "@/types/concierge";

const PROMPTS = [
  "Plan a grounded heritage half-day",
  "Which historic places should I start with?",
  "Build a route that stays on this island",
] as const;

function createId(prefix: string) {
  const random = typeof crypto?.randomUUID === "function"
    ? crypto.randomUUID().replace(/-/g, "")
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${random}`;
}

export function HeritageConcierge({
  island,
  islandName,
}: {
  island: "stt" | "stj" | "stx";
  islandName: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ConciergeMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientId = useMemo(() => createId("heritage_client"), []);
  const sessionId = useMemo(() => createId("heritage_session"), []);
  const requestRef = useRef<AbortController | null>(null);

  async function send(messageOverride?: string) {
    const text = (messageOverride ?? draft).trim();
    if (!text || loading) return;

    const userMessage: ConciergeMessage = {
      id: createId("message"),
      role: "user",
      text,
      createdAt: new Date().toISOString(),
    };

    const nextMessages = [...messages, userMessage];
    const context: ConciergeContext = {
      island,
      islandName,
      selectedEstate: null,
      pickup: null,
      destination: null,
      rideMode: "direct",
      passengers: 1,
      luggage: 0,
      activeLens: "heritage",
      nearbyEstates: [],
    };

    const body: ConciergeChatRequest = {
      clientId,
      sessionId,
      idempotencyKey: createId("request"),
      message: text,
      context,
      recentMessages: nextMessages.slice(-8),
    };

    const controller = new AbortController();
    requestRef.current?.abort();
    requestRef.current = controller;
    setMessages(nextMessages);
    setDraft("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/concierge/heritage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const payload = (await response.json().catch(() => null)) as
        | ConciergeReply
        | { error?: string }
        | null;

      if (!response.ok || !payload || !("message" in payload)) {
        throw new Error(payload && "error" in payload ? payload.error : "The heritage guide could not respond.");
      }

      setMessages((current) => [...current, payload.message]);
    } catch (requestError) {
      if (controller.signal.aborted) return;
      setError(requestError instanceof Error ? requestError.message : "The heritage guide could not respond.");
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
      setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-[9998] inline-flex items-center gap-3 rounded-2xl border border-amber-100/20 bg-[#043331] px-3 py-3 text-white shadow-[0_20px_70px_rgba(4,51,49,.35)] transition hover:-translate-y-0.5 sm:bottom-6 sm:right-6"
      >
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f5c451] text-[#043331]"><BookOpenCheck size={19} /></span>
        <span className="hidden text-left sm:block"><small className="block text-[9px] font-black uppercase tracking-[.18em] text-white/45">Source-aware AI</small><strong className="block text-sm">Ask Heritage Guide</strong></span>
      </button>
    );
  }

  return (
    <section className="fixed inset-0 z-[9998] flex flex-col overflow-hidden bg-[#061c1b] text-white sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[min(700px,calc(100vh-48px))] sm:w-[430px] sm:rounded-[30px] sm:border sm:border-white/10 sm:shadow-[0_35px_100px_rgba(0,0,0,.55)]" role="dialog" aria-modal="true" aria-label="VI Guide Heritage Concierge">
      <header className="flex items-start justify-between border-b border-white/10 bg-[#082b29] px-5 pb-4 pt-[max(18px,env(safe-area-inset-top))] sm:p-5">
        <div className="flex gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f5c451] text-[#043331]"><Sparkles size={20} /></span><div><h2 className="font-black">Heritage Concierge</h2><p className="mt-1 text-xs text-white/45">Reviewed {islandName} records · uncertainty labeled</p></div></div>
        <button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl text-white/45 hover:bg-white/10 hover:text-white" aria-label="Close Heritage Concierge"><X size={18} /></button>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5" aria-live="polite">
        {!messages.length ? (
          <div className="rounded-[24px] border border-white/10 bg-white/[.05] p-5"><p className="text-sm font-semibold leading-6 text-white/70">Ask about reviewed historic places or build a realistic island heritage route. I will identify gaps instead of inventing missing dates, people, or claims.</p><div className="mt-4 grid gap-2">{PROMPTS.map((prompt) => <button key={prompt} type="button" onClick={() => void send(prompt)} className="rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3 text-left text-xs font-bold text-white/65 hover:border-amber-200/25 hover:text-white">{prompt}</button>)}</div></div>
        ) : null}
        {messages.map((message) => <article key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[88%] rounded-2xl px-4 py-3 text-[13px] font-semibold leading-6 ${message.role === "user" ? "rounded-tr-md bg-[#f5c451] text-[#043331]" : "rounded-tl-md border border-white/10 bg-white/[.05] text-white/75"}`}><p className="whitespace-pre-wrap">{message.text}</p></div></article>)}
        {loading ? <p className="text-xs font-bold text-amber-100/55">Reviewing the available heritage evidence…</p> : null}
        {error ? <div className="rounded-2xl border border-rose-300/20 bg-rose-300/[.07] p-3 text-xs text-rose-100">{error}</div> : null}
      </div>

      <footer className="border-t border-white/10 bg-[#082522] px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-4 sm:p-4"><form onSubmit={submit} className="flex items-end gap-2"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={1} maxLength={3000} disabled={loading} placeholder="Ask about a historic place or route…" className="max-h-28 min-h-12 flex-1 resize-none rounded-2xl border border-white/10 bg-white/[.06] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-amber-200/35" /><button type="submit" disabled={!draft.trim() || loading} className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f5c451] text-[#043331] disabled:opacity-35" aria-label="Send heritage question"><Send size={18} /></button></form><p className="mt-2 text-center text-[9px] text-white/25">Reviewed records guide the answer. Missing evidence is labeled, not invented.</p></footer>
    </section>
  );
}
