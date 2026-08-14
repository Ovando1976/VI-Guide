import type { CarRentalIsland } from "@/lib/car-rentals";

type VehicleVisual = {
  src: string;
  alt: string;
  sourceUrl: string;
  credit: string;
  license: string;
};

const VEHICLE_VISUALS = {
  jeep: {
    src: "https://upload.wikimedia.org/wikipedia/commons/7/7f/Dark_Blue_Jeep_Wrangler_Rubicon_JL_Turning_Onto_N_Jones_Blvd.jpg",
    alt: "Jeep Wrangler on the road, representative of a Jeep rental class",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Dark_Blue_Jeep_Wrangler_Rubicon_JL_Turning_Onto_N_Jones_Blvd.jpg",
    credit: "Noah Wulf / Wikimedia Commons",
    license: "CC BY-SA 4.0",
  },
  suv: {
    src: "https://upload.wikimedia.org/wikipedia/commons/3/35/SUV_car.jpg",
    alt: "SUV driving on an unpaved road, representative of an SUV rental class",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:SUV_car.jpg",
    credit: "Wiaskara / Wikimedia Commons",
    license: "CC BY-SA 4.0",
  },
  van: {
    src: "https://upload.wikimedia.org/wikipedia/commons/0/0b/Nissan_NV3500_Full-Size_Passenger_Van_%286866545153%29.jpg",
    alt: "Passenger van, representative of a larger rental vehicle class",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Nissan_NV3500_Full-Size_Passenger_Van_(6866545153).jpg",
    credit: "artistmac / Wikimedia Commons",
    license: "CC BY-SA 2.0",
  },
} satisfies Record<"jeep" | "suv" | "van", VehicleVisual>;

const OPERATOR_VISUAL_KIND: Record<string, keyof typeof VEHICLE_VISUALS> = {
  "enterprise-stt-airport": "suv",
  "national-stt-airport": "van",
  "360-car-rental-stt": "jeep",
  "budget-stt-airport": "suv",
  "courtesy-stj": "jeep",
  "national-stj-cruz-bay": "suv",
  "st-john-car-rental": "jeep",
  "centerline-stx": "suv",
  "hertz-stx-airport": "van",
  "avis-stx-airport": "suv",
};

function fallbackKind(island: CarRentalIsland): keyof typeof VEHICLE_VISUALS {
  if (island === "stj") return "jeep";
  if (island === "stx") return "suv";
  return "van";
}

export function OperatorVisual({
  operatorId,
  island,
  name,
  location,
}: {
  operatorId: string;
  island: CarRentalIsland;
  name: string;
  location: string;
}) {
  const kind = OPERATOR_VISUAL_KIND[operatorId] ?? fallbackKind(island);
  const visual = VEHICLE_VISUALS[kind];

  return (
    <div className="relative -mx-6 -mt-6 mb-6 h-44 overflow-hidden rounded-t-[27px] bg-[#032f2d] sm:h-52">
      {/* These are representative vehicle-class photographs, not claims about
          a specific operator's current fleet. We intentionally use a native
          img here so the cards do not depend on Next.js remote-image host
          configuration for Creative Commons media. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={visual.src}
        alt={visual.alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#032f2d]/95 via-[#032f2d]/10 to-transparent" />
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 text-white">
        <span className="rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-[7px] font-black uppercase tracking-[.12em] backdrop-blur-md">
          Representative {kind} photo
        </span>
        <a
          href={visual.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="max-w-[58%] rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-right text-[7px] font-bold text-white/80 backdrop-blur-md hover:text-white"
          aria-label={`Photo credit: ${visual.credit}, ${visual.license}`}
        >
          {visual.license} · photo credit
        </a>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 text-white">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[.14em] text-[#f5d06f]">Pickup area</p>
          <p className="mt-1 text-sm font-black">{location}</p>
        </div>
        <span className="rounded-full border border-white/20 bg-black/20 px-3 py-1.5 text-[8px] font-black uppercase tracking-[.12em] backdrop-blur-md">
          {name}
        </span>
      </div>
    </div>
  );
}
