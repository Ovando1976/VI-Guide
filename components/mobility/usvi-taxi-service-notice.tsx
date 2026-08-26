import { Bus, CarFront, ShieldCheck, UsersRound } from "lucide-react";

const SERVICE_POINTS = [
  {
    icon: Bus,
    title: "Shared-service capable",
    detail:
      "Standard, airport, ferry, safari, and shared taxi requests may be combined with compatible passengers and stops.",
  },
  {
    icon: UsersRound,
    title: "Party size matters",
    detail:
      "Your passenger count stays attached to the governed fare quote and the driver dispatch record.",
  },
  {
    icon: CarFront,
    title: "Exclusive is separate",
    detail:
      "A private or exclusive vehicle is not included in the standard quote. Dispatch must confirm a separately governed exclusive rule before we price or promise it.",
  },
  {
    icon: ShieldCheck,
    title: "Official fare only",
    detail:
      "Service preference never creates surge, mileage, or time-based substitute pricing. Unsupported charges stay blocked for dispatch review.",
  },
] as const;

export function UsviTaxiServiceNotice() {
  return (
    <section
      aria-labelledby="usvi-taxi-service-model"
      className="mx-auto mb-4 mt-3 max-w-6xl rounded-[28px] border border-[#0b5d5b]/10 bg-white/85 p-4 text-[#043331] shadow-[0_14px_40px_rgba(4,51,49,.07)] backdrop-blur sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[.2em] text-amber-600">
            USVI regulated taxi service
          </p>
          <h2
            id="usvi-taxi-service-model"
            className="mt-1 text-xl font-black tracking-[-.035em] sm:text-2xl"
          >
            Shared dispatch is the normal service expectation.
          </h2>
          <p className="mt-2 max-w-3xl text-xs font-semibold leading-5 text-slate-600 sm:text-sm">
            USVI Explorer separates the official taxi fare from the dispatch
            experience. Airport and ferry transfers do not automatically mean a
            private car, and a comfort or direct request is not an exclusive
            charter unless dispatch confirms the separately governed service.
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full bg-[#043331] px-3 py-2 text-[9px] font-black uppercase tracking-[.14em] text-[#f5c451]">
          No surge pricing
        </span>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
        {SERVICE_POINTS.map(({ icon: Icon, title, detail }) => (
          <div
            key={title}
            className="w-[82%] shrink-0 rounded-[20px] border border-slate-200 bg-[#f8f4ea] p-3 sm:w-auto"
          >
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white text-[#0b6b64] shadow-sm">
                <Icon className="h-4 w-4" />
              </span>
              <p className="text-[10px] font-black uppercase tracking-[.1em]">
                {title}
              </p>
            </div>
            <p className="mt-2 text-[11px] font-semibold leading-4 text-slate-600">
              {detail}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
