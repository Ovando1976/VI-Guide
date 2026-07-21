"use client";

import { useRouter } from "next/navigation";
import {
  Bot,
  Brain,
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
} from "react";

import { StructuredPlanRenderer } from "@/components/intelligence/structured-plan-renderer";
import {
  askViIntelligence,
  feedIntelligenceContext,
} from "@/lib/intelligence/client";
import type { ConciergeContext, ConciergeMessage } from "@/types/concierge";
import type {
  IntelligenceAction,
  IntelligenceLocation,
  IntelligenceResponse,
} from "@/types/intelligence";

type Props = {
  context: ConciergeContext;
  onSelectEstate: (geoid: string) => void;
  onSetPickup: (geoid: string) => void;
  onSetDestination: (geoid: string) => void;
  placement?: "left" | "right";
  initiallyOpen?: boolean;
};

const STORAGE_KEY = "vi-guide-concierge-v2";
const SAVED_PLAN_KEY = "vi-guide.intelligence.saved-plans";
const STARTER_PROMPTS = [
  "Plan a relaxed half-day near me",
  "Plan my day after the cruise",
  "Find a beach and arrange the taxi route",
  "Build a history, food, and shopping day",
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
    text: "Tell me the island day you want. I use the same VI Guide intelligence as Map, Search, Heritage, Mobility, and saved plans, so the answer can include places, timing, routes, and reviewable actions in one result.",
    createdAt: new Date().toISOString(),
  };
}

function estateLocation(
  estate: ConciergeContext["selectedEstate"],
  island: ConciergeContext["island"],
): IntelligenceLocation | undefined {
  return estate
    ? { id: estate.geoid, name: estate.name, island, kind: "estate" }
    : undefined;
}

function readSavedPlans() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVED_PLAN_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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
  const [messages, setMessages] = useState<ConciergeMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<IntelligenceResponse | null>(null);
  const [completedActions, setCompletedActions] = useState<Set<string>>(
    () => new Set(),
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setOpen((current) => current || initiallyOpen);
  }, [initiallyOpen]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as {
        messages?: ConciergeMessage[];
      } | null;
      setMessages(
        stored?.messages?.length
          ? stored.messages.slice(-40)
          : [createWelcomeMessage()],
      );
    } catch {
      setMessages([createWelcomeMessage()]);
    }
  }, []);

  useEffect(() => {
    if (!messages.length) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ messages: messages.slice(-40) }),
    );
  }, [messages]);

  useEffect(() => {
    feedIntelligenceContext("concierge", {
      island: context.island,
      selectedPlace: estateLocation(context.selectedEstate, context.island),
      pickup: estateLocation(context.pickup, context.island),
      destination: estateLocation(context.destination, context.island),
      party: {
        adults: context.passengers,
        children: 0,
        accessibilityNeeds: [],
      },
      preferences: {
        interests: [context.activeLens, context.rideMode].filter(Boolean),
      },
    });
  }, [context]);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
      inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [loading, messages.length, open, response]);

  const contextLabel = useMemo(() => {
    if (context.pickup && context.destination) {
      return `${context.pickup.name} → ${context.destination.name}`;
    }
    return context.selectedEstate?.name ?? context.islandName;
  }, [context]);

  async function sendMessage(messageOverride?: string) {
    const text = (messageOverride ?? draft).trim();
    if (!text || loading) return;

    const userMessage: ConciergeMessage = {
      id: createId("message"),
      role: "user",
      text,
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setLoading(true);
    setError(null);
    setResponse(null);
    setCompletedActions(new Set());

    try {
      const result = await askViIntelligence(
        text,
        {
          page: "concierge",
          island: context.island,
          selectedPlace: estateLocation(context.selectedEstate, context.island),
          pickup: estateLocation(context.pickup, context.island),
          destination: estateLocation(context.destination, context.island),
          party: {
            adults: context.passengers,
            children: 0,
            accessibilityNeeds: [],
          },
          preferences: {
            interests: [context.activeLens],
          },
        },
        ["recommend", "plan", "map", "mobility", "booking", "knowledge"],
      );

      setResponse(result);
      setMessages((current) => [
        ...current,
        {
          id: createId("message"),
          role: "assistant",
          text: result.answer,
          createdAt: result.generatedAt,
        },
      ]);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "VI Guide Intelligence could not respond.",
      );
    } finally {
      setLoading(false);
    }
  }

  function executeAction(action: IntelligenceAction) {
    if (action.requiresConfirmation && action.type !== "save_plan") return;

    if (action.type === "save_plan" && action.payload?.plan) {
      const saved = readSavedPlans();
      localStorage.setItem(
        SAVED_PLAN_KEY,
        JSON.stringify([
          ...saved,
          {
            id: createId("plan"),
            createdAt: new Date().toISOString(),
            island: context.island,
            plan: action.payload.plan,
          },
        ]),
      );
      window.dispatchEvent(new Event("vi-guide-intelligence-plan-saved"));
    } else if (action.href) {
      router.push(action.href);
    }

    setCompletedActions((current) => new Set(current).add(action.id));
  }

  function startNewSession() {
    setMessages([createWelcomeMessage()]);
    setResponse(null);
    setCompletedActions(new Set());
    setError(null);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
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
          className={`fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[9999] flex items-center gap-3 rounded-2xl border border-cyan-200/20 bg-[#0a2530] px-3 py-3 text-left text-white shadow-[0_20px_60px_rgba(0,0,0,.5)] transition hover:-translate-y-0.5 sm:bottom-5 md:bottom-6 ${horizontalClass}`}
          aria-label="Open VI Guide Intelligence"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-300 to-teal-300 text-[#05242b]">
            <Sparkles size={19} />
          </span>
          <span className="hidden sm:block">
            <small className="block text-[9px] font-black uppercase tracking-[.18em] text-cyan-100/50">
              VI Guide Intelligence
            </small>
            <strong className="block text-sm">Plan with the whole app</strong>
          </span>
        </button>
      ) : null}

      {open ? (
        <section
          className={`fixed inset-0 z-[9999] flex flex-col overflow-hidden bg-[#06131b] text-white shadow-[0_30px_100px_rgba(0,0,0,.7)] sm:inset-auto sm:bottom-5 sm:h-[min(780px,calc(100vh-40px))] sm:w-[440px] sm:rounded-[28px] sm:border sm:border-white/10 ${panelHorizontalClass}`}
          role="dialog"
          aria-modal="true"
          aria-label="VI Guide Intelligence"
        >
          <header className="border-b border-white/10 bg-[#081b24] p-4 pt-[max(16px,env(safe-area-inset-top))]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 to-teal-300 text-[#06242a]">
                  <Bot size={21} />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate font-black">VI Guide Intelligence</h2>
                  <p className="mt-0.5 truncate text-xs text-white/45">
                    Shared live context · {contextLabel}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={startNewSession}
                  className="grid h-9 w-9 place-items-center rounded-xl text-white/45 hover:bg-white/10 hover:text-white"
                  aria-label="Start a new session"
                >
                  <Sparkles size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-xl text-white/45 hover:bg-white/10 hover:text-white"
                  aria-label="Close intelligence"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              <Status icon={<Brain size={12} />} label="Shared memory" />
              <Status icon={<MapPin size={12} />} label="Live map state" />
              <Status icon={<ShieldCheck size={12} />} label="Review actions" />
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
              <div className="grid gap-2 pl-9">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void sendMessage(prompt)}
                    className="rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3 text-left text-xs font-bold text-white/65 hover:border-cyan-300/25 hover:text-white"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            ) : null}

            {response ? (
              <div className="space-y-3 pl-9">
                <StructuredPlanRenderer response={response} />
                {response.actions.length ? (
                  <div className="grid gap-2">
                    {response.actions.map((action) => {
                      const completed = completedActions.has(action.id);
                      return (
                        <button
                          key={action.id}
                          type="button"
                          disabled={completed}
                          onClick={() => executeAction(action)}
                          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.045] p-3 text-left hover:border-cyan-300/25 disabled:opacity-50"
                        >
                          <span className="grid h-8 w-8 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200">
                            {action.type === "plan_ride" ? <Route size={15} /> : <MapPin size={15} />}
                          </span>
                          <span className="min-w-0 flex-1 text-xs font-black text-white/80">
                            {completed ? "Completed" : action.label}
                          </span>
                          <span className="text-white/25">→</span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : null}

            {loading ? (
              <p className="pl-9 text-xs font-bold text-cyan-100/45">
                Building a grounded plan from shared app context…
              </p>
            ) : null}
            {error ? (
              <div className="ml-9 rounded-2xl border border-rose-300/20 bg-rose-300/[.07] p-3 text-xs text-rose-100">
                {error}
              </div>
            ) : null}
          </div>

          <footer className="border-t border-white/10 bg-[#081720] p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
            <form onSubmit={submit} className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={draft}
                maxLength={3000}
                rows={1}
                disabled={loading}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask for a place, complete day, route, or booking…"
                className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-white/10 bg-white/[.055] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-cyan-300/40"
              />
              <button
                type="submit"
                disabled={!draft.trim() || loading}
                className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-300 text-[#05232b] disabled:opacity-35"
                aria-label="Send message"
              >
                <Send size={17} />
              </button>
            </form>
          </footer>
        </section>
      ) : null}
    </>
  );
}

function MessageBubble({ message }: { message: ConciergeMessage }) {
  const assistant = message.role === "assistant";
  return (
    <article className={`flex gap-2.5 ${assistant ? "items-start" : "justify-end"}`}>
      {assistant ? (
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200">
          <Sparkles size={13} />
        </span>
      ) : null}
      <div
        className={`max-w-[86%] rounded-2xl px-3.5 py-3 text-[13px] leading-6 ${
          assistant
            ? "rounded-tl-md border border-white/10 bg-white/[.045] text-white/75"
            : "rounded-tr-md bg-cyan-300 font-semibold text-[#05242c]"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.text}</p>
      </div>
    </article>
  );
}

function Status({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[.035] px-2 py-2 text-[9px] font-black text-white/45">
      {icon} {label}
    </span>
  );
}
