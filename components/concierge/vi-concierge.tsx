"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bot,
  Brain,
  Check,
  Map,
  MapPin,
  Navigation,
  Route,
  Save,
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
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { ItineraryTimeline } from "@/components/intelligence/itinerary-timeline";
import { PlaceCard } from "@/components/intelligence/place-card";
import {
  askViIntelligence,
  feedIntelligenceContext,
} from "@/lib/intelligence/client";
import {
  createJourneyPlan,
  upsertJourneyPlan,
} from "@/lib/journey-planner";
import type { ConciergeContext, ConciergeMessage } from "@/types/concierge";
import type {
  IntelligenceAction,
  IntelligenceLocation,
  IntelligencePlanStop,
  IntelligenceRecommendation,
  IntelligenceResponse,
} from "@/types/intelligence";

type Props = {
  context: ConciergeContext;
  onSelectEstate: (geoid: string) => void;
  onSetPickup: (geoid: string) => void;
  onSetDestination: (geoid: string) => void;
  placement?: "left" | "right";
  initiallyOpen?: boolean;
  initialPrompt?: string;
};

type StoredSession = {
  messages?: ConciergeMessage[];
  response?: IntelligenceResponse | null;
};

const STORAGE_KEY = "vi-guide-concierge-v2";
const STARTER_PROMPTS = [
  "Plan a relaxed half-day near me",
  "Plan my day after the cruise",
  "Find a beach and arrange the taxi route",
  "Build a history, food, and shopping day",
] as const;
const FOLLOW_UPS = [
  "Find Food Nearby",
  "Show Beaches",
  "Plan Ride",
  "Family Friendly",
  "Rain Alternative",
  "Save Trip",
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
    text: "Tell me the island day you want. I can search VI Guide, build a practical itinerary, connect transportation, and save the reviewed result to My Trip.",
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

export function ViConcierge({
  context,
  onSelectEstate,
  onSetPickup,
  onSetDestination,
  placement = "right",
  initiallyOpen = false,
  initialPrompt = "",
}: Props) {
  void onSelectEstate;
  void onSetPickup;
  void onSetDestination;

  const router = useRouter();
  const [open, setOpen] = useState(initiallyOpen);
  const [messages, setMessages] = useState<ConciergeMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<IntelligenceResponse | null>(null);
  const [completedActions, setCompletedActions] = useState<Set<string>>(
    () => new Set(),
  );
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const submittedInitialPrompt = useRef<string | null>(null);

  useEffect(() => {
    setOpen((current) => current || initiallyOpen);
  }, [initiallyOpen]);

  useEffect(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem(STORAGE_KEY) ?? "null",
      ) as StoredSession | null;
      setMessages(
        stored?.messages?.length
          ? stored.messages.slice(-40)
          : [createWelcomeMessage()],
      );
      setResponse(stored?.response ?? null);
    } catch {
      setMessages([createWelcomeMessage()]);
      setResponse(null);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || !messages.length) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ messages: messages.slice(-40), response }),
      );
    } catch {
      // Conversation remains available for the current session.
    }
  }, [hydrated, messages, response]);

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
    setPendingActionId(null);

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
          : "VI Guide Concierge could not respond.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const prompt = initialPrompt.trim();
    if (
      !prompt ||
      !messages.length ||
      loading ||
      submittedInitialPrompt.current === prompt
    ) {
      return;
    }
    submittedInitialPrompt.current = prompt;
    setOpen(true);
    void sendMessage(prompt);
    // sendMessage intentionally uses the latest live concierge context.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt, loading, messages.length]);

  function executeAction(action: IntelligenceAction) {
    if (completedActions.has(action.id)) return;

    if (action.requiresConfirmation && pendingActionId !== action.id) {
      setPendingActionId(action.id);
      return;
    }

    const plan = action.payload?.plan;
    if (action.type === "save_plan" && Array.isArray(plan)) {
      const generated = plan as IntelligencePlanStop[];
      if (!generated.length) return;

      const journey = createJourneyPlan(context.island, "VI Concierge plan");
      upsertJourneyPlan({
        ...journey,
        status: "ready",
        plan: generated,
        notes: "Created by VI Concierge from grounded VI Guide data.",
      });
      setCompletedActions((current) => new Set(current).add(action.id));
      setPendingActionId(null);
      router.push("/planner");
      return;
    }

    if (action.href) {
      setCompletedActions((current) => new Set(current).add(action.id));
      setPendingActionId(null);
      router.push(action.href);
    }
  }

  function openMap(item: IntelligenceRecommendation | IntelligencePlanStop) {
    const metadata = item as typeof item & {
      mapFocus?: { href?: string; lat?: number; lng?: number; placeId?: string };
    };
    const focus = metadata.mapFocus;
    if (focus?.href) return router.push(focus.href);
    if (item.mapHref) return router.push(item.mapHref);

    const params = new URLSearchParams({
      island: item.island,
      place: "placeId" in item && item.placeId ? item.placeId : item.id,
      placeName: item.title,
      placeType: item.kind,
    });
    const lat = focus?.lat ?? item.lat;
    const lng = focus?.lng ?? item.lng;
    if (typeof lat === "number") params.set("placeLat", String(lat));
    if (typeof lng === "number") params.set("placeLng", String(lng));
    router.push(`/map?${params.toString()}`);
  }

  function openRecommendation(item: IntelligenceRecommendation) {
    router.push(item.href ?? item.mapHref ?? `/search?q=${encodeURIComponent(item.title)}`);
  }

  function planRide(item: IntelligenceRecommendation) {
    const params = new URLSearchParams({
      island: item.island,
      destinationName: item.title,
    });
    if (typeof item.lat === "number") params.set("toLat", String(item.lat));
    if (typeof item.lng === "number") params.set("toLng", String(item.lng));
    router.push(`/mobility?${params.toString()}`);
  }

  function saveRecommendation(item: IntelligenceRecommendation) {
    const saveAction = response?.actions.find((action) => action.type === "save_plan");
    if (saveAction) return executeAction(saveAction);

    const journey = createJourneyPlan(item.island, `${item.title} trip`);
    upsertJourneyPlan({
      ...journey,
      status: "draft",
      plan: [{
        id: `saved_${item.id.replace(/[^a-zA-Z0-9_-]/g, "_")}`,
        title: item.title,
        island: item.island,
        kind: item.kind,
        summary: item.summary,
        placeId: item.id,
        lat: item.lat,
        lng: item.lng,
        href: item.href,
        mapHref: item.mapHref,
      }],
      notes: "Saved from VI Concierge.",
    });
  }

  function startNewSession() {
    setMessages([createWelcomeMessage()]);
    setResponse(null);
    setCompletedActions(new Set());
    setPendingActionId(null);
    setError(null);
    setDraft("");
    submittedInitialPrompt.current = null;
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      void sendMessage();
    }
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
          aria-label="Open VI Concierge"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-300 to-teal-300 text-[#05242b]">
            <Sparkles size={19} />
          </span>
          <span className="hidden sm:block">
            <small className="block text-[9px] font-black uppercase tracking-[.18em] text-cyan-100/50">
              VI Concierge
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
          aria-label="VI Concierge"
          aria-busy={loading}
        >
          <header className="border-b border-white/10 bg-[#081b24] p-4 pt-[max(16px,env(safe-area-inset-top))]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 to-teal-300 text-[#06242a]">
                  <Bot size={21} />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate font-black">VI Concierge</h2>
                  <p className="mt-0.5 truncate text-xs text-white/45">
                    Live app context · {contextLabel}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <Link
                  href="/planner"
                  className="grid h-9 w-9 place-items-center rounded-xl text-white/45 hover:bg-white/10 hover:text-white"
                  aria-label="Open My Trip"
                >
                  <Route size={16} />
                </Link>
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
                  aria-label="Close Concierge"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              <Status icon={<Brain size={12} />} label="App context" />
              <Status icon={<MapPin size={12} />} label="Map ready" />
              <Status icon={<ShieldCheck size={12} />} label="Review actions" />
            </div>
          </header>

          <div
            ref={scrollRef}
            className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5"
            aria-live="polite"
          >
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                showFollowUps={message.role === "assistant" && index > 0}
                onFollowUp={(prompt) => void sendMessage(prompt)}
              />
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
                <div className="flex flex-wrap items-center gap-2 text-[9px] font-black uppercase tracking-[.14em] text-white/35">
                  <span className="rounded-full border border-white/10 px-2.5 py-1.5">{response.confidence} confidence</span>
                  <span>{response.intent.replaceAll("_", " ")}</span>
                </div>
                {response.recommendations.length ? (
                  <div className="space-y-3">
                    <h3 className="text-[9px] font-black uppercase tracking-[.16em] text-cyan-100/45">Best matches</h3>
                    {response.recommendations.slice(0, 6).map((recommendation) => (
                      <PlaceCard
                        key={recommendation.id}
                        recommendation={recommendation}
                        onOpenMap={() => openMap(recommendation)}
                        onViewDetails={() => openRecommendation(recommendation)}
                        onRide={() => planRide(recommendation)}
                        onSave={() => saveRecommendation(recommendation)}
                      />
                    ))}
                  </div>
                ) : null}
                {response.plan.length ? (
                  <div className="space-y-2">
                    <h3 className="text-[9px] font-black uppercase tracking-[.16em] text-cyan-100/45">Connected itinerary</h3>
                    <ItineraryTimeline plan={response.plan} onSelectStop={openMap} />
                  </div>
                ) : null}
                {response.warnings.length ? (
                  <div className="rounded-2xl border border-amber-200/15 bg-amber-200/[.06] p-3 text-[11px] leading-5 text-amber-50/70">
                    {response.warnings.map((warning) => <p key={warning}>{warning}</p>)}
                  </div>
                ) : null}
                {response.actions.length ? (
                  <div className="grid gap-2">
                    {response.actions.map((action) => {
                      const completed = completedActions.has(action.id);
                      const confirming = pendingActionId === action.id && !completed;
                      const Icon = iconForAction(action.type);

                      return (
                        <button
                          key={action.id}
                          type="button"
                          disabled={completed}
                          onClick={() => executeAction(action)}
                          className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition disabled:opacity-50 ${
                            confirming
                              ? "border-amber-300/35 bg-amber-300/[.09]"
                              : "border-white/10 bg-white/[.045] hover:border-cyan-300/25"
                          }`}
                        >
                          <span
                            className={`grid h-8 w-8 place-items-center rounded-xl ${
                              confirming
                                ? "bg-amber-300/15 text-amber-100"
                                : "bg-cyan-300/10 text-cyan-200"
                            }`}
                          >
                            {completed ? <Check size={15} /> : <Icon size={15} />}
                          </span>
                          <span className="min-w-0 flex-1 text-xs font-black text-white/80">
                            {completed
                              ? "Completed"
                              : confirming
                                ? `Confirm: ${action.label}`
                                : action.label}
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
              <ConciergeSkeleton />
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
                onKeyDown={handleComposerKeyDown}
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
            <p className="mt-2 px-1 text-[9px] font-semibold text-white/25">
              Enter to send · Shift+Enter for a new line
            </p>
          </footer>
        </section>
      ) : null}
    </>
  );
}

function MessageBubble({ message, showFollowUps, onFollowUp }: { message: ConciergeMessage; showFollowUps: boolean; onFollowUp(prompt: string): void }) {
  const assistant = message.role === "assistant";
  return (
    <article className={`flex gap-2.5 ${assistant ? "items-start" : "justify-end"}`}>
      {assistant ? (
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200">
          <Sparkles size={13} />
        </span>
      ) : null}
      <div className={assistant ? "min-w-0 max-w-[calc(100%-38px)]" : "max-w-[86%]"}>
      <div
        className={`rounded-2xl px-3.5 py-3 text-[13px] leading-6 ${
          assistant
            ? "rounded-tl-md border border-white/10 bg-white/[.045] text-white/75"
            : "rounded-tr-md bg-cyan-300 font-semibold text-[#05242c]"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.text}</p>
      </div>
      {showFollowUps ? (
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
          {FOLLOW_UPS.map((prompt) => (
            <button key={prompt} type="button" onClick={() => onFollowUp(prompt)} className="min-h-9 shrink-0 rounded-full border border-white/10 bg-white/[.035] px-3 text-[9px] font-black text-cyan-100/65 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-cyan-100">
              {prompt}
            </button>
          ))}
        </div>
      ) : null}
      </div>
    </article>
  );
}

function ConciergeSkeleton() {
  return (
    <div className="space-y-3 pl-9" aria-label="Building your recommendations">
      <div className="animate-pulse overflow-hidden rounded-[22px] border border-white/10 bg-white/[.04]">
        <div className="h-28 bg-white/[.07]" />
        <div className="space-y-2 p-4"><div className="h-4 w-2/3 rounded bg-white/10" /><div className="h-3 w-full rounded bg-white/[.07]" /><div className="h-3 w-4/5 rounded bg-white/[.07]" /><div className="grid grid-cols-2 gap-2 pt-2"><div className="h-10 rounded-xl bg-white/[.08]" /><div className="h-10 rounded-xl bg-white/[.08]" /></div></div>
      </div>
      <div className="animate-pulse space-y-3 rounded-[22px] border border-white/10 bg-white/[.04] p-4">
        {["w-2/3", "w-4/5", "w-1/2"].map((width) => <div key={width} className="flex items-center gap-3"><span className="h-3 w-3 rounded-full bg-cyan-300/30" /><span className={`h-4 rounded bg-white/[.08] ${width}`} /></div>)}
      </div>
    </div>
  );
}

function Status({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[.035] px-2 py-2 text-[9px] font-black text-white/45">
      {icon} {label}
    </span>
  );
}

function iconForAction(type: IntelligenceAction["type"]) {
  if (type === "save_plan") return Save;
  if (type === "plan_ride" || type === "start_booking") return Navigation;
  if (type === "open_map") return Map;
  if (type === "open_place") return MapPin;
  return Sparkles;
}
