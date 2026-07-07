import {
  ArrowRight,
  BadgeDollarSign,
  Car,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  MapPinned,
  PhoneCall,
  Radio,
  Route,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const demoSteps = [
  {
    label: "Step 1",
    title: "Customer requests a ride",
    text: "The rider selects island, pickup, dropoff, passenger count, luggage, add-ons, and contact information.",
    icon: Route,
  },
  {
    label: "Step 2",
    title: "System checks pricing mode",
    text: "The app separates official tariff matches, VI Guide custom road-aware estimates, and dispatcher-review routes.",
    icon: ShieldCheck,
  },
  {
    label: "Step 3",
    title: "Dispatcher receives the request",
    text: "The association sees the ride in a command center with rider contact, fare basis, road flags, and status workflow.",
    icon: Radio,
  },
  {
    label: "Step 4",
    title: "Driver is assigned",
    text: "Dispatch can assign a driver, call the rider, copy a dispatch note, save internal notes, and move the ride forward.",
    icon: Car,
  },
];

const valueCards = [
  {
    title: "Protects tariff integrity",
    text: "Official tariff matches are labeled clearly. Non-direct combinations are not falsely presented as official fares.",
    icon: ShieldCheck,
  },
  {
    title: "Supports local operators",
    text: "The system is built around dispatch and association control, not replacing taxi operators.",
    icon: Users,
  },
  {
    title: "Handles real VI roads",
    text: "Narrow, steep, difficult, and remote roads can be flagged for dispatcher review or custom pricing.",
    icon: MapPinned,
  },
  {
    title: "Creates revenue opportunity",
    text: "The app turns visitor transportation demand into organized ride requests and partner leads.",
    icon: BadgeDollarSign,
  },
];

const pilotFeatures = [
  "Customer ride request page",
  "Official tariff-aware quote flow",
  "Custom road-aware estimate logic",
  "Dispatcher review fallback",
  "Taxi Association Command Center",
  "Driver assignment workflow",
  "Call rider and copy dispatch note",
  "Admin lead tracking",
];

export default function TaxiAssociationDemoPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8f0da] pb-24 text-ink">
      <section className="mx-auto max-w-7xl px-4 py-8 md:py-10">
        <div className="overflow-hidden rounded-[2.75rem] bg-ink text-white shadow-2xl">
          <div className="grid gap-6 p-5 md:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:p-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-turquoise/15 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-turquoise">
                <Radio className="h-4 w-4" />
                Taxi Association Demo
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
                A modern dispatch layer for VI taxi operators.
              </h1>

              <p className="mt-5 max-w-3xl text-sm leading-7 text-white/70 md:text-base">
                This demo shows how VI Guide can help taxi associations receive
                customer ride requests, respect official tariff logic, flag
                difficult roads, assign drivers, and manage transportation
                workflow from one command center.
              </p>

              <div className="mt-7 rounded-[2rem] bg-white/10 p-5">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-turquoise">
                  Core message
                </p>
                <p className="mt-3 text-xl font-black leading-8">
                  This does not replace the taxi association. It gives the
                  association a modern customer request, pricing guidance,
                  dispatch, and driver assignment system.
                </p>
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate("/mobility")}
                  className="inline-flex items-center gap-2 rounded-2xl bg-turquoise px-5 py-4 text-sm font-black text-ink active:scale-95"
                >
                  Open Rider Flow
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  onClick={() => navigate("/mobility/dispatch")}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-black text-ink active:scale-95"
                >
                  Open Command Center
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  onClick={() => navigate("/admin/leads")}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-sm font-black text-white active:scale-95"
                >
                  Admin Leads
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <aside className="rounded-[2.25rem] bg-white p-5 text-ink">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
                Meeting demo path
              </p>
              <h2 className="mt-2 text-3xl font-black">
                Show the whole system in five minutes.
              </h2>

              <div className="mt-5 space-y-3">
                {demoSteps.map((step) => {
                  const Icon = step.icon;

                  return (
                    <div key={step.title} className="rounded-[2rem] bg-stone-50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">
                            {step.label}
                          </p>
                          <h3 className="mt-1 text-lg font-black">{step.title}</h3>
                          <p className="mt-1 text-sm font-bold leading-6 text-stone-600">
                            {step.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </aside>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {valueCards.map((card) => {
            const Icon = card.icon;

            return (
              <div key={card.title} className="rounded-[2.25rem] bg-white p-5 shadow-xl">
                <Icon className="h-8 w-8 text-emerald-700" />
                <h3 className="mt-4 text-2xl font-black">{card.title}</h3>
                <p className="mt-2 text-sm font-bold leading-6 text-stone-600">
                  {card.text}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
          <section className="rounded-[2.5rem] bg-white p-5 shadow-xl md:p-7">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
              Pilot offer
            </p>
            <h2 className="mt-2 text-4xl font-black">
              Taxi Association Pilot
            </h2>
            <p className="mt-4 text-sm font-bold leading-7 text-stone-600">
              The first paid version should be a controlled pilot with manual
              onboarding, association review, and a shared dispatcher workflow.
              Payments can stay manual at first while the system proves ride
              demand and operational value.
            </p>

            <div className="mt-5 rounded-[2rem] bg-emerald-50 p-5">
              <div className="flex items-start gap-3">
                <DollarSign className="mt-1 h-6 w-6 shrink-0 text-emerald-700" />
                <div>
                  <h3 className="text-xl font-black">Pilot pricing</h3>
                  <p className="mt-2 text-sm font-bold leading-6 text-emerald-950">
                    Start with monthly dispatch access, ride request intake,
                    and admin tracking. Keep invoicing/manual collection until
                    the association agrees on the operating model.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/join")}
                className="rounded-2xl bg-ink px-5 py-3 text-sm font-black text-white active:scale-95"
              >
                Join as Founding Partner
              </button>
              <button
                onClick={() => navigate("/demo")}
                className="rounded-2xl bg-stone-100 px-5 py-3 text-sm font-black text-ink active:scale-95"
              >
                Demo Hub
              </button>
            </div>
          </section>

          <section className="rounded-[2.5rem] bg-ink p-5 text-white shadow-xl md:p-7">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-turquoise">
              What is included
            </p>
            <h2 className="mt-2 text-4xl font-black">
              Built for the association meeting.
            </h2>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {pilotFeatures.map((feature) => (
                <div key={feature} className="flex items-start gap-3 rounded-2xl bg-white/10 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-turquoise" />
                  <p className="text-sm font-black leading-6">{feature}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[2rem] bg-white/10 p-5">
              <div className="flex items-start gap-3">
                <ClipboardList className="mt-1 h-6 w-6 shrink-0 text-turquoise" />
                <div>
                  <h3 className="text-xl font-black">Demo script</h3>
                  <p className="mt-2 text-sm font-bold leading-7 text-white/70">
                    First show this page. Then open the rider flow, create a
                    request, open the command center, assign a driver, copy the
                    dispatch note, move the ride status, and finish inside the
                    admin lead inbox.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-6 rounded-[2.5rem] bg-white p-5 shadow-xl md:p-7">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
            Live demo controls
          </p>
          <h2 className="mt-2 text-4xl font-black">Open the working product.</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {[
              {
                title: "Rider Flow",
                text: "Create a ride request.",
                path: "/mobility",
                icon: Car,
              },
              {
                title: "Command Center",
                text: "Dispatch and assign.",
                path: "/mobility/dispatch",
                icon: Radio,
              },
              {
                title: "Admin Leads",
                text: "Track opportunity.",
                path: "/admin/leads",
                icon: ClipboardList,
              },
              {
                title: "Partner Join",
                text: "Capture paid interest.",
                path: "/join",
                icon: PhoneCall,
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.title}
                  onClick={() => navigate(item.path)}
                  className="rounded-[2rem] bg-stone-50 p-5 text-left transition hover:-translate-y-1 active:scale-[0.99]"
                >
                  <Icon className="h-7 w-7 text-emerald-700" />
                  <h3 className="mt-4 text-xl font-black">{item.title}</h3>
                  <p className="mt-2 text-sm font-bold leading-6 text-stone-600">
                    {item.text}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-black text-emerald-700">
                    Open
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
