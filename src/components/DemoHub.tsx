import {
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  Building2,
  Car,
  Compass,
  MapPinned,
  MousePointerClick,
  Route,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const demoCards = [
  {
    title: "Visitor App",
    subtitle: "Show the public-facing island discovery experience.",
    path: "/",
    icon: Compass,
    eyebrow: "Start here",
  },
  {
    title: "Partner Portal",
    subtitle: "Show businesses how they appear, get leads, and join.",
    path: "/partners",
    icon: Building2,
    eyebrow: "Revenue demo",
  },
  {
    title: "Merchant Dashboard",
    subtitle: "Show views, calls, directions, AI mentions, and lead activity.",
    path: "/merchant/demo",
    icon: BarChart3,
    eyebrow: "Business value",
  },
  {
    title: "Mobility Request",
    subtitle: "Show visitor transportation requests and estimated fares.",
    path: "/mobility",
    icon: Car,
    eyebrow: "Visitor mobility",
  },
  {
    title: "Admin Leads",
    subtitle: "Review partner claims, merchant activity, and mobility leads.",
    path: "/admin/leads",
    icon: ShieldCheck,
    eyebrow: "Operator inbox",
  },
  {
    title: "Dispatch Board",
    subtitle: "Show operators how transportation requests are managed.",
    path: "/mobility/dispatch",
    icon: Route,
    eyebrow: "Operator workflow",
  },
];

const talkTrack = [
  {
    title: "Visitors discover local businesses",
    text: "The app helps visitors find beaches, food, shopping, events, attractions, transportation, and AI recommendations.",
    icon: MapPinned,
  },
  {
    title: "Businesses get measurable actions",
    text: "Partners are not just buying ads. They can see profile views, direction clicks, calls, saves, AI mentions, and inquiries.",
    icon: MousePointerClick,
  },
  {
    title: "Mobility becomes a lead system",
    text: "Taxi, ferry, cruise, airport, beach, dinner, and tour requests can flow into a dispatch board for licensed operators.",
    icon: Car,
  },
  {
    title: "The app creates recurring revenue",
    text: "Verified listings, featured placement, concierge partners, and mobility dispatch tools create monthly subscription opportunities.",
    icon: BadgeDollarSign,
  },
];

export default function DemoHub() {
  const navigate = useNavigate();

  return (

    <div className="min-h-screen pb-32 pt-8 md:pt-10">
      <div className="mx-auto mb-4 flex max-w-6xl justify-end px-4">
        <a
          href="/taxi-demo"
          className="inline-flex items-center rounded-2xl bg-turquoise px-5 py-3 text-sm font-black text-ink shadow-2xl active:scale-95"
        >
          Taxi Association Demo →</a><a href="/map-intent" className="ml-2 inline-flex items-center rounded-2xl bg-emerald-950 px-5 py-3 text-sm font-black text-white shadow-2xl active:scale-95">Map Intent →
        </a>
      </div>
      <section className="mx-auto max-w-6xl px-4">
        <div className="overflow-hidden rounded-[2.75rem] bg-ink text-white shadow-2xl">
          <div className="grid gap-8 p-6 md:grid-cols-[1.05fr_0.95fr] md:p-10 lg:p-12">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-turquoise/15 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-turquoise">
                <Sparkles className="h-4 w-4" />
                VI Guide Business Demo
              </div>

              <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight md:text-6xl">
                One link to show the whole business opportunity.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-white/70 md:text-lg">
                Use this page during sales calls with restaurants, taxi operators,
                tour companies, shopping centers, beach bars, ferry partners, and
                local business owners.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => navigate("/partners")}
                  className="inline-flex items-center justify-center gap-3 rounded-2xl bg-turquoise px-6 py-4 text-sm font-black text-ink shadow-xl active:scale-95"
                >
                  Start Partner Demo
                  <ArrowRight className="h-5 w-5" />
                </button>

                <button
                  onClick={() => navigate("/mobility")}
                  className="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-6 py-4 text-sm font-black text-white active:scale-95"
                >
                  Start Mobility Demo
                  <Car className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-turquoise">
                5-minute demo story
              </p>

              <div className="mt-5 space-y-3">
                {talkTrack.map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="rounded-3xl bg-white/10 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-turquoise text-ink">
                          <Icon className="h-5 w-5" />
                        </div>

                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">
                            Step {index + 1}
                          </p>
                          <p className="mt-1 font-black text-white">
                            {item.title}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-white/60">
                            {item.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid border-t border-white/10 md:grid-cols-4">
            {[
              "Visitor discovery",
              "Partner leads",
              "Merchant analytics",
              "Mobility dispatch",
            ].map((label) => (
              <div key={label} className="border-white/10 p-5 md:border-r">
                <p className="text-sm font-black text-white">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-6xl px-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {demoCards.map((card) => {
            const Icon = card.icon;

            return (
              <button
                key={card.path}
                onClick={() => navigate(card.path)}
                className="group rounded-[2rem] bg-white p-5 text-left shadow-xl ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 transition group-hover:bg-ink group-hover:text-turquoise">
                    <Icon className="h-6 w-6" />
                  </div>

                  <ArrowRight className="h-5 w-5 text-stone-300 transition group-hover:translate-x-1 group-hover:text-emerald-700" />
                </div>

                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">
                  {card.eyebrow}
                </p>

                <h2 className="mt-2 text-xl font-black text-ink">
                  {card.title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-stone-500">
                  {card.subtitle}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-6xl px-4">
        <div className="rounded-[2.25rem] bg-white p-5 shadow-xl ring-1 ring-black/5 md:p-8">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">
                Sales close
              </p>

              <h2 className="mt-2 text-3xl font-black text-ink">
                What we are selling
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-600 md:text-base">
                VI Guide is a visitor discovery app, local business lead engine,
                AI concierge, and mobility coordination layer. The first offer is
                founding partner access for verified profiles, featured placement,
                monthly analytics, and transportation lead flow.
              </p>
            </div>

            <div className="rounded-[2rem] bg-emerald-50 p-5">
              <p className="text-sm font-black text-emerald-950">
                Founding partner offer
              </p>

              <p className="mt-2 text-4xl font-black text-emerald-950">
                $49<span className="text-base text-emerald-900/60">/mo</span>
              </p>

              <p className="mt-1 text-xs font-bold text-emerald-900/65">
                First 6 months for early partners
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
