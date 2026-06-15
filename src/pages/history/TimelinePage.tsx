import {
  Anchor,
  CalendarDays,
  Clock3,
  Crown,
  Flame,
  Landmark,
  MapPinned,
  Shield,
  Ship,
  Waves,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { IslandCode } from "../../types";

type TimelineEra =
  | "pre-danish"
  | "erik-smit"
  | "danish-expansion"
  | "emancipation"
  | "transfer"
  | "modern";

type TimelineEvent = {
  id: string;
  year: number;
  yearLabel?: string;
  title: string;
  description: string;
  island: IslandCode | "all";
  location: string;
  coordinates?: [number, number];
  era: TimelineEra;
  tags: string[];
};

type Props = {
  selectedIsland?: IslandCode;
};

const ERAS: { id: TimelineEra | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pre-danish", label: "Pre-Danish" },
  { id: "erik-smit", label: "Erik Smit" },
  { id: "danish-expansion", label: "Danish" },
  { id: "emancipation", label: "Freedom" },
  { id: "transfer", label: "Transfer" },
  { id: "modern", label: "Modern" },
];

const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: "indigenous-occupation",
    year: 1000,
    yearLabel: "Pre-1493",
    title: "Indigenous Taíno and Kalinago occupation",
    description:
      "Before European colonization, the Virgin Islands were part of a wider Indigenous Caribbean world shaped by seafaring, settlement, trade, conflict, and cultural exchange.",
    island: "all",
    location: "Virgin Islands",
    era: "pre-danish",
    tags: ["indigenous", "taino", "kalinago", "pre-colonial"],
  },
  {
    id: "1493-columbus",
    year: 1493,
    title: "Columbus sights the Virgin Islands",
    description:
      "European contact begins a new recorded era for the islands, followed by Spanish claims, raids, and disruption of Indigenous life.",
    island: "all",
    location: "Virgin Islands",
    era: "pre-danish",
    tags: ["columbus", "spanish-era", "european-contact"],
  },
  {
    id: "early-spanish-era",
    year: 1500,
    yearLabel: "1500s",
    title: "Early Spanish era",
    description:
      "The islands entered the Spanish imperial sphere, though they remained contested by Indigenous peoples, European rivals, privateers, and later colonial ventures.",
    island: "all",
    location: "Virgin Islands",
    era: "pre-danish",
    tags: ["spanish", "privateers", "colonial-competition"],
  },
  {
    id: "1652-erik-smit-first-voyage",
    year: 1652,
    title: "Erik Smit’s first voyage aboard Fortuna",
    description:
      "Dutch-born commander Erik Smit led a Danish-sponsored private voyage that proved profitable and helped spark Danish interest in West Indian trade.",
    island: "all",
    location: "West Indies",
    era: "erik-smit",
    tags: ["erik-smit", "fortuna", "danish-expansion"],
  },
  {
    id: "1653-erik-smit-second-voyage",
    year: 1653,
    title: "Erik Smit’s second voyage",
    description:
      "Smit returned with a larger fleet and again showed that Caribbean trade could be profitable for Danish interests.",
    island: "all",
    location: "West Indies",
    era: "erik-smit",
    tags: ["erik-smit", "trade", "voyage"],
  },
  {
    id: "1655-hurricane-losses",
    year: 1655,
    title: "Hurricane losses damage Danish ambitions",
    description:
      "Storms and maritime losses weakened early Danish colonial momentum before a permanent settlement could be established.",
    island: "all",
    location: "Caribbean Sea",
    era: "erik-smit",
    tags: ["hurricane", "maritime-risk", "colonial-failure"],
  },
  {
    id: "1663-settlement-proposal",
    year: 1663,
    title: "Settlement proposal for St. Thomas",
    description:
      "Erik Smit promoted a formal Danish settlement project for St. Thomas, laying groundwork for Denmark’s later colonial effort.",
    island: "st_thomas",
    location: "St. Thomas",
    coordinates: [18.3419, -64.9307],
    era: "erik-smit",
    tags: ["erik-smit", "st-thomas", "settlement"],
  },
  {
    id: "1665-eendragt-departs",
    year: 1665,
    title: "The Eendragt departs",
    description:
      "Settlers and supplies departed for St. Thomas aboard the Eendragt, but storms, fire, illness, war, and privateering undermined the effort.",
    island: "st_thomas",
    location: "St. Thomas",
    coordinates: [18.3419, -64.9307],
    era: "erik-smit",
    tags: ["eendragt", "settlement", "privateers"],
  },
  {
    id: "1666-colony-collapse",
    year: 1666,
    title: "First Danish settlement collapses",
    description:
      "Disease, hurricanes, leadership loss, privateering, and looting led to the complete collapse of Denmark’s first formal St. Thomas settlement attempt.",
    island: "st_thomas",
    location: "St. Thomas",
    coordinates: [18.3419, -64.9307],
    era: "erik-smit",
    tags: ["settlement-collapse", "st-thomas", "danish-failure"],
  },
  {
    id: "1672-danish-st-thomas",
    year: 1672,
    title: "Permanent Danish settlement of St. Thomas",
    description:
      "Denmark established a permanent colony on St. Thomas and began construction of Fort Christian, creating its first lasting foothold in the Virgin Islands.",
    island: "st_thomas",
    location: "Charlotte Amalie",
    coordinates: [18.3411, -64.9306],
    era: "danish-expansion",
    tags: ["fort-christian", "danish-colonization", "st-thomas"],
  },
  {
    id: "1683-claim-st-john",
    year: 1683,
    title: "Danish claim to St. John",
    description:
      "Denmark claimed St. John before formally occupying it decades later, setting the stage for plantation expansion and resistance.",
    island: "st_john",
    location: "St. John",
    coordinates: [18.3358, -64.7281],
    era: "danish-expansion",
    tags: ["st-john", "danish-claim"],
  },
  {
    id: "1718-occupation-st-john",
    year: 1718,
    title: "Danish occupation of St. John",
    description:
      "Danish planters, soldiers, and enslaved Africans landed at Coral Bay, formally beginning Danish occupation of St. John.",
    island: "st_john",
    location: "Coral Bay",
    coordinates: [18.342, -64.713],
    era: "danish-expansion",
    tags: ["coral-bay", "occupation", "plantation"],
  },
  {
    id: "1733-st-croix-purchase",
    year: 1733,
    title: "Denmark purchases St. Croix",
    description:
      "Denmark purchased St. Croix from France, adding the largest agricultural island to the Danish West Indies.",
    island: "st_croix",
    location: "St. Croix",
    coordinates: [17.7246, -64.8348],
    era: "danish-expansion",
    tags: ["st-croix", "purchase", "france"],
  },
  {
    id: "1733-slave-code",
    year: 1733,
    title: "Harsh slave code issued",
    description:
      "A severe slave code intensified oppression and helped create the conditions that led to the St. John revolt.",
    island: "st_john",
    location: "St. John",
    coordinates: [18.3358, -64.7281],
    era: "danish-expansion",
    tags: ["slave-code", "st-john", "resistance"],
  },
  {
    id: "1733-akwamu-revolt",
    year: 1733,
    title: "Akwamu revolt on St. John",
    description:
      "Enslaved Akwamu people seized Fortsberg and held much of St. John for months in one of the most important slave revolts in Caribbean history.",
    island: "st_john",
    location: "Fortsberg / Coral Bay",
    coordinates: [18.342, -64.713],
    era: "danish-expansion",
    tags: ["akwamu", "revolt", "fortsberg", "resistance"],
  },
  {
    id: "1754-crown-takeover",
    year: 1754,
    title: "Danish Crown takeover",
    description:
      "The Danish Crown took control from the chartered company, reshaping administration of St. Thomas, St. John, and St. Croix.",
    island: "all",
    location: "Danish West Indies",
    era: "danish-expansion",
    tags: ["crown-takeover", "government", "danish-west-indies"],
  },
  {
    id: "1764-free-port",
    year: 1764,
    title: "St. Thomas declared a free port",
    description:
      "The free port policy transformed St. Thomas into a major Caribbean trade hub, attracting ships, merchants, and commerce from many nations.",
    island: "st_thomas",
    location: "Charlotte Amalie Harbor",
    coordinates: [18.3379, -64.9332],
    era: "danish-expansion",
    tags: ["free-port", "harbor", "commerce"],
  },
  {
    id: "1792-slave-trade-abolition-law",
    year: 1792,
    title: "Danish slave trade abolition law",
    description:
      "Denmark passed a law to abolish its transatlantic slave trade, though the ban did not take effect until 1803 and slavery itself continued.",
    island: "all",
    location: "Danish West Indies",
    era: "emancipation",
    tags: ["slave-trade", "abolition", "law"],
  },
  {
    id: "1801-first-british-occupation",
    year: 1801,
    title: "First British occupation",
    description:
      "British forces occupied the Danish West Indies during the Napoleonic era, reflecting the islands’ strategic maritime importance.",
    island: "all",
    location: "Danish West Indies",
    era: "emancipation",
    tags: ["british-occupation", "napoleonic-wars"],
  },
  {
    id: "1802-return-to-denmark",
    year: 1802,
    title: "Return to Denmark",
    description:
      "After the first British occupation, the islands were returned to Danish control.",
    island: "all",
    location: "Danish West Indies",
    era: "emancipation",
    tags: ["return-to-denmark", "british-occupation"],
  },
  {
    id: "1803-slave-trade-ban-effective",
    year: 1803,
    title: "Slave trade ban takes effect",
    description:
      "The Danish ban on the transatlantic slave trade became effective, while plantation slavery continued in the islands.",
    island: "all",
    location: "Danish West Indies",
    era: "emancipation",
    tags: ["slave-trade", "abolition", "1803"],
  },
  {
    id: "1807-second-british-occupation",
    year: 1807,
    title: "Second British occupation",
    description:
      "Britain again occupied the Danish West Indies and expanded military works, including defenses around St. Thomas harbor.",
    island: "all",
    location: "Danish West Indies",
    era: "emancipation",
    tags: ["british-occupation", "hassel-island", "war"],
  },
  {
    id: "1815-return-after-british-occupation",
    year: 1815,
    title: "Return after British occupation",
    description:
      "The islands were returned to Denmark after the Napoleonic Wars.",
    island: "all",
    location: "Danish West Indies",
    era: "emancipation",
    tags: ["return-to-denmark", "1815", "napoleonic-wars"],
  },
  {
    id: "1840s-buddhoe-organization",
    year: 1840,
    yearLabel: "1840s",
    title: "Buddhoe and freedom organizing",
    description:
      "Organizing among enslaved and free people on St. Croix helped create the conditions for the 1848 emancipation uprising.",
    island: "st_croix",
    location: "St. Croix",
    coordinates: [17.7246, -64.8348],
    era: "emancipation",
    tags: ["buddhoe", "organization", "freedom"],
  },
  {
    id: "1848-emancipation",
    year: 1848,
    title: "Emancipation in the Danish West Indies",
    description:
      "Thousands demanded freedom on St. Croix, and Governor Peter von Scholten declared all unfree people in the Danish West Indies free.",
    island: "all",
    location: "Fort Frederik / Danish West Indies",
    coordinates: [17.7115, -64.8815],
    era: "emancipation",
    tags: ["emancipation", "buddhoe", "fort-frederik"],
  },
  {
    id: "1849-labor-regulations",
    year: 1849,
    title: "Labor Regulations",
    description:
      "Post-emancipation labor rules restricted freed people’s mobility and labor rights, keeping plantation workers under coercive conditions.",
    island: "all",
    location: "Danish West Indies",
    era: "emancipation",
    tags: ["labor", "post-emancipation", "plantation"],
  },
  {
    id: "1867-hurricane-tsunami",
    year: 1867,
    title: "Hurricane and tsunami",
    description:
      "A powerful hurricane and tsunami devastated the islands, damaging ports, plantations, and infrastructure.",
    island: "all",
    location: "Virgin Islands",
    era: "emancipation",
    tags: ["hurricane", "tsunami", "disaster"],
  },
  {
    id: "1867-us-purchase-attempt",
    year: 1867,
    title: "U.S. purchase attempt",
    description:
      "The United States pursued purchase negotiations for the Danish West Indies, beginning a long path toward the eventual 1917 transfer.",
    island: "all",
    location: "Danish West Indies",
    era: "transfer",
    tags: ["purchase", "united-states", "denmark"],
  },
  {
    id: "1878-fireburn",
    year: 1878,
    title: "Fireburn labor uprising",
    description:
      "Workers on St. Croix rose against oppressive labor conditions. Queen Mary, Queen Agnes, and Queen Mathilda became central figures in the Fireburn memory.",
    island: "st_croix",
    location: "Frederiksted / St. Croix",
    coordinates: [17.7115, -64.8815],
    era: "emancipation",
    tags: ["fireburn", "queen-mary", "labor", "st-croix"],
  },
  {
    id: "1902-failed-purchase-treaty",
    year: 1902,
    title: "Failed purchase treaty",
    description:
      "A U.S.-Danish purchase treaty was signed but failed to secure final Danish approval.",
    island: "all",
    location: "Danish West Indies",
    era: "transfer",
    tags: ["purchase", "treaty", "failed"],
  },
  {
    id: "1912-first-carnival",
    year: 1912,
    title: "First St. Thomas Carnival",
    description:
      "St. Thomas celebrated an early Carnival with parades and public festivity, laying cultural groundwork for later Carnival tradition.",
    island: "st_thomas",
    location: "Charlotte Amalie",
    coordinates: [18.3419, -64.9307],
    era: "transfer",
    tags: ["carnival", "st-thomas", "culture"],
  },
  {
    id: "1915-hamilton-jackson",
    year: 1915,
    title: "D. Hamilton Jackson and The Herald",
    description:
      "Labor leader, journalist, and attorney D. Hamilton Jackson published The Herald and became a major voice for workers and civil rights.",
    island: "st_croix",
    location: "St. Croix",
    coordinates: [17.7466, -64.7032],
    era: "transfer",
    tags: ["hamilton-jackson", "labor", "press"],
  },
  {
    id: "1916-labor-strikes",
    year: 1916,
    title: "Labor strikes",
    description:
      "Large strikes on St. Croix and St. Thomas pushed for higher wages and better conditions during the final Danish period.",
    island: "all",
    location: "Danish West Indies",
    era: "transfer",
    tags: ["labor", "strikes", "workers"],
  },
  {
    id: "1916-hurricane",
    year: 1916,
    title: "Major hurricane",
    description:
      "A severe hurricane damaged the islands shortly before the transfer to the United States.",
    island: "all",
    location: "Virgin Islands",
    era: "transfer",
    tags: ["hurricane", "disaster", "1916"],
  },
  {
    id: "1917-transfer-day",
    year: 1917,
    title: "Transfer Day",
    description:
      "The Danish West Indies were transferred to the United States and became the Virgin Islands of the United States.",
    island: "all",
    location: "Virgin Islands",
    era: "transfer",
    tags: ["transfer-day", "united-states", "denmark"],
  },
  {
    id: "1927-us-citizenship",
    year: 1927,
    title: "U.S. citizenship",
    description:
      "Virgin Islanders were granted U.S. citizenship, changing the territory’s legal and political relationship with the United States.",
    island: "all",
    location: "U.S. Virgin Islands",
    era: "modern",
    tags: ["citizenship", "united-states", "political-status"],
  },
  {
    id: "1931-civil-government",
    year: 1931,
    title: "Civil government",
    description:
      "Administration shifted away from naval rule toward civilian government.",
    island: "all",
    location: "U.S. Virgin Islands",
    era: "modern",
    tags: ["civil-government", "naval-rule"],
  },
  {
    id: "1936-organic-act",
    year: 1936,
    title: "Organic Act",
    description:
      "The Organic Act created a more formal civil governmental structure for the U.S. Virgin Islands.",
    island: "all",
    location: "U.S. Virgin Islands",
    era: "modern",
    tags: ["organic-act", "government"],
  },
  {
    id: "1954-revised-organic-act",
    year: 1954,
    title: "Revised Organic Act",
    description:
      "The Revised Organic Act became the territory’s central governing framework.",
    island: "all",
    location: "U.S. Virgin Islands",
    era: "modern",
    tags: ["revised-organic-act", "government"],
  },
  {
    id: "1968-elective-governor-act",
    year: 1968,
    title: "Elective Governor Act",
    description:
      "Federal law allowed Virgin Islanders to elect their own governor.",
    island: "all",
    location: "U.S. Virgin Islands",
    era: "modern",
    tags: ["governor", "democracy", "political-status"],
  },
  {
    id: "1970-first-elected-governor",
    year: 1970,
    title: "First elected governor",
    description:
      "Virgin Islanders elected their governor for the first time, marking a major political milestone.",
    island: "all",
    location: "U.S. Virgin Islands",
    era: "modern",
    tags: ["election", "governor", "self-government"],
  },
  {
    id: "1984-territorial-status-expansion",
    year: 1984,
    title: "Territorial status expansion",
    description:
      "The territory continued to develop its political institutions and status discussions in the late twentieth century.",
    island: "all",
    location: "U.S. Virgin Islands",
    era: "modern",
    tags: ["political-status", "territory"],
  },
  {
    id: "1989-hurricane-hugo",
    year: 1989,
    title: "Hurricane Hugo",
    description:
      "Hurricane Hugo caused widespread destruction, especially on St. Croix, reshaping disaster recovery and infrastructure planning.",
    island: "all",
    location: "U.S. Virgin Islands",
    era: "modern",
    tags: ["hurricane-hugo", "disaster", "recovery"],
  },
  {
    id: "1995-hurricane-marilyn",
    year: 1995,
    title: "Hurricane Marilyn",
    description:
      "Hurricane Marilyn heavily damaged St. Thomas and St. John, leaving a major mark on modern recovery history.",
    island: "all",
    location: "U.S. Virgin Islands",
    era: "modern",
    tags: ["hurricane-marilyn", "disaster", "recovery"],
  },
  {
    id: "2012-centennial-carnival",
    year: 2012,
    title: "Centennial Carnival",
    description:
      "St. Thomas marked 100 years since the 1912 Carnival celebration with centennial cultural memory.",
    island: "st_thomas",
    location: "Charlotte Amalie",
    coordinates: [18.3419, -64.9307],
    era: "modern",
    tags: ["carnival", "centennial", "culture"],
  },
  {
    id: "2017-transfer-centennial",
    year: 2017,
    title: "Transfer Day Centennial",
    description:
      "The territory marked 100 years since the transfer from Denmark to the United States.",
    island: "all",
    location: "U.S. Virgin Islands",
    era: "modern",
    tags: ["transfer-day", "centennial", "history"],
  },
  {
    id: "2017-irma-maria",
    year: 2017,
    title: "Hurricanes Irma and Maria",
    description:
      "Two major hurricanes reshaped modern recovery, infrastructure, and resilience planning across the territory.",
    island: "all",
    location: "U.S. Virgin Islands",
    era: "modern",
    tags: ["irma", "maria", "hurricane", "recovery"],
  },
];

function iconForEvent(event: TimelineEvent) {
  if (event.tags.includes("hurricane") || event.tags.includes("tsunami")) {
    return Waves;
  }

  if (event.tags.includes("fort") || event.tags.includes("fort-christian")) {
    return Shield;
  }

  if (event.tags.includes("fireburn") || event.tags.includes("emancipation")) {
    return Flame;
  }

  if (event.tags.includes("free-port") || event.tags.includes("harbor")) {
    return Anchor;
  }

  if (event.tags.includes("transfer-day") || event.tags.includes("government")) {
    return Landmark;
  }

  if (event.era === "erik-smit") return Ship;
  if (event.era === "danish-expansion") return Crown;

  return Clock3;
}

function eraLabel(era: TimelineEra) {
  if (era === "pre-danish") return "Pre-Danish";
  if (era === "erik-smit") return "Erik Smit";
  if (era === "danish-expansion") return "Danish Expansion";
  if (era === "emancipation") return "Emancipation Era";
  if (era === "transfer") return "Transfer Era";
  return "Modern Era";
}

export default function TimelinePage({
  selectedIsland = "st_thomas",
}: Props) {
  const navigate = useNavigate();
  const [era, setEra] = useState<TimelineEra | "all">("all");

  const events = useMemo(() => {
    return TIMELINE_EVENTS.filter((event) => {
      const islandMatch =
        event.island === "all" || event.island === selectedIsland;
      const eraMatch = era === "all" || event.era === era;

      return islandMatch && eraMatch;
    }).sort((a, b) => a.year - b.year);
  }, [selectedIsland, era]);

  function openOnMap(event: TimelineEvent) {
    const params = new URLSearchParams();

    params.set("layer", "timeline");
    params.set("event", event.id);
    params.set("island", selectedIsland);

    if (event.coordinates) {
      params.set("lat", String(event.coordinates[0]));
      params.set("lng", String(event.coordinates[1]));
    }

    navigate(`/map?${params.toString()}`);
  }

  return (
    <main className="min-h-screen bg-stone-50 px-5 py-6 pb-32 text-stone-950">
      <section className="rounded-[2rem] bg-stone-950 p-6 text-white shadow-2xl">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-300">
          Virgin Islands Historical Atlas
        </p>

        <h1 className="mt-3 text-4xl font-black leading-tight">
          Timeline of the Virgin Islands
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-stone-300">
          Explore Indigenous history, Danish colonization, resistance,
          emancipation, Transfer Day, storms, political milestones, and modern
          recovery.
        </p>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <StatCard value={events.length} label="Events" />
          <StatCard value="1493" label="Contact" />
          <StatCard value="1917" label="Transfer" />
        </div>
      </section>

      <section className="mt-5 flex gap-2 overflow-x-auto pb-2">
        {ERAS.map((item) => (
          <button
            key={item.id}
            onClick={() => setEra(item.id)}
            className={`shrink-0 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-[0.18em] shadow ${
              era === item.id
                ? "bg-stone-950 text-white"
                : "bg-white text-stone-600"
            }`}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </section>

      <section className="mt-6 space-y-4">
        {events.map((event) => {
          const Icon = iconForEvent(event);

          return (
            <article
              key={event.id}
              className="rounded-[2rem] bg-white p-5 shadow-xl"
            >
              <div className="flex gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-amber-500 text-white shadow-lg">
                  <Icon className="h-7 w-7" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">
                    {event.yearLabel ?? event.year} • {eraLabel(event.era)}
                  </p>

                  <h2 className="mt-1 text-2xl font-black leading-tight">
                    {event.title}
                  </h2>

                  <p className="mt-2 text-sm leading-relaxed text-stone-600">
                    {event.description}
                  </p>

                  <div className="mt-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-stone-500">
                    <MapPinned className="h-4 w-4 text-emerald-700" />
                    {event.location}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {event.tags.slice(0, 5).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-stone-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500"
                      >
                        {tag.replaceAll("-", " ")}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => openOnMap(event)}
                    className="mt-5 rounded-2xl bg-stone-950 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white"
                    type="button"
                  >
                    View on Map
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3">
      <p className="text-2xl font-black">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-300">
        {label}
      </p>
    </div>
  );
}