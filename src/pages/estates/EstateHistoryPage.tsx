import { useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Archive,
  ChevronLeft,
  Landmark,
  LibraryBig,
  MapPinned,
  MessageCircle,
  Route,
  ScrollText,
} from "lucide-react";

import { geographicIndexItems } from "../../data/core/geographicIndex";
import { getHistoryForHistoricSite } from "../../data/history/historyLinks";
import { historySourceLine } from "../../data/history/normalizeHistoryRecord";
import { getEstateHistoryDescription } from "../../data/canonical/estateHistoryDescriptions";
import { getManualEstateHistoryOverride } from "../../data/canonical/manualEstateHistoryOverrides";
import { getSixtoEstateExtract } from "../../data/history/sources/sixtoTimeAndIExtracts";
import { getSixtoEstateAcreage1902 } from "../../data/history/sources/sixtoEstateAcreage1902";
import { getEstateSourceIndexEntry } from "../../data/canonical/estateSourceIndex";
import { getSixtoEstateNarrative1902 } from "../../data/history/sources/sixtoEstateNarratives1902";

type LooseRecord = Record<string, unknown>;

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalize(value: unknown): string {
  return clean(value)
    .toLowerCase()
    .replace(/^estate\s+/i, "")
    .replace(/['’]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getLoose(value: unknown, key: string): unknown {
  return (value as LooseRecord | null)?.[key];
}

function safeNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function islandLabel(value?: string | null): string {
  if (value === "st_thomas" || value === "stt") return "St. Thomas";
  if (value === "st_john" || value === "stj") return "St. John";
  if (value === "st_croix" || value === "stx") return "St. Croix";
  if (value === "water_island" || value === "wat") return "Water Island";
  return "U.S. Virgin Islands";
}

function readCoordinates(record: LooseRecord) {
  const coords = getLoose(record, "coordinates") || getLoose(record, "coords") || getLoose(record, "centroid");

  if (Array.isArray(coords) && coords.length >= 2) {
    const a = safeNumber(coords[0]);
    const b = safeNumber(coords[1]);

    if (a !== null && b !== null) {
      if (a < -40 && b > 0) return { lng: a, lat: b };
      if (b < -40 && a > 0) return { lat: a, lng: b };
    }
  }

  if (coords && typeof coords === "object") {
    const obj = coords as LooseRecord;
    const lat = safeNumber(obj.lat ?? obj.latitude);
    const lng = safeNumber(obj.lng ?? obj.lon ?? obj.longitude);

    if (lat !== null && lng !== null) return { lat, lng };
  }

  return null;
}

function recordName(record: LooseRecord): string {
  return (
    clean(getLoose(record, "name")) ||
    clean(getLoose(record, "title")) ||
    clean(getLoose(record, "label")) ||
    clean(getLoose(record, "estate")) ||
    "Unnamed Estate"
  );
}

function findEstate(geoid: string, context?: string | null) {
  const decoded = decodeURIComponent(geoid || "");
  const target = normalize(decoded);
  const contextTarget = normalize(context || "");

  return geographicIndexItems.find((item) => {
    const record = item as LooseRecord;
    const type = normalize(getLoose(record, "type"));
    const source = normalize(getLoose(record, "source"));

    const isEstate =
      type === "estate" ||
      source === "estate" ||
      clean(getLoose(record, "estate")) !== "";

    if (!isEstate) return false;

    const candidates = [
      getLoose(record, "id"),
      getLoose(record, "geoid"),
      getLoose(record, "slug"),
      getLoose(record, "name"),
      getLoose(record, "title"),
      getLoose(record, "label"),
      getLoose(record, "estate"),
    ].map(normalize);

    return candidates.includes(target) || Boolean(contextTarget && candidates.includes(contextTarget));
  }) as LooseRecord | undefined;
}

function findEstateHistory(title: string, id: string) {
  const direct = getHistoryForHistoricSite({
    name: title,
    siteId: id,
  });

  if (direct.length > 0) return direct;

  return getHistoryForHistoricSite({
    name: title.replace(/^Estate\s+/i, ""),
    siteId: id,
  });
}

export default function EstateHistoryPage() {
  const { geoid = "" } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const estate = useMemo(
    () => findEstate(geoid, params.get("context")),
    [geoid, params],
  );

  const fallbackTitle = clean(params.get("context")) || decodeURIComponent(geoid || "Estate");
  const title = estate ? recordName(estate) : fallbackTitle;
  const estateId = clean(getLoose(estate, "id")) || clean(getLoose(estate, "geoid")) || decodeURIComponent(geoid || title);
  const island = clean(params.get("island")) || clean(getLoose(estate, "island")) || "st_thomas";
  const quarter =
    clean(params.get("quarter")) ||
    clean(getLoose(estate, "quarter")) ||
    clean(getLoose(estate, "quarterGroup")) ||
    "Unknown quarter";
  const coords = estate ? readCoordinates(estate) : null;

  const historyRecords = useMemo(
    () => findEstateHistory(title, estateId).slice(0, 18),
    [title, estateId],
  );

  const estateDescription =
    getManualEstateHistoryOverride(estateId) ||
    getManualEstateHistoryOverride(title) ||
    getManualEstateHistoryOverride(fallbackTitle) ||
    getEstateHistoryDescription(estateId) ||
    getEstateHistoryDescription(title) ||
    getEstateHistoryDescription(fallbackTitle);

  const sixtoExtract =
    getSixtoEstateExtract(title) ||
    getSixtoEstateExtract(fallbackTitle) ||
    getSixtoEstateExtract(title.replace(/^Estate\s+/i, '')) ||
    null;

  const sixtoAcreage =
    getSixtoEstateAcreage1902(title) ||
    getSixtoEstateAcreage1902(fallbackTitle) ||
    getSixtoEstateAcreage1902(title.replace(/^Estate\s+/i, '')) ||
    null;

  const sixtoNarrative =
    getSixtoEstateNarrative1902(title) ||
    getSixtoEstateNarrative1902(fallbackTitle) ||
    getSixtoEstateNarrative1902(estateId) ||
    getSixtoEstateNarrative1902(title.replace(/^Estate\s+/i, '')) ||
    null;

  const estateSourceIndex =
    getEstateSourceIndexEntry(estateId) ||
    getEstateSourceIndexEntry(title) ||
    getEstateSourceIndexEntry(fallbackTitle) ||
    null;

  const developmentTimeline: never[] = [];

  const encodedTitle = encodeURIComponent(title);
  const encodedId = encodeURIComponent(estateId || title);

  return (
    <main className="min-h-screen bg-[#05070d] px-5 py-8 pb-[calc(120px+env(safe-area-inset-bottom))] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(251,191,36,0.18),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.12),transparent_30%),linear-gradient(to_bottom,#05070d,#111827_50%,#05070d)]" />

      <div className="relative mx-auto max-w-7xl">
        <button
          type="button"
          onClick={() => navigate(`/map?island=${island}`)}
          className="mb-5 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-black shadow-xl backdrop-blur-xl transition hover:bg-white/15"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Atlas
        </button>

        <section className="overflow-hidden rounded-[2.75rem] border border-white/10 bg-white/[0.06] shadow-2xl backdrop-blur-2xl">
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="p-8 sm:p-10">
              <p className="text-[10px] font-black uppercase tracking-[0.45em] text-amber-300">
                Estate History
              </p>

              <h1 className="mt-6 font-serif text-5xl font-black leading-[0.9] tracking-[-0.06em] sm:text-7xl">
                {title}
              </h1>

              <div className="mt-6 flex flex-wrap gap-2">
                <Pill label={islandLabel(island)} />
                <Pill label={quarter} />
                <Pill label={`ID ${estateId || "pending"}`} />
                <Pill label={`${historyRecords.length} linked records`} />
              </div>

              <p className="mt-8 max-w-xl text-base leading-relaxed text-white/70">
                {estateSourceIndex?.historicalDescription ||
                  estateDescription?.historicalDescription ||
                  "This dedicated estate history page gathers the historical context, archive links, map context, source records, and AI routes for the selected estate."}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <DarkMetric label="Island" value={islandLabel(island)} />
                <DarkMetric label="Quarter" value={quarter} />
                <DarkMetric
                  label="Coordinates"
                  value={coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : "Needed"}
                />
              </div>
            </div>

            <div className="grid gap-4 bg-[#020617]/60 p-5">
              <div className="rounded-[2rem] border border-white/10 bg-black/40 p-6">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-300 text-slate-950">
                  <Landmark className="h-7 w-7" />
                </div>

                <h2 className="mt-5 font-serif text-3xl font-black">
                  Estate history card
                </h2>

                <p className="mt-3 text-sm leading-relaxed text-white/65">
                  {estateSourceIndex?.shortDescription ||
                    estateDescription?.shortDescription ||
                    "The atlas History action now opens this dedicated estate page instead of dropping the user into the generic history hub."}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Action
                    label="Archives"
                    icon={Archive}
                    onClick={() => navigate(`/estates/${encodedId}/archives?island=${island}&context=${encodedTitle}`)}
                  />
                  <Action
                    label="Ask AI"
                    icon={MessageCircle}
                    onClick={() => navigate(`/concierge?island=${island}&context=${encodedTitle}&type=estate-history`)}
                  />
                  <Action
                    label="Route"
                    icon={Route}
                    onClick={() =>
                      navigate(`/mobility?island=${island}&destination=${encodedTitle}${coords ? `&lat=${coords.lat}&lng=${coords.lng}` : ""}`)
                    }
                  />
                  <Action
                    label="Map"
                    icon={MapPinned}
                    onClick={() => navigate(`/map?island=${island}&context=${encodedTitle}`)}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>


        {estateSourceIndex ? (
          <section className="mt-6 rounded-[2rem] bg-white p-6 text-stone-950 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-800">
                <LibraryBig className="h-6 w-6" />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-700">
                  Estate Timeline Contrast
                </p>
                <h2 className="mt-1 font-serif text-3xl font-black">
                  {estateSourceIndex.name}
                </h2>
                {estateSourceIndex.historicalDescription ? (
                  <p className="mt-3 text-sm leading-7 text-stone-700">
                    {estateSourceIndex.historicalDescription}
                  </p>
                ) : null}
              </div>
            </div>

            {estateSourceIndex.keyFacts.length ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {estateSourceIndex.keyFacts.slice(0, 6).map((fact) => (
                  <div
                    key={fact}
                    className="rounded-3xl border border-stone-200 bg-stone-50 p-4 text-sm font-bold leading-relaxed text-stone-700"
                  >
                    {fact}
                  </div>
                ))}
              </div>
            ) : null}

            {estateSourceIndex.sourceRefs.length ? (
              <p className="mt-5 text-xs font-bold leading-5 text-stone-400">
                Primary source: {estateSourceIndex.sourceRefs[0]}
              </p>
            ) : null}
          </section>
        ) : null}

        {sixtoAcreage ? (
          <section className="mt-6 rounded-[2rem] bg-white p-6 text-stone-950 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-800">
                <LibraryBig className="h-6 w-6" />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-700">
                  Sixto 1902 Estate Table
                </p>
                <h2 className="mt-1 font-serif text-3xl font-black">
                  {sixtoAcreage.name}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  Adolph Sixto listed this estate in his “Estates and Acreage of St. Thomas”
                  table on PDF page {sixtoAcreage.sourcePage}.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <Info label="Sixto acreage" value={sixtoAcreage.acres !== null ? `${sixtoAcreage.acres} acres` : "Unclear"} />
              <Info label="Sixto category" value={sixtoAcreage.category.replaceAll("-", " ")} />
              <Info label="Source page" value={`PDF page ${sixtoAcreage.sourcePage}`} />
            </div>

            {sixtoAcreage.note ? (
              <p className="mt-5 rounded-3xl bg-amber-50 p-5 text-sm font-bold leading-relaxed text-amber-900">
                {sixtoAcreage.note}
              </p>
            ) : null}
          </section>
        ) : null}

        {sixtoExtract ? (
          <section className="mt-6 rounded-[2rem] bg-white p-6 text-stone-950 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-800">
                <LibraryBig className="h-6 w-6" />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-700">
                  Primary Source
                </p>
                <h2 className="mt-1 font-serif text-3xl font-black">
                  Adolph Sixto: Time and I
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  Matched estate reference from Adolph Sixto&apos;s early twentieth-century account.
                  {sixtoExtract.pages.length ? ` PDF page${sixtoExtract.pages.length === 1 ? "" : "s"}: ${sixtoExtract.pages.join(", ")}.` : ""}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              {sixtoExtract.excerpts.slice(0, 3).map((excerpt) => (
                <blockquote
                  key={excerpt}
                  className="rounded-3xl border-l-4 border-amber-400 bg-stone-50 p-5 text-sm leading-relaxed text-stone-700"
                >
                  {excerpt}
                </blockquote>
              ))}
            </div>

            <p className="mt-4 text-xs font-bold text-stone-400">
              Primary source: Adolph Sixto, Time and I; or, Looking Forward, San Juan News, c. 1902.
            </p>
          </section>
        ) : null}


        <section className="mt-6 rounded-[2rem] bg-white p-6 text-stone-950 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-800">
              <ScrollText className="h-6 w-6" />
            </div>

            <div>
              <h2 className="font-serif text-3xl font-black">
                Linked Historical Records
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                These records are pulled from the VI Guide historical knowledge base
                using the estate name and identifier.
              </p>
            </div>
          </div>

          {historyRecords.length > 0 ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {historyRecords.map((record) => (
                <article key={record.id} className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-700">
                    {record.dateRange || record.type}
                  </p>
                  <h3 className="mt-2 font-serif text-2xl font-black">
                    {record.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-stone-700">
                    {record.summary}
                  </p>
                  <p className="mt-4 text-xs font-bold text-stone-400">
                    {historySourceLine(record)}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-6">
              <h3 className="font-serif text-2xl font-black">
                No linked records yet
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                This estate route is ready. Next we can improve matching between
                estate names, Danish archive records, dictionary entries, and
                generated historical records.
              </p>
            </div>
          )}
        </section>

        <section className="mt-6 grid gap-3 md:grid-cols-3">
          <Info label="Estate ID" value={estateId || "Unavailable"} />
          <Info label="Island" value={islandLabel(island)} />
          <Info label="Quarter" value={quarter} />
        </section>
      </div>
    </main>
  );
}

function Pill({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-black text-white/85">
      {label}
    </span>
  );
}

function DarkMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-black text-white">{value}</p>
    </div>
  );
}

function Action({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: typeof Archive;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl bg-white p-4 text-left text-stone-950 shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl"
    >
      <Icon className="h-5 w-5 text-amber-700" />
      <p className="mt-3 text-xs font-black uppercase tracking-[0.18em]">
        {label}
      </p>
    </button>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white p-5 text-stone-950 shadow-xl">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-700">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-black">{value}</p>
    </div>
  );
}
