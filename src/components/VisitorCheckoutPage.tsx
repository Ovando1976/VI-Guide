import { useEffect, useState } from "react";
import {
  BadgeDollarSign,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  activateVisitorPass,
  syncVisitorPassFromCloud,
} from "../lib/accounts/userAccount";
import {
  startVisitorCheckout,
  type VisitorCheckoutPlan,
} from "../lib/payments/stripeCheckout";

const plans: VisitorCheckoutPlan[] = [
  {
    id: "day-pass",
    name: "Cruise Day Pass",
    amount: 9,
    days: 1,
    text: "Best for one cruise stop. Unlocks visitor desk, planner, route previews, and trip tools.",
  },
  {
    id: "trip-pass",
    name: "Trip Pass",
    amount: 19,
    days: 7,
    text: "Best for a full visit. Unlocks premium planning for the week.",
    featured: true,
  },
  {
    id: "concierge-pass",
    name: "Concierge Pass",
    amount: 49,
    days: 14,
    text: "Best for visitors who want planning help, stays, rides, and partner recommendations.",
  },
];

export default function VisitorCheckoutPage() {
  const navigate = useNavigate();
  const [paidPlan, setPaidPlan] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");

    if (payment !== "success") return;

    setNotice("Payment complete. Syncing your visitor pass...");

    let cancelled = false;

    async function sync() {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const pass = await syncVisitorPassFromCloud();

        if (cancelled) return;

        if (pass) {
          setNotice("Visitor pass activated.");
          setTimeout(() => navigate("/visitor-desk"), 500);
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 900));
      }

      if (!cancelled) {
        setNotice(
          "Payment was completed, but the pass is still processing. Refresh in a moment or check Firestore."
        );
      }
    }

    sync();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const activateDemo = (plan: VisitorCheckoutPlan) => {
    activateVisitorPass(plan.id, plan.name, plan.amount, plan.days);
    setPaidPlan(plan.id);

    setTimeout(() => {
      navigate("/visitor-desk");
    }, 500);
  };

  const payWithStripe = async (plan: VisitorCheckoutPlan) => {
    setError("");
    setLoadingPlan(plan.id);

    try {
      await startVisitorCheckout(plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start checkout.");
      setLoadingPlan(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f0da] pb-40 text-ink">
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-[2.75rem] bg-ink p-6 text-white shadow-2xl md:p-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-turquoise/15 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-turquoise">
            <CreditCard className="h-4 w-4" />
            Visitor Checkout
          </div>

          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
            Unlock the premium visitor planning flow.
          </h1>

          <p className="mt-4 max-w-3xl text-sm font-bold leading-7 text-white/70">
            Pay with Stripe Checkout. The webhook writes the pass to Firestore, then the app syncs paid access.
          </p>
        </div>

        {notice ? (
          <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-black text-emerald-800">
            {notice}
          </div>
        ) : null}

        {error ? (
          <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-black text-red-700">
            {error}
          </div>
        ) : null}

        <section className="mt-6 grid gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className={`rounded-[2.5rem] p-5 shadow-xl ${
                plan.featured ? "bg-emerald-950 text-white" : "bg-white text-ink"
              }`}
            >
              <div
                className={`grid h-14 w-14 place-items-center rounded-2xl ${
                  plan.featured ? "bg-turquoise text-ink" : "bg-emerald-950 text-turquoise"
                }`}
              >
                <BadgeDollarSign className="h-7 w-7" />
              </div>

              <p
                className={`mt-5 text-xs font-black uppercase tracking-[0.22em] ${
                  plan.featured ? "text-turquoise" : "text-emerald-700"
                }`}
              >
                {plan.days} day access
              </p>

              <h2 className="mt-2 text-3xl font-black">{plan.name}</h2>

              <p className="mt-3 text-5xl font-black">${plan.amount}</p>

              <p className={`mt-4 text-sm font-bold leading-7 ${plan.featured ? "text-white/70" : "text-stone-500"}`}>
                {plan.text}
              </p>

              <button
                type="button"
                onClick={() => payWithStripe(plan)}
                disabled={loadingPlan === plan.id}
                className={`mt-6 w-full rounded-2xl px-5 py-4 text-sm font-black active:scale-95 disabled:opacity-60 ${
                  plan.featured ? "bg-[#ffcf32] text-ink" : "bg-ink text-white"
                }`}
              >
                <ShieldCheck className="mr-2 inline h-4 w-4" />
                {loadingPlan === plan.id ? "Opening Stripe..." : "Pay with Stripe"}
              </button>

              <button
                type="button"
                onClick={() => activateDemo(plan)}
                className={`mt-3 w-full rounded-2xl px-5 py-3 text-xs font-black active:scale-95 ${
                  plan.featured ? "bg-white/10 text-white" : "bg-stone-100 text-ink"
                }`}
              >
                {paidPlan === plan.id ? (
                  <>
                    <CheckCircle2 className="mr-2 inline h-4 w-4" />
                    Demo Activated
                  </>
                ) : (
                  "Activate Demo Pass"
                )}
              </button>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-[2.5rem] bg-white p-5 shadow-xl">
          <Sparkles className="h-8 w-8 text-emerald-700" />
          <h2 className="mt-4 text-3xl font-black">What this unlocks</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {["Visitor Desk", "Cruise Planner", "Road previews", "Booking tools"].map((item) => (
              <div key={item} className="rounded-2xl bg-stone-50 p-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                <p className="mt-3 text-sm font-black">{item}</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
