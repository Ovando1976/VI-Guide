import { useNavigate } from "react-router-dom";
import {
  Archive,
  Building2,
  Crown,
  Download,
  FileText,
  Landmark,
  Sparkles,
} from "lucide-react";

const offers = [
  {
    title: "Archive Packs",
    text: "Curated source bundles, translated map records, and research-ready archive collections.",
    icon: Archive,
  },
  {
    title: "Property Reports",
    text: "Premium property-history packets for researchers, families, schools, and local investors.",
    icon: Building2,
  },
  {
    title: "Historic Map Downloads",
    text: "Cleaned map metadata, thumbnails, review queues, and export-ready historic map sets.",
    icon: Download,
  },
  {
    title: "Sponsor a Collection",
    text: "Museums, schools, tourism partners, and local businesses can sponsor public history sections.",
    icon: Landmark,
  },
];

export default function HistoryRevenueStrip() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-amber-300/20 bg-gradient-to-br from-amber-300/15 via-yellow-900/20 to-black/40 p-5 shadow-2xl shadow-black/30">
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-300/20 blur-3xl" />
      <div className="absolute -bottom-20 left-1/3 h-52 w-52 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="relative grid gap-5 lg:grid-cols-[1.1fr_1.6fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-black/25 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-amber-200">
            <Crown className="h-3.5 w-3.5" />
            Revenue Layer
          </div>

          <h2 className="mt-4 text-2xl font-black tracking-tight text-white md:text-3xl">
            Turn USVI history into paid research products.
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-amber-50/70">
            Keep public browsing free, then monetize deeper archive access,
            property reports, map downloads, school packets, tourism sponsorships,
            and local heritage research.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate("/history?view=archives")}
              className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-4 py-2 text-xs font-black text-zinc-950 shadow-lg shadow-amber-950/30 transition hover:-translate-y-0.5 hover:bg-yellow-200"
            >
              <Sparkles className="h-4 w-4" />
              Unlock archive packs
            </button>

            <button
              type="button"
              onClick={() => navigate("/history/property-report")}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-white/15"
            >
              <FileText className="h-4 w-4" />
              Request property report
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {offers.map((offer) => {
            const Icon = offer.icon;

            return (
              <article
                key={offer.title}
                className="rounded-3xl border border-white/10 bg-black/25 p-4 backdrop-blur transition hover:-translate-y-0.5 hover:border-amber-300/30 hover:bg-black/35"
              >
                <Icon className="h-5 w-5 text-amber-300" />
                <h3 className="mt-3 text-sm font-black text-white">{offer.title}</h3>
                <p className="mt-2 text-xs leading-5 text-white/55">{offer.text}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
