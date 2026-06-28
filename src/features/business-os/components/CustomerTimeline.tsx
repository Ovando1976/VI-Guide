import {
  CalendarDays,
  Clock3,
  DollarSign,
  FileText,
  Mail,
  MousePointerClick,
  Phone,
  ReceiptText,
  StickyNote,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import type { BusinessTimelineEvent } from "../firestore";
import type { BusinessOSData } from "../types";
import { formatDate, label } from "../utils";
import { BusinessOSCard, SectionHeader } from "./BusinessOSCard";

type TimelineEvent = {
  id: string;
  title: string;
  businessName: string;
  date: string;
  detail: string;
  source: string;
  icon: LucideIcon;
};

export default function CustomerTimeline({ data }: { data: BusinessOSData }) {
  const events =
    data.timeline.length > 0 ? buildLiveTimeline(data) : buildFallbackTimeline(data);

  return (
    <BusinessOSCard>
      <SectionHeader
        title="Customer Timeline"
        text="A running history of leads, clicks, calls, notes, appointments, estimates, invoices, and payments."
        icon={Clock3}
      />

      {events.length === 0 ? (
        <div className="p-8 text-center">
          <Clock3 className="mx-auto h-12 w-12 text-cyan-300" />
          <h3 className="mt-4 text-2xl font-black">No activity yet</h3>
          <p className="mt-2 text-sm text-white/60">
            Customer actions will appear here as the platform starts generating traffic.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/10">
          {events.map((event) => {
            const Icon = event.icon;

            return (
              <div key={event.id} className="flex gap-4 p-5">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan-300 text-slate-950">
                  <Icon className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black text-white">{event.title}</p>

                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/55">
                      {event.date}
                    </span>

                    <span className="rounded-full bg-cyan-300/15 px-3 py-1 text-xs font-black text-cyan-100">
                      {event.source}
                    </span>
                  </div>

                  <p className="mt-1 text-sm font-bold text-cyan-200">
                    {event.businessName}
                  </p>

                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-white/60">
                    {event.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </BusinessOSCard>
  );
}

function buildLiveTimeline(data: BusinessOSData): TimelineEvent[] {
  return data.timeline
    .slice()
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 20)
    .map((event: BusinessTimelineEvent) => ({
      id: event.id,
      title: event.title,
      businessName:
        data.businessById.get(event.businessId)?.name || "Unknown business",
      date: formatDate(event.createdAt),
      detail: event.description || "Timeline activity recorded.",
      source: label(event.source || event.type),
      icon: iconForTimelineType(event.type),
    }));
}

function buildFallbackTimeline(data: BusinessOSData): TimelineEvent[] {
  return [
    ...data.leads.map((lead) => ({
      id: `lead-${lead.id}`,
      title: `${lead.visitorName} submitted a lead`,
      businessName:
        data.businessById.get(lead.businessId)?.name || "Unknown business",
      date: formatDate(lead.createdAt),
      detail: lead.message,
      source: label(lead.source),
      icon: Mail,
    })),

    ...data.estimates.map((estimate) => ({
      id: `estimate-${estimate.id}`,
      title: `Estimate ${estimate.status}: ${estimate.title}`,
      businessName:
        data.businessById.get(estimate.businessId)?.name || "Unknown business",
      date: formatDate(estimate.updatedAt || estimate.createdAt),
      detail: `$${estimate.total.toLocaleString()} estimate recorded.`,
      source: "Estimate",
      icon: FileText,
    })),

    ...data.invoices.map((invoice) => ({
      id: `invoice-${invoice.id}`,
      title: `Invoice ${invoice.status}: ${invoice.title}`,
      businessName:
        data.businessById.get(invoice.businessId)?.name || "Unknown business",
      date: formatDate(invoice.updatedAt || invoice.createdAt),
      detail: `$${invoice.total.toLocaleString()} invoice. Balance due: $${invoice.balanceDue.toLocaleString()}.`,
      source: "Invoice",
      icon: ReceiptText,
    })),

    ...data.payments.map((payment) => ({
      id: `payment-${payment.id}`,
      title: `Payment ${payment.status}`,
      businessName:
        data.businessById.get(payment.businessId)?.name || "Unknown business",
      date: formatDate(payment.paidAt || payment.createdAt),
      detail: `$${payment.amount.toLocaleString()} payment recorded by ${
        payment.method || "manual"
      }.`,
      source: "Payment",
      icon: DollarSign,
    })),

    ...data.analytics.flatMap((row) => {
      const business = data.businessById.get(row.businessId);

      if (!business) return [];

      return [
        {
          id: `phone-${row.businessId}`,
          title: `${business.name} received phone clicks`,
          businessName: business.name,
          date: formatDate(row.updatedAt),
          detail: `${row.phoneClicks || 0} phone clicks recorded.`,
          source: "Phone",
          icon: Phone,
        },
        {
          id: `actions-${row.businessId}`,
          title: `${business.name} generated customer actions`,
          businessName: business.name,
          date: formatDate(row.updatedAt),
          detail: `${
            (row.websiteClicks || 0) + (row.directionRequests || 0)
          } website/direction actions recorded.`,
          source: "Analytics",
          icon: MousePointerClick,
        },
      ];
    }),
  ].slice(0, 20);
}

function iconForTimelineType(type: string): LucideIcon {
  if (type === "lead") return Mail;
  if (type === "call") return Phone;
  if (type === "email") return Mail;
  if (type === "appointment") return CalendarDays;
  if (type === "task") return StickyNote;
  if (type === "estimate") return FileText;
  if (type === "invoice") return ReceiptText;
  if (type === "payment") return Wallet;
  return Clock3;
}