"use client";

import { BellRing, CheckCircle2, Clock3, XCircle } from "lucide-react";

import type { CommerceBookingStatus } from "@/types/commerce-booking";

type BookingActivity = {
  reference: string;
  listingName: string;
  status: CommerceBookingStatus;
  updatedAt: string;
  merchantNote?: string | null;
  proposedTime?: string | null;
};

export function BookingActivityFeed({ activities }: { activities: BookingActivity[] }) {
  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-3">
        <BellRing className="h-5 w-5 text-teal-700" />
        <div>
          <h2 className="text-xl font-black">Live booking activity</h2>
          <p className="mt-1 text-[9px] font-black uppercase tracking-[.14em] text-slate-400">
            Shared traveler and merchant updates
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {activities.length ? activities.map((activity) => (
          <article key={`${activity.reference}-${activity.updatedAt}`} className="rounded-2xl border border-slate-200 bg-[#fbfaf6] p-4">
            <div className="flex items-start gap-3">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone(activity.status)}`}>
                {activity.status === "confirmed" ? <CheckCircle2 className="h-5 w-5" /> : activity.status === "declined" || activity.status === "cancelled" ? <XCircle className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black">{activity.listingName}</p>
                <p className="mt-1 text-[9px] font-black uppercase tracking-[.13em] text-slate-400">{activity.reference} · {activity.status}</p>
                {activity.proposedTime ? <p className="mt-2 text-xs font-bold text-amber-700">Proposed time: {activity.proposedTime}</p> : null}
                {activity.merchantNote ? <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{activity.merchantNote}</p> : null}
              </div>
            </div>
          </article>
        )) : (
          <div className="rounded-2xl bg-[#f8f4ea] p-4 text-sm font-semibold text-slate-500">No live booking updates yet.</div>
        )}
      </div>
    </section>
  );
}

function tone(status: CommerceBookingStatus) {
  if (status === "confirmed") return "bg-emerald-100 text-emerald-700";
  if (status === "declined" || status === "cancelled") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
}
