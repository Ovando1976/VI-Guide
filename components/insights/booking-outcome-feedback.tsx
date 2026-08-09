"use client";

import { CheckCircle2, MessageSquareText } from "lucide-react";
import { useState, type FormEvent } from "react";

import { recordCustomerInsight } from "@/lib/customer-insights-client";

export function BookingOutcomeFeedback({ reference, listingId, status, island }: { reference: string; listingId: string; status: string; island: "stt" | "stj" | "stx" }) {
  const [priceAccurate, setPriceAccurate] = useState("yes");
  const [delivered, setDelivered] = useState("yes");
  const [onTime, setOnTime] = useState("yes");
  const [rating, setRating] = useState("5");
  const [issue, setIssue] = useState("none");
  const [sent, setSent] = useState(false);
  if (!['confirmed', 'completed', 'cancelled'].includes(status)) return null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    const ok = await recordCustomerInsight("trip_outcome_submitted", {
      booking_reference: reference,
      listing_id: listingId,
      booking_status: status,
      delivered: delivered === "yes",
      price_accurate: priceAccurate === "yes",
      on_time: onTime === "yes",
      rating: Number(rating),
      issue_category: issue,
    }, { island, requireConsent: false });
    if (issue !== "none") {
      await recordCustomerInsight("support_issue_reported", {
        booking_reference: reference,
        listing_id: listingId,
        category: issue,
      }, { island, requireConsent: false });
    }
    setSent(ok);
  }

  return (
    <form onSubmit={submit} className="mt-6 rounded-[24px] border border-sky-200 bg-sky-50 p-5 text-sky-950">
      <div className="flex items-start gap-3"><MessageSquareText className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" /><div><p className="text-[9px] font-black uppercase tracking-[.15em] text-sky-700">Reality check</p><h3 className="mt-1 text-lg font-black">Did the experience deliver what was promised?</h3></div></div>
      {sent ? <p className="mt-4 flex items-center gap-2 text-sm font-bold text-emerald-700"><CheckCircle2 className="h-5 w-5" /> Thank you. This will improve future recommendations.</p> : <><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><Choice label="Service delivered" value={delivered} onChange={setDelivered} options={["yes", "no"]} /><Choice label="Price accurate" value={priceAccurate} onChange={setPriceAccurate} options={["yes", "no"]} /><Choice label="On time" value={onTime} onChange={setOnTime} options={["yes", "no"]} /><Choice label="Rating" value={rating} onChange={setRating} options={["5", "4", "3", "2", "1"]} /><Choice label="Problem" value={issue} onChange={setIssue} options={["none", "pricing", "provider_no_response", "transportation", "listing_inaccurate", "accessibility", "cleanliness", "safety"]} /></div><button className="mt-4 inline-flex min-h-11 items-center rounded-full bg-sky-900 px-5 text-[9px] font-black uppercase tracking-[.14em] text-white">Send feedback</button></>}
    </form>
  );
}

function Choice({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <label className="text-[9px] font-black uppercase tracking-[.13em] text-sky-700">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-sky-200 bg-white px-3 text-xs font-bold normal-case tracking-normal">{options.map((option) => <option key={option}>{option.replaceAll("_", " ")}</option>)}</select></label>;
}
