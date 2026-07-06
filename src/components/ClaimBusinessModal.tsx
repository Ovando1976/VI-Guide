import { useState } from "react";
import { ArrowRight, Building2, Mail, MessageSquare, Phone, User, X } from "lucide-react";

import type { DemoPartner } from "../data/demoPartners";
import { logDemoPartnerEvent } from "../lib/demoPartnerEvents";
import { createPartnerClaim } from "../lib/firestore/partnerClaims";
import { createMerchantLead } from "../lib/firestore/merchantLeads";

type ClaimBusinessModalProps = {
  partner: DemoPartner | null;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function ClaimBusinessModal({
  partner,
  onClose,
  onSuccess,
}: ClaimBusinessModalProps) {
  const [ownerName, setOwnerName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!partner) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const claimedBusiness = businessName.trim() || partner.name;
    const owner = ownerName.trim() || "A business owner";
    const leadMessage = `${owner} submitted a claim request for ${claimedBusiness}. ${email ? `Email: ${email}. ` : ""}${phone ? `Phone: ${phone}. ` : ""}${message ? `Message: ${message}` : ""}`;

    setSaving(true);
    setSaveError(null);

    logDemoPartnerEvent({
      partnerId: partner.id,
      partnerName: partner.name,
      action: "request_info",
      message: leadMessage,
    });

    try {
      await createPartnerClaim({
        partnerId: partner.id,
        partnerName: partner.name,
        partnerTier: partner.partnerTier,
        islandCode: partner.islandCode,
        area: partner.area,
        ownerName: owner,
        businessName: claimedBusiness,
        email,
        phone,
        message,
        source: "partner_page",
      });

      await createMerchantLead({
        partnerId: partner.id,
        partnerName: partner.name,
        action: "claim_business",
        message: leadMessage,
        visitorName: owner,
        visitorPhone: phone,
        visitorEmail: email,
        source: "claim_modal",
      });
    } catch (error) {
      console.error("Failed to save partner claim to Firestore", error);
      setSaveError("Saved locally for the demo, but Firestore did not accept the claim yet.");
    } finally {
      setSaving(false);
      setSubmitted(true);

      window.setTimeout(() => {
        onSuccess?.();
      }, 700);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-ink/70 px-4 py-8 backdrop-blur-xl">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2.25rem] bg-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 grid h-11 w-11 place-items-center rounded-full bg-white/90 text-ink shadow-lg ring-1 ring-black/5 active:scale-95"
          aria-label="Close claim form"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative h-48 overflow-hidden bg-emerald-950">
          <img
            src={partner.image}
            alt=""
            className="h-full w-full object-cover opacity-55"
            onError={(event) => {
              event.currentTarget.src =
                "/images/places/st-thomas/magens-bay-beach-1.jpg";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />

          <div className="absolute bottom-5 left-5 right-16 text-white">
            <div className="inline-flex items-center gap-2 rounded-full bg-turquoise px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-ink">
              <Building2 className="h-3.5 w-3.5" />
              Claim Business
            </div>

            <h2 className="mt-3 text-3xl font-black leading-tight">
              {submitted ? "Claim request received" : `Claim ${partner.name}`}
            </h2>

            <p className="mt-1 text-sm font-bold text-white/70">
              {partner.area} · {partner.partnerTier} demo profile
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="p-6 md:p-8">
            <div className="rounded-[2rem] bg-emerald-50 p-6">
              <p className="text-lg font-black text-emerald-950">
                This is exactly what a partner lead looks like.
              </p>
              <p className="mt-3 text-sm leading-7 text-emerald-900/75">
                The claim request was saved to the demo lead stream. Open the
                merchant dashboard to show a business owner how VI Guide tracks
                real visitor and partner activity.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={onSuccess}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white active:scale-95"
                >
                  View Dashboard
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-black text-emerald-900 shadow-sm ring-1 ring-emerald-100 active:scale-95"
                >
                  Stay on Partner Page
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 p-6 md:p-8">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                  <User className="h-4 w-4" />
                  Your Name
                </span>
                <input
                  value={ownerName}
                  onChange={(event) => setOwnerName(event.target.value)}
                  placeholder="Business owner / manager"
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold text-ink outline-none transition focus:border-emerald-500 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                  <Building2 className="h-4 w-4" />
                  Business Name
                </span>
                <input
                  value={businessName}
                  onChange={(event) => setBusinessName(event.target.value)}
                  placeholder={partner.name}
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold text-ink outline-none transition focus:border-emerald-500 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                  <Mail className="h-4 w-4" />
                  Email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="owner@example.com"
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold text-ink outline-none transition focus:border-emerald-500 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                  <Phone className="h-4 w-4" />
                  Phone
                </span>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="(340) 555-0000"
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold text-ink outline-none transition focus:border-emerald-500 focus:bg-white"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                <MessageSquare className="h-4 w-4" />
                Message
              </span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="I want to claim this profile and learn about founding partner pricing."
                rows={4}
                className="w-full resize-none rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold leading-6 text-ink outline-none transition focus:border-emerald-500 focus:bg-white"
              />
            </label>

            <div className="rounded-3xl bg-stone-50 p-4">
              <p className="text-sm font-black text-ink">
                Demo promise to the business owner:
              </p>
              <p className="mt-1 text-sm leading-6 text-stone-600">
                Verified profile, featured placement, visitor action tracking,
                AI concierge eligibility, and a simple monthly analytics report.
              </p>
            </div>

            {saveError && (
              <div className="rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-900">
                {saveError}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-4 text-sm font-black text-white shadow-xl disabled:opacity-60 active:scale-95"
            >
              {saving ? "Saving Claim..." : "Submit Claim Request"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
