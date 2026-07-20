"use client";

import { BookOpen, CalendarDays, ExternalLink, MapPinned, Ruler, Search, ShieldAlert, Waves, type LucideIcon } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

import { assessSpecies, type FishingDistrict, type FishingSpecies, type FishingWater } from "@/lib/fishing-species";
import type { FishingHandbookPage } from "@/lib/fishing-handbook";

type Props = { pages: FishingHandbookPage[]; species: FishingSpecies[]; sourceFile: string };
type View = "species" | "closures" | "areas" | "handbook";

const STATUS_STYLE = {
  prohibited: "border-rose-200 bg-rose-50 text-rose-900",
  closed: "border-amber-300 bg-amber-50 text-amber-950",
  verify: "border-violet-200 bg-violet-50 text-violet-900",
  "no-closure-matched": "border-emerald-200 bg-emerald-50 text-emerald-900",
} as const;

const AREAS = [
  { name: "Hind Bank Marine Conservation District", district: "St. Thomas", status: "Closed year-round", detail: "No fishing for any species and no anchoring by fishing vessels.", page: 47 },
  { name: "Grammanik Bank", district: "St. Thomas", status: "Seasonal closure", detail: "February 1–April 30; HMS exception described in the handbook. Pots, traps, bottom longlines, gillnets, and trammel nets are prohibited year-round.", page: 47 },
  { name: "Lang Bank Red Hind Spawning Area", district: "St. Croix", status: "Seasonal closure", detail: "December 1 through the last day of February. Listed bottom gear is prohibited year-round.", page: 48 },
  { name: "Mutton Snapper Spawning Aggregation", district: "St. Croix", status: "Seasonal closure", detail: "March 1–June 30 in the federal portion. Listed bottom gear is prohibited year-round.", page: 48 },
  { name: "Inner Mangrove Lagoon", district: "St. Thomas", status: "No take", detail: "No fishing or take of natural resources; no internal-combustion engines.", page: 45 },
  { name: "Cas Cay / Mangrove Lagoon", district: "St. Thomas", status: "Restricted", detail: "No take except permitted cast-net baitfish activity in the described shoreline area.", page: 45 },
  { name: "St. Croix East End Marine Park", district: "St. Croix", status: "Zoned", detail: "No-take, recreation, wildlife-preservation, and open zones have different rules.", page: 46 },
] as const;

function today() { return new Date().toISOString().slice(0, 10); }

export function FishingGuide({ pages, species, sourceFile }: Props) {
  const [view, setView] = useState<View>("species");
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState("all");
  const [date, setDate] = useState(today());
  const [water, setWater] = useState<FishingWater>("territorial");
  const [district, setDistrict] = useState<FishingDistrict>("stt-stj");
  const [selected, setSelected] = useState<string | null>(null);

  const families = useMemo(() => ["all", ...new Set(species.map((item) => item.family))], [species]);
  const filteredSpecies = useMemo(() => species.filter((item) => {
    const matchesFamily = family === "all" || item.family === family;
    const text = `${item.name} ${item.scientificName} ${item.family} ${item.summary}`.toLowerCase();
    return matchesFamily && text.includes(query.toLowerCase().trim());
  }), [family, query, species]);
  const handbookResults = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return pages.filter((page) => !terms.length || terms.every((term) => `${page.section} ${page.title} ${page.text}`.toLowerCase().includes(term))).slice(0, 20);
  }, [pages, query]);

  return (
    <div>
      <div className="grid gap-4 rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_auto_auto_auto]">
        <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3"><Search className="h-5 w-5 text-teal-700" /><span className="sr-only">Search fishing information</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search grouper, conch, permit, closure…" className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none" /></label>
        <label className="grid gap-1 text-[9px] font-black uppercase tracking-[.14em] text-slate-500">Fishing date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-[#043331]" /></label>
        <label className="grid gap-1 text-[9px] font-black uppercase tracking-[.14em] text-slate-500">Water<select value={water} onChange={(event) => setWater(event.target.value as FishingWater)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-[#043331]"><option value="territorial">Territorial · 0–3 nm</option><option value="federal">Federal · 3–200 nm</option></select></label>
        <label className="grid gap-1 text-[9px] font-black uppercase tracking-[.14em] text-slate-500">District<select value={district} onChange={(event) => setDistrict(event.target.value as FishingDistrict)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-[#043331]"><option value="stt-stj">St. Thomas / St. John</option><option value="stx">St. Croix</option></select></label>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {([['species','Species'],['closures','Closure calendar'],['areas','Protected areas'],['handbook','Full handbook']] as const).map(([id, label]) => <button key={id} type="button" onClick={() => setView(id)} className={`shrink-0 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[.12em] ${view === id ? "bg-teal-700 text-white" : "border border-slate-200 bg-white text-slate-600"}`}>{label}</button>)}
      </div>

      {view === "species" ? <>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2">{families.map((item) => <button key={item} type="button" onClick={() => setFamily(item)} className={`shrink-0 rounded-xl px-3 py-2 text-[10px] font-bold ${family === item ? "bg-cyan-100 text-teal-950" : "bg-white text-slate-500"}`}>{item === "all" ? "All species" : item}</button>)}</div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredSpecies.map((item) => {
          const assessment = assessSpecies(item, { date, water, district });
          const expanded = selected === item.id;
          return <article key={item.id} className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
            <button type="button" onClick={() => setSelected(expanded ? null : item.id)} className="w-full p-5 text-left">
              <div className="flex items-start gap-4"><div className="grid h-16 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#ccfbf1,#a5f3fc)] text-3xl">{item.imageUrl ? <Image src={item.imageUrl} alt="" width={320} height={180} className="h-full w-full object-contain" /> : item.glyph}</div><div className="min-w-0"><div className="text-[9px] font-black uppercase tracking-[.16em] text-amber-700">{item.family}</div><h2 className="mt-1 text-xl font-black tracking-tight text-[#043331]">{item.name}</h2><div className="mt-1 truncate text-xs italic text-slate-400">{item.scientificName}</div></div></div>
              <div className={`mt-4 rounded-2xl border px-3 py-2.5 text-xs font-black ${STATUS_STYLE[assessment.status]}`}>{assessment.label}</div>
              <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{item.summary}</p>
            </button>
            {expanded ? <div className="border-t border-slate-100 bg-slate-50 p-5">
              <p className="text-sm font-semibold leading-6 text-slate-700">{assessment.explanation}</p>
              {item.sizeRules.length ? <Info icon={Ruler} label="Size rules" values={item.sizeRules} /> : null}
              {item.closures.length ? <Info icon={CalendarDays} label="Handbook closures" values={item.closures.map((rule) => rule.label)} /> : null}
              {item.notes.length ? <Info icon={ShieldAlert} label="Important details" values={item.notes} /> : null}
              <div className="mt-4 flex flex-wrap gap-2">{item.handbookPages.map((page) => <a key={page} href={`${sourceFile}#page=${page + 4}`} target="_blank" rel="noreferrer" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-[.12em] text-teal-800">Handbook p. {page}</a>)}</div>
            </div> : null}
          </article>;
        })}</div>
      </> : null}

      {view === "closures" ? <div className="mt-6 grid gap-4 md:grid-cols-2">{species.filter((item) => item.closures.length).map((item) => <article key={item.id} className="rounded-[24px] border border-slate-200 bg-white p-5"><div className="flex items-center gap-3"><span className="text-2xl">{item.glyph}</span><div><h2 className="font-black text-[#043331]">{item.name}</h2><div className="text-xs italic text-slate-400">{item.scientificName}</div></div></div><div className="mt-4 space-y-2">{item.closures.map((closure) => <div key={`${closure.start}-${closure.end}-${closure.districts.join()}`} className="rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-950">{closure.label}<div className="mt-1 text-[10px] font-semibold uppercase tracking-[.1em] text-amber-800/65">{closure.waters.join(' + ')} · {closure.districts.join(' + ')}</div></div>)}</div></article>)}</div> : null}

      {view === "areas" ? <div className="mt-6 grid gap-4 md:grid-cols-2">{AREAS.map((area) => <article key={area.name} className="rounded-[24px] border border-slate-200 bg-white p-5"><div className="flex items-center justify-between gap-3"><MapPinned className="text-teal-700" /><span className="rounded-full bg-rose-50 px-3 py-1 text-[9px] font-black uppercase text-rose-800">{area.status}</span></div><h2 className="mt-4 text-lg font-black text-[#043331]">{area.name}</h2><div className="mt-1 text-[10px] font-black uppercase tracking-[.14em] text-amber-700">{area.district}</div><p className="mt-3 text-sm font-medium leading-6 text-slate-600">{area.detail}</p><a href={`${sourceFile}#page=${area.page + 4}`} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase text-teal-800">Source · handbook p. {area.page} <ExternalLink size={13} /></a></article>)}</div> : null}

      {view === "handbook" ? <div className="mt-6 grid gap-4 md:grid-cols-2">{handbookResults.map((page) => <article key={page.id} className="rounded-[24px] border border-slate-200 bg-white p-5"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-amber-700"><BookOpen size={14} /> {page.section}</div><h2 className="mt-2 text-lg font-black text-[#043331]">{page.title}</h2><p className="mt-3 line-clamp-5 whitespace-pre-line text-sm font-medium leading-6 text-slate-600">{page.text}</p><a href={`${sourceFile}#page=${page.pdfPage}`} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase text-teal-800">PDF page {page.pdfPage} <ExternalLink size={13} /></a></article>)}</div> : null}

      <div className="mt-8 rounded-[24px] border border-cyan-200 bg-cyan-50 p-5"><div className="flex gap-3"><Waves className="shrink-0 text-teal-700" /><p className="text-sm font-semibold leading-6 text-teal-950">A green result means only that this 2024 handbook dataset did not match a seasonal or permanent prohibition for the selected context. It never means “legal to harvest.” Current emergency closures, ACL actions, species identification, location rules, permits, gear, size, bag, landing, and reporting requirements must still be checked.</p></div></div>
    </div>
  );
}

function Info({ icon: Icon, label, values }: { icon: LucideIcon; label: string; values: string[] }) {
  return <div className="mt-4"><div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.14em] text-slate-500"><Icon size={14} /> {label}</div><ul className="mt-2 space-y-1.5">{values.map((value) => <li key={value} className="text-xs font-semibold leading-5 text-slate-600">• {value}</li>)}</ul></div>;
}
