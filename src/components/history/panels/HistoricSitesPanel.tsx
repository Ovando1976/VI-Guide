import { useMemo, useState } from "react";
import {
  ExternalLink,
  Landmark,
  MapPinned,
  Route,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import historicSiteItems from "../../../data/history/generated/historicSites";

type SiteRecord = Record<string, unknown>;

function textValue(value: unknown, fallback = "") {
  return String(value ?? fallback).trim();
}

function siteTitle(site: SiteRecord) {
  return (
    textValue(site.title) ||
    textValue(site.name) ||
    textValue(site.label) ||
    "Untitled historic site"
  );
}

function siteIsland(site: SiteRecord) {
  const island = textValue(site.island || site.islandCode);
  return island.replaceAll("_", " ");
}

function siteSearchText(site: SiteRecord) {
  return [
    site.id,
    site.title,
    site.name,
    site.label,
    site.type,
    site.category,
    site.island,
    site.description,
    site.summary,
    site.address,
    site.quarter,
    site.source,
  ]
    .join(" ")
    .toLowerCase();
}

export default function HistoricSitesPanel() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const sites = historicSiteItems as SiteRecord[];

  const filteredSites = useMemo(() => {
    const q = query.trim().toLowerCase();

    return sites
      .filter((site) => !q || siteSearchText(site).includes(q))
      .slice(0, 24);
  }, [query, sites]);

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-2xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <Landmark className="mt-1 h-6 w-6 text-yellow-300" />
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-yellow-300">
              Historic Sites
            </p>
            <h2 className="mt-1 text-3xl font-black text-white">
              Forts, Churches, Estates & Ruins
            </h2>
            <p className="mt-4 max-w-4xl text-sm leading-7 text-white/65">
              Historic site records connect to detail pages, coordinates, maps,
              source records, images, archive context, and visitor discovery.
            </p>
          </div>
        </div>

        <Metric label="Site records" value={sites.length} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <SiteAction
          icon={MapPinned}
          title="Open Mapped Sites"
          text="View forts, churches, estates, ruins, cemeteries, districts, and landmarks on the Territory Atlas."
          onClick={() => navigate("/map?filter=history")}
        />
        <SiteAction
          icon={Landmark}
          title="Historic Site Records"
          text="Search names, descriptions, linked records, images, and preservation notes."
          onClick={() => navigate("/history?view=sites")}
        />
        <SiteAction
          icon={ShieldCheck}
          title="Protected Places"
          text="Track National Register, VISHPO, local status, and mapped site evidence."
          onClick={() => navigate("/map?filter=history")}
        />
      </div>

      <div className="mt-7 rounded-3xl border border-white/10 bg-black/20 p-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search historic sites, forts, churches, estates, ruins..."
            className="w-full rounded-2xl border border-white/10 bg-white/[0.06] py-4 pl-11 pr-4 text-sm font-semibold text-white outline-none placeholder:text-white/35 focus:border-yellow-300/40"
          />
        </label>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredSites.length > 0 ? (
            filteredSites.map((site, index) => (
              <button
                key={textValue(site.id) || `${siteTitle(site)}-${index}`}
                type="button"
                onClick={() => navigate("/map?filter=history")}
                className="group rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-left transition hover:-translate-y-0.5 hover:border-yellow-300/40 hover:bg-white/[0.07]"
              >
                <div className="flex items-start justify-between gap-3">
                  <Landmark className="mt-1 h-5 w-5 shrink-0 text-yellow-300" />
                  <ExternalLink className="h-4 w-4 text-white/25 transition group-hover:text-yellow-300" />
                </div>

                <h3 className="mt-3 line-clamp-2 text-sm font-black text-white">
                  {siteTitle(site)}
                </h3>

                <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/55">
                  {textValue(
                    site.description || site.summary || site.type,
                    "Historic site record",
                  )}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Tag>{siteIsland(site)}</Tag>
                  <Tag>{textValue(site.type || site.category)}</Tag>
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-white/50">
              No historic site records matched that search.
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-yellow-300/15 bg-yellow-300/10 p-5">
        <div className="flex items-start gap-3">
          <Route className="mt-1 h-5 w-5 text-yellow-300" />
          <p className="text-sm leading-7 text-yellow-50/80">
            This panel is now reading from the canonical historic site index.
            Next step is linking each card to its own detail route when the
            final site-detail route is confirmed.
          </p>
        </div>
      </div>
    </section>
  );
}

function SiteAction({
  icon: Icon,
  title,
  text,
  onClick,
}: {
  icon: typeof Landmark;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-3xl border border-white/10 bg-black/20 p-5 text-left transition hover:-translate-y-1 hover:border-yellow-300/40 hover:bg-white/[0.07]"
    >
      <div className="flex items-center justify-between gap-3">
        <Icon className="h-6 w-6 text-yellow-300" />
        <ExternalLink className="h-4 w-4 text-white/25 transition group-hover:text-yellow-300" />
      </div>
      <h3 className="mt-6 text-xl font-black text-white">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-white/55">{text}</p>
    </button>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-right md:min-w-[160px]">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-white">{value.toLocaleString()}</p>
    </div>
  );
}

function Tag({ children }: { children: string }) {
  if (!children) return null;

  return (
    <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/55">
      {children}
    </span>
  );
}
