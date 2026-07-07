import { FormEvent, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeDollarSign,
  CheckCircle2,
  ClipboardCheck,
  Crown,
  MapPin,
  Rocket,
  Sparkles,
  Store,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { createMerchantLead } from "../lib/firestore/merchantLeads";

type Prospect = {
  placeName?: string;
  placeType?: string;
  total?: number;
  directions?: number;
  dayPlans?: number;
  rides?: number;
  taps?: number;
  estimatedValue?: number;
};

type PartnerCloseLead = {
  id: string;
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  tier: string;
  notes: string;
  prospect: Prospect | null;
  createdAt: string;
};

const LOCAL_KEY = "viNavigatorPartnerCloseLeads";
const PROSPECT_KEY = "viNavigatorSelectedPartnerProspect";

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "$49/mo",
    icon: Store,
    description: "Claimed listing, contact links, basic visitor proof.",
    bullets: ["Claimed business profile", "Map listing", "Basic lead tracking"],
  },
  {
    id: "growth",
    name: "Growth",
    price: "$99/mo",
    icon: Rocket,
    description: "Featured placement and stronger visitor-intent dashboard.",
    bullets: ["Featured map placement", "Directions + day-plan tracking", "Monthly proof report"],
    featured: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$199/mo",
    icon: Crown,
    description: "Priority placement, ride attribution, and concierge routing.",
    bullets: ["Priority placement", "Ride-request attribution", "Concierge handoff"],
  },
];

function readProspect(): Prospect | null {
  try {
    const raw = window.localStorage.getItem(PROSPECT_KEY);
    return raw ? (JSON.parse(raw) as Prospect) : null;
  } catch {
    return null;
  }
}

function readCloseLeads(): PartnerCloseLead[] {
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveCloseLead(lead: PartnerCloseLead) {
  const next = [lead, ...readCloseLeads()].slice(0, 250);
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
}

export default function PartnerClosePage() {
  const navigate = useNavigate();
  const prospect = useMemo(() => readProspect(), []);

  const [businessName, setBusinessName] = useState(prospect?.placeName || "");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState("growth");
  const [notes, setNotes] = useState(
    prospect?.placeName
      ? `Follow up about founding partner placement for ${prospect.placeName}.`
      : "Follow up about founding partner placement."
  );
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedPlan = plans.find((plan) => plan.id === tier) || plans[1];

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    const lead: PartnerCloseLead = {
      id: `partner-close-${Date.now()}`,
      businessName: businessName.trim(),
      contactName: contactName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      tier,
      notes: notes.trim(),
      prospect,
      createdAt: new Date().toISOString(),
    };

    if (!lead.businessName) return;

    setSaving(true);
    saveCloseLead(lead);

    try {
      await createMerchantLead({
        partnerId: `close-${lead.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        partnerName: lead.businessName,
        action: "partner_close_form" as any,
        source: "partner_close_page",
        visitorName: lead.contactName || "Business Contact",
        visitorPhone: lead.phone,
        visitorEmail: lead.email,
        message: `Partner close lead for ${lead.businessName}. Selected plan: ${selectedPlan.name} ${selectedPlan.price}. Notes: ${lead.notes}`,
        plan: selectedPlan.name,
        planPrice: selectedPlan.price,
        prospect,
        localEventId: lead.id,
      } as any);
    } catch (error) {
      console.warn("Partner close Firestore write failed; saved locally instead.", error);
    }

    setSaving(false);
    setSaved(true);
  };

  return (
    <main className="min-h-screen bg-[#f8f0da] pb-40 text-ink">
      <section className="mx-auto max-w-7xl px-4 py-8">
        <button
          type="button"
          onClick={() => navigate("/business-proof")}
          className="mb-4 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black shadow-sm active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Business Proof
        </button>

        <div className="rounded-[2.75rem] bg-ink p-5 text-white shadow-2xl md:p-8 lg:p-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-turquoise/15 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-turquoise">
            <BadgeDollarSign className="h-4 w-4" />
            Partner Close
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
            Convert the proof into a paid partner.
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 md:text-base">
            Use this page after showing the business proof card. Pick a plan,
            capture the contact, and save the follow-up as a partner lead.
          </p>

          {prospect ? (
            <div className="mt-7 grid gap-3 md:grid-cols-5">
              <HeroStat label="Prospect" value={prospect.placeName || "Selected place"} />
              <HeroStat label="Actions" value={prospect.total || 0} />
              <HeroStat label="Directions" value={prospect.directions || 0} />
              <HeroStat label="Ride starts" value={prospect.rides || 0} />
              <HeroStat
                label="Est. value"
                value={`$${Number(prospect.estimatedValue || 0).toLocaleString()}`}
              />
            </div>
          ) : (
            <div className="mt-7 rounded-[2rem] bg-white/10 p-5 text-sm font-bold leading-7 text-white/70">
              No prospect was selected yet. You can still create a partner close
              lead manually, or go back to Business Proof and select a place.
            </div>
          )}
        </div>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <form onSubmit={submit} className="rounded-[2.25rem] bg-white p-5 shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
              Close details
            </p>
            <h2 className="mt-2 text-3xl font-black">Capture the partner</h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Business name" value={businessName} onChange={setBusinessName} required />
              <Field label="Contact name" value={contactName} onChange={setContactName} />
              <Field label="Phone" value={phone} onChange={setPhone} />
              <Field label="Email" value={email} onChange={setEmail} type="email" />
            </div>

            <div className="mt-5">
              <label className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
                Follow-up notes
              </label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="mt-2 min-h-32 w-full rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4 text-sm font-bold outline-none focus:border-emerald-700"
              />
            </div>

            <button
              type="submit"
              disabled={saving || !businessName.trim()}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-950 px-5 py-4 text-sm font-black text-white shadow-xl active:scale-95 disabled:opacity-50"
            >
              {saved ? <CheckCircle2 className="h-5 w-5" /> : <ClipboardCheck className="h-5 w-5" />}
              {saving ? "Saving..." : saved ? "Partner lead saved" : "Save Partner Lead"}
            </button>

            {saved ? (
              <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-950">
                Saved. This prospect is now part of the business sales pipeline.
                Check <button type="button" onClick={() => navigate("/partner-pipeline")} className="font-black underline">Partner Pipeline</button>
                {" "}or{" "}
                <button type="button" onClick={() => navigate("/admin/leads")} className="font-black underline">Admin Leads</button>.
              </div>
            ) : null}
          </form>

          <div className="space-y-5">
            <section className="rounded-[2.25rem] bg-white p-5 shadow-xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                Select plan
              </p>
              <h2 className="mt-2 text-3xl font-black">Founding partner offer</h2>

              <div className="mt-5 space-y-3">
                {plans.map((plan) => {
                  const Icon = plan.icon;
                  const active = tier === plan.id;

                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setTier(plan.id)}
                      className={`w-full rounded-[2rem] p-4 text-left transition active:scale-[0.99] ${
                        active
                          ? "bg-emerald-950 text-white shadow-xl"
                          : "bg-stone-50 hover:bg-stone-100"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${
                            active ? "bg-turquoise text-ink" : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="text-lg font-black">{plan.name}</h3>
                            <p className="text-xl font-black">{plan.price}</p>
                          </div>
                          <p className={`mt-1 text-sm font-bold leading-6 ${active ? "text-white/70" : "text-stone-500"}`}>
                            {plan.description}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {plan.bullets.map((bullet) => (
                              <span
                                key={bullet}
                                className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
                                  active ? "bg-white/10 text-white/70" : "bg-white text-stone-500"
                                }`}
                              >
                                {bullet}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[2.25rem] bg-ink p-5 text-white shadow-xl">
              <Sparkles className="h-8 w-8 text-turquoise" />
              <h2 className="mt-4 text-3xl font-black">Closing line</h2>
              <p className="mt-3 text-sm font-bold leading-7 text-white/70">
                “We are not selling a static listing. We are showing where visitors
                are already tapping, routing, planning, and requesting rides. The
                partner plan turns that activity into customer traffic.”
              </p>

              <div className="mt-5 rounded-[1.5rem] bg-white/10 p-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-turquoise">
                  Recommended ask
                </p>
                <p className="mt-2 text-3xl font-black">
                  {selectedPlan.name} · {selectedPlan.price}
                </p>
              </div>
            </section>
          </div>
        </section>
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label>
      <span className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
        {label}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4 text-sm font-bold outline-none focus:border-emerald-700"
      />
    </label>
  );
}

function HeroStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[1.75rem] bg-white p-4 text-ink">
      <MapPin className="h-5 w-5 text-emerald-700" />
      <p className="mt-3 truncate text-2xl font-black">{value}</p>
      <p className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-stone-500">
        {label}
      </p>
    </div>
  );
}
