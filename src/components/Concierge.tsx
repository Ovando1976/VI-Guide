import { useEffect, useMemo, useRef, useState } from "react";
import type { User } from "firebase/auth";
import {
  BadgeDollarSign,
  Bot,
  Calendar as CalendarIcon,
  Car,
  ChevronRight,
  Compass,
  Hotel,
  Loader2,
  MapPin,
  MessageSquareText,
  Route,
  Send,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
  Waves,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";

import { askAiConcierge } from "../lib/ai/conciergeClient";
import { cn } from "../lib/utils";
import type { BeachDoc, EventDoc, IslandCode, PlaceDoc, UserProfile } from "../types";

type Listing = BeachDoc | PlaceDoc;
type ConciergeMessage = {
  role: "user" | "model";
  text: string;
  listings?: Listing[];
  events?: EventDoc[];
  plan?: Array<{
    time?: string;
    title: string;
    detail: string;
    path?: string;
  }>;
  actions?: Array<{
    label: string;
    description?: string;
    path: string;
    kind?: string;
  }>;
  provider?: string;
  access?: {
    admin?: boolean;
    partner?: boolean;
    premium?: boolean;
    operatorMode?: boolean;
  };
  suggestedRoutes?: Record<string, string | null>;
};

type ConciergeProps = {
  user: User | null;
  profile?: UserProfile | null;
  contextListing?: Listing | null;
  userLocation?: { lat: number; lng: number } | null;
  onSelectListing?: (listing: Listing) => void;
  agentId?: string;
  selectedIsland?: IslandCode;
};

const quickPrompts = [
  {
    label: "Beach day",
    icon: Waves,
    prompt: "Plan a beach day on St. Thomas with food nearby and transportation.",
  },
  {
    label: "Stay planning",
    icon: Hotel,
    prompt: "Help me choose where to stay for a Virgin Islands trip.",
  },
  {
    label: "Ride help",
    icon: Car,
    prompt: "Help me plan transportation from the airport to the beach and dinner.",
  },
  {
    label: "Cruise day",
    icon: Route,
    prompt: "I am visiting for one cruise day. Build me a simple island plan.",
  },
];

function islandLabel(island?: IslandCode) {
  return {
    st_thomas: "St. Thomas",
    st_john: "St. John",
    st_croix: "St. Croix",
    water_island: "Water Island",
  }[island || "st_thomas"];
}

function listingLocation(listing: Listing) {
  const place = listing as PlaceDoc;
  const beach = listing as BeachDoc;

  return place.address || beach.areaSlug || place.category || "U.S. Virgin Islands";
}

function eventDateLabel(value: unknown) {
  if (!value) return "Upcoming";

  try {
    return format(new Date(String(value)), "MMM d, h:mm a");
  } catch {
    return "Upcoming";
  }
}

export default function Concierge({
  user,
  contextListing,
  userLocation,
  onSelectListing,
  agentId = "concierge",
  selectedIsland = "st_thomas",
}: ConciergeProps) {
  const [messages, setMessages] = useState<ConciergeMessage[]>([
    {
      role: "model",
      text:
        agentId === "operator"
          ? "Operator intelligence online. I can help review territory, partner, visitor, and booking opportunities."
          : "Welcome to VI Guide AI. I can help you plan beaches, food, rides, stays, events, and booking handoffs across the Virgin Islands.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentIsland = selectedIsland || "st_thomas";
  const isOperator = agentId === "operator";

  const latestAccess = useMemo(() => {
    return [...messages].reverse().find((message) => message.access)?.access || {};
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  const sendMessage = async (messageText?: string) => {
    const userMessage = (messageText || input).trim();

    if (!userMessage || isTyping) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setIsTyping(true);

    try {
      const result = await askAiConcierge({
        message: userMessage,
        islandCode: currentIsland,
        agentId,
        contextListing: contextListing || null,
        userLocation: userLocation || null,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: result.answer,
          listings: result.listings || [],
          events: result.events || [],
          plan: result.plan || [],
          actions: result.actions || [],
          provider: result.provider,
          access: result.access,
          suggestedRoutes: result.suggestedRoutes,
        },
      ]);
    } catch (error) {
      console.error("AI Concierge Error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text:
            "I could not reach VI Guide AI right now. The app is still online, but the concierge gateway needs a moment. Please try again.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f0da] pb-72 text-ink">
      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-5 md:px-6 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-5 lg:sticky lg:top-5 lg:h-[calc(100vh-8rem)]">
          <section className="overflow-hidden rounded-[2.5rem] bg-emerald-950 text-white shadow-2xl">
            <div className="relative min-h-[330px] p-6">
              <div className="absolute inset-0">
                <img
                  src="/images/places/st-thomas/sapphire-marina-1.jpg"
                  alt="Virgin Islands AI concierge"
                  className="h-full w-full object-cover opacity-45"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-950/85 to-ink/90" />
              </div>

              <div className="relative z-10">
                <div className="grid h-16 w-16 place-items-center rounded-3xl bg-turquoise text-ink shadow-2xl">
                  <Sparkles className="h-8 w-8" />
                </div>

                <p className="mt-6 text-xs font-black uppercase tracking-[0.24em] text-turquoise">
                  VI Guide AI
                </p>

                <h1 className="mt-3 font-serif text-5xl leading-none">
                  Island Concierge
                </h1>

                <p className="mt-4 text-sm font-bold leading-7 text-white/75">
                  Ask for beaches, stays, rides, events, bookings, local routes, and trip strategy.
                </p>

                <div className="mt-5 grid gap-2">
                  <StatusPill
                    icon={ShieldCheck}
                    label={latestAccess.admin ? "Admin intelligence" : "Visitor mode"}
                    active={Boolean(latestAccess.admin || latestAccess.operatorMode)}
                  />
                  <StatusPill
                    icon={BadgeDollarSign}
                    label={latestAccess.premium ? "Premium visitor tools" : "Visitor pass available"}
                    active={Boolean(latestAccess.premium)}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2.25rem] bg-white p-5 shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
              Quick starts
            </p>

            <div className="mt-4 grid gap-3">
              {quickPrompts.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => void sendMessage(item.prompt)}
                  className="flex items-center justify-between rounded-2xl bg-stone-50 p-4 text-left transition active:scale-95"
                >
                  <span className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                      <item.icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-sm font-black">{item.label}</span>
                      <span className="block text-xs font-bold text-stone-400">
                        Ask AI
                      </span>
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-stone-300" />
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[2.25rem] bg-ink p-5 text-white shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-turquoise">
              Current context
            </p>

            <div className="mt-4 space-y-3 text-sm font-bold text-white/75">
              <p>
                Island: <span className="text-white">{islandLabel(currentIsland)}</span>
              </p>
              <p>
                User: <span className="text-white">{user?.email || "Guest / anonymous"}</span>
              </p>
              <p>
                Mode: <span className="text-white">{isOperator ? "Operator" : "Concierge"}</span>
              </p>
              {contextListing ? (
                <p>
                  Viewing: <span className="text-white">{contextListing.title}</span>
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => window.location.assign("/visitor-checkout")}
              className="mt-5 w-full rounded-2xl bg-[#ffcf32] px-5 py-4 text-sm font-black text-ink active:scale-95"
            >
              Unlock visitor pass
            </button>
          </section>
        </aside>

        <section className="overflow-hidden rounded-[2.75rem] bg-white shadow-2xl">
          <header className="border-b border-stone-100 bg-white/80 p-5 backdrop-blur md:p-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-3xl bg-turquoise/30 blur-xl" />
                <div className="relative grid h-14 w-14 place-items-center rounded-3xl bg-ink text-turquoise">
                  <Bot className="h-7 w-7" />
                </div>
              </div>

              <div>
                <h2 className="font-serif text-3xl italic">Island Concierge</h2>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.24em] text-stone-400">
                  Processing intelligence
                </p>
              </div>
            </div>
          </header>

          <div
            ref={scrollRef}
            className="h-[58vh] min-h-[520px] overflow-y-auto bg-gradient-to-b from-stone-50 to-white p-5 md:p-7"
          >
            <div className="space-y-7">
              {messages.map((message, index) => (
                <MessageBubble
                  key={`${message.role}-${index}`}
                  message={message}
                  onSelectListing={onSelectListing}
                />
              ))}

              {isTyping ? (
                <div className="flex max-w-[90%] gap-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-ink text-turquoise shadow-xl">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-2 rounded-[2rem] rounded-tl-none bg-white p-5 shadow-xl">
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-700" />
                    <span className="text-sm font-black text-stone-500">
                      Thinking through the island...
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <footer className="border-t border-stone-100 bg-white p-5 md:p-6">
            <div className="mx-auto flex max-w-4xl items-center gap-3">
              <input
                type="text"
                placeholder="Ask about beaches, food, transit, stays, bookings..."
                className="min-w-0 flex-1 rounded-[2rem] border border-stone-100 bg-stone-50 px-6 py-5 font-serif italic outline-none shadow-inner focus:ring-8 focus:ring-turquoise/10"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void sendMessage();
                  }
                }}
              />

              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={!input.trim() || isTyping}
                className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-ink text-turquoise shadow-2xl transition active:scale-95 disabled:opacity-40"
                aria-label="Send message"
              >
                {isTyping ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
              </button>
            </div>
          </footer>
        </section>
      </section>
    </main>
  );
}

function StatusPill({
  icon: Icon,
  label,
  active,
}: {
  icon: typeof ShieldCheck;
  label: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
      <Icon className={cn("h-4 w-4", active ? "text-turquoise" : "text-white/40")} />
      <span className="text-xs font-black uppercase tracking-[0.14em] text-white/80">
        {label}
      </span>
    </div>
  );
}

function MessageBubble({
  message,
  onSelectListing,
}: {
  message: ConciergeMessage;
  onSelectListing?: (listing: Listing) => void;
}) {
  const isUser = message.role === "user";
  const topListing = !isUser && message.listings?.length ? message.listings[0] : null;
  const otherListings = !isUser && message.listings?.length ? message.listings.slice(1, 5) : [];

  return (
    <div className={cn("flex gap-4", isUser ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-2xl shadow-xl",
          isUser ? "bg-white text-ink" : "bg-ink text-turquoise",
        )}
      >
        {isUser ? <UserIcon className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </div>

      <article
        className={cn(
          "max-w-[86%] rounded-[2rem] p-5 shadow-xl md:p-6",
          isUser
            ? "rounded-tr-none bg-ink text-white"
            : "rounded-tl-none bg-white text-ink",
        )}
      >
        {topListing ? (
          <button
            type="button"
            onClick={() => onSelectListing?.(topListing)}
            className="mb-5 grid w-full gap-4 overflow-hidden rounded-[1.75rem] bg-emerald-950 text-left text-white shadow-xl active:scale-[0.99] md:grid-cols-[140px_1fr]"
          >
            <div className="h-36 bg-stone-800 md:h-full">
              <img
                src={topListing.coverImage || "/images/places/st-thomas/sapphire-marina-1.jpg"}
                alt={topListing.title}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700">
                Top recommendation
              </p>
              <h3 className="mt-2 font-serif text-3xl leading-none">{topListing.title}</h3>
              <p className="mt-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-white/60">
                <MapPin className="h-3 w-3 text-turquoise" />
                {listingLocation(topListing)}
              </p>
            </div>
          </button>
        ) : null}

        <div
          className={cn(
            "prose prose-sm max-w-none leading-7",
            isUser ? "prose-invert" : "prose-stone rounded-[1.5rem] bg-stone-50/70 p-4",
          )}
        >
          <ReactMarkdown>{message.text}</ReactMarkdown>
        </div>

        {message.plan?.length ? (
          <div className="mt-5 rounded-[1.75rem] border border-emerald-100 bg-emerald-50/80 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700">
                Smart plan
              </p>
              <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">
                {message.plan.length} steps
              </span>
            </div>

            <div className="mt-4 grid gap-3">
              {message.plan.map((step, index) => (
                <button
                  key={`${step.title}-${index}`}
                  type="button"
                  onClick={() => step.path && window.location.assign(step.path)}
                  className="grid gap-3 rounded-2xl bg-white p-4 text-left shadow-sm transition active:scale-[0.99] md:grid-cols-[72px_1fr]"
                >
                  <span className="rounded-2xl bg-ink px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.12em] text-turquoise">
                    {step.time || `Step ${index + 1}`}
                  </span>

                  <span className="min-w-0">
                    <span className="block text-sm font-black text-ink">{step.title}</span>
                    <span className="mt-1 block text-xs font-bold leading-5 text-stone-500">
                      {step.detail}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {otherListings.length ? (
          <div className="mt-5 rounded-[1.75rem] bg-stone-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">
              Other good matches
            </p>

            <div className="mt-3 grid gap-3">
              {otherListings.map((listing) => (
                <button
                  key={listing.id}
                  type="button"
                  onClick={() => onSelectListing?.(listing)}
                  className="group flex items-center gap-4 rounded-2xl bg-white p-3 text-left shadow-sm transition hover:shadow-xl active:scale-[0.99]"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-stone-200">
                    <img
                      src={listing.coverImage || "/images/places/st-thomas/sapphire-marina-1.jpg"}
                      alt={listing.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-base font-black text-ink">{listing.title}</h4>
                    <p className="mt-1 flex items-center gap-2 truncate text-xs font-bold text-stone-400">
                      <MapPin className="h-3 w-3 text-emerald-700" />
                      {listingLocation(listing)}
                    </p>
                  </div>

                  <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-emerald-700" />
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {message.events?.length ? (
          <div className="mt-5 grid gap-3">
            {message.events.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-4 rounded-2xl border border-stone-100 bg-stone-50 p-3"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-stone-200">
                  <img
                    src={event.coverImage || "/images/events/culture/fort-christian.jpg"}
                    alt={event.title}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-base font-black text-ink">{event.title}</h4>
                  <p className="mt-1 flex items-center gap-2 truncate text-xs font-bold text-stone-400">
                    <CalendarIcon className="h-3 w-3 text-emerald-700" />
                    {eventDateLabel(event.startAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {message.actions?.length ? (
          <div className="mt-5 rounded-[1.75rem] border border-stone-100 bg-stone-50 p-4 text-ink">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700">
              Host handoff
            </p>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {message.actions.map((action) => (
                <button
                  key={`${action.label}-${action.path}`}
                  type="button"
                  onClick={() => window.location.assign(action.path)}
                  className={cn(
                    "rounded-2xl px-4 py-3 text-left shadow-lg transition active:scale-[0.98]",
                    action.kind === "checkout"
                      ? "bg-[#ffcf32] text-ink"
                      : "border border-stone-100 bg-white text-ink",
                  )}
                >
                  <span className="block text-sm font-black">{action.label}</span>
                  {action.description ? (
                    <span
                      className={cn(
                        "mt-1 block text-xs font-bold leading-5",
                        action.kind === "checkout" ? "text-ink/60" : "text-stone-500",
                      )}
                    >
                      {action.description}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {!message.actions?.length && message.suggestedRoutes ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {Object.entries(message.suggestedRoutes)
              .filter(([, path]) => Boolean(path))
              .slice(0, 4)
              .map(([label, path]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => path && window.location.assign(path)}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-black capitalize text-emerald-800 active:scale-95"
                >
                  <MessageSquareText className="h-3 w-3" />
                  {label.replace(/([A-Z])/g, " $1")}
                </button>
              ))}
          </div>
        ) : null}
      </article>
    </div>
  );
}
