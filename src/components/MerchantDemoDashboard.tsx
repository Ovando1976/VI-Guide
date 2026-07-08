import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BarChart3, Bell, CalendarDays, Car, Compass, Eye, MapPin, MessageSquare, MousePointerClick, Phone, RefreshCw, Save, Sparkles, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { demoPartners, getDemoPartnerById } from "../data/demoPartners";
import {
  clearDemoPartnerEvents,
  readDemoPartnerEvents,
  seedDemoPartnerEvents,
  type DemoPartnerEvent,
} from "../lib/demoPartnerEvents";

const actionIcon = {
  profile_view: Eye,
  call: Phone,
  directions: MapPin,
  save: Save,
  request_info: MessageSquare,
  concierge: Sparkles,
};

function formatTime(value: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "Now";
  }
}

export default function MerchantDemoDashboard() {
  const navigate = useNavigate();
  const [selectedPartnerId, setSelectedPartnerId] = useState("sapphire-beach-bar");
  const [events, setEvents] = useState<DemoPartnerEvent[]>(() => readDemoPartnerEvents());

  const selectedPartner = getDemoPartnerById(selectedPartnerId);

  useEffect(() => {
    const refresh = () => setEvents(readDemoPartnerEvents());
    window.addEventListener("vi-guide-demo-partner-event", refresh);
    window.addEventListener("storage", refresh);

    if (readDemoPartnerEvents().length === 0) {
      seedDemoPartnerEvents();
      refresh();
    }

    return () => {
      window.removeEventListener("vi-guide-demo-partner-event", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const partnerEvents = events.filter((event) => event.partnerId === selectedPartner.id);

  const totals = useMemo(() => {
    const bonus = {
      profileViews: partnerEvents.filter((event) => event.action === "profile_view").length,
      directionClicks: partnerEvents.filter((event) => event.action === "directions").length,
      calls: partnerEvents.filter((event) => event.action === "call").length,
      saves: partnerEvents.filter((event) => event.action === "save").length,
      conciergeMentions: partnerEvents.filter((event) => event.action === "concierge").length,
      inquiries: partnerEvents.filter((event) => event.action === "request_info").length,
    };

    return {
      profileViews: selectedPartner.metrics.profileViews + bonus.profileViews,
      directionClicks: selectedPartner.metrics.directionClicks + bonus.directionClicks,
      calls: selectedPartner.metrics.calls + bonus.calls,
      saves: selectedPartner.metrics.saves + bonus.saves,
      conciergeMentions: selectedPartner.metrics.conciergeMentions + bonus.conciergeMentions,
      inquiries: selectedPartner.metrics.inquiries + bonus.inquiries,
    };
  }, [partnerEvents, selectedPartner]);

  const cards = [
    {
      label: "Profile Views",
      value: totals.profileViews,
      icon: Eye,
      note: "Visitors who opened your profile",
    },
    {
      label: "Direction Clicks",
      value: totals.directionClicks,
      icon: MapPin,
      note: "Visitors asking how to get there",
    },
    {
      label: "Call Taps",
      value: totals.calls,
      icon: Phone,
      note: "High-intent mobile actions",
    },
    {
      label: "Saved Visits",
      value: totals.saves,
      icon: Save,
      note: "Added to visitor plans",
    },
    {
      label: "AI Mentions",
      value: totals.conciergeMentions,
      icon: Sparkles,
      note: "Concierge recommendation moments",
    },
    {
      label: "New Leads",
      value: totals.inquiries,
      icon: MessageSquare,
      note: "Questions and quote requests",
    },
  ];

  function resetDemo() {
    clearDemoPartnerEvents();
    seedDemoPartnerEvents();
    setEvents(readDemoPartnerEvents());
  }

  return (
    <div className="min-h-screen pb-32 pt-8 md:pt-10">
      <section className="mx-auto max-w-7xl px-4">
        <div className="rounded-[2.5rem] bg-ink p-5 text-white shadow-2xl md:p-8 lg:p-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-turquoise/15 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-turquoise">
                <BarChart3 className="h-4 w-4" />
                Partner Demo Mode
              </div>

              <h1 className="mt-4 text-4xl font-black leading-tight md:text-5xl">
                Merchant dashboard
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70 md:text-base">
                This shows what a partner sees when visitors interact with their
                business inside VI Guide: views, directions, calls, saves, AI
                concierge mentions, and inquiries.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/partners")}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-ink active:scale-95"
              >
                Partner Page
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => navigate("/explore")}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-white active:scale-95"
              >
                Visitor App
                <Compass className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-7 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[2rem] bg-white/10 p-4">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-turquoise">
                Selected business
              </p>

              <div className="mt-4 overflow-hidden rounded-[1.5rem] bg-white text-ink">
                <img
                  src={selectedPartner.image}
                  alt=""
                  className="h-44 w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.src =
                      "/images/places/st-thomas/magens-bay-beach-1.jpg";
                  }}
                />

                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-black">{selectedPartner.name}</h2>
                      <p className="mt-1 flex items-center gap-2 text-sm font-bold text-stone-500">
                        <MapPin className="h-4 w-4" />
                        {selectedPartner.area}
                      </p>
                    </div>

                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800">
                      {selectedPartner.partnerTier}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-stone-600">
                    {selectedPartner.description}
                  </p>

                  {selectedPartner.offer && (
                    <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-900">
                      Current offer: {selectedPartner.offer}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {demoPartners.map((partner) => (
                  <button
                    key={partner.id}
                    onClick={() => setSelectedPartnerId(partner.id)}
                    className={[
                      "rounded-2xl px-3 py-3 text-left text-xs font-black transition active:scale-95",
                      selectedPartnerId === partner.id
                        ? "bg-turquoise text-ink"
                        : "bg-white/10 text-white/70 hover:bg-white/15",
                    ].join(" ")}
                  >
                    {partner.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:gap-4">
                {cards.map((card) => {
                  const Icon = card.icon;

                  return (
                    <div key={card.label} className="min-h-[9.5rem] rounded-[2rem] bg-white p-4 text-ink shadow-xl lg:p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                          <Icon className="h-5 w-5" />
                        </div>
                        <p className="text-3xl font-black">
                          {card.value.toLocaleString()}
                        </p>
                      </div>

                      <p className="mt-4 text-sm font-black">{card.label}</p>
                      <p className="mt-1 text-xs leading-5 text-stone-500">
                        {card.note}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 rounded-[2rem] bg-white p-5 text-ink shadow-xl">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">
                      Recent visitor activity
                    </p>
                    <h2 className="mt-1 text-2xl font-black">Lead stream</h2>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        seedDemoPartnerEvents();
                        setEvents(readDemoPartnerEvents());
                      }}
                      className="inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-xs font-black text-white"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Add demo leads
                    </button>

                    <button
                      onClick={resetDemo}
                      className="inline-flex items-center gap-2 rounded-2xl bg-stone-100 px-4 py-3 text-xs font-black text-stone-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Reset
                    </button>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {(partnerEvents.length ? partnerEvents : events).slice(0, 8).map((event) => {
                    const Icon = actionIcon[event.action] ?? Bell;

                    return (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 rounded-3xl bg-stone-50 p-4"
                      >
                        <div className="rounded-2xl bg-white p-3 text-emerald-700 shadow-sm">
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-black">{event.partnerName}</p>
                            <p className="text-xs font-bold text-stone-400">
                              {formatTime(event.createdAt)}
                            </p>
                          </div>

                          <p className="mt-1 text-sm leading-6 text-stone-600">
                            {event.message}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {events.length === 0 && (
                    <div className="rounded-3xl bg-stone-50 p-6 text-center">
                      <p className="font-black text-stone-700">No demo leads yet.</p>
                      <p className="mt-1 text-sm text-stone-500">
                        Open the partner page and tap Call, Directions, or Lead.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 grid gap-4 pb-24 md:grid-cols-3">
                {[
                  {
                    icon: Car,
                    title: "Mobility value",
                    text: "Taxi and transfer partners can receive airport, ferry, cruise, and tour intent.",
                  },
                  {
                    icon: CalendarDays,
                    title: "Event value",
                    text: "Restaurants, bars, and venues can promote specials and event nights.",
                  },
                  {
                    icon: MousePointerClick,
                    title: "Measurable value",
                    text: "Partners see more than ads: calls, saves, directions, and inquiries.",
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-[2rem] bg-white/10 p-5">
                    <item.icon className="h-6 w-6 text-turquoise" />
                    <p className="mt-3 font-black">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-white/65">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
