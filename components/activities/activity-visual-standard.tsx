import { Camera, CheckCircle2, ImageIcon, ShieldCheck } from "lucide-react";

const STANDARDS = [
  {
    icon: Camera,
    title: "Operator-specific first",
    text: "Use an operator or experience image only when its source and usage context are known.",
  },
  {
    icon: ImageIcon,
    title: "Representative when needed",
    text: "Island scenery may illustrate an activity card while dedicated operator photography is still being verified.",
  },
  {
    icon: CheckCircle2,
    title: "No invented proof",
    text: "A beautiful image never substitutes for verified availability, pricing, departure details, or operator confirmation.",
  },
];

export function ActivityVisualStandard() {
  return (
    <section className="rounded-[30px] border border-[#d9e6e2] bg-white p-5 shadow-[0_14px_40px_rgba(4,51,49,.06)] sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-3xl">
          <div className="vi-eyebrow inline-flex items-center gap-2 text-[#0f766e]">
            <ShieldCheck className="h-4 w-4" /> Visual trust standard
          </div>
          <h2 className="vi-display mt-2 text-2xl font-bold tracking-[-.03em] text-[#032f2d] sm:text-3xl">
            Real island context now. Verified experience photography as we source it.
          </h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#607370]">
            USVI Explorer distinguishes visual inspiration from booking evidence. Until a dedicated activity image is verified, cards can use representative island photography while the operator, source, review date, and booking details remain explicit.
          </p>
        </div>
        <span className="rounded-full bg-[#eaf8f5] px-4 py-2 text-[9px] font-black uppercase tracking-[.13em] text-[#0f766e]">
          Provenance before polish
        </span>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {STANDARDS.map(({ icon: Icon, title, text }) => (
          <article key={title} className="rounded-[22px] border border-[#e1ebe8] bg-[#fffdf8] p-4">
            <Icon className="h-5 w-5 text-[#0f766e]" />
            <h3 className="mt-3 text-sm font-black text-[#032f2d]">{title}</h3>
            <p className="mt-1.5 text-xs font-semibold leading-5 text-[#607370]">{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
