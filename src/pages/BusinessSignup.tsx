import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Building2,
  CheckCircle2,
  Crown,
  Mail,
  Phone,
  Send,
  User,
} from "lucide-react";

import { createBusinessClaim } from "../lib/firestore/businesses";

const plans = [
  {
    name: "Free",
    price: "$0",
    features: ["Basic listing", "Search visibility", "Contact info"],
  },
  {
    name: "Featured",
    price: "$49/mo",
    features: ["Featured badge", "Priority placement", "Lead capture", "Analytics"],
  },
  {
    name: "Premium",
    price: "$99/mo",
    features: ["Top placement", "Concierge promotion", "Booking buttons", "Monthly report"],
  },
  {
    name: "Enterprise",
    price: "$299/mo",
    features: ["Multiple listings", "Campaign support", "Custom placement", "Partner features"],
  },
] as const;

type PlanName = (typeof plans)[number]["name"];

export default function BusinessSignup() {
  const [searchParams] = useSearchParams();

  const claimedBusinessSlug = searchParams.get("business") || "";

  const [selectedPlan, setSelectedPlan] = useState<PlanName>("Featured");
  const [businessName, setBusinessName] = useState("");
  const [claimantName, setClaimantName] = useState("");
  const [claimantEmail, setClaimantEmail] = useState("");
  const [claimantPhone, setClaimantPhone] = useState("");
  const [claimantRole, setClaimantRole] = useState("");
  const [website, setWebsite] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const pageTitle = useMemo(() => {
    return claimedBusinessSlug ? "Claim Your Business" : "List Your Business";
  }, [claimedBusinessSlug]);

  async function submitClaim(event: FormEvent) {
    event.preventDefault();

    if (!claimantName.trim() || !claimantEmail.trim()) return;

    try {
      setSubmitting(true);

      await createBusinessClaim({
        businessId: claimedBusinessSlug || businessName.trim().toLowerCase().replace(/\s+/g, "-"),
        businessName: businessName.trim() || claimedBusinessSlug || "New Business",
        businessSlug: claimedBusinessSlug,
        claimantName: claimantName.trim(),
        claimantEmail: claimantEmail.trim(),
        claimantPhone: claimantPhone.trim() || undefined,
        claimantRole: claimantRole.trim() || undefined,
        website: website.trim() || undefined,
        message:
          message.trim() ||
          `Interested in the ${selectedPlan} VI Guide business plan.`,
        plan: selectedPlan,
      });

      setSent(true);
      setBusinessName("");
      setClaimantName("");
      setClaimantEmail("");
      setClaimantPhone("");
      setClaimantRole("");
      setWebsite("");
      setMessage("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#061016] p-5 pb-32 text-white">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-2xl">
        <div className="bg-gradient-to-br from-cyan-400/20 via-emerald-400/10 to-transparent p-6">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-cyan-300">
            Grow with VI Guide
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight">
            {pageTitle}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70">
            Get discovered by visitors and locals searching for places, tours,
            taxis, restaurants, contractors, charters, hotels, and services
            across the Virgin Islands.
          </p>

          {claimedBusinessSlug ? (
            <div className="mt-4 rounded-2xl border border-cyan-300/25 bg-cyan-300/10 p-4 text-sm font-bold text-cyan-100">
              Claim request for: {claimedBusinessSlug}
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-4">
        {plans.map((plan) => {
          const active = selectedPlan === plan.name;

          return (
            <button
              key={plan.name}
              type="button"
              onClick={() => setSelectedPlan(plan.name)}
              className={`rounded-[2rem] border p-5 text-left shadow-xl transition ${
                active
                  ? "border-cyan-300 bg-cyan-300 text-slate-950"
                  : "border-white/10 bg-white/[0.06] text-white hover:bg-white/10"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-black">{plan.name}</h2>
                <p
                  className={`text-2xl font-black ${
                    active ? "text-slate-950" : "text-cyan-300"
                  }`}
                >
                  {plan.price}
                </p>
              </div>

              <div className="mt-4 space-y-2">
                {plan.features.map((feature) => (
                  <div
                    key={feature}
                    className={`flex items-center gap-2 text-sm ${
                      active ? "text-slate-800" : "text-white/70"
                    }`}
                  >
                    <CheckCircle2 size={16} />
                    {feature}
                  </div>
                ))}
              </div>

              <div
                className={`mt-5 rounded-2xl px-4 py-3 text-center text-sm font-black ${
                  active ? "bg-slate-950 text-white" : "bg-cyan-400 text-slate-950"
                }`}
              >
                {active ? "Selected" : `Choose ${plan.name}`}
              </div>
            </button>
          );
        })}
      </section>

      <form
        onSubmit={submitClaim}
        className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl"
      >
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-400 text-slate-950">
            <Crown className="h-6 w-6" />
          </div>

          <div>
            <h2 className="text-2xl font-black">Submit Claim Request</h2>
            <p className="mt-1 text-sm text-white/65">
              We will review your request and contact you about verification,
              listing updates, and the selected plan.
            </p>
          </div>
        </div>

        {sent ? (
          <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm font-bold text-emerald-200">
            Claim request submitted successfully.
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-white/50">
              <Building2 className="h-4 w-4" />
              Business Name
            </span>
            <input
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              placeholder={claimedBusinessSlug || "Your business name"}
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm outline-none ring-1 ring-white/10 focus:ring-cyan-300"
            />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-white/50">
              <User className="h-4 w-4" />
              Your Name
            </span>
            <input
              value={claimantName}
              onChange={(event) => setClaimantName(event.target.value)}
              placeholder="Owner or manager name"
              required
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm outline-none ring-1 ring-white/10 focus:ring-cyan-300"
            />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-white/50">
              <Mail className="h-4 w-4" />
              Email
            </span>
            <input
              type="email"
              value={claimantEmail}
              onChange={(event) => setClaimantEmail(event.target.value)}
              placeholder="you@business.com"
              required
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm outline-none ring-1 ring-white/10 focus:ring-cyan-300"
            />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-white/50">
              <Phone className="h-4 w-4" />
              Phone
            </span>
            <input
              value={claimantPhone}
              onChange={(event) => setClaimantPhone(event.target.value)}
              placeholder="Best phone number"
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm outline-none ring-1 ring-white/10 focus:ring-cyan-300"
            />
          </label>

          <label className="block">
            <span className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-white/50">
              Role
            </span>
            <input
              value={claimantRole}
              onChange={(event) => setClaimantRole(event.target.value)}
              placeholder="Owner, manager, marketing..."
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm outline-none ring-1 ring-white/10 focus:ring-cyan-300"
            />
          </label>

          <label className="block">
            <span className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-white/50">
              Website
            </span>
            <input
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              placeholder="https://..."
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm outline-none ring-1 ring-white/10 focus:ring-cyan-300"
            />
          </label>
        </div>

        <label className="mt-3 block">
          <span className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-white/50">
            Message
          </span>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={4}
            placeholder={`I want to claim this listing and start with the ${selectedPlan} plan.`}
            className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm outline-none ring-1 ring-white/10 focus:ring-cyan-300"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-4 font-black text-slate-950 disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {submitting ? "Submitting..." : `Submit ${selectedPlan} Request`}
        </button>
      </form>
    </main>
  );
}