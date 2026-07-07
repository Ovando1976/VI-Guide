import { FormEvent, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Car,
  CheckCircle2,
  CreditCard,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type PlanId = "verified" | "featured" | "concierge" | "mobility";

type Plan = {
  id: PlanId;
  name: string;
  price: string;
  description: string;
  features: string[];
};

const plans: Plan[] = [
  {
    id: "verified",
    name: "Verified Listing",
    price: "$49/mo",
    description: "Verified profile, visitor discovery, calls, and directions.",
    features: [
      "Verified business profile",
      "Call and directions visibility",
      "Category placement",
      "Founding partner badge",
    ],
  },
  {
    id: "featured",
    name: "Featured Partner",
    price: "$99/mo",
    description: "Higher placement and stronger visibility across the app.",
    features: [
      "Everything in Verified",
      "Featured placement",
      "Monthly visibility report",
      "Priority category placement",
    ],
  },
  {
    id: "concierge",
    name: "Concierge Partner",
    price: "$199/mo",
    description: "Premium placement for AI concierge and itinerary flows.",
    features: [
      "Everything in Featured",
      "AI concierge recommendation eligibility",
      "Itinerary placement",
      "Priority lead tracking",
    ],
  },
  {
    id: "mobility",
    name: "Mobility Partner",
    price: "Pilot pricing",
    description: "Transportation requests, dispatch visibility, and ride leads.",
    features: [
      "Transportation request leads",
      "Dispatch board visibility",
      "Visitor pickup/dropoff requests",
      "Custom pilot setup",
    ],
  },
];

const islands = [
  { label: "St. Thomas", value: "st_thomas" },
  { label: "St. John", value: "st_john" },
  { label: "St. Croix", value: "st_croix" },
  { label: "Water Island", value: "water_island" },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export default function JoinPage() {
  const navigate = useNavigate();

  const [selectedPlan, setSelectedPlan] = useState<PlanId>("verified");
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [islandCode, setIslandCode] = useState("st_thomas");
  const [area, setArea] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const activePlan =
    plans.find((plan) => plan.id === selectedPlan) ?? plans[0];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!businessName.trim() || !ownerName.trim() || !email.trim()) {
      setSaveError("Business name, contact name, and email are required.");
      return;
    }

    setSaving(true);
    setSaveError("");

    try {
      const { createPartnerClaim } = await import(
        "../lib/firestore/partnerClaims"
      );

      const cleanBusinessName = businessName.trim();

      await createPartnerClaim({
        partnerId: `${slugify(cleanBusinessName) || "founding-partner"}-${Date.now()}`,
        partnerName: cleanBusinessName,
        businessName: cleanBusinessName,
        ownerName: ownerName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        islandCode: islandCode as never,
        area: area.trim(),
        partnerTier: activePlan.name,
        source: "partner_page",
        message: [
          "Founding Partner Request",
          `Selected plan: ${activePlan.name} — ${activePlan.price}`,
          message.trim() ? `Message: ${message.trim()}` : "",
        ]
          .filter(Boolean)
          .join("\n\n"),
      });

      setSubmitted(true);
    } catch (error) {
      setSaveError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f0da] pb-32 text-ink">
      <section className="mx-auto max-w-7xl px-4 py-8 md:py-10">
        <div className="overflow-hidden rounded-[2.75rem] bg-ink text-white shadow-2xl">
          <div className="grid gap-6 p-5 md:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-turquoise/15 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-turquoise">
                <CreditCard className="h-4 w-4" />
                Founding Partner Access
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
                Turn local visibility into real visitor leads.
              </h1>

              <p className="mt-5 max-w-3xl text-sm leading-7 text-white/70 md:text-base">
                VI Guide gives local businesses a way to get discovered by
                visitors, appear in island planning flows, and turn attention
                into trackable leads.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    icon: Building2,
                    title: "Business profiles",
                    text: "Verified local listings with calls, directions, and lead tracking.",
                  },
                  {
                    icon: Sparkles,
                    title: "AI concierge",
                    text: "Partner-ready placement for recommendations and trip planning.",
                  },
                  {
                    icon: Car,
                    title: "Mobility leads",
                    text: "Transportation and dispatch-ready visitor request flow.",
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.title} className="rounded-[2rem] bg-white/10 p-4">
                      <Icon className="h-5 w-5 text-turquoise" />
                      <p className="mt-3 text-sm font-black text-white">
                        {item.title}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-white/60">
                        {item.text}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate("/demo")}
                  className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-ink active:scale-95"
                >
                  Demo Hub
                </button>

                <button
                  onClick={() => navigate("/admin/leads")}
                  className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-white active:scale-95"
                >
                  Admin Leads
                </button>
              </div>
            </div>

            <div className="rounded-[2.25rem] bg-white p-5 text-ink">
              {submitted ? (
                <div className="flex min-h-[430px] flex-col justify-center text-center">
                  <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-700" />
                  <h2 className="mt-5 text-3xl font-black">
                    Request received.
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-stone-600">
                    The founding partner request was saved into the admin lead
                    inbox. Now follow up, call, email, and close the account.
                  </p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <button
                      onClick={() => navigate("/admin/leads")}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-black text-white active:scale-95"
                    >
                      Open Admin Leads
                      <ArrowRight className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setBusinessName("");
                        setOwnerName("");
                        setEmail("");
                        setPhone("");
                        setArea("");
                        setMessage("");
                      }}
                      className="rounded-2xl bg-stone-100 px-5 py-3 text-sm font-black text-ink active:scale-95"
                    >
                      Add Another
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">
                    Join VI Guide
                  </p>
                  <h2 className="mt-2 text-3xl font-black">
                    Request founding partner access
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    Select a plan and send the request into the live admin inbox.
                  </p>

                  <div className="mt-5 grid gap-3">
                    <Field
                      label="Business name"
                      value={businessName}
                      onChange={setBusinessName}
                      placeholder="Example: Sapphire Beach Bar"
                      required
                    />

                    <Field
                      label="Owner / contact name"
                      value={ownerName}
                      onChange={setOwnerName}
                      placeholder="Contact person"
                      required
                    />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field
                        label="Email"
                        value={email}
                        onChange={setEmail}
                        placeholder="owner@example.com"
                        type="email"
                        required
                      />

                      <Field
                        label="Phone"
                        value={phone}
                        onChange={setPhone}
                        placeholder="(340) 555-0101"
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
                          Island
                        </span>
                        <select
                          value={islandCode}
                          onChange={(event) => setIslandCode(event.target.value)}
                          className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold outline-none ring-emerald-700/20 focus:ring-4"
                        >
                          {islands.map((island) => (
                            <option key={island.value} value={island.value}>
                              {island.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <Field
                        label="Area"
                        value={area}
                        onChange={setArea}
                        placeholder="Red Hook, Cruz Bay..."
                      />
                    </div>

                    <label className="block">
                      <span className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
                        Message
                      </span>
                      <textarea
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        placeholder="Tell us what type of visibility or leads you want."
                        rows={4}
                        className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold outline-none ring-emerald-700/20 focus:ring-4"
                      />
                    </label>
                  </div>

                  {saveError && (
                    <div className="mt-4 rounded-2xl bg-amber-100 p-3 text-sm font-bold leading-6 text-amber-950">
                      {saveError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={saving}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-4 text-sm font-black text-white disabled:opacity-60 active:scale-95"
                  >
                    {saving ? "Saving Request..." : "Request Access"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
            const active = selectedPlan === plan.id;

            return (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={[
                  "rounded-[2.25rem] p-5 text-left shadow-xl transition active:scale-[0.99]",
                  active
                    ? "bg-emerald-700 text-white"
                    : "bg-white text-ink hover:-translate-y-1",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={[
                      "rounded-2xl p-3",
                      active ? "bg-white/15" : "bg-emerald-100",
                    ].join(" ")}
                  >
                    {plan.id === "verified" && (
                      <BadgeCheck
                        className={active ? "h-6 w-6 text-white" : "h-6 w-6 text-emerald-700"}
                      />
                    )}
                    {plan.id === "featured" && (
                      <ShieldCheck
                        className={active ? "h-6 w-6 text-white" : "h-6 w-6 text-emerald-700"}
                      />
                    )}
                    {plan.id === "concierge" && (
                      <Sparkles
                        className={active ? "h-6 w-6 text-white" : "h-6 w-6 text-emerald-700"}
                      />
                    )}
                    {plan.id === "mobility" && (
                      <Car
                        className={active ? "h-6 w-6 text-white" : "h-6 w-6 text-emerald-700"}
                      />
                    )}
                  </div>

                  <span
                    className={[
                      "rounded-full px-3 py-1 text-xs font-black",
                      active
                        ? "bg-white text-ink"
                        : "bg-stone-100 text-stone-600",
                    ].join(" ")}
                  >
                    {plan.price}
                  </span>
                </div>

                <h3 className="mt-4 text-2xl font-black">{plan.name}</h3>
                <p
                  className={[
                    "mt-2 text-sm leading-6",
                    active ? "text-white/75" : "text-stone-600",
                  ].join(" ")}
                >
                  {plan.description}
                </p>

                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className={[
                        "flex items-start gap-2 text-sm font-bold",
                        active ? "text-white/85" : "text-stone-700",
                      ].join(" ")}
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Building2,
              title: "Local businesses",
              text: "Restaurants, shops, attractions, experiences, and service providers get a simple way to join.",
            },
            {
              icon: MapPin,
              title: "Visitor intent",
              text: "Connect business profiles to calls, directions, AI mentions, and trip planning.",
            },
            {
              icon: Phone,
              title: "Manual close-ready",
              text: "No payment automation needed first. Capture interest and close by phone or invoice.",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.title} className="rounded-[2rem] bg-white p-5 shadow-xl">
                <Icon className="h-7 w-7 text-emerald-700" />
                <h3 className="mt-4 text-xl font-black">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  {item.text}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        required={required}
        className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold outline-none ring-emerald-700/20 focus:ring-4"
      />
    </label>
  );
}
