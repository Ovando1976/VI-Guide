import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { createPropertyReportLead } from "../../lib/firestore/propertyReportLeads";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clipboard,
  Crown,
  FileText,
  Landmark,
  Mail,
  MapPinned,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type ReportTier = "starter" | "full" | "premium";

type PropertyReportLead = {
  name: string;
  email: string;
  phone: string;
  island: string;
  propertyName: string;
  parcelId: string;
  address: string;
  purpose: string;
  tier: ReportTier;
  notes: string;
  createdAt: string;
};

const SALES_EMAIL = import.meta.env.VITE_PROPERTY_REPORT_EMAIL || "";

const tiers: {
  id: ReportTier;
  title: string;
  price: string;
  description: string;
  features: string[];
}[] = [
  {
    id: "starter",
    title: "Starter Property Report",
    price: "$49",
    description: "Best for a quick property/place history snapshot.",
    features: [
      "Property or estate name context",
      "Island and quarter background",
      "Starter historic map references",
      "Plain-English summary",
    ],
  },
  {
    id: "full",
    title: "Full Property Report",
    price: "$149",
    description: "Best for owners, buyers, sellers, families, and researchers.",
    features: [
      "Expanded property-history context",
      "Old place names and estate references",
      "Historic map and archive leads",
      "Download-ready research packet outline",
    ],
  },
  {
    id: "premium",
    title: "Premium Research Packet",
    price: "$299+",
    description: "Best for serious research, family history, due-diligence prep, or investment context.",
    features: [
      "Custom archive/source review",
      "Map, site, and neighborhood context",
      "Citations and source notes",
      "Concierge follow-up and next-step research plan",
    ],
  },
];

const initialLead: PropertyReportLead = {
  name: "",
  email: "",
  phone: "",
  island: "St. Thomas",
  propertyName: "",
  parcelId: "",
  address: "",
  purpose: "Property history",
  tier: "starter",
  notes: "",
  createdAt: "",
};

function buildLeadSummary(lead: PropertyReportLead) {
  const tier = tiers.find((item) => item.id === lead.tier);

  return [
    "VI Guide Property Report Request",
    "",
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    `Phone: ${lead.phone || "Not provided"}`,
    `Island: ${lead.island}`,
    `Property / Estate / Place: ${lead.propertyName}`,
    `Parcel ID: ${lead.parcelId || "Not provided"}`,
    `Address / Area: ${lead.address || "Not provided"}`,
    `Purpose: ${lead.purpose}`,
    `Requested tier: ${tier?.title || lead.tier} (${tier?.price || ""})`,
    "",
    "Notes:",
    lead.notes || "No additional notes provided.",
    "",
    `Created: ${lead.createdAt || new Date().toISOString()}`,
  ].join("\n");
}

export default function PropertyReportRequestPage() {
  const navigate = useNavigate();
  const [lead, setLead] = useState<PropertyReportLead>(initialLead);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const selectedTier = tiers.find((item) => item.id === lead.tier) ?? tiers[0];

  const canSubmit = useMemo(() => {
    return (
      lead.name.trim().length > 1 &&
      lead.email.trim().includes("@") &&
      lead.propertyName.trim().length > 1
    );
  }, [lead.email, lead.name, lead.propertyName]);

  const leadSummary = useMemo(() => {
    return buildLeadSummary({
      ...lead,
      createdAt: lead.createdAt || new Date().toISOString(),
    });
  }, [lead]);

  function updateField<K extends keyof PropertyReportLead>(
    key: K,
    value: PropertyReportLead[K],
  ) {
    setLead((current) => ({ ...current, [key]: value }));
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(leadSummary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  async function submitLead() {
    if (!canSubmit || isSubmitting) return;

    const completedLead: PropertyReportLead = {
      ...lead,
      createdAt: new Date().toISOString(),
    };

    setIsSubmitting(true);
    setSubmitError("");

    try {
      await createPropertyReportLead({
        name: completedLead.name.trim(),
        email: completedLead.email.trim(),
        phone: completedLead.phone.trim(),
        island: completedLead.island,
        propertyName: completedLead.propertyName.trim(),
        parcelId: completedLead.parcelId.trim(),
        address: completedLead.address.trim(),
        purpose: completedLead.purpose,
        tier: completedLead.tier,
        notes: completedLead.notes.trim(),
        leadSummary: buildLeadSummary(completedLead),
        source: "history-property-report-page",
      });

      const previous = JSON.parse(
        localStorage.getItem("viGuidePropertyReportLeads") || "[]",
      ) as PropertyReportLead[];

      localStorage.setItem(
        "viGuidePropertyReportLeads",
        JSON.stringify([completedLead, ...previous].slice(0, 50)),
      );

      setLead(completedLead);
      setSubmitted(true);
    } catch (error) {
      console.error("Failed to submit property report lead", error);
      setSubmitError(
        "We could not save this request yet. Copy the request and send it manually.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const mailtoHref = SALES_EMAIL
    ? `mailto:${SALES_EMAIL}?subject=${encodeURIComponent(
        `Property Report Request: ${lead.propertyName || "VI property"}`,
      )}&body=${encodeURIComponent(leadSummary)}`
    : "";

  return (
    <main className="min-h-screen bg-[#05060a] pb-[calc(96px+env(safe-area-inset-bottom))] text-white">
      <div className="fixed bottom-5 right-5 z-[80] flex flex-col gap-2">
        <a
          href="/admin/property-report-leads"
          className="rounded-full border border-amber-300/40 bg-amber-300 px-5 py-3 text-xs font-black text-zinc-950 shadow-2xl shadow-amber-950/30 hover:bg-amber-200"
        >
          Admin lead inbox
        </a>
        <a
          href="/admin/property-report-template"
          className="rounded-full border border-white/10 bg-zinc-950/90 px-5 py-3 text-xs font-black text-white shadow-2xl hover:bg-zinc-900"
        >
          Report template
        </a>
      </div>

      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_18%_0%,rgba(251,191,36,0.2),transparent_32%),radial-gradient(circle_at_82%_0%,rgba(20,184,166,0.12),transparent_34%),linear-gradient(135deg,#020617,#09090f_55%,#1c1206)] px-5 py-8">
        <div className="mx-auto max-w-6xl">
          <button
            type="button"
            onClick={() => navigate("/history")}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black text-white/75 transition hover:bg-white/15"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to History
          </button>

          <div className="mt-7 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-black/25 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-amber-200">
                <Crown className="h-3.5 w-3.5" />
                Property Intelligence
              </div>

              <h1 className="mt-5 max-w-4xl font-serif text-4xl font-black leading-none tracking-[-0.055em] sm:text-6xl">
                Get a Virgin Islands property history report.
              </h1>

              <p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-300 sm:text-base">
                Request a research packet for a property, estate, parcel,
                neighborhood, family place, or historic site. We combine map
                references, old place names, archive leads, estate context, and
                local history into a readable report.
              </p>

              <p className="mt-4 max-w-3xl rounded-2xl border border-amber-300/15 bg-amber-300/10 p-4 text-xs leading-6 text-amber-50/75">
                Not a survey, appraisal, legal title opinion, or legal advice.
                This is a property-history and research intelligence product.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-black/25 p-5 shadow-2xl">
              <p className="flex items-center gap-2 text-sm font-black text-amber-300">
                <Sparkles className="h-4 w-4" />
                Selected package · {selectedTier.price}
              </p>
              <h2 className="mt-3 text-2xl font-black">{selectedTier.title}</h2>
              <p className="mt-2 text-sm leading-6 text-white/60">
                {selectedTier.description}
              </p>
              <div className="mt-4 grid gap-2">
                {selectedTier.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2 text-sm text-white/70">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-5 py-6 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="space-y-4">
          {tiers.map((tier) => {
            const active = lead.tier === tier.id;

            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => updateField("tier", tier.id)}
                className={`w-full rounded-[2rem] border p-5 text-left shadow-xl transition hover:-translate-y-0.5 ${
                  active
                    ? "border-amber-300 bg-amber-300/10"
                    : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-white">{tier.title}</h2>
                    <p className="mt-1 text-sm text-amber-200">{tier.price}</p>
                  </div>
                  {active ? <CheckCircle2 className="h-5 w-5 text-amber-300" /> : null}
                </div>
                <p className="mt-3 text-sm leading-6 text-white/55">
                  {tier.description}
                </p>
              </button>
            );
          })}

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
            <p className="flex items-center gap-2 text-sm font-black text-amber-300">
              <ShieldCheck className="h-4 w-4" />
              Best early customers
            </p>
            <div className="mt-4 grid gap-3 text-sm text-white/60">
              <LeadPoint icon={Building2} text="Property owners, buyers, sellers, heirs, and families." />
              <LeadPoint icon={MapPinned} text="Realtors, researchers, educators, and neighborhood historians." />
              <LeadPoint icon={Landmark} text="Tourism, preservation, museums, and cultural organizations." />
            </div>
          </div>
        </aside>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl">
          <div className="flex items-start gap-3">
            <FileText className="mt-1 h-6 w-6 text-amber-300" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-300">
                Request Form
              </p>
              <h2 className="mt-1 text-3xl font-black">Property report intake</h2>
              <p className="mt-2 text-sm leading-6 text-white/55">
                Submit the request today. We’ll review the property, confirm the
                scope, and follow up with next steps.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Your name">
              <input
                value={lead.name}
                onChange={(event) => updateField("name", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-amber-300/50"
                placeholder="Full name"
              />
            </Field>

            <Field label="Email">
              <input
                value={lead.email}
                onChange={(event) => updateField("email", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-amber-300/50"
                placeholder="name@email.com"
              />
            </Field>

            <Field label="Phone optional">
              <input
                value={lead.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-amber-300/50"
                placeholder="Phone number"
              />
            </Field>

            <Field label="Island">
              <select
                value={lead.island}
                onChange={(event) => updateField("island", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-amber-300/50"
              >
                <option>St. Thomas</option>
                <option>St. John</option>
                <option>St. Croix</option>
                <option>Water Island</option>
              </select>
            </Field>

            <Field label="Property, estate, family place, or site name">
              <input
                value={lead.propertyName}
                onChange={(event) => updateField("propertyName", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-amber-300/50"
                placeholder="Example: Estate Bordeaux, Frenchtown, parcel name..."
              />
            </Field>

            <Field label="Parcel ID optional">
              <input
                value={lead.parcelId}
                onChange={(event) => updateField("parcelId", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-amber-300/50"
                placeholder="Parcel number if known"
              />
            </Field>

            <Field label="Address / area optional">
              <input
                value={lead.address}
                onChange={(event) => updateField("address", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-amber-300/50"
                placeholder="Road, neighborhood, quarter, or landmark"
              />
            </Field>

            <Field label="Purpose">
              <select
                value={lead.purpose}
                onChange={(event) => updateField("purpose", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-amber-300/50"
              >
                <option>Property history</option>
                <option>Family history</option>
                <option>Buying or selling research</option>
                <option>Tourism or heritage project</option>
                <option>School or museum research</option>
                <option>Legal / title preparation support</option>
                <option>Other</option>
              </select>
            </Field>
          </div>

          <Field label="What are you trying to find?">
            <textarea
              value={lead.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              className="min-h-32 w-full resize-y rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-amber-300/50"
              placeholder="Tell us what you know and what you want to discover..."
            />
          </Field>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!canSubmit || isSubmitting}
              onClick={submitLead}
              className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-5 py-3 text-sm font-black text-zinc-950 shadow-lg shadow-amber-950/30 transition hover:-translate-y-0.5 hover:bg-yellow-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Sparkles className="h-4 w-4" />
              {isSubmitting ? "Submitting..." : "Request my report"}
            </button>

            <button
              type="button"
              onClick={copySummary}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/15"
            >
              <Clipboard className="h-4 w-4" />
              {copied ? "Copied" : "Copy request"}
            </button>

            {SALES_EMAIL ? (
              <a
                href={mailtoHref}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/15"
              >
                <Mail className="h-4 w-4" />
                Email request
              </a>
            ) : null}
          </div>

          {submitError ? (
            <div className="mt-5 rounded-3xl border border-red-300/20 bg-red-300/10 p-4">
              <p className="text-sm font-black text-red-200">Submission issue</p>
              <p className="mt-2 text-sm leading-6 text-red-50/70">
                {submitError}
              </p>
            </div>
          ) : null}

          {submitted ? (
            <div className="mt-5 rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-4">
              <p className="flex items-center gap-2 text-sm font-black text-emerald-200">
                <CheckCircle2 className="h-4 w-4" />
                Request captured
              </p>
              <p className="mt-2 text-sm leading-6 text-emerald-50/70">
                Your request was received. We’ll review the property details and follow up with the next step.
              </p>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mt-4 block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/45">
        {label}
      </span>
      {children}
    </label>
  );
}

function LeadPoint({
  icon: Icon,
  text,
}: {
  icon: typeof Building2;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
      <p className="leading-6">{text}</p>
    </div>
  );
}
