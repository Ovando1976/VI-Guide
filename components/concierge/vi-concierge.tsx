"use client";

import { useRouter } from "next/navigation";
import {
  Bot,
  Brain,
  Gauge,
  MapPin,
  Route,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import type {
  ConciergeAction,
  ConciergeChatRequest,
  ConciergeContext,
  ConciergeMessage,
  ConciergeReply,
} from "@/types/concierge";

type Props = {
  context: ConciergeContext;
  onSelectEstate: (geoid: string) => void;
  onSetPickup: (geoid: string) => void;
  onSetDestination: (geoid: string) => void;
  placement?: "left" | "right";
  initiallyOpen?: boolean;
};

const STORAGE_KEY = "vi-guide-concierge-v1";
const STARTER_PROMPTS = [
  "Plan a relaxed half-day near me",
  "Find a beach and arrange the taxi route",
  "Compare two areas for dinner",
  "Help with an airport or ferry transfer",
] as const;

function createId(prefix: string) {
  const randomPart =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID().replace(/-/g, "")
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;

  return `${prefix}_${randomPart}`;
}

function createWelcomeMessage(): ConciergeMessage {
  return {
    id: createId("message"),
    role: "assistant",
    text: "Tell me what kind of island day you want. I can use the live map, local directory, and official USVI taxi context to recommend places, compare areas, and prepare a practical route. I’ll never book, dispatch, or spend without your review.",
    createdAt: new Date().toISOString(),
  };
}

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function ViConcierge({
  context,
  onSelectEstate,
  onSetPickup,
  onSetDestination,
  placement = "right",
  initiallyOpen = false,
}: Props) {
  const router = useRouter();

  const [open, setOpen] = useState(initiallyOpen);

  useEffect(() => {
    if (initiallyOpen) setOpen(true);
  }, [initiallyOpen]);
  const [clientId, setClientId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<ConciergeMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastReply, setLastReply] = useState<ConciergeReply | null>(null);
  const [executedActions, setExecutedActions] = useState<Set<string>>(
    () => new Set(),
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (raw) {
        const stored = JSON.parse(raw) as {
          clientId?: string;
          sessionId?: string;
          messages?: ConciergeMessage[];
        };

        if (
          typeof stored.clientId === "string" &&
          typeof stored.sessionId === "string"
        ) {
          setClientId(stored.clientId);
          setSessionId(stored.sessionId);
          setMessages(
            Array.isArray(stored.messages) && stored.messages.length
              ? stored.messages.slice(-40)
              : [createWelcomeMessage()],
          );
          return;
        }
      }
    } catch {
      // Continue with an in-memory session.
    }

    setClientId(createId("client"));
    setSessionId(createId("session"));
    setMessages([createWelcomeMessage()]);
  }, []);

  useEffect(() => {
    if (!clientId || !sessionId) return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          clientId,
          sessionId,
          messages: messages.slice(-40),
        }),
      );
    } catch {
      // Continue without persistent browser storage.
    }
  }, [clientId, sessionId, messages]);

  useEffect(() => {
    if (!open) return;

    const frame = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });

      inputRef.current?.focus();
    });

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, messages.length, loading]);

  useEffect(() => {
    return () => requestRef.current?.abort();
  }, []);

  const contextLabel = useMemo(() => {
    if (context.pickup && context.destination) {
      return `${context.pickup.name} → ${context.destination.name}`;
    }

    return context.selectedEstate?.name ?? context.islandName;
  }, [context]);

  async function sendMessage(messageOverride?: string) {
    const text = (messageOverride ?? draft).trim();

    if (!text || loading || !clientId || !sessionId) {
      return;
    }

    const userMessage: ConciergeMessage = {
      id: createId("message"),
      role: "user",
      text,
      createdAt: new Date().toISOString(),
    };

    const nextMessages = [...messages, userMessage];

    const body: ConciergeChatRequest = {
      clientId,
      sessionId,
      idempotencyKey: createId("request"),
      message: text,
      context,
      recentMessages: nextMessages.slice(-10),
    };

    const controller = new AbortController();
    requestRef.current = controller;

    setMessages(nextMessages);
    setDraft("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/concierge/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const payload = (await response.json().catch(() => null)) as
        | ConciergeReply
        | { error?: string }
        | null;

      if (!response.ok || !payload || !("message" in payload)) {
        const message =
          payload && "error" in payload
            ? payload.error
            : "The concierge could not respond.";

        throw new Error(message || "The concierge could not respond.");
      }

      setLastReply(payload);
      setMessages((current) => [...current, payload.message]);
    } catch (requestError) {
      if (controller.signal.aborted) return;

      setError(
        requestError instanceof Error
          ? requestError.message
          : "The concierge could not respond.",
      );
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
      }

      setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  function executeAction(action: ConciergeAction) {
    if (action.requiresApproval) return;

    switch (action.type) {
      case "select_estate":
        if (action.geoid) onSelectEstate(action.geoid);
        break;

      case "set_pickup":
        if (action.geoid) onSetPickup(action.geoid);
        break;

      case "set_destination":
        if (action.geoid) onSetDestination(action.geoid);
        break;

      case "open_estate":
      case "open_mobility":
        if (action.href) router.push(action.href);
        break;
    }

    setExecutedActions((current) => {
      const next = new Set(current);
      next.add(action.id);
      return next;
    });
  }

  function startNewSession() {
    requestRef.current?.abort();

    setSessionId(createId("session"));
    setMessages([createWelcomeMessage()]);
    setLastReply(null);
    setExecutedActions(new Set());
    setError(null);
  }

  const horizontalClass =
    placement === "left" ? "left-4 md:left-6" : "right-4 md:right-6";

  const panelHorizontalClass =
    placement === "left" ? "sm:left-5" : "sm:right-5";

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[9999] flex items-center gap-3 rounded-2xl border border-cyan-200/20 bg-[#0a2530] px-2 py-2 text-left text-white shadow-[0_20px_60px_rgba(0,0,0,0.5)] transition hover:-translate-y-0.5 hover:bg-[#0d303d] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:bottom-5 sm:px-4 sm:py-3 md:bottom-6 ${horizontalClass}`}
          aria-label="Open VI Guide Concierge"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-300 to-teal-300 text-[#05242b]">
            <Sparkles size={19} strokeWidth={2.4} />
          </span>

          <span className="hidden sm:block">
            <span className="block text-[9px] font-extrabold uppercase tracking-[0.18em] text-cyan-200/60">
              VI Guide
            </span>

            <span className="mt-0.5 block text-sm font-extrabold">
              Ask the concierge
            </span>
          </span>
        </button>
      ) : null}

      {open ? (
        <section
          className={`fixed inset-0 z-[9999] flex flex-col overflow-hidden border-white/10 bg-[#06131b] text-white shadow-[0_30px_100px_rgba(0,0,0,0.7)] sm:inset-auto sm:bottom-5 sm:h-[min(760px,calc(100vh-40px))] sm:w-[430px] sm:rounded-[28px] sm:border ${panelHorizontalClass}`}
          role="dialog"
          aria-modal="true"
          aria-label="VI Guide Concierge"
        >
          <header className="shrink-0 border-b border-white/10 bg-[#081b24] px-4 pb-4 pt-[max(16px,env(safe-area-inset-top))] sm:p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 to-teal-300 text-[#06242a]">
                  <Bot size={21} />
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-base font-extrabold">
                      VI Guide Concierge
                    </h2>

                    <span className="h-2 w-2 rounded-full bg-emerald-300" />
                  </div>

                  <p className="mt-0.5 truncate text-xs text-white/45">
                    Live context · {contextLabel}
                  </p>
                </div>
              </div>

              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={startNewSession}
                  className="grid h-9 w-9 place-items-center rounded-xl text-white/45 transition hover:bg-white/10 hover:text-white"
                  aria-label="Start a new session"
                >
                  <Sparkles size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-xl text-white/45 transition hover:bg-white/10 hover:text-white"
                  aria-label="Close concierge"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-1.5">
              <StatusPill icon={<Brain size={12} />} label="Live directory" />

              <StatusPill
                icon={<Gauge size={12} />}
                label="Official taxi context"
              />

              <StatusPill
                icon={<ShieldCheck size={12} />}
                label="Review before booking"
              />
            </div>
          </header>

          <div
            ref={scrollRef}
            className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5"
            aria-live="polite"
          >
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {messages.length === 1 && !loading ? (
              <div className="space-y-2 pl-9">
                <div className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-white/30">
                  Try asking
                </div>
                <div className="grid gap-2">
                  {STARTER_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => void sendMessage(prompt)}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3 text-left text-xs font-bold text-white/70 transition hover:border-cyan-300/25 hover:bg-cyan-300/[.07] hover:text-white"
                    >
                      <span>{prompt}</span>
                      <span className="text-cyan-200">→</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {lastReply?.actions.length ? (
              <div className="space-y-2 pl-9">
                <div className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-white/30">
                  Available actions · reversible
                </div>

                {lastReply.actions.map((action) => {
                  const executed = executedActions.has(action.id);

                  return (
                    <button
                      key={action.id}
                      type="button"
                      disabled={executed || action.requiresApproval}
                      onClick={() => executeAction(action)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3 text-left transition hover:border-cyan-300/25 hover:bg-cyan-300/[0.07] disabled:opacity-50"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200">
                        {action.type === "open_mobility" ? (
                          <Route size={15} />
                        ) : (
                          <MapPin size={15} />
                        )}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-extrabold text-white/85">
                          {executed ? "Applied" : action.label}
                        </span>

                        <span className="mt-0.5 block truncate text-[10px] text-white/35">
                          {action.rationale}
                        </span>
                      </span>

                      <span className="text-white/25">→</span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {loading ? (
              <div className="flex items-center gap-3 text-xs text-white/45">
                <span className="flex gap-1">
                  {[0, 1, 2].map((item) => (
                    <span
                      key={item}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300"
                      style={{ animationDelay: `${item * 120}ms` }}
                    />
                  ))}
                </span>
                Shaping a grounded island plan…
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-rose-300/20 bg-rose-300/[0.07] p-3 text-xs text-rose-100">
                {error}
              </div>
            ) : null}
          </div>

          <footer className="shrink-0 border-t border-white/10 bg-[#081720] px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 sm:p-3">
            {lastReply?.suggestions.length ? (
              <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
                {lastReply.suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    disabled={loading}
                    onClick={() => void sendMessage(suggestion)}
                    className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-bold text-white/55 hover:bg-white/10 hover:text-white"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}

            <form onSubmit={submit} className="flex items-end gap-2">
              <label className="min-w-0 flex-1">
                <span className="sr-only">Message the VI Guide Concierge</span>

                <textarea
                  ref={inputRef}
                  value={draft}
                  maxLength={3000}
                  rows={1}
                  disabled={loading}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      if (draft.trim() && !loading) void sendMessage();
                    }
                  }}
                  placeholder="Ask for a place, plan, comparison, or taxi route…"
                  className="max-h-28 min-h-11 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-cyan-300/40 focus:ring-4 focus:ring-cyan-300/10"
                />
              </label>

              <button
                type="submit"
                disabled={!draft.trim() || loading}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-300 text-[#05232b] hover:bg-cyan-200 disabled:opacity-35"
                aria-label="Send message"
              >
                <Send size={17} />
              </button>
            </form>

            <p className="mt-2 text-center text-[9px] text-white/25">
              Taxi fares follow the official USVI rate structure. Final dispatch
              and booking always require review.
            </p>
          </footer>
        </section>
      ) : null}
    </>
  );
}

function MessageBubble({ message }: { message: ConciergeMessage }) {
  const assistant = message.role === "assistant";

  return (
    <article
      className={`flex gap-2.5 ${assistant ? "items-start" : "justify-end"}`}
    >
      {assistant ? (
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200">
          <Sparkles size={13} />
        </span>
      ) : null}

      <div
        className={`max-w-[84%] rounded-2xl px-3.5 py-3 ${
          assistant
            ? "rounded-tl-md border border-white/10 bg-white/[0.045] text-white/75"
            : "rounded-tr-md bg-cyan-300 text-[#05242c]"
        }`}
      >
        <p className="whitespace-pre-wrap text-[13px] leading-[1.55]">
          {message.text}
        </p>

        <time
          dateTime={message.createdAt}
          className={`mt-1.5 block text-[9px] ${
            assistant ? "text-white/25" : "text-[#05242c]/45"
          }`}
        >
          {formatTime(message.createdAt)}
        </time>
      </div>
    </article>
  );
}

function StatusPill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-2 py-2 text-[8px] font-bold text-white/45">
      <span className="shrink-0 text-cyan-200/60">{icon}</span>

      <span className="truncate">{label}</span>
    </div>
  );
}
