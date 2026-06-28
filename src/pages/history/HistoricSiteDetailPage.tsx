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
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import IslandMap from "../../components/maps/IslandMap";
import {
  geographicIndexItems,
  type GeographicIndexItem,
} from "../../data/core/geographicIndex";
import { getHistoryForHistoricSite } from "../../data/history/historyLinks";

type LooseRecord = Record<string, unknown>;

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalize(value: unknown): string {
  return clean(value)
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getLoose(value: unknown, key: string): unknown {
  return (value as LooseRecord | null)?.[key];
}

function safeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function islandLabel(value?: string | null): string {
  if (value === "st_thomas" || value === "stt") return "St. Thomas";
  if (value === "st_john" || value === "stj") return "St. John";
  if (value === "st_croix" || value === "stx") return "St. Croix";
  if (value === "water_island" || value === "wat") return "Water Island";
  return "U.S. Virgin Islands";
}

function getImage(site: GeographicIndexItem & LooseRecord): string {
  return (
    clean(getLoose(site, "coverImage")) ||
    clean(getLoose(site, "imageUrl")) ||
    clean(getLoose(site, "image")) ||
    clean(getLoose(site, "photoUrl")) ||
    clean(getLoose(site, "thumbnailUrl")) ||
    "/images/historicSite/placeholder-historic-site.svg"
  );
}

function findHistoricSite(siteId: string) {
  const decoded = decodeURIComponent(siteId);
  const target = normalize(decoded);

  return geographicIndexItems.find((item: GeographicIndexItem) => {
    const source = String(getLoose(item, "source") ?? "");
    const isHistoric =
      source === "historicSite" ||
      source === "historic_site" ||
      String(getLoose(item, "type") ?? "") === "historic";

    if (!isHistoric) return false;

    return [
      getLoose(item, "id"),
      getLoose(item, "name"),
      getLoose(item, "slug"),
      getLoose(item, "siteId"),
    ].some((value) => normalize(value) === target);
  });
}

export default function HistoricSiteDetailPage() {
  const { siteId = "" } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const site = useMemo(() => findHistoricSite(siteId), [siteId]);

  if (!site) {
    return (
      <main className="min-h-screen bg-[#f8f7f2] px-5 py-10 text-stone-950">
        <div className="mx-auto max-w-5xl">
          <button
            type="button"
            onClick={() => navigate("/map")}
            className="rounded-full bg-white px-5 py-3 text-sm font-black shadow"
          >
            ← Back
          </button>

          <section className="mt-6 rounded-[2rem] bg-white p-8 shadow-xl">
            <h1 className="font-serif text-4xl font-black">
              Historic site not found
            </h1>
            <p className="mt-3 text-sm text-stone-600">
              Requested site: {decodeURIComponent(siteId || "missing")}
            </p>
          </section>
        </div>
      </main>
    );
  }

  const island = clean(params.get("island")) || clean(site.island) || "st_thomas";
  const title = clean(site.name) || "Unnamed Historic Site";
  const description =
    clean(site.description) ||
    "Historic site connected to the Virgin Islands geographic index.";

  const lat = safeNumber(site.coordinates?.lat);
  const lng = safeNumber(site.coordinates?.lng);
  const hasCoords = lat !== null && lng !== null;

  const encodedTitle = encodeURIComponent(title);
  const encodedId = encodeURIComponent(String(site.id));

  const linkedHistoryRecords = getHistoryForHistoricSite({
    name: title,
    siteId: String(site.id),
  }).slice(0, 6);

  return (
    <main className="min-h-screen bg-[#f8f7f2] px-5 py-8 pb-[calc(140px+env(safe-area-inset-bottom))] text-stone-950">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => navigate("/map")}
          className="mb-5 flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black shadow transition hover:-translate-y-0.5"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        <section className="overflow-hidden rounded-[2.75rem] bg-black text-white shadow-2xl">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
            <div className="p-8 sm:p-10">
              <p className="text-[10px] font-black uppercase tracking-[0.45em] text-amber-300">
                Historic Site
              </p>

              <h1 className="mt-6 font-serif text-5xl font-black leading-[0.9] tracking-[-0.06em] sm:text-7xl">
                {title}
              </h1>

              <div className="mt-6 flex flex-wrap gap-2">
                <Pill label={islandLabel(island)} />
                <Pill label={clean(site.type) || "Historic Site"} />
                <Pill label={`ID ${site.id}`} />
              </div>

              <p className="mt-8 max-w-xl text-base leading-relaxed text-white/70">
                {description}
              </p>
            </div>

            <div className="bg-[#111827] p-5">
              <div className="relative h-full min-h-[360px] overflow-hidden rounded-[2rem] border border-white/10 bg-black">
                <img
                  src={getImage(site as GeographicIndexItem & LooseRecord)}
                  alt={title}
                  className="h-full min-h-[360px] w-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(event) => {
                    event.currentTarget.src =
                      "/images/historicSite/placeholder-historic-site.svg";
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-black/55 p-4 backdrop-blur-xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-300">
                    Site Image
                  </p>
                  <p className="mt-1 text-sm font-bold text-white">{title}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
          <Action
            label="Archives"
            icon={Archive}
            onClick={() =>
              navigate(
                `/history/knowledge?site=${encodedId}&island=${island}&context=${encodedTitle}`,
              )
            }
          />

          <Action
            label="Knowledge"
            icon={LibraryBig}
            onClick={() =>
              navigate(
                `/history/knowledge?site=${encodedId}&island=${island}&context=${encodedTitle}`,
              )
            }
          />

          <Action
            label="Ask AI"
            icon={MessageCircle}
            onClick={() =>
              navigate(
                `/concierge?island=${island}&context=${encodedTitle}&type=historic-site`,
              )
            }
          />

          <Action
            label="Plan Ride"
            icon={Route}
            onClick={() =>
              navigate(
                `/mobility?island=${island}&destination=${encodedTitle}${
                  hasCoords ? `&lat=${lat}&lng=${lng}` : ""
                }`,
              )
            }
          />

          <Action
            label="Directions"
            icon={MapPinned}
            disabled={!hasCoords}
            onClick={() => {
              if (!hasCoords) return;
              window.open(
                `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
                "_blank",
                "noopener,noreferrer",
              );
            }}
          />
        </section>

        {hasCoords ? (
          <section className="mt-6 overflow-hidden rounded-[2rem] bg-white p-5 shadow-xl">
            <h2 className="font-serif text-2xl font-black">
              Historic Site Location
            </h2>
            <p className="mt-2 text-sm text-stone-600">
              Explore the site location and surrounding estate geography.
            </p>

            <div className="mt-5 overflow-hidden rounded-[1.5rem]">
              <IslandMap
                embedded
                embeddedMapHeight="420px"
                interactive
                showControls
                focusTarget={{
                  center: [lng, lat],
                  zoom: 15,
                  pitch: 58,
                  bearing: -12,
                }}
                showEstateBoundaries
                showEstateLabels
                showParcels={false}
                showParcelLabels={false}
              />
            </div>
          </section>
        ) : null}

        {linkedHistoryRecords.length > 0 ? (
          <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-xl">
            <h2 className="font-serif text-2xl font-black">
              Linked History Records
            </h2>

            <div className="mt-4 grid gap-3">
              {linkedHistoryRecords.map((record) => (
                <div key={record.id} className="rounded-2xl bg-stone-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
                    {record.dateRange || record.type}
                  </p>

                  <h3 className="mt-2 text-sm font-black">{record.title}</h3>

                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-stone-600">
                    {record.summary}
                  </p>

                  <p className="mt-3 text-[11px] font-bold text-stone-400">
                    {record.source.title} · {record.source.pages}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-800">
              <Sparkles className="h-6 w-6" />
            </div>

            <div>
              <h2 className="font-serif text-2xl font-black">
                Historic Intelligence
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-stone-600">
                This page connects the historic site to maps, archives, AI
                context, mobility, coordinates, nearby geography, and the
                historical knowledge base.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <Info label="Island" value={islandLabel(island)} />
            <Info label="Source" value={clean(site.source) || "Historic Site"} />
            <Info
              label="Coordinates"
              value={
                hasCoords ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : "Unavailable"
              }
            />
          </div>
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

function Action({
  label,
  icon: Icon,
  onClick,
  disabled = false,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-[2rem] bg-white p-6 text-left shadow-xl transition ${
        disabled
          ? "cursor-not-allowed opacity-45"
          : "hover:-translate-y-0.5 hover:shadow-2xl"
      }`}
    >
      <Icon className="h-6 w-6 text-amber-700" />
      <p className="mt-5 text-sm font-black uppercase tracking-[0.18em]">
        {label}
      </p>
    </button>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-stone-50 p-5">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-700">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-black">{value}</p>
    </div>
  );
}