import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Bot, BookOpen, Car, MapPin, Search, Send, Sparkles, User as UserIcon } from "lucide-react";
import { motion } from "motion/react";
import ReactMarkdown from "react-markdown";

import type { ConciergeAction } from "../features/concierge/conciergeBrain";
import { buildConciergeRidePath, isRideRequest } from "../features/concierge/conciergeMobility";
import { getHistoricSiteOffer } from "../data/revenue/historicSiteOffers";
import type { GeographicIndexItem } from "../data/core/geographicIndex";
import { createTourLead, updateTourLead } from "../lib/firestore/tourLeads";
import { useAppIntelligence } from "../hooks/useAppIntelligence";
import { cn } from "../lib/utils";
import {
  parseIntentLazy,
  reasonFromResultsLazy,
  relationshipAnswerLazy,
  runBrainLazy,
  searchGeographyLazy,
} from "./concierge/conciergeLazy";
import {
  extractLeadDetails,
  extractPlaceQueries,
  inferBookingOption,
  islandLabel,
  normalizeIsland,
  wantsBooking,
  withTimeout,
  type BookingOption,
} from "./concierge/conciergeUtils";
import { BookingHero, getTitle, ResultCard, SideAction } from "./concierge/ConciergePanels";
import type { ConciergeMessage, ConciergeProps } from "./concierge/conciergeTypes";

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

  const atlasContext = useMemo(() => {
    const latParam = params.get("lat");
    const lngParam = params.get("lng");

    return {
      island: params.get("island"),
      place: params.get("place"),
      atlasId: params.get("atlasId"),
      atlasType: params.get("atlasType"),
      source: params.get("source"),
      lat: latParam ? Number(latParam) : null,
      lng: lngParam ? Number(lngParam) : null,
    };
  }, [params]);

  const hasAtlasContext = Boolean(atlasContext.place);

  const atlasPrompt = hasAtlasContext
    ? `The user opened Concierge from the VI Guide Territory Atlas.

Selected place: ${atlasContext.place}
Type: ${atlasContext.atlasType || "unknown"}
Source: ${atlasContext.source || "unknown"}
Island: ${atlasContext.island || urlIsland}
Coordinates: ${
        atlasContext.lat !== null && atlasContext.lng !== null
          ? `${atlasContext.lat}, ${atlasContext.lng}`
          : "not available"
      }

Use this selected Atlas location as the active context.`
    : "";

  const [bookingSite, setBookingSite] = useState<GeographicIndexItem | null>(null);
  const [input, setInput] = useState(initialPrompt ?? "");
  const [isTyping, setIsTyping] = useState(false);
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadBookingSite() {
      if (!urlContext) {
        setBookingSite(null);
        return;
      }

      const matches = await searchGeographyLazy(urlContext, {
        island: urlIsland,
        limit: 8,
      });

      if (!cancelled) {
        setBookingSite(
          matches.find((item) => item.source === "historicSite") ||
            matches[0] ||
            null,
        );
      }
    }

    void loadBookingSite();

    return () => {
      cancelled = true;
    };
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
    contextTitle:
      atlasContext.place ||
      (contextListing ? getTitle(contextListing) : bookingSite?.name),
  });

  const welcomeText =
    isBookingIntent && bookingSite
      ? `I can help you book **${
          bookingOffer?.tourTitle || `${bookingSite.name} Guided Visit`
        }**. Choose tour, ride, or bundle, or type your preferred date, party size, phone, email, and pickup location.`
      : hasAtlasContext
        ? `I’m focused on **${atlasContext.place}** from the VI Guide Territory Atlas.

Type: **${atlasContext.atlasType || "Atlas item"}**  
Source: **${atlasContext.source || "VI Guide"}**  
Island: **${islandLabel(atlasContext.island || urlIsland)}**

Ask me about this place, its history, nearby beaches, routes, dictionary records, parcels, or what to do nearby.`
        : `I’m connected to VI Guide’s geographic index and app context. You are in **${intelligence.routeName}** for **${islandLabel(urlIsland)}**. Ask me for places, routes, estates, beaches, businesses, history, tours, or taxi help.`;

  const [messages, setMessages] = useState<ConciergeMessage[]>([
    { role: "model", text: welcomeText },
  ]);

  useEffect(() => {
    setInput(initialPrompt ?? "");
  }, [initialPrompt]);

  useEffect(() => {
    setMessages((current) => {
      if (current.length > 1) return current;
      return [{ role: "model", text: welcomeText }];
    });
  }, [welcomeText]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  function pushModelMessage(message: ConciergeMessage) {
    setMessages((prev) => [...prev, message]);
  }

  async function saveBookingLead(option: BookingOption, note?: string): Promise<string> {
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
      const parsedIntent = await parseIntentLazy(userMessage, urlIsland);
      const relationshipAnswer = await relationshipAnswerLazy(parsedIntent);

      if (relationshipAnswer) {
        pushModelMessage({
          role: "model",
          text: relationshipAnswer.text,
          results: relationshipAnswer.results,
          actions: relationshipAnswer.actions as ConciergeAction[] | undefined,
          intent:
            parsedIntent.intent === "directions" || parsedIntent.intent === "taxi"
              ? "route"
              : parsedIntent.intent === "history"
                ? "history"
                : "search",
        });
        return;
      }

      if ((isBookingIntent && bookingSite) || (bookingSite && wantsBooking(userMessage))) {
        const option = inferBookingOption(userMessage);
        const text = await saveBookingLead(option, userMessage);
        pushModelMessage({ role: "model", text });
        return;
      }

      if (isRideRequest(userMessage)) {
        const path = buildConciergeRidePath({ message: userMessage, island: urlIsland });

        pushModelMessage({
          role: "model",
          text:
            "I’ll send this into Mobility. Mobility will use the estate-based taxi system to resolve pickup, destination, taxi zone, official fare, route preview, and ride request.",
          actions: [{ type: "navigate", label: "Open Mobility Fare", path }],
          intent: "route",
        });
        return;
      }

      const placeQueries = extractPlaceQueries(userMessage);
      const geographyResults = (
        await Promise.all(
          placeQueries.map((query) =>
            searchGeographyLazy(query, {
              island: urlIsland,
              limit: 5,
            }),
          ),
        )
      ).flat();

      const uniqueResults = geographyResults.filter(
        (item, index, array) =>
          array.findIndex((other) => other.id === item.id) === index,
      );

      if (uniqueResults.length > 0) {
        const reasoned = await reasonFromResultsLazy({
          parsed: parsedIntent,
          results: uniqueResults,
        });

        pushModelMessage({
          role: "model",
          text: reasoned?.text || "I found matching VI Guide locations for that request.",
          results: reasoned?.results || uniqueResults.slice(0, 8),
          actions: [
            {
              type: "navigate",
              label: "Open Mobility Route Planner",
              path: `/mobility?island=${urlIsland}&q=${encodeURIComponent(userMessage)}`,
            },
          ],
          intent:
            parsedIntent.intent === "directions" || parsedIntent.intent === "taxi"
              ? "route"
              : parsedIntent.intent === "history"
                ? "history"
                : "search",
        });
        return;
      }

      const brain = await runBrainLazy({
        message: userMessage,
        island: urlIsland,
        routeName: intelligence.routeName,
        path: location.pathname,
        contextTitle:
          atlasContext.place ||
          (contextListing ? getTitle(contextListing) : bookingSite?.name),
        userLocation,
      });

      let text = brain.answer;

      if (hasAtlasContext) {
        text = `${atlasPrompt}

${text}`;
      }

      if (parcelContext) {
        text += `\n\nParcel context: ${parcelContext.label}, ${
          parcelContext.estateName || "unknown estate"
        }.`;
      }

      text += `\n\n---\n\n**Context I used:**\n${intelligence.systemContext}`;

      pushModelMessage({
        role: "model",
        text,
        results: brain.results,
        actions: brain.actions,
        intent: brain.intent,
      });
    } catch (error) {
      console.error("Concierge action failed:", error);
      pushModelMessage({
        role: "model",
        text: "I could not complete that action. The request timed out or was blocked. Please try again.",
      });
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
            <p className="mt-3 text-lg font-black text-white">{intelligence.routeName}</p>
            <p className="mt-1 text-sm text-cyan-200">{islandLabel(urlIsland)}</p>

            {hasAtlasContext ? (
              <div className="mt-3 rounded-2xl bg-emerald-300/10 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">
                  Atlas Selection
                </p>
                <p className="mt-1 text-sm font-black text-white">{atlasContext.place}</p>
                <p className="mt-1 text-xs text-white/50">
                  {atlasContext.atlasType || "Atlas item"} · {atlasContext.source || "VI Guide"}
                </p>
              </div>
            ) : contextListing || bookingSite ? (
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
            <SideAction icon={BookOpen} label="Dictionary" onClick={() => navigate("/dictionary")} />
            <SideAction icon={MapPin} label="Open Map" onClick={() => navigate(`/map?island=${urlIsland}`)} />
            <SideAction icon={Car} label="Plan Ride" onClick={() => navigate(`/mobility?island=${urlIsland}`)} />
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
                  I use app context, VI Guide geography, history, and Mobility’s route flow.
                </p>
              </div>
            </div>
          </header>

          {isBookingIntent && bookingSite ? (
            <BookingHero bookingSite={bookingSite} bookingOffer={bookingOffer} onStartBooking={startBooking} />
          ) : null}

          <div ref={scrollRef} className="flex-1 space-y-8 overflow-y-auto p-6 no-scrollbar">
            {messages.map((msg, index) => (
              <motion.div
                key={`${msg.role}-${index}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex max-w-[96%] gap-4", msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto")}
              >
                <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-xl", msg.role === "user" ? "bg-white text-slate-950" : "bg-gradient-to-br from-emerald-300 to-cyan-400 text-slate-950")}>
                  {msg.role === "user" ? <UserIcon size={20} /> : <Bot size={20} />}
                </div>

                <div className={cn("space-y-5 rounded-[2rem] border p-5 shadow-2xl backdrop-blur-2xl", msg.role === "user" ? "rounded-tr-none border-white/10 bg-white text-slate-950" : "rounded-tl-none border-white/10 bg-white/[0.07] text-white")}>
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
                            if (action.type === "navigate" && action.path) navigate(action.path);
                            if (action.type === "search" && action.query) void handleSend(action.query);
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
                        <ResultCard key={`${item.source}-${item.id}`} item={item} urlIsland={urlIsland} navigate={navigate} />
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
