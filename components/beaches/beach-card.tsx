import Link from "next/link";
import type { BeachRecord } from "@/types/beach";

export function BeachCard({ beach }: { beach: BeachRecord }) {
  return (
    <Link
      href={`/beaches/${beach.slug}`}
      className="block overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div
        className="h-56 bg-cover bg-center"
        style={{ backgroundImage: `url('${beach.heroImage}')` }}
      />
      <div className="p-5">
        <div className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-500">
          {beach.island.toUpperCase()}
        </div>
        <h2 className="mt-2 text-2xl font-black italic tracking-tight text-[#043331]">
          {beach.name}
        </h2>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          {beach.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {beach.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-slate-200 bg-[#f8f4ea] px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#043331]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}