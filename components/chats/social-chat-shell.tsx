"use client";

import Link from "next/link";
import {
  ArrowUp,
  Bot,
  CheckCheck,
  Circle,
  Loader2,
  MessageCircleMore,
  Plus,
  Reply,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

import { SocialAvatar } from "@/components/social/social-avatar";
import { useAuth } from "@/components/auth-provider";
import { ConversationClient, type ConversationConnectionState, type PublicConversationMessage } from "@/lib/conversations/client";
import { readActiveIsland } from "@/lib/active-island";
import { SocialClient } from "@/lib/social/client";
import type { PublicSocialProfile, SocialConversationInboxItem } from "@/types/social";

type DescriptorParticipant = {
  id: string;
  actorType: "human" | "ai" | "business" | "system";
  role: string;
  isSelf: boolean;
  canInvokeAi: boolean;
  profile: PublicSocialProfile | null;
  label: string;
};
type ConversationDescriptor = {
  conversation: {
    id: string;
    kind: string;
    title: string | null;
    visibility: string;
    aiAccess: "off" | "mention" | "active";
    assistantParticipantIds: string[];
  };
  selfParticipantId: string;
  participants: DescriptorParticipant[];
};

function makeMessageId() {
  const random = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, "")
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  return `msg_${random}`;
}

function mergeMessages(current: readonly PublicConversationMessage[], incoming: PublicConversationMessage) {
  const byId = new Map(current.map((message) => [message.id, message] as const));
  byId.set(incoming.id, incoming);
  return Array.from(byId.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}

function messageText(message: PublicConversationMessage) {
  return message.parts.map((part) => {
    if (part.type === "text") return part.text;
    if (part.type === "file") return `Shared file: ${part.name}`;
    if (part.type === "artifact") return `Shared ${part.artifactType}: ${part.title}`;
    if (part.type === "location") return `Shared location: ${part.name}`;
    if (part.type === "poll") return `Poll: ${part.question}`;
    if (part.type === "image") return part.alt ? `Image: ${part.alt}` : "Shared an image";
    if (part.type === "video") return part.alt ? `Video: ${part.alt}` : "Shared a video";
    if (part.type === "audio") return "Shared audio";
    return "text" in part ? part.text : "Shared item";
  }).join("\n");
}

function timeLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
}

function connectionLabel(state: ConversationConnectionState) {
  return state === "connected" ? "Live" : state === "connecting" ? "Connecting" : state === "reconnecting" ? "Reconnecting" : "Offline";
}

export function SocialChatShell() {
  const { user, loading: authLoading } = useAuth();
  const conversationClient = useMemo(() => new ConversationClient(async () => user ? user.getIdToken() : null), [user]);
  const socialClient = useMemo(() => new SocialClient(async () => user ? user.getIdToken() : null), [user]);
  const [inbox, setInbox] = useState<SocialConversationInboxItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [descriptor, setDescriptor] = useState<ConversationDescriptor | null>(null);
  const [messages, setMessages] = useState<PublicConversationMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [replyTo, setReplyTo] = useState<PublicConversationMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connection, setConnection] = useState<ConversationConnectionState>("offline");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!user) { setInbox([]); setSelectedId(null); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    void socialClient.inbox(100)
      .then((items) => {
        if (cancelled) return;
        setInbox(items);
        const requested = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("conversation") : null;
        setSelectedId(requested && items.some((item) => item.conversationId === requested) ? requested : items[0]?.conversationId ?? null);
      })
      .catch((cause) => !cancelled && setError(cause instanceof Error ? cause.message : "Chats could not load."))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [socialClient, user]);

  useEffect(() => {
    if (!user || !selectedId) { setDescriptor(null); setMessages([]); return; }
    let cancelled = false;
    let unsubscribe = () => {};
    setThreadLoading(true);
    setError(null);
    void (async () => {
      try {
        const token = await user.getIdToken();
        const [page, metadataResponse] = await Promise.all([
          conversationClient.listMessages(selectedId, { limit: 100 }),
          fetch(`/api/social/conversations/${encodeURIComponent(selectedId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
        ]);
        if (!metadataResponse.ok) throw new Error("Conversation details could not load.");
        const metadata = (await metadataResponse.json()) as ConversationDescriptor;
        if (cancelled) return;
        setDescriptor(metadata);
        setMessages([...page.messages]);
        const latest = page.messages.at(-1);
        await socialClient.markConversationRead(selectedId, latest?.id ?? null).catch(() => {});
        setInbox((current) => current.map((item) => item.conversationId === selectedId ? { ...item, unreadCount: 0, lastReadMessageId: latest?.id ?? null } : item));
        unsubscribe = conversationClient.subscribeMessages(selectedId, {
          onMessage(message) {
            if (cancelled) return;
            setMessages((current) => mergeMessages(current, message));
            void socialClient.markConversationRead(selectedId, message.id).catch(() => {});
          },
          onState: (state) => !cancelled && setConnection(state),
          onError: (streamError) => !cancelled && setError(streamError.message),
        });
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Conversation could not load.");
      } finally {
        if (!cancelled) setThreadLoading(false);
      }
    })();
    return () => { cancelled = true; unsubscribe(); };
  }, [conversationClient, selectedId, socialClient, user]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages.length, aiThinking]);

  async function refreshInbox() {
    try { setInbox(await socialClient.inbox(100)); } catch {}
  }

  async function sendMessage(text: string) {
    const cleaned = text.trim();
    if (!cleaned || !selectedId || !descriptor || sending) return;
    setSending(true);
    setError(null);
    const id = makeMessageId();
    const assistantId = descriptor.conversation.assistantParticipantIds[0];
    const invokesAi = descriptor.conversation.aiAccess === "active" || (/\B@IslandAI\b/i.test(cleaned) && Boolean(assistantId));
    const optimistic: PublicConversationMessage = Object.freeze({
      version: 1,
      id,
      conversationId: selectedId,
      senderParticipantId: descriptor.selfParticipantId,
      parts: Object.freeze([Object.freeze({ type: "text" as const, text: cleaned })]),
      ...(replyTo ? { replyToMessageId: replyTo.id } : {}),
      ...(invokesAi && assistantId && descriptor.conversation.aiAccess === "mention" ? { mentions: Object.freeze([assistantId]) } : {}),
      createdAt: new Date().toISOString(),
      editedAt: null,
      deletedAt: null,
      deletedByParticipantId: null,
    });
    setMessages((current) => mergeMessages(current, optimistic));
    setDraft("");
    setReplyTo(null);

    try {
      const saved = await conversationClient.sendText(selectedId, cleaned, {
        id,
        ...(optimistic.replyToMessageId ? { replyToMessageId: optimistic.replyToMessageId } : {}),
        ...(optimistic.mentions?.length ? { mentions: optimistic.mentions } : {}),
      });
      setMessages((current) => mergeMessages(current, saved));
      await refreshInbox();
      if (invokesAi && assistantId) {
        setAiThinking(true);
        const reply = await conversationClient.invokeAi(selectedId, {
          assistantParticipantId: assistantId,
          invocation: descriptor.conversation.aiAccess === "active" ? "active" : "mention",
          ...(descriptor.conversation.aiAccess === "mention" ? { invocationMessageId: saved.id } : {}),
          context: { page: "community", island: readActiveIsland() },
          capabilities: ["recommend", "plan", "knowledge"],
        });
        setMessages((current) => mergeMessages(current, reply.message));
        await refreshInbox();
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Message could not be completed.");
    } finally {
      setAiThinking(false);
      setSending(false);
    }
  }

  function submit(event: FormEvent) { event.preventDefault(); void sendMessage(draft); }
  function keyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(draft); }
  }

  if (authLoading || loading) return <div className="grid min-h-[75vh] place-items-center bg-[#f5f8f7]"><Loader2 className="h-6 w-6 animate-spin text-teal-700" /></div>;
  if (!user) return <main className="grid min-h-[85vh] place-items-center bg-[#f5f8f7] px-4"><div className="max-w-md rounded-[30px] border border-slate-200 bg-white p-8 text-center shadow-sm"><MessageCircleMore className="mx-auto h-8 w-8 text-teal-700" /><h1 className="mt-4 text-2xl font-black">Your conversations live here.</h1><p className="mt-2 text-sm leading-6 text-slate-500">Sign in for DMs, groups, communities and Island AI.</p><Link href="/login?next=%2Fchats" className="mt-5 inline-flex min-h-11 items-center rounded-full bg-[#063d45] px-5 text-sm font-black text-white">Sign in</Link></div></main>;

  const filteredInbox = inbox.filter((item) => `${item.title} ${item.lastMessagePreview ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  const selectedInbox = inbox.find((item) => item.conversationId === selectedId) ?? null;
  const participantMap = new Map(descriptor?.participants.map((participant) => [participant.id, participant]) ?? []);

  return (
    <main className="min-h-[100dvh] bg-[#edf4f3] px-2 pb-24 pt-2 lg:pb-3 lg:pl-24">
      <section className="mx-auto flex h-[calc(100dvh-6.5rem)] max-w-[1500px] overflow-hidden rounded-[26px] border border-white bg-white shadow-[0_20px_70px_rgba(5,48,54,.14)] lg:h-[calc(100dvh-1.5rem)]">
        <aside className={`${selectedId ? "hidden md:flex" : "flex"} w-full shrink-0 flex-col border-r border-slate-200 bg-[#f8fbfa] md:w-[340px]`}>
          <div className="border-b border-slate-200 p-4">
            <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-teal-700">Island Social</p><h1 className="mt-1 text-2xl font-black">Chats</h1></div><Link href="/create?type=group" className="grid h-10 w-10 place-items-center rounded-2xl bg-[#063d45] text-white" aria-label="New group"><Plus className="h-5 w-5" /></Link></div>
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3"><Search className="h-4 w-4 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations" className="min-h-11 min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none" /></div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {filteredInbox.map((item) => (
              <button key={item.conversationId} type="button" onClick={() => { setSelectedId(item.conversationId); if (history.replaceState) history.replaceState(null, "", `/chats?conversation=${encodeURIComponent(item.conversationId)}`); }} className={`mb-1 flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${selectedId === item.conversationId ? "bg-white shadow-sm ring-1 ring-teal-100" : "hover:bg-white"}`}>
                {item.kind === "ai_private" ? <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#063d45] to-[#129a98] text-white"><Sparkles className="h-5 w-5" /></span> : item.imageUrl ? <SocialAvatar src={item.imageUrl} name={item.title} size={48} /> : <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#e2f2ef] text-teal-700">{item.kind === "group" || item.kind === "community" ? <Users className="h-5 w-5" /> : <MessageCircleMore className="h-5 w-5" />}</span>}
                <span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><strong className="truncate text-sm">{item.title}</strong>{item.unreadCount ? <span className="grid min-w-5 place-items-center rounded-full bg-teal-700 px-1.5 py-0.5 text-[9px] font-black text-white">{item.unreadCount}</span> : null}</span><span className="mt-1 block truncate text-[11px] font-medium text-slate-400">{item.lastMessagePreview ?? (item.kind === "ai_private" ? "Your private Island AI workspace" : "Start the conversation")}</span></span>
              </button>
            ))}
            <Link href="/discover?tab=people" className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 p-3 text-xs font-black text-teal-700"><Plus className="h-4 w-4" /> Find someone to message</Link>
          </div>
          <div className="border-t border-slate-200 p-3"><div className="flex items-center gap-2 rounded-2xl bg-[#e9f5f2] p-3 text-[10px] font-semibold leading-4 text-slate-500"><ShieldCheck className="h-4 w-4 shrink-0 text-teal-700" /> Private conversation context stays scoped to its participants.</div></div>
        </aside>

        <div className={`${selectedId ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col`}>
          {selectedId && selectedInbox ? <>
            <header className="flex min-h-[70px] items-center justify-between border-b border-slate-200 px-3 sm:px-5">
              <div className="flex min-w-0 items-center gap-3"><button type="button" onClick={() => setSelectedId(null)} className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 md:hidden"><X className="h-4 w-4" /></button>{selectedInbox.kind === "ai_private" ? <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#063d45] text-white"><Bot className="h-5 w-5" /></span> : <SocialAvatar src={selectedInbox.imageUrl} name={selectedInbox.title} size={42} />}<div className="min-w-0"><h2 className="truncate text-sm font-black sm:text-base">{selectedInbox.title}</h2><p className="mt-0.5 flex items-center gap-1.5 text-[10px] font-bold text-slate-400"><Circle className={`h-2.5 w-2.5 ${connection === "connected" ? "fill-emerald-500 text-emerald-500" : "fill-slate-300 text-slate-300"}`} />{connectionLabel(connection)}{descriptor?.conversation.aiAccess !== "off" ? " · Island AI available" : ""}</p></div></div>
              <Link href="/discover" className="rounded-full bg-slate-100 px-3 py-2 text-[10px] font-black text-slate-600">People</Link>
            </header>

            <div className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,#fbfdfc,#f5f9f8)] px-3 py-5 sm:px-6">
              {threadLoading ? <div className="grid h-full place-items-center"><Loader2 className="h-6 w-6 animate-spin text-teal-700" /></div> : <div className="mx-auto max-w-3xl space-y-3">
                {messages.map((message) => {
                  const sender = participantMap.get(message.senderParticipantId);
                  const self = message.senderParticipantId === descriptor?.selfParticipantId;
                  const ai = sender?.actorType === "ai";
                  const replied = message.replyToMessageId ? messages.find((item) => item.id === message.replyToMessageId) : null;
                  return <div key={message.id} className={`group flex items-end gap-2 ${self ? "justify-end" : "justify-start"}`}>
                    {!self ? (ai ? <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#063d45] text-white"><Sparkles className="h-3.5 w-3.5" /></span> : <SocialAvatar src={sender?.profile?.avatarUrl} name={sender?.label ?? "Island member"} size={32} />) : null}
                    <div className={`max-w-[85%] ${self ? "items-end" : "items-start"} flex flex-col`}>
                      {!self ? <span className="mb-1 px-1 text-[9px] font-black uppercase tracking-wide text-slate-400">{sender?.label ?? "Member"}</span> : null}
                      <div className={`rounded-[20px] px-4 py-3 text-sm font-medium leading-5 shadow-sm ${self ? "rounded-br-md bg-[#063d45] text-white" : ai ? "rounded-bl-md border border-teal-100 bg-[#eaf7f4] text-slate-800" : "rounded-bl-md border border-slate-200 bg-white text-slate-800"}`}>
                        {replied ? <div className={`mb-2 border-l-2 pl-2 text-[10px] ${self ? "border-white/30 text-white/55" : "border-teal-400 text-slate-400"}`}>{messageText(replied).slice(0, 100)}</div> : null}
                        <p className="whitespace-pre-wrap">{messageText(message)}</p>
                      </div>
                      <div className="mt-1 flex items-center gap-2 px-1 text-[9px] font-semibold text-slate-400"><span>{timeLabel(message.createdAt)}</span>{self ? <CheckCheck className="h-3 w-3" /> : null}<button type="button" onClick={() => setReplyTo(message)} className="opacity-0 transition group-hover:opacity-100"><Reply className="h-3 w-3" /></button></div>
                    </div>
                  </div>;
                })}
                {aiThinking ? <div className="flex items-center gap-2 text-xs font-bold text-teal-700"><Loader2 className="h-4 w-4 animate-spin" /> Island AI is thinking…</div> : null}
                <div ref={bottomRef} />
              </div>}
            </div>

            <div className="border-t border-slate-200 bg-white p-3 sm:p-4">
              {error ? <div className="mx-auto mb-2 max-w-3xl rounded-xl bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-700">{error}</div> : null}
              {replyTo ? <div className="mx-auto mb-2 flex max-w-3xl items-center justify-between rounded-xl bg-slate-100 px-3 py-2 text-[10px] font-semibold text-slate-500"><span className="truncate">Replying to: {messageText(replyTo).slice(0, 100)}</span><button type="button" onClick={() => setReplyTo(null)}><X className="h-3.5 w-3.5" /></button></div> : null}
              <form onSubmit={submit} className="mx-auto flex max-w-3xl items-end gap-2 rounded-[22px] border border-slate-200 bg-slate-50 p-2 focus-within:border-teal-400 focus-within:bg-white">
                <textarea value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={keyDown} rows={1} maxLength={4000} placeholder={descriptor?.conversation.aiAccess === "mention" ? "Message… or mention @IslandAI" : "Message…"} className="max-h-32 min-h-10 min-w-0 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm font-medium outline-none" />
                <button disabled={!draft.trim() || sending} className="grid h-10 w-10 place-items-center rounded-2xl bg-[#063d45] text-white disabled:opacity-40">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-5 w-5" />}</button>
              </form>
            </div>
          </> : <div className="grid h-full place-items-center p-8 text-center"><div><MessageCircleMore className="mx-auto h-10 w-10 text-teal-700" /><h2 className="mt-4 text-2xl font-black">Choose a conversation</h2><p className="mt-2 text-sm text-slate-500">Your DMs, groups, communities and Island AI all use the same conversation engine.</p></div></div>}
        </div>
      </section>
    </main>
  );
}
