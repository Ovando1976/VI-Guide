import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import type { User } from "firebase/auth";
import {
  Bot,
  BookOpen,
  CalendarDays,
  Car,
  ChevronRight,
  Landmark,
  Loader2,
  MapPin,
  Route,
  Search,
  Send,
  Sparkles,
  Star,
  User as UserIcon,
  type LucideIcon,
} from "lucide-react";
import { motion } from "motion/react";
import ReactMarkdown from "react-markdown";

import {
  runConciergeBrain,
  type ConciergeAction,
  type ConciergeIntent,
} from "../features/concierge/conciergeBrain";
import {
  buildConciergeRidePath,
  isRideRequest,
} from "../features/concierge/conciergeMobility";
import { createTourLead, updateTourLead } from "../lib/firestore/tourLeads";
import type {
  BeachDoc,
  EventDoc,
  IslandCode,
  PlaceDoc,
  UserProfile,
} from "../types";
import { cn } from "../lib/utils";
import { searchAllGeography } from "../lib/search/geographicSearch";
import type { GeographicIndexItem } from "../data/core/geographicIndex";
import { getHistoricSiteOffer } from "../data/revenue/historicSiteOffers";
import { useAppIntelligence } from "../hooks/useAppIntelligence";

type Listing = BeachDoc | PlaceDoc | EventDoc | GeographicIndexItem;
type BookingOption = "tour" | "ride" | "bundle";

type ConciergeMessage = {
  role: "user" | "model";
  text: string;
  results?: GeographicIndexItem[];
  actions?: ConciergeAction[];
  intent?: ConciergeIntent;
};

type ConciergeProps = {
  user: User | null;
  profile?: UserProfile | null;
  selectedIsland?: IslandCode;
  contextListing?: Listing | null;
  userLocation?: { lat: number; lng: number } | null;
  onSelectListing?: (listing: BeachDoc | PlaceDoc | EventDoc) => void;
  agentId?: string;
  initialPrompt?: string;
};

const ISLAND_LABELS: Partial<Record<IslandCode, string>> = {
  st_thomas: "St. Thomas",
  st_john: "St. John",
  st_croix: "St. Croix",
  water_island: "Water Island",
};

function normalizeIsland(value?: string | null): IslandCode {
  if (value === "stt" || value === "st_thomas") return "st_thomas";
  if (value === "stj" || value === "st_john") return "st_john";
  if (value === "stx" || value === "st_croix") return "st_croix";
  if (value === "wat" || value === "water_island") return "water_island";
  return "st_thomas";
}

function islandLabel(value?: string | null): string {
  return ISLAND_LABELS[normalizeIsland(value)] || "USVI";
}

function getTitle(item: Listing): string {
  return String(
    ("title" in item && item.title) ||
      ("name" in item && item.name) ||
      item.id ||
      "Untitled",
  );
}

function getImage(item: Listing): string {
  const loose = item as Listing & {
    imageUrl?: string;
    coverImage?: string;
    image?: string;
    photoUrl?: string;
    thumbnailUrl?: string;
  };

  return (
    loose.coverImage ||
    loose.imageUrl ||
    loose.image ||
    loose.photoUrl ||
    loose.thumbnailUrl ||
    "/images/placeholder-island.jpg"
  );
}

function getSourceLabel(item: GeographicIndexItem): string {
  if (item.source === "estate") return "Estate";
  if (item.source === "historicSite") return "Historic Site";
  if (item.source === "archive") return "Archive";
  if (item.source === "dictionary") return "Dictionary";
  if (item.source === "beach") return "Beach";
  return item.category || item.type || "Place";
}

function inferBookingOption(text: string): BookingOption {
  const lower = text.toLowerCase();

  if (lower.includes("bundle") || (lower.includes("tour") && lower.includes("ride"))) {
    return "bundle";
  }

  if (
    lower.includes("ride") ||
    lower.includes("taxi") ||
    lower.includes("pickup") ||
    lower.includes("drive") ||
    lower.includes("transport")
  ) {
    return "ride";
  }

  return "tour";
}

function wantsBooking(text: string) {
  const lower = text.toLowerCase();

  return [
    "book",
    "reserve",
    "tour",
    "bundle",
    "schedule",
    "price",
  ].some((word) => lower.includes(word));
}

function extractLeadDetails(text: string) {
  const email =
    text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null;

  const phone =
    text.match(/(?:\+?1[-.\s]?)?(?:\(?340\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/)
      ?.[0] ?? null;

  const guestMatch =
    text.match(/(?:party of|guests?|people|persons?|for)\s+(\d{1,2})/i) ||
    text.match(/(\d{1,2})\s+(?:guests?|people|persons?)/i);

  const dateMatch =
    text.match(
      /\b(?:today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t)?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[^,.]*/i,
    )?.[0] ?? null;

  const pickupMatch =
    text.match(/(?:pickup|pick up|from)\s+(?:at\s+)?([^,.]+)/i)?.[1]?.trim() ??
    null;

  return {
    customerEmail: email,
    customerPhone: phone,
    guestCount: guestMatch ? Number(guestMatch[1]) : null,
    preferredDate: dateMatch,
    pickupLocation: pickupMatch,
    specialRequests: text.trim() || null,
  };
}

async function withTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error("Request timed out")), ms);
    }),
  ]);
}

export default function Concierge({
  user,
  profile,
  selectedIsland = "st_thomas",
  contextListing,
  userLocation,
  initialPrompt,
}: ConciergeProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);

  const urlIsland = normalizeIsland(params.get("island") || selectedIsland);
  const urlContext = params.get("context") || initialPrompt || "";
  const intent = params.get("intent") || "";
  const isBookingIntent = intent === "book-tour";

  const bookingSite = useMemo(() => {
    if (!urlContext) return null;

    const matches = searchAllGeography(urlContext, {
      island: urlIsland,
      limit: 8,
    }) as GeographicIndexItem[];

    return matches.find((item) => item.source === "historicSite") || matches[0] || null;
  }, [urlContext, urlIsland]);

  const bookingOffer = getHistoricSiteOffer(bookingSite?.id);

  const parcelContext = (location.state as any)?.parcelContext as
    | {
        parcelId: string;
        label: string;
        island: string;
        estateName?: string | null;
        address?: string | null;
      }
    | undefined;

  const intelligence = useAppIntelligence({
    selectedIsland: urlIsland,
    selectedIslandLabel: islandLabel(urlIsland),
    profile,
    userLocation,
    contextTitle: contextListing ? getTitle(contextListing) : bookingSite?.name,
  });

  const [input, setInput] = useState(initialPrompt ?? "");
  const [isTyping, setIsTyping] = useState(false);
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ConciergeMessage[]>([
    {
      role: "model",
      text:
        isBookingIntent && bookingSite
          ? `I can help you book **${
              bookingOffer?.tourTitle || `${bookingSite.name} Guided Visit`
            }**. Choose tour, ride, or bundle, or type your preferred date, party size, phone, email, and pickup location.`
          : `I’m connected to VI Guide’s geographic index and app context. You are in **${intelligence.routeName}** for **${islandLabel(urlIsland)}**. Ask me for places, routes, estates, beaches, businesses, history, tours, or taxi help.`,
    },
  ]);

  useEffect(() => {
    setInput(initialPrompt ?? "");
  }, [initialPrompt]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  async function saveBookingLead(
    option: BookingOption,
    note?: string,
  ): Promise<string> {
    const siteName = bookingSite?.name || urlContext || "this historic site";
    const details = extractLeadDetails(note || "");

    const estimatedValue =
      option === "ride"
        ? 5
        : option === "bundle"
          ? (bookingOffer?.tourPrice || 35) + 12
          : bookingOffer?.tourPrice || 35;

    if (activeLeadId) {
      await withTimeout(
        updateTourLead(activeLeadId, {
          intent: option,
          estimatedValue,
          customerEmail: details.customerEmail,
          customerPhone: details.customerPhone,
          guestCount: details.guestCount,
          preferredDate: details.preferredDate,
          pickupLocation: details.pickupLocation,
          specialRequests: details.specialRequests,
        }),
        8000,
      );

      return `I updated the existing **${option} lead** for **${siteName}**.

${note ? `Added note: ${note}\n\n` : ""}To finish the booking, confirm:

- Full name
- Phone number
- Email
- Number of guests
- Preferred date and time
- Pickup location, if transportation is needed`;
    }

    const leadId = await withTimeout(
      createTourLead({
        siteId: bookingSite?.id,
        siteName,
        island: urlIsland,
        intent: option,
        customerName: profile?.displayName || user?.displayName || null,
        customerEmail: details.customerEmail || user?.email || null,
        customerPhone: details.customerPhone,
        guestCount: details.guestCount,
        preferredDate: details.preferredDate,
        pickupLocation: details.pickupLocation,
        specialRequests: details.specialRequests,
        userId: user?.uid || null,
        estimatedValue,
        source: "ambient-concierge",
      }),
      8000,
    );

    setActiveLeadId(leadId);

    return `Done — I created a **${option} lead** for **${siteName}**.

${note ? `Your note: ${note}\n\n` : ""}Next, confirm:

- Full name
- Phone number
- Email
- Number of guests
- Preferred date and time
- Pickup location, if transportation is needed`;
  }

  async function handleSend(customText?: string) {
    const userMessage = (customText ?? input).trim();
    if (!userMessage || isTyping) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setIsTyping(true);

    try {
      if (
        (isBookingIntent && bookingSite) ||
        (bookingSite && wantsBooking(userMessage))
      ) {
        const option = inferBookingOption(userMessage);
        const text = await saveBookingLead(option, userMessage);
        setMessages((prev) => [...prev, { role: "model", text }]);
        return;
      }

      if (isRideRequest(userMessage)) {
        const path = buildConciergeRidePath({
          message: userMessage,
          island: urlIsland,
        });

        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            text:
              "I’ll send this into Mobility. Mobility will use the existing estate-based taxi system to resolve the pickup, destination, taxi zone, official fare, route preview, and ride request.",
            actions: [
              {
                type: "navigate",
                label: "Open Mobility Fare",
                path,
              },
            ],
            intent: "route",
          },
        ]);

        return;
      }

      const brain = runConciergeBrain({
        message: userMessage,
        island: urlIsland,
        routeName: intelligence.routeName,
        path: location.pathname,
        contextTitle: contextListing ? getTitle(contextListing) : bookingSite?.name,
        userLocation,
      });

      let text = brain.answer;

      if (parcelContext) {
        text += `\n\nParcel context: ${parcelContext.label}, ${
          parcelContext.estateName || "unknown estate"
        }.`;
      }

      text += `\n\n---\n\n**Context I used:**\n${intelligence.systemContext}`;

      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text,
          results: brain.results,
          actions: brain.actions,
          intent: brain.intent,
        },
      ]);
    } catch (error) {
      console.error("Concierge action failed:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text:
            "I could not complete that action. The request timed out or was blocked. Please try again.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  async function startBooking(option: BookingOption) {
    if (isTyping) return;

    const siteName = bookingSite?.name || urlContext || "this historic site";

    const message =
      option === "tour"
        ? `I want to book the ${bookingOffer?.tourTitle || `${siteName} tour`}.`
        : option === "ride"
          ? `I need a ride to ${siteName}.`
          : `I want the tour and taxi bundle for ${siteName}.`;

    await handleSend(message);
  }

  return (
    <main className="min-h-[calc(100vh-96px)] bg-[#061016] px-4 py-6 pb-32 text-white">
      <section className="mx-auto grid min-h-[calc(100vh-160px)] max-w-7xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_40px_140px_rgba(0,0,0,0.38)] backdrop-blur-3xl lg:grid-cols-[20rem_1fr]">
        <aside className="border-b border-white/10 bg-slate-950/45 p-6 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-300 to-cyan-400 text-slate-950 shadow-xl">
              <Sparkles className="h-7 w-7" />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
                Ambient AI
              </p>
              <h1 className="text-2xl font-black">Concierge</h1>
            </div>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">
              Current Context
            </p>

            <p className="mt-3 text-lg font-black text-white">
              {intelligence.routeName}
            </p>

            <p className="mt-1 text-sm text-cyan-200">
              {islandLabel(urlIsland)}
            </p>

            {contextListing || bookingSite ? (
              <p className="mt-3 text-sm leading-relaxed text-white/60">
                Viewing: {contextListing ? getTitle(contextListing) : bookingSite?.name}
              </p>
            ) : null}
          </div>

          <div className="mt-5 space-y-2">
            {intelligence.suggestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => void handleSend(item)}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm font-bold text-white/75 transition hover:bg-white/10 active:scale-95"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-2">
            <SideAction
              icon={BookOpen}
              label="Dictionary"
              onClick={() => navigate("/dictionary")}
            />
            <SideAction
              icon={MapPin}
              label="Open Map"
              onClick={() => navigate(`/map?island=${urlIsland}`)}
            />
            <SideAction
              icon={Car}
              label="Plan Ride"
              onClick={() => navigate(`/mobility?island=${urlIsland}`)}
            />
          </div>
        </aside>

        <section className="flex min-w-0 flex-col">
          <header className="relative overflow-hidden border-b border-white/10 p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.28),transparent_45%),linear-gradient(135deg,rgba(15,23,42,0.92),rgba(2,6,23,0.96))]" />

            <div className="relative z-10 flex flex-wrap items-center gap-5">
              <div className="grid h-16 w-16 place-items-center rounded-3xl bg-white/10 text-emerald-300 shadow-2xl ring-1 ring-white/10">
                <Bot size={32} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-300">
                  VI Guide Intelligence Layer
                </p>

                <h2 className="mt-2 text-4xl font-black tracking-tight">
                  {isBookingIntent ? "Book an Island Experience" : "Ask the Island"}
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/65">
                  I use the app context, VI Guide geographic index, and Mobility’s estate-based taxi flow.
                </p>
              </div>
            </div>
          </header>

          {isBookingIntent && bookingSite ? (
            <BookingHero
              bookingSite={bookingSite}
              bookingOffer={bookingOffer}
              onStartBooking={startBooking}
            />
          ) : null}

          <div
            ref={scrollRef}
            className="flex-1 space-y-8 overflow-y-auto p-6 no-scrollbar"
          >
            {messages.map((msg, index) => (
              <motion.div
                key={`${msg.role}-${index}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex max-w-[96%] gap-4",
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto",
                )}
              >
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-xl",
                    msg.role === "user"
                      ? "bg-white text-slate-950"
                      : "bg-gradient-to-br from-emerald-300 to-cyan-400 text-slate-950",
                  )}
                >
                  {msg.role === "user" ? <UserIcon size={20} /> : <Bot size={20} />}
                </div>

                <div
                  className={cn(
                    "space-y-5 rounded-[2rem] border p-5 shadow-2xl backdrop-blur-2xl",
                    msg.role === "user"
                      ? "rounded-tr-none border-white/10 bg-white text-slate-950"
                      : "rounded-tl-none border-white/10 bg-white/[0.07] text-white",
                  )}
                >
                  <div className="prose prose-sm max-w-none prose-invert">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>

                  {msg.actions && msg.actions.length > 0 ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {msg.actions.map((action) => (
                        <button
                          key={`${action.type}-${action.label}`}
                          type="button"
                          onClick={() => {
                            if (action.type === "navigate") navigate(action.path);
                            if (action.type === "search") void handleSend(action.query);
                            if (action.type === "book") void startBooking(action.intent);
                          }}
                          className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-left text-sm font-black text-emerald-100 transition hover:bg-emerald-300 hover:text-slate-950"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {msg.results && msg.results.length > 0 ? (
                    <div className="grid gap-3">
                      {msg.results.slice(0, 6).map((item) => (
                        <ResultCard
                          key={`${item.source}-${item.id}`}
                          item={item}
                          urlIsland={urlIsland}
                          navigate={navigate}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              </motion.div>
            ))}

            {isTyping ? (
              <div className="flex gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300 to-cyan-400 text-slate-950 shadow-xl">
                  <Bot size={20} />
                </div>

                <div className="rounded-[2rem] rounded-tl-none border border-emerald-300/20 bg-emerald-300/10 p-5 text-white shadow-2xl">
                  <div className="h-2 w-48 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300" />
                  </div>

                  <p className="mt-3 text-sm font-bold text-white/70">
                    Reading app context and searching VI Guide…
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <footer className="border-t border-white/10 bg-white/[0.04] p-5 backdrop-blur-3xl">
            <div className="mx-auto flex max-w-4xl items-center gap-3 rounded-[2rem] border border-white/10 bg-slate-950/60 p-3 shadow-2xl">
              <Search className="ml-3 h-5 w-5 text-emerald-300" />

              <input
                type="text"
                placeholder="Ask about places, routes, beaches, businesses, estates, history, or taxi help..."
                className="flex-1 rounded-[1.5rem] border border-white/10 bg-white px-5 py-4 text-base font-semibold text-slate-950 outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-300/20"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void handleSend();
                }}
              />

              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={!input.trim() || isTyping}
                className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-300 text-slate-950 shadow-xl transition hover:bg-white active:scale-95 disabled:opacity-50"
              >
                <Send size={22} />
              </button>
            </div>
          </footer>
        </section>
      </section>
    </main>
  );
}

function BookingHero({
  bookingSite,
  bookingOffer,
  onStartBooking,
}: {
  bookingSite: GeographicIndexItem;
  bookingOffer: ReturnType<typeof getHistoricSiteOffer>;
  onStartBooking: (option: BookingOption) => void;
}) {
  return (
    <section className="border-b border-white/10 bg-white/[0.03] p-6">
      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <div className="overflow-hidden rounded-[2rem] bg-black/30">
          <img
            src={getImage(bookingSite)}
            alt={bookingSite.name}
            className="h-60 w-full object-cover"
          />
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white p-6 text-slate-950 shadow-2xl">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">
            Featured Historic Experience
          </p>

          <h2 className="mt-2 text-3xl font-black">
            {bookingOffer?.tourTitle || `${bookingSite.name} Guided Visit`}
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {bookingSite.description ||
              "Explore the history, geography, and local stories connected to this site."}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge icon={Star} text="Visitor Favorite 4.9" />
            <Badge icon={CalendarDays} text="Available Today" />
            <Badge icon={Car} text="Taxi Bundle Ready" />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <BookingButton
              icon={Landmark}
              title={`Tour ${bookingOffer ? `$${bookingOffer.tourPrice}` : ""}`}
              text="Historic walk"
              onClick={() => onStartBooking("tour")}
            />
            <BookingButton
              icon={Car}
              title="Book Ride"
              text="Taxi lead"
              onClick={() => onStartBooking("ride")}
            />
            <BookingButton
              icon={Route}
              title="Bundle"
              text="Tour + taxi"
              onClick={() => onStartBooking("bundle")}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ResultCard({
  item,
  urlIsland,
  navigate,
}: {
  item: GeographicIndexItem;
  urlIsland: IslandCode;
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        if (item.source === "beach") {
          navigate(
            `/explore?island=${item.island ?? urlIsland}&q=${encodeURIComponent(item.name)}`,
          );
          return;
        }

        if (item.source === "estate") {
          navigate(
            `/estates/${encodeURIComponent(item.estateId || item.id)}?island=${
              item.island ?? urlIsland
            }`,
          );
          return;
        }

        if (item.source === "historicSite") {
          navigate(
            `/historic-sites/${encodeURIComponent(item.id)}?island=${
              item.island ?? urlIsland
            }`,
          );
          return;
        }

        navigate(`/dictionary?q=${encodeURIComponent(item.name)}`);
      }}
      className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white p-3 text-left text-slate-950 transition hover:shadow-xl"
    >
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
        <img
          src={getImage(item)}
          alt=""
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black">{item.name}</p>

        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
          {getSourceLabel(item)} · {islandLabel(item.island)}
        </p>

        {item.description ? (
          <p className="mt-1 line-clamp-2 text-xs text-slate-500">
            {item.description}
          </p>
        ) : null}
      </div>

      <ChevronRight size={16} className="text-slate-300" />
    </button>
  );
}

function SideAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm font-black text-white/75 transition hover:bg-white/10"
    >
      <Icon className="h-4 w-4 text-emerald-300" />
      {label}
    </button>
  );
}

function Badge({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-900">
      <Icon className="h-3.5 w-3.5" />
      {text}
    </span>
  );
}

function BookingButton({
  icon: Icon,
  title,
  text,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl bg-slate-950 p-4 text-left text-white shadow-xl transition hover:bg-emerald-300 hover:text-slate-950 active:scale-[0.98]"
    >
      <Icon className="h-5 w-5" />
      <p className="mt-3 text-sm font-black">{title}</p>
      <p className="mt-1 text-xs opacity-70">{text}</p>
    </button>
  );
}