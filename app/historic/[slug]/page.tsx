import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Landmark, MapPin, Navigation, Sparkles } from "lucide-react";
import { getTravelKnowledgeItem } from "@/lib/travel-knowledge";
import { AddToTripButton } from "@/components/trip-planner/add-to-trip-button";

const ISLAND_NAMES = { stt: "St. Thomas", stj: "St. John", stx: "St. Croix" } as const;

export default function HistoricDetailPage({ params }: { params: { slug: string } }) {
  const site = getTravelKnowledgeItem("historic", params.slug);
  if (!site) notFound();
  const islandName = ISLAND_NAMES[site.island];
  const mapHref = `/map?island=${site.island}&q=${encodeURIComponent(site.name)}`;
  const rideHref = `/mobility?island=${site.island}&destination=${encodeURIComponent(site.name)}`;

  return (
    <main className="min-h-screen bg-[#f8f4ea] px-4 py-6 pb-32 text-[#043331] sm:px-6 lg:py-10">
      <div className="mx-auto max-w-7xl space-y-7">
        <Link href="/historic" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[.18em]"><ArrowLeft className="h-4 w-4" /> Historic guide</Link>
        <section className="overflow-hidden rounded-[36px] bg-[#043331] text-white shadow-[0_30px_80px_rgba(4,51,49,.2)]">
          <div className="grid lg:grid-cols-[1.15fr_.85fr]">
            <div className="min-h-[380px] bg-cover bg-center lg:min-h-[560px]" style={{ backgroundImage: `linear-gradient(180deg,rgba(4,51,49,.05),rgba(4,51,49,.45)),url('${site.heroImage}')` }} />
            <div className="flex flex-col justify-between p-7 sm:p-10">
              <div>
                <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.25em] text-[#f5c451]"><Landmark className="h-4 w-4" /> {islandName} history</div>
                <h1 className="mt-5 text-4xl font-black leading-[.95] tracking-[-.05em] sm:text-6xl">{site.name}</h1>
                <p className="mt-6 text-base font-semibold leading-8 text-white/72">{site.description}</p>
                <div className="mt-6 flex flex-wrap gap-2">{site.tags.map((tag) => <span key={tag} className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-[.16em]">{tag}</span>)}</div>
              </div>
              <div className="mt-10 grid gap-3 sm:grid-cols-2">
                <Link href={mapHref} className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-3 text-[10px] font-black uppercase tracking-[.18em]"><MapPin className="h-4 w-4" /> Open map</Link>
                <Link href={rideHref} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f5c451] px-5 py-3 text-[10px] font-black uppercase tracking-[.18em] text-[#043331]"><Navigation className="h-4 w-4" /> Plan ride</Link>
              </div>
            </div>
          </div>
        </section>
        <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
            <div className="text-[10px] font-black uppercase tracking-[.22em] text-amber-600">Cultural context</div>
            <h2 className="mt-3 text-3xl font-black tracking-[-.04em]">Visit with context, not just directions.</h2>
            <p className="mt-5 text-base font-semibold leading-8 text-slate-600">{site.description} VI Guide keeps this core public information inside the application so travelers can still discover the site when live database services are unavailable.</p>
          </div>
          <aside className="rounded-[30px] bg-[#e8f5f2] p-7">
            <Sparkles className="h-6 w-6 text-teal-700" />
            <h2 className="mt-4 text-2xl font-black tracking-[-.03em]">Build a history route</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">Ask the concierge to combine this stop with nearby landmarks, lunch, transportation, and timing.</p>
            <AddToTripButton className="mt-6" item={{ id: site.id, slug: site.slug, name: site.name, kind: "historic", island: site.island, image: site.heroImage, description: site.description, location: site.address, lat: site.lat, lng: site.lng, href: `/historic/${site.slug}` }} />
            <Link href={`/map?concierge=open&prompt=${encodeURIComponent(`Plan a historic day around ${site.name}`)}`} className="mt-3 inline-flex w-full justify-center rounded-full bg-[#043331] px-5 py-3 text-[10px] font-black uppercase tracking-[.18em] text-white">Ask concierge</Link>
          </aside>
        </section>
      </div>
    </main>
  );
}
