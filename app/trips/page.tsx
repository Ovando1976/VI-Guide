import Link from "next/link";
import { redirect } from "next/navigation";
import { BedDouble, CalendarDays, Users } from "lucide-react";

import { RiderTripHistory } from "@/components/rider-trip-history";
import { TripReturnNotice } from "@/components/mobility/trip-return-notice";
import { getSession } from "@/lib/auth-server";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";

type StayRequest = {
  requestId: string;
  stayName: string;
  staySlug: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  rooms: number;
  status: string;
};

export default async function TripsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/trips");

  let stays: StayRequest[] = [];
  if (hasFirebaseAdminConfiguration()) {
    try {
      const snapshot = await getAdminDb()
        .collection("stayBookingRequests")
        .where("riderId", "==", session.uid)
        .limit(20)
        .get();
      stays = snapshot.docs
        .map((doc) => ({
          requestId: doc.id,
          ...(doc.data() as Omit<StayRequest, "requestId">),
        }))
        .sort((a, b) => b.checkIn.localeCompare(a.checkIn));
    } catch (error) {
      console.error("stay request history error", error);
    }
  }

  return (
    <main className="min-h-screen px-4 py-7 text-[#043331] md:px-8">
      <div className="mx-auto max-w-7xl">
        <TripReturnNotice />
        <div className="mb-5 flex flex-wrap justify-end gap-3">
          <Link
            href="/accommodations"
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-[10px] font-black uppercase tracking-[.18em] shadow-sm"
          >
            Find a stay
          </Link>
          <Link
            href="/mobility"
            className="rounded-2xl bg-[#043331] px-5 py-3 text-[10px] font-black uppercase tracking-[.18em] text-white shadow-lg"
          >
            Book another ride
          </Link>
        </div>
        {stays.length ? <StayRequestHistory stays={stays} /> : null}
        <RiderTripHistory riderId={session.uid} />
      </div>
    </main>
  );
}

function StayRequestHistory({ stays }: { stays: StayRequest[] }) {
  return (
    <section className="mb-8 overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-sm">
      <div className="bg-[linear-gradient(135deg,#043331,#0f766e)] px-6 py-6 text-white sm:px-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[.25em] text-[#f5c558]">
              Stay requests
            </div>
            <h2 className="mt-2 text-3xl font-black tracking-tight">
              Your island stays
            </h2>
          </div>
          <BedDouble className="h-8 w-8 text-white/55" />
        </div>
      </div>
      <div className="grid gap-4 p-5 sm:p-6 md:grid-cols-2">
        {stays.map((stay) => (
          <Link
            key={stay.requestId}
            href={`/accommodations/${stay.staySlug}`}
            className="rounded-[24px] border border-slate-200 p-5 transition hover:border-teal-600 hover:bg-[#f8f4ea]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-black tracking-tight">
                  {stay.stayName}
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-500">
                  <CalendarDays className="h-4 w-4 text-teal-700" />
                  {formatDate(stay.checkIn)} – {formatDate(stay.checkOut)}
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-500">
                  <Users className="h-4 w-4 text-teal-700" />
                  {stay.adults + stay.children} guests · {stay.rooms}{" "}
                  {stay.rooms === 1 ? "room" : "rooms"}
                </div>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-2 text-[8px] font-black uppercase tracking-[.13em] text-amber-800">
                Pending confirmation
              </span>
            </div>
            <div className="mt-4 text-[9px] font-bold uppercase tracking-[.14em] text-slate-400">
              Ref {stay.requestId}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
