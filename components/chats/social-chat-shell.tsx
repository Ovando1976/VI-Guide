"use client";

import Link from "next/link";
import {
  ArrowUp,
  Bot,
  CheckCheck,
  Circle,
  ImagePlus,
  Loader2,
  MessageCircleMore,
  Mic,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import {
  ConversationClient,
  type ConversationConnectionState,
  type PersonalAiConversation,
  type PublicConversationMessage,
} from "@/lib/conversations/client";
import { readActiveIsland } from "@/lib/active-island";

const QUICK_PROMPTS = [
  "What is happening around the islands today?",
  "Help me plan something fun with friends this weekend.",
  "Give me three local conversation starters.",
  "Find a relaxed beach plan for this afternoon.",
] as const;

function messageId() {
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replace(/-/g, "")
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  return `msg_${random}`;
}

function mergeMessages(
  current: readonly PublicConversationMessage[],
  incoming: PublicConversationMessage,
) {
  const byId = new Map(current.map((message) => [message.id, message] as const));
  byId.set(incoming.id, incoming);
  return Array.from(byId.values()).sort(
    (left, right) =>
      left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id),
  );
}

function textForMessage(message: PublicConversationMessage) {
  return message.parts
    .map((part) => {
      if (part.type === "text") return part.text;
      if (part.type === "file") return `Shared file: ${part.name}`;
      if (part.type === "artifact") return `Shared ${part.artifactType}: ${part.title}`;
      if (part.type === "location") return `Shared location: ${part.name}`;
      if (part.type === "poll") return `Poll: ${part.question}`;
      if (part.type === "image") return part.alt ? `Image: ${part.alt}` : "Shared an image";
      if (part.type === "video") return part.alt ? `Video: ${part.alt}` : "Shared a video";
      if (part.type === "audio") return "Shared audio";
      return "text" in part ? part.text : "Shared media";
    })
    .join("\n");
}

function timeLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function connectionLabel(state: ConversationConnectionState) {
  if (state === "connected") return "Live";
  if (state === "connecting") return "Connecting";
  if (state === "reconnecting") return "Reconnecting";
  return "Offline";
}

export function SocialChatShell() {
  const { user, loading: authLoading } = useAuth();
  const [conversation, setConversation] = useState<PersonalAiConversation | null>(null);
  const [messages, setMessages] = useState<PublicConversationMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connection, setConnection] =
    useState<ConversationConnectionState>("offline");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const client = useMemo(
    () =>
      new ConversationClient(async () => {
        if (!user) return null;
        return user.getIdToken();
      }),
    [user],
  );

  useEffect(() => {
    if (!user) {
      setConversation(null);
      setMessages([]);
      setLoading(false);
      setConnection("offline");
      return;
    }

    let cancelled = false;
    let unsubscribe = () => {};
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const personal = await client.ensurePersonalAi();
        if (cancelled) return;
        setConversation(personal);

        const page = await client.listMessages(personal.conversationId, {
          limit: 80,
        });
        if (cancelled) return;
        setMessages([...page.messages]);

        unsubscribe = client.subscribeMessages(personal.conversationId, {
          onMessage(message) {
            if (cancelled) return;
            setMessages((current) => mergeMessages(current, message));
          },
          onState(state) {
            if (!cancelled) setConnection(state);
          },
          onError(streamError) {
            if (!cancelled) setError(streamError.message);
          },
        });
      } catch (cause) {
        if (!cancelled) {
          setError(
            cause instanceof Error ? cause.message : "Island AI could not open your chat.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [client, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, aiThinking]);

  async function sendMessage(text: string) {
    const cleaned = text.trim();
    if (!cleaned || !conversation || sending) return;

    setError(null);
    setSending(true);
    const id = messageId();
    const optimistic: PublicConversationMessage = Object.freeze({
      version: 1,
      id,
      conversationId: conversation.conversationId,
      senderParticipantId: conversation.participantId,
      parts: Object.freeze([Object.freeze({ type: "text" as const, text: cleaned })]),
      createdAt: new Date().toISOString(),
      editedAt: null,
      deletedAt: null,
      deletedByParticipantId: null,
    });
    setMessages((current) => mergeMessages(current, optimistic));
    setDraft("");

    try {
      const saved = await client.sendText(conversation.conversationId, cleaned, {
        id,
      });
      setMessages((current) => mergeMessages(current, saved));

      setAiThinking(true);
      const island = readActiveIsland();
      const reply = await client.invokeAi(conversation.conversationId, {
        assistantParticipantId: conversation.assistantParticipantId,
        invocation: "active",
        context: {
          page: "community",
          island,
        },
        capabilities: ["recommend", "plan", "knowledge"],
      });
      setMessages((current) => mergeMessages(current, reply.message));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Your message could not be completed.",
      );
    } finally {
      setAiThinking(false);
      setSending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(draft);
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(draft);
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-teal-700" />
      </div>
    );
  }

  if (!user) {
    return (
      <main className="min-h-[100dvh] bg-[radial-gradient(circle_at_top_left,_#d8f2ef,_#f5f8f7_45%,_#eef3f4)] px-4 pb-28 pt-8">
        <section className="mx-auto mt-16 max-w-xl rounded-[32px] border border-white/70 bg-white/85 p-8 text-center shadow-[0_24px_70px_rgba(6,43,58,0.14)] backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#073b4c] text-white shadow-lg">
            <MessageCircleMore className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-3xl font-black tracking-[-0.03em] text-slate-950">
            Your island conversations, in one place.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
            Sign in to open your private Island AI chat. Your conversation history stays tied to your account.
          </p>
          <Link
            href="/login?next=%2Fchats"
            className="mt-7 inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#073b4c] px-6 font-bold text-white shadow-lg transition hover:-translate-y-0.5"
          >
            Sign in to chat
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[radial-gradient(circle_at_top_left,_#d7f1ee,_#f7faf9_44%,_#edf3f4)] px-3 pb-28 pt-3 sm:px-5 sm:pt-5 lg:pb-6 lg:pl-24">
      <section className="mx-auto flex h-[calc(100dvh-7.5rem)] max-w-[1500px] overflow-hidden rounded-[28px] border border-white/80 bg-white/90 shadow-[0_24px_80px_rgba(6,43,58,0.16)] backdrop-blur-xl lg:h-[calc(100dvh-2.5rem)]">
        <aside className="hidden w-[330px] shrink-0 border-r border-slate-200/80 bg-[#f7faf9] md:flex md:flex-col">
          <div className="border-b border-slate-200/80 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-teal-700">
                  Island Social
                </p>
                <h1 className="mt-1 text-2xl font-black tracking-[-0.03em] text-slate-950">
                  Chats
                </h1>
              </div>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#073b4c] text-white shadow-sm"
                aria-label="New conversation"
                title="People and group chat creation is the next rollout"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-slate-500 shadow-sm">
              <Search className="h-4 w-4" />
              <span className="text-sm">Search conversations</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-[0_8px_24px_rgba(6,43,58,0.08)] ring-1 ring-teal-100"
            >
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#073b4c] to-[#159a9c] text-white">
                <Sparkles className="h-5 w-5" />
                <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-extrabold text-slate-950">
                    Island AI
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">Now</span>
                </div>
                <p className="mt-1 truncate text-xs text-slate-500">
                  Your private island intelligence workspace
                </p>
              </div>
            </button>

            <div className="mt-5 px-2">
              <p className="text-[10px] font-black uppercase tracking-[0.17em] text-slate-400">
                Social rollout
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-200 p-3 text-slate-500">
                  <Users className="h-5 w-5" />
                  <div>
                    <p className="text-xs font-bold text-slate-700">Group chats</p>
                    <p className="text-[11px]">Coming onto this same engine</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-200 p-3 text-slate-500">
                  <MessageCircleMore className="h-5 w-5" />
                  <div>
                    <p className="text-xs font-bold text-slate-700">Direct messages</p>
                    <p className="text-[11px]">People discovery is next</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200/80 p-4">
            <div className="flex items-center gap-3 rounded-2xl bg-[#e9f5f2] px-3 py-3">
              <ShieldCheck className="h-5 w-5 text-teal-700" />
              <div>
                <p className="text-xs font-extrabold text-slate-800">Private by default</p>
                <p className="text-[10px] leading-4 text-slate-500">
                  AI sees only the conversation context you authorize.
                </p>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-white">
          <header className="flex min-h-[74px] items-center justify-between border-b border-slate-200/80 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#073b4c] to-[#159a9c] text-white shadow-sm">
                <Bot className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-sm font-black text-slate-950 sm:text-base">
                    {conversation?.title ?? "Island AI"}
                  </h2>
                  <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-teal-700">
                    AI
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                  <Circle
                    className={`h-2.5 w-2.5 fill-current ${
                      connection === "connected"
                        ? "text-emerald-500"
                        : connection === "offline"
                          ? "text-slate-300"
                          : "text-amber-400"
                    }`}
                  />
                  {connectionLabel(connection)} · private workspace
                </div>
              </div>
            </div>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-slate-100"
              aria-label="Conversation options"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,#fbfdfd_0%,#f7fbfa_55%,#ffffff_100%)] px-4 py-5 sm:px-6 lg:px-10">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <Loader2 className="mx-auto h-7 w-7 animate-spin text-teal-700" />
                  <p className="mt-3 text-sm font-semibold text-slate-500">
                    Opening your conversation…
                  </p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="mx-auto flex min-h-full max-w-2xl flex-col justify-center py-8">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#073b4c] text-white shadow-[0_16px_35px_rgba(7,59,76,0.24)]">
                  <Sparkles className="h-7 w-7" />
                </div>
                <h3 className="mt-5 text-center text-2xl font-black tracking-[-0.03em] text-slate-950">
                  Talk to the intelligence layer for island life.
                </h3>
                <p className="mx-auto mt-2 max-w-lg text-center text-sm leading-6 text-slate-600">
                  Ask naturally. This thread is persistent, realtime, and ready to grow into shared conversations with people, groups, businesses, and communities.
                </p>
                <div className="mt-7 grid gap-2 sm:grid-cols-2">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => void sendMessage(prompt)}
                      className="rounded-2xl border border-slate-200 bg-white p-4 text-left text-sm font-semibold leading-5 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-5">
                {messages.map((message) => {
                  const mine =
                    message.senderParticipantId === conversation?.participantId;
                  const assistant =
                    message.senderParticipantId === conversation?.assistantParticipantId;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`flex max-w-[88%] gap-2.5 sm:max-w-[76%] ${mine ? "flex-row-reverse" : ""}`}>
                        <div
                          className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                            mine
                              ? "bg-slate-200 text-slate-600"
                              : "bg-gradient-to-br from-[#073b4c] to-[#159a9c] text-white"
                          }`}
                        >
                          {assistant ? (
                            <Sparkles className="h-3.5 w-3.5" />
                          ) : (
                            <span className="text-[10px] font-black">
                              {(user.displayName?.[0] ?? user.email?.[0] ?? "Y").toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div
                            className={`whitespace-pre-wrap rounded-[22px] px-4 py-3 text-sm leading-6 shadow-sm ${
                              mine
                                ? "rounded-tr-md bg-[#073b4c] text-white"
                                : "rounded-tl-md border border-slate-200/80 bg-white text-slate-800"
                            }`}
                          >
                            {textForMessage(message)}
                          </div>
                          <div
                            className={`mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-slate-400 ${
                              mine ? "justify-end" : "justify-start"
                            }`}
                          >
                            {timeLabel(message.createdAt)}
                            {mine ? <CheckCheck className="h-3 w-3" /> : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {aiThinking ? (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#073b4c] to-[#159a9c] text-white">
                        <Sparkles className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex items-center gap-1 rounded-[20px] rounded-tl-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-600" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-600 [animation-delay:120ms]" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-600 [animation-delay:240ms]" />
                      </div>
                    </div>
                  </div>
                ) : null}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          <div className="border-t border-slate-200/80 bg-white px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 sm:px-5">
            {error ? (
              <div className="mx-auto mb-2 max-w-3xl rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                {error}
              </div>
            ) : null}
            <form
              onSubmit={handleSubmit}
              className="mx-auto flex max-w-3xl items-end gap-2 rounded-[24px] border border-slate-200 bg-[#f7faf9] p-2 shadow-sm focus-within:border-teal-300 focus-within:ring-4 focus-within:ring-teal-50"
            >
              <button
                type="button"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-white"
                aria-label="Add attachment"
                title="Attachments are the next media milestone"
              >
                <Plus className="h-5 w-5" />
              </button>
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value.slice(0, 4000))}
                onKeyDown={handleComposerKeyDown}
                rows={1}
                placeholder="Message Island AI…"
                className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-1 py-2.5 text-[15px] leading-5 text-slate-900 outline-none placeholder:text-slate-400"
                aria-label="Message"
              />
              <div className="hidden items-center gap-1 sm:flex">
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-white"
                  aria-label="Add image"
                  title="Image sharing coming next"
                >
                  <ImagePlus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-white"
                  aria-label="Attach file"
                  title="File sharing coming next"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-white"
                  aria-label="Voice message"
                  title="Voice messages coming next"
                >
                  <Mic className="h-4 w-4" />
                </button>
              </div>
              <button
                type="submit"
                disabled={!draft.trim() || sending || !conversation}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#073b4c] text-white shadow-sm transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Send message"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUp className="h-5 w-5" />
                )}
              </button>
            </form>
            <p className="mx-auto mt-2 max-w-3xl text-center text-[10px] leading-4 text-slate-400">
              Island AI can make mistakes. Verify important travel, safety, and transaction details.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
