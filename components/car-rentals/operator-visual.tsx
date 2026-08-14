import Image from "next/image";
import type { CarRentalIsland } from "@/lib/car-rentals";

const OPERATOR_VISUALS: Record<CarRentalIsland, { src: string; alt: string; position: string }> = {
  stt: {
    src: "/images/usvi-harbor-hero.jpg",
    alt: "St. Thomas harbor and hillside roads",
    position: "object-center",
  },
  stj: {
    src: "/images/places/st-john/trunk-bay-overlook-1.jpg",
    alt: "St. John island roads and coastline",
    position: "object-center",
  },
  stx: {
    src: "/images/places/st-croix/cane-bay-beach-1.jpg",
    alt: "St. Croix coastline and island landscape",
    position: "object-center",
  },
};

export function OperatorVisual({ island, name, location }: { island: CarRentalIsland; name: string; location: string }) {
  const visual = OPERATOR_VISUALS[island];

  return (
    <div className="relative -mx-6 -mt-6 mb-6 h-44 overflow-hidden rounded-t-[27px] bg-[#032f2d] sm:h-52">
      <Image
        src={visual.src}
        alt={visual.alt}
        fill
        sizes="(min-width: 1024px) 50vw, 100vw"
        className={`object-cover ${visual.position} transition duration-500 group-hover:scale-[1.025]`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#032f2d]/90 via-[#032f2d]/10 to-transparent" />
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
