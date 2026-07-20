import Link from "next/link";
import { Fish, MessageCircle, ShieldAlert } from "lucide-react";

import { FishingGuide } from "@/components/fishing/fishing-guide";
import { getFishingHandbook } from "@/lib/fishing-handbook";
import { fishingSpecies } from "@/lib/fishing-species";

export const metadata = {
  title: "USVI Fishing Guide | VI Guide",
  description: "Explore interactive USVI fishing species cards, seasonal closures, protected areas, and the cited 2024 DPNR handbook.",
};

export default function FishingPage() {
  const handbook = getFishingHandbook();

  return (
    <main className="min-h-screen bg-[#f8f4ea] px-5 pb-32 pt-10 text-[#043331] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-200 text-teal-950"><Fish size={26} /></div>
        <div className="mt-7 text-[11px] font-black uppercase tracking-[.24em] text-amber-700">DPNR reference · 2024 edition</div>
        <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-[-.045em] sm:text-6xl">Your interactive USVI fishing guide.</h1>
        <p className="mt-5 max-w-3xl text-base font-semibold leading-8 text-slate-600">Check species cards against a fishing date, district, and territorial or federal waters. Explore seasonal closures, protected areas, size summaries, gear guidance, and every cited page of the Division of Fish & Wildlife handbook.</p>

        <section className="mt-8 grid gap-4 rounded-[28px] border border-amber-300 bg-amber-50 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
          <ShieldAlert className="text-amber-800" />
          <div><div className="font-black text-amber-950">Reference guidance—not live legal clearance</div><p className="mt-1 text-sm font-semibold leading-6 text-amber-900/75">The handbook says regulations can change and has no legal force. Current territorial and federal regulations control. Verify closures, limits, permits, and protected-area rules with the responsible agency before fishing.</p></div>
          <Link href="/map?concierge=open&prompt=Help%20me%20check%20the%20fishing%20rules%20for%20my%20plan" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-300 px-4 py-3 text-xs font-black text-amber-950"><MessageCircle size={16} /> Ask concierge</Link>
        </section>

        <section className="mt-10"><FishingGuide pages={handbook.pages} species={fishingSpecies} sourceFile={handbook.sourceFile} /></section>

        <section className="mt-10 rounded-[28px] bg-[#043331] p-6 text-white sm:p-8">
          <div className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-200">Verify current rules</div>
          <div className="mt-4 grid gap-5 sm:grid-cols-3">
            <div><div className="text-sm font-black">Territorial · St. Thomas</div><a href="tel:+13407743320" className="mt-2 block text-cyan-200">340-774-3320</a></div>
            <div><div className="text-sm font-black">Territorial · St. Croix</div><a href="tel:+13407735774" className="mt-2 block text-cyan-200">340-773-5774</a></div>
            <div><div className="text-sm font-black">Federal waters · NOAA</div><a href="tel:+17278245305" className="mt-2 block text-cyan-200">727-824-5305</a></div>
          </div>
        </section>
      </div>
    </main>
  );
}
