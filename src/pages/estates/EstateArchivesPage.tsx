import {
  ArrowLeft,
  BookOpen,
  Camera,
  FileText,
  Globe,
  Landmark,
  Map,
  Search,
  type LucideIcon,
} from "lucide-react";
import { useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { estates } from "../../data/estates";
import {
  geographicIndexItems,
  type GeographicIndexItem,
} from "../../data/core/geographicIndex";
import { getEstateFeaturesByGeoid } from "../../data/estateFeatureLinks";
import { getQuarterFeatures } from "../../data/quarterFeatureLinks";
import { getEstateKnowledgeForEstate } from "../../data/estateKnowledgeLookup";

type EstateLike = (typeof estates)[number];
type LooseRecord = Record<string, unknown>;

function clean(value: unknown): string {
  return String(value ?? "")
    .replace(/^Estate\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(value: unknown): string {
  return clean(value)
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function compactId(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function getLoose(value: unknown, key: string): unknown {
  return (value as LooseRecord | null)?.[key];
}

function isLooseMatch(a: unknown, b: unknown): boolean {
  const an = normalize(a);
  const bn = normalize(b);
  const ac = compactId(a);
  const bc = compactId(b);

  if (!an || !bn || !ac || !bc) return false;

  return (
    an === bn ||
    ac === bc ||
    an.includes(bn) ||
    bn.includes(an) ||
    ac.includes(bc) ||
    bc.includes(ac)
  );
}

function islandName(value: unknown): string {
  const key = String(value ?? "").toLowerCase();

  if (key === "stt" || key === "st_thomas") return "St. Thomas";
  if (key === "stj" || key === "st_john") return "St. John";
  if (key === "stx" || key === "st_croix") return "St. Croix";
  if (key === "wat" || key === "water_island") return "Water Island";

  return "U.S. Virgin Islands";
}

function getEstateCandidates(estate: EstateLike): unknown[] {
  return [
    getLoose(estate, "id"),
    getLoose(estate, "estateId"),
    getLoose(estate, "geoid"),
    getLoose(estate, "name"),
    getLoose(estate, "normalizedName"),
    getLoose(estate, "quarter"),
    getLoose(estate, "quarterGroup"),
    ...(Array.isArray(getLoose(estate, "aliases"))
      ? (getLoose(estate, "aliases") as unknown[])
      : []),
  ];
}

function getIndexCandidates(item: GeographicIndexItem): unknown[] {
  return [
    getLoose(item, "id"),
    getLoose(item, "estateId"),
    getLoose(item, "geoid"),
    getLoose(item, "name"),
    getLoose(item, "estateName"),
    getLoose(item, "searchText"),
    getLoose(item, "quarter"),
    getLoose(item, "quarterGroup"),
  ];
}

function findEstateFromIndex(rawParam: string): EstateLike | undefined {
  const indexMatch = geographicIndexItems.find((item) => {
    if (getLoose(item, "source") !== "estate") return false;

    return getIndexCandidates(item).some((value) =>
      isLooseMatch(value, rawParam),
    );
  });

  if (!indexMatch) return undefined;

  return estates.find((estate) =>
    getEstateCandidates(estate).some((estateValue) =>
      getIndexCandidates(indexMatch).some((indexValue) =>
        isLooseMatch(estateValue, indexValue),
      ),
    ),
  );
}

function findEstateByParam(rawParam: string): EstateLike | undefined {
  const decoded = decodeURIComponent(rawParam);

  const directMatch = estates.find((estate) =>
    getEstateCandidates(estate).some((value) => isLooseMatch(value, decoded)),
  );

  return directMatch ?? findEstateFromIndex(decoded);
}

export default function EstateArchivesPage() {
  const { geoid = "" } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const estate = useMemo(() => findEstateByParam(geoid), [geoid]);

  if (!estate) {
    return (
      <main className="min-h-screen bg-stone-50 p-6 text-stone-950">
        <h1 className="text-3xl font-black">Estate not found</h1>

        <p className="mt-3 rounded-2xl bg-white p-4 text-sm text-stone-600 shadow">
          Requested estate:{" "}
          <span className="font-black text-stone-950">
            {decodeURIComponent(geoid || "missing")}
          </span>
        </p>

        <button
          type="button"
          onClick={() => navigate("/map")}
          className="mt-4 rounded-2xl bg-stone-950 px-5 py-3 font-bold text-white"
        >
          Back to Map
        </button>
      </main>
    );
  }

  const estateId = String(
    getLoose(estate, "geoid") ||
      getLoose(estate, "estateId") ||
      getLoose(estate, "id") ||
      normalize(getLoose(estate, "name")),
  );

  const title = clean(getLoose(estate, "name")) || "Unnamed Estate";
  const island = String(
    params.get("island") ||
      getLoose(estate, "island") ||
      getLoose(estate, "islandCode") ||
      "st_thomas",
  );

  const islandLabel = islandName(island);
  const quarter =
    clean(getLoose(estate, "quarter")) ||
    clean(getLoose(estate, "quarterGroup")) ||
    "Unknown Quarter";

  const encodedTitle = encodeURIComponent(title);
  const encodedId = encodeURIComponent(estateId);
  const atlasUrl = `/atlas?estate=${encodedId}&island=${encodeURIComponent(
    island,
  )}&context=${encodedTitle}`;

  const estateFeatures = getEstateFeaturesByGeoid(estateId);
  const quarterFeatures = getQuarterFeatures(
    island,
    String(getLoose(estate, "quarterGroup") || getLoose(estate, "quarter") || ""),
  );

  const knowledge = getEstateKnowledgeForEstate({
    geoid: estateId,
    name: title,
  });

  const relatedArchives = Array.isArray(knowledge?.relatedArchives)
    ? knowledge.relatedArchives
    : [];

  return (
    <main className="min-h-screen bg-stone-50 px-5 py-6 pb-[calc(140px+env(safe-area-inset-bottom))] text-stone-950">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-5 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black shadow transition hover:bg-stone-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <section className="rounded-[2rem] bg-stone-950 p-6 text-white shadow-2xl">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-300">
          Estate Archives
        </p>

        <h1 className="mt-3 text-5xl font-black leading-tight">{title}</h1>

        <p className="mt-3 text-sm font-bold text-stone-300">
          {quarter} · {islandLabel}
        </p>

        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-stone-300">
          Archive gateway for historic photos, maps, Danish records, Library of
          Congress images, HABS/HAER material, and estate-specific documents.
        </p>
      </section>

      <section className="mt-5 rounded-[2rem] bg-gradient-to-r from-sky-950 to-cyan-700 p-6 text-white shadow-xl">
        <div className="flex items-start gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15">
            <Globe className="h-8 w-8" />
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200">
              Historical Atlas
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Open this estate in the VI Guide Atlas
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-sky-100">
              View {title} inside the historical gazetteer with map references,
              neighboring estates, feature links, archive targets, and future
              timeline data.
            </p>

            <button
              type="button"
              onClick={() => navigate(atlasUrl)}
              className="mt-5 rounded-xl bg-white px-5 py-3 text-sm font-black text-sky-950 shadow transition hover:bg-slate-100"
            >
              Open Historical Atlas
            </button>
          </div>
        </div>
      </section>

      {knowledge ? (
        <section className="mt-5 rounded-[2rem] bg-white p-5 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-800">
              <BookOpen className="h-6 w-6" />
            </div>

            <div>
              <h2 className="text-2xl font-black">Archive Intelligence</h2>

              <p className="mt-3 text-sm leading-relaxed text-stone-600">
                {knowledge.historicSummary ||
                  knowledge.description ||
                  `${title} is ready for archive matching and historical enrichment.`}
              </p>
            </div>
          </div>

          {relatedArchives.length > 0 ? (
            <div className="mt-5 grid gap-3">
              {relatedArchives.map((archive) => (
                <div key={archive} className="rounded-2xl bg-amber-50 p-4">
                  <p className="text-sm font-black text-stone-900">{archive}</p>
                  <p className="mt-1 text-xs text-stone-600">
                    Research target
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-2xl bg-stone-50 p-4 text-sm text-stone-600">
              No related archive targets have been attached yet.
            </p>
          )}
        </section>
      ) : null}

      <section className="mt-5 grid gap-3 sm:grid-cols-2">
        <ArchiveCard
          icon={Camera}
          title="Historic Images"
          description="Photographs, postcards, aerial imagery, and visual references connected to the estate."
        />

        <ArchiveCard
          icon={Map}
          title="Historic Maps"
          description="Estate maps, quarter maps, Danish West Indies maps, and boundary references."
        />

        <ArchiveCard
          icon={FileText}
          title="Danish Records"
          description="Census records, plantation documents, church records, deeds, and administrative files."
        />

        <ArchiveCard
          icon={Landmark}
          title="Linked Features"
          description={`${estateFeatures.length} estate-linked records and ${quarterFeatures.length} quarter-linked records are ready for future archive matching.`}
        />
      </section>

      <section className="mt-5 rounded-[2rem] bg-white p-5 shadow-xl">
        <h2 className="text-2xl font-black">Explore More</h2>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() =>
              navigate(
                `/history/knowledge?estate=${encodedId}&island=${encodeURIComponent(
                  island,
                )}&context=${encodedTitle}`,
              )
            }
            className="rounded-2xl bg-emerald-100 p-4 text-xs font-black uppercase tracking-[0.16em] text-emerald-950 transition hover:bg-emerald-200"
          >
            <Search className="mx-auto mb-2 h-5 w-5" />
            Knowledge Base
          </button>

          <button
            type="button"
            onClick={() =>
              navigate(
                `/estates/${encodedId}/history?island=${encodeURIComponent(
                  island,
                )}&context=${encodedTitle}`,
              )
            }
            className="rounded-2xl bg-amber-100 p-4 text-xs font-black uppercase tracking-[0.16em] text-amber-950 transition hover:bg-amber-200"
          >
            <BookOpen className="mx-auto mb-2 h-5 w-5" />
            History Page
          </button>

          <button
            type="button"
            onClick={() => navigate(atlasUrl)}
            className="rounded-2xl bg-sky-100 p-4 text-xs font-black uppercase tracking-[0.16em] text-sky-950 transition hover:bg-sky-200"
          >
            <Globe className="mx-auto mb-2 h-5 w-5" />
            Historical Atlas
          </button>
        </div>
      </section>
    </main>
  );
}

function ArchiveCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-[2rem] bg-white p-5 shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl">
      <Icon className="h-6 w-6 text-emerald-700" />

      <h2 className="mt-4 text-xl font-black">{title}</h2>

      <p className="mt-2 text-sm leading-relaxed text-stone-600">
        {description}
      </p>

      <p className="mt-4 inline-flex rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-900">
        Coming soon
      </p>
    </section>
  );
}