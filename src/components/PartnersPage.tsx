import { ArrowRight, BarChart3, CheckCircle2, Compass, Crown, Handshake, MapPin, MessageSquare, MousePointerClick, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { demoPartners, type DemoPartner, type DemoPartnerAction } from "../data/demoPartners";
import { logDemoPartnerEvent } from "../lib/demoPartnerEvents";

const pricing = [
  {
    name: "Verified Listing",
    price: "$49",
    description: "Claim your profile and appear as a verified local business.",
    features: ["Verified profile", "Call and directions buttons", "Photos and description", "Monthly visibility report"],
  },
  {
    name: "Featured Partner",
    price: "$99",
    description: "Get stronger placement in visitor discovery flows.",
    features: ["Featured cards", "Offers and specials", "More prominent map/list placement", "Lead tracking"],
    highlighted: true,
  },
  {
    name: "Concierge Partner",
    price: "$199",
    description: "Become eligible for AI concierge recommendations when relevant.",
    features: ["AI concierge placement", "Visitor intent reporting", "QR campaign support", "Priority partner profile"],
  },
];

function track(partner: DemoPartner, action: DemoPartnerAction) {
  logDemoPartnerEvent({
    partnerId: partner.id,
    partnerName: partner.name,
    action,
  });
}

export default function PartnersPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-32 pt-8 md:pt-10">
      <section className="mx-auto max-w-6xl px-4">
        <div className="overflow-hidden rounded-[2.5rem] bg-ink text-white shadow-2xl">
          <div className="grid gap-8 p-6 md:grid-cols-[1.1fr_0.9fr] md:p-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-turquoise/15 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-turquoise">
                <Handshake className="h-4 w-4" />
                VI Guide Partner Portal
              </div>

              <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight md:text-6xl">
                Turn visitor attention into measurable local business leads.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-white/75 md:text-lg">
                VI Guide helps visitors discover where to eat, what to do, how to get around,
                and which local businesses are worth visiting. Partners get profile visibility,
                lead buttons, concierge placement, and simple analytics.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => navigate("/merchant/demo")}
                  className="inline-flex items-center justify-center gap-3 rounded-2xl bg-turquoise px-6 py-4 text-sm font-black text-ink shadow-xl transition active:scale-95"
                >
                  View Dashboard Demo
                  <ArrowRight className="h-5 w-5" />
                </button>

                <button
                  onClick={() => navigate("/explore")}
                  className="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-6 py-4 text-sm font-black text-white transition active:scale-95"
                >
                  See Visitor App
                  <Compass className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-turquoise">
                Demo impact
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  ["1,248", "Profile views"],
                  ["312", "Direction taps"],
                  ["84", "Call taps"],
                  ["58", "AI mentions"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-3xl bg-white/10 p-4">
                    <p className="text-3xl font-black">{value}</p>
                    <p className="mt-1 text-xs font-bold text-white/60">{label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-3xl bg-white p-4 text-ink">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-1 h-5 w-5 text-emerald-700" />
                  <div>
                    <p className="font-black">AI concierge lead</p>
                    <p className="mt-1 text-sm leading-6 text-stone-600">
                      Visitor asked: “Where should we eat near Red Hook after the ferry?”
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid border-t border-white/10 md:grid-cols-4">
            {[
              ["Visitors discover you", MapPin],
              ["They tap call/directions", MousePointerClick],
              ["Concierge recommends you", Sparkles],
              ["You see the results", BarChart3],
            ].map(([label, Icon]) => (
              <div key={String(label)} className="border-white/10 p-5 md:border-r">
                <Icon className="h-6 w-6 text-turquoise" />
                <p className="mt-3 text-sm font-black">{String(label)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-6xl px-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">
              Demo partner profiles
            </p>
            <h2 className="mt-2 text-3xl font-black text-ink">
              What a business gets inside the app
            </h2>
          </div>

          <button
            onClick={() => navigate("/merchant/demo")}
            className="hidden rounded-2xl bg-ink px-5 py-3 text-sm font-black text-white shadow-lg md:inline-flex"
          >
            Open Dashboard
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {demoPartners.slice(0, 8).map((partner) => (
            <article
              key={partner.id}
              className="overflow-hidden rounded-[2rem] bg-white shadow-xl ring-1 ring-black/5"
            >
              <div className="relative h-40">
                <img
                  src={partner.image}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.src =
                      "/images/places/st-thomas/magens-bay-beach-1.jpg";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <span className="rounded-full bg-turquoise px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-ink">
                    {partner.partnerTier}
                  </span>
                  <h3 className="mt-2 text-xl font-black text-white">
                    {partner.name}
                  </h3>
                </div>
              </div>

              <div className="p-4">
                <p className="flex items-center gap-2 text-xs font-bold text-stone-500">
                  <MapPin className="h-4 w-4" />
                  {partner.area}
                </p>

                <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-600">
                  {partner.description}
                </p>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => track(partner, "call")}
                    className="rounded-2xl bg-stone-100 px-3 py-2 text-xs font-black text-stone-700 active:scale-95"
                  >
                    Call
                  </button>
                  <button
                    onClick={() => track(partner, "directions")}
                    className="rounded-2xl bg-stone-100 px-3 py-2 text-xs font-black text-stone-700 active:scale-95"
                  >
                    Directions
                  </button>
                  <button
                    onClick={() => track(partner, "request_info")}
                    className="rounded-2xl bg-emerald-700 px-3 py-2 text-xs font-black text-white active:scale-95"
                  >
                    Lead
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-6xl px-4">
        <div className="rounded-[2.5rem] bg-white p-5 shadow-xl ring-1 ring-black/5 md:p-8">
          <div className="flex items-center gap-3">
            <Crown className="h-7 w-7 text-emerald-700" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">
                Founding partner offer
              </p>
              <h2 className="text-3xl font-black text-ink">Simple monthly plans</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={[
                  "rounded-[2rem] p-5 ring-1",
                  plan.highlighted
                    ? "bg-ink text-white ring-ink"
                    : "bg-stone-50 text-ink ring-black/5",
                ].join(" ")}
              >
                <p className="text-sm font-black">{plan.name}</p>
                <div className="mt-3 flex items-end gap-1">
                  <p className="text-4xl font-black">{plan.price}</p>
                  <p className={plan.highlighted ? "text-white/60" : "text-stone-500"}>
                    /mo
                  </p>
                </div>

                <p className={["mt-3 text-sm leading-6", plan.highlighted ? "text-white/70" : "text-stone-600"].join(" ")}>
                  {plan.description}
                </p>

                <div className="mt-5 space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm font-bold">
                      <CheckCircle2 className="h-4 w-4 text-turquoise" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-3xl bg-emerald-50 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-black text-emerald-950">
                  Sales message for businesses
                </p>
                <p className="mt-1 text-sm leading-6 text-emerald-900/75">
                  “We are building the local AI visitor guide for the Virgin Islands.
                  Your business can be recommended when visitors ask where to eat,
                  what to do, how to get around, or how to plan their day.”
                </p>
              </div>

              <button
                onClick={() => navigate("/merchant/demo")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white"
              >
                Show dashboard
                <MessageSquare className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
