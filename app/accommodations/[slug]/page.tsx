import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, BedDouble, ExternalLink, MapPin, Phone, ShieldCheck, Sparkles, Waves } from "lucide-react";
import { TagPill } from "@/components/directory/tag-pill";
import { PlaceActionBar } from "@/components/place/place-action-bar";
import { StayActionCard } from "@/components/stay-action-card";
import { getAccommodationBySlug } from "@/lib/accommodations";

const ISLAND_NAMES = { stt: "St. Thomas", stj: "St. John", stx: "St. Croix" } as const;

type Props = { params: Promise<{ slug: string }> };

export default async function AccommodationDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = getAccommodationBySlug(slug);
  if (!item) notFound();

  const islandName = ISLAND_NAMES[item.island];
  const highlights = Array.from(new Set([item.category, item.location, ...(item.bestFor ?? []), ...item.tags])).filter(Boolean).slice(0, 8) as string[];
  const mapParams = new URLSearchParams({ island: item.island.toUpperCase(), focus: item.slug });
  const rideParams = new URLSearchParams({ island: item.island.toUpperCase(), destination: item.name });

  return (
    <main className="stay-detail min-h-screen bg-[#f8f4ea] pb-36 text-[#043331]">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link href="/accommodations" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[.18em] transition hover:border-[#0f766e]"><ArrowLeft size={15} /> All stays</Link>
          <div className="text-[10px] font-black uppercase tracking-[.2em] text-slate-500">{islandName} · {item.location ?? item.category}</div>
        </div>

        <section className="relative overflow-hidden rounded-[34px] bg-[#043331] shadow-[0_30px_80px_rgba(4,51,49,.2)]">
          <div className="relative min-h-[440px] bg-cover bg-center sm:min-h-[520px]" style={{ backgroundImage: `url('${item.heroImage}')` }}>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,51,49,.08)_20%,rgba(4,51,49,.92)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-9 lg:p-11">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#f5b942] px-3 py-2 text-[9px] font-black uppercase tracking-[.2em] text-[#043331]">Verified stay</span>
                <span className="rounded-full border border-white/25 bg-black/20 px-3 py-2 text-[9px] font-black uppercase tracking-[.2em] backdrop-blur">{item.category}</span>
              </div>
              <h1 className="mt-4 max-w-4xl text-[clamp(2.6rem,6vw,5.4rem)] font-black leading-[.92] tracking-[-.06em]">{item.name}</h1>
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-white/80">
                {item.location ? <span className="inline-flex items-center gap-2"><MapPin size={16} /> {item.location}, {islandName}</span> : null}
                <span className="inline-flex items-center gap-2"><BadgeCheck size={16} className="text-[#7ce0d4]" /> Reviewed {item.verifiedAt}</span>
              </div>
            </div>
          </div>
        </section>

        <PlaceActionBar
          className="relative z-10 mx-2 -mt-5 sm:mx-5"
          name={item.name}
          island={islandName}
          mapHref={`/map?${mapParams.toString()}`}
          rideHref={`/mobility?${rideParams.toString()}`}
          website={item.website}
        />

        <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(330px,.85fr)] lg:items-start">
          <div className="space-y-7">
            <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="text-[10px] font-black uppercase tracking-[.23em] text-amber-600">Why consider this stay</div>
              <p className="mt-4 text-lg font-semibold leading-8 text-slate-700">{item.description}</p>
              <div className="mt-6 flex flex-wrap gap-2">{highlights.map((entry) => <TagPill key={entry} label={entry} />)}</div>
            </section>

            <section className="grid gap-4 sm:grid-cols-3">
              <InfoCard icon={BedDouble} title="Stay type" value={item.category} />
              <InfoCard icon={Waves} title="Island base" value={item.location ?? islandName} />
              <InfoCard icon={ShieldCheck} title="Catalog status" value="Verified source" />
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="grid gap-8 md:grid-cols-2">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[.22em] text-slate-400">Property information</div>
                  <div className="mt-5 space-y-4 text-sm font-semibold leading-6 text-slate-600">
                    {item.address ? <div className="flex gap-3"><MapPin className="h-5 w-5 shrink-0 text-teal-700" /><span>{item.address}</span></div> : null}
                    {item.phone ? <a className="flex gap-3 hover:text-teal-800" href={`tel:${item.phone}`}><Phone className="h-5 w-5 shrink-0 text-teal-700" /><span>{item.phone}</span></a> : null}
                    {item.website ? <a className="flex gap-3 hover:text-teal-800" href={item.website} target="_blank" rel="noreferrer"><ExternalLink className="h-5 w-5 shrink-0 text-teal-700" /><span>Official property website</span></a> : null}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[.22em] text-slate-400">Source transparency</div>
                  <p className="mt-5 text-sm font-semibold leading-6 text-slate-600">Verified using {item.sourceLabel}. VI Guide distinguishes catalog verification from live room availability, rates, and reservation confirmation.</p>
                  {item.sourceUrl ? <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-teal-800">Review source <ExternalLink className="h-4 w-4" /></a> : null}
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-[30px] bg-[#043331] p-7 text-white sm:p-8">
              <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.22em] text-[#f5b942]"><Sparkles size={14} /> Make it a complete trip</div>
              <h2 className="mt-3 text-3xl font-black tracking-[-.04em]">Connect your stay, transportation, and island days.</h2>
              <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-white/65">Ask the concierge for a grounded plan built around this property, including arrival timing, nearby beaches, dinner options, ferry connections, and a return ride.</p>
            </section>
          </div>

          <div className="lg:sticky lg:top-6"><StayActionCard name={item.name} website={item.website} island={islandName} location={item.location} /></div>
        </div>
      </div>
    </main>
  );
}

function InfoCard({ icon: Icon, title, value }: { icon: typeof BedDouble; title: string; value: string }) {
  return <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#e8f5f2] text-[#0f766e]"><Icon size={19} /></span><div className="mt-4 text-[9px] font-black uppercase tracking-[.2em] text-slate-400">{title}</div><strong className="mt-1 block capitalize">{value}</strong></div>;
}
