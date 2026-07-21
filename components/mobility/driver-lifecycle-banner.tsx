import {
  CheckCircle2,
  CircleDot,
  MapPin,
  Navigation,
  ShieldCheck,
} from "lucide-react";

const STEPS = [
  { label: "Matched", icon: CircleDot },
  { label: "En route", icon: Navigation },
  { label: "Arrived", icon: MapPin },
  { label: "In trip", icon: ShieldCheck },
  { label: "Completed", icon: CheckCircle2 },
] as const;

export function DriverLifecycleBanner() {
  return (
    <section className="mb-5 rounded-[28px] border border-teal-900/10 bg-[linear-gradient(135deg,#043331,#0f766e)] p-5 text-white shadow-[0_22px_60px_rgba(4,51,49,.18)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[.2em] text-[#f5c451]">
            Server-verified operations
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-[-.04em] sm:text-3xl">
            Run each ride one step at a time
          </h1>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/68">
            VI Guide only exposes the correct next trip action. Payment, assignment,
            driver identity, and lifecycle order are verified before every update.
          </p>
        </div>
        <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[9px] font-black uppercase tracking-[.16em] text-white/80">
          No skipped stages
        </span>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-5">
        {STEPS.map(({ label, icon: Icon }, index) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.06] px-3 py-3"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/10 text-[#7ce0d4]">
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <div className="text-[8px] font-black uppercase tracking-[.14em] text-white/35">
                Step {index + 1}
              </div>
              <div className="text-xs font-black">{label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
