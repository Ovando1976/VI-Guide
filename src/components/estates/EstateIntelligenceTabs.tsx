import { useMemo, useState } from "react";
import {
  Archive,
  BookOpen,
  Building2,
  Clock3,
  History,
  MapPinned,
  ShieldCheck,
  Tags,
} from "lucide-react";

import type {
  EstateCivicPlace,
  EstateKnowledge,
  EstateRule,
  EstateTimelineEvent,
} from "../../types/estateKnowledge";

type TabKey = "overview" | "nearby" | "archives" | "civic" | "rules" | "timeline";

type Props = {
  knowledge?: EstateKnowledge;
  timeline?: EstateTimelineEvent[];
  fallbackSummary?: string;
  fallbackHistory?: string;
};

const tabs: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "nearby", label: "Nearby" },
  { key: "archives", label: "Archives" },
  { key: "civic", label: "Civic" },
  { key: "rules", label: "Rules" },
  { key: "timeline", label: "Timeline" },
];

export function EstateIntelligenceTabs({
  knowledge,
  timeline = [],
  fallbackSummary,
  fallbackHistory,
}: Props) {
  const [active, setActive] = useState<TabKey>("overview");

  const activeTabs = useMemo(() => {
    return tabs.filter((tab) => {
      if (tab.key === "nearby") {
        return Boolean(
          knowledge?.relatedPlaces?.length ||
            knowledge?.relatedHistoricSites?.length
        );
      }

      if (tab.key === "archives") {
        return Boolean(knowledge?.relatedArchives?.length);
      }

      if (tab.key === "civic") {
        return Boolean(knowledge?.civicPlaces?.length);
      }

      if (tab.key === "rules") {
        return Boolean(knowledge?.estateRules?.length);
      }

      if (tab.key === "timeline") {
        return timeline.length > 0;
      }

      return true;
    });
  }, [knowledge, timeline.length]);

  return (
    <section className="mt-5 rounded-[2rem] bg-white p-4 shadow-xl">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {activeTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={`shrink-0 rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] transition ${
              active === tab.key
                ? "bg-stone-950 text-white"
                : "bg-stone-50 text-stone-500"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {active === "overview" ? (
          <OverviewPanel
            knowledge={knowledge}
            fallbackSummary={fallbackSummary}
            fallbackHistory={fallbackHistory}
          />
        ) : null}

        {active === "nearby" ? <NearbyPanel knowledge={knowledge} /> : null}

        {active === "archives" ? <ArchivesPanel knowledge={knowledge} /> : null}

        {active === "civic" ? <CivicPanel items={knowledge?.civicPlaces ?? []} /> : null}

        {active === "rules" ? <RulesPanel rules={knowledge?.estateRules ?? []} /> : null}

        {active === "timeline" ? <TimelinePanel events={timeline} /> : null}
      </div>
    </section>
  );
}

function OverviewPanel({
  knowledge,
  fallbackSummary,
  fallbackHistory,
}: {
  knowledge?: EstateKnowledge;
  fallbackSummary?: string;
  fallbackHistory?: string;
}) {
  const tags = knowledge?.tags ?? [];

  return (
    <div className="rounded-[1.5rem] bg-stone-50 p-5">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-800">
          <BookOpen className="h-5 w-5" />
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">
            Estate Knowledge
          </p>
          <h2 className="mt-1 text-2xl font-black">
            {knowledge?.estateName ?? "Estate overview"}
          </h2>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-stone-700">
        {knowledge?.description || fallbackSummary || "Estate summary is being prepared."}
      </p>

      {(knowledge?.historicSummary || fallbackHistory) ? (
        <p className="mt-3 text-sm leading-relaxed text-stone-600">
          {knowledge?.historicSummary || fallbackHistory}
        </p>
      ) : null}

      {tags.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800"
            >
              <Tags className="h-3 w-3" />
              {formatLabel(tag)}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function NearbyPanel({ knowledge }: { knowledge?: EstateKnowledge }) {
  return (
    <div className="grid gap-4">
      <CardList
        icon={MapPinned}
        eyebrow="Knowledge Graph"
        title="Connected Places"
        items={knowledge?.relatedPlaces ?? []}
        itemLabel="Related place"
        tone="emerald"
      />

      <CardList
        icon={History}
        eyebrow="Heritage Layer"
        title="Historic Sites"
        items={knowledge?.relatedHistoricSites ?? []}
        itemLabel="Historic site"
        tone="amber"
      />
    </div>
  );
}

function ArchivesPanel({ knowledge }: { knowledge?: EstateKnowledge }) {
  return (
    <CardList
      icon={Archive}
      eyebrow="Research Layer"
      title="Archive Targets"
      items={knowledge?.relatedArchives ?? []}
      itemLabel="Research source"
      tone="amber"
    />
  );
}

function CivicPanel({ items }: { items: EstateCivicPlace[] }) {
  if (!items.length) {
    return <EmptyState label="No civic places linked yet." />;
  }

  return (
    <div className="grid gap-3">
      {items.map((place) => (
        <div key={place.id} className="rounded-2xl bg-sky-50 p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-sky-800">
              <Building2 className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-black text-stone-900">{place.name}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-sky-700">
                {formatLabel(place.type)} · {formatLabel(place.relationship)}
              </p>

              {place.address ? (
                <p className="mt-2 text-xs leading-relaxed text-stone-600">
                  {place.address}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RulesPanel({ rules }: { rules: EstateRule[] }) {
  if (!rules.length) {
    return <EmptyState label="No estate rules available yet." />;
  }

  return (
    <div className="grid gap-3">
      {rules.map((rule) => (
        <div key={rule.id} className="rounded-2xl bg-stone-50 p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-stone-700">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-black text-stone-900">{rule.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                {rule.description}
              </p>
              <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">
                {formatLabel(rule.ruleType)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TimelinePanel({ events }: { events: EstateTimelineEvent[] }) {
  if (!events.length) {
    return <EmptyState label="No timeline events available yet." />;
  }

  return (
    <div className="grid gap-4">
      {events.map((event, index) => (
        <div key={`${event.year}-${index}`} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-100 text-sm font-black text-emerald-800">
              {index + 1}
            </div>

            {index < events.length - 1 ? (
              <div className="mt-2 h-full min-h-8 w-px bg-emerald-100" />
            ) : null}
          </div>

          <div className="pb-3">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">
              {event.year}
            </p>
            <h3 className="mt-1 text-base font-bold text-zinc-950">
              {event.event}
            </h3>
          </div>
        </div>
      ))}
    </div>
  );
}

function CardList({
  icon: Icon,
  eyebrow,
  title,
  items,
  itemLabel,
  tone,
}: {
  icon: typeof Archive;
  eyebrow: string;
  title: string;
  items: string[];
  itemLabel: string;
  tone: "emerald" | "amber";
}) {
  if (!items.length) {
    return <EmptyState label={`${title} will appear here as data is added.`} />;
  }

  const toneClass =
    tone === "amber"
      ? "bg-amber-50 text-amber-800"
      : "bg-emerald-50 text-emerald-800";

  const eyebrowClass = tone === "amber" ? "text-amber-700" : "text-emerald-700";

  return (
    <div className="rounded-[1.5rem] bg-stone-50 p-5">
      <div className="flex items-start gap-3">
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <p className={`text-[10px] font-black uppercase tracking-[0.25em] ${eyebrowClass}`}>
            {eyebrow}
          </p>
          <h2 className="mt-1 text-2xl font-black">{title}</h2>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item} className="rounded-2xl bg-white p-4">
            <p className="text-sm font-black text-stone-900">{item}</p>
            <p className="mt-1 text-xs text-stone-600">{itemLabel}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl bg-stone-50 p-5 text-sm leading-relaxed text-stone-500">
      {label}
    </div>
  );
}

function formatLabel(value: string): string {
  return value.replaceAll("_", " ");
}