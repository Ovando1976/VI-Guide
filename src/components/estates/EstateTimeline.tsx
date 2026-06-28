import type { TimelineEvent } from "../../lib/estates/estateNarrative";

type EstateTimelineProps = {
  events?: TimelineEvent[];
};

export function EstateTimeline({ events = [] }: EstateTimelineProps) {
  if (!Array.isArray(events) || events.length === 0) return null;

  return (
    <section className="rounded-[2rem] bg-white p-6 shadow-xl shadow-black/10">
      <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-700">
        Timeline
      </p>

      <h2 className="mt-2 font-serif text-2xl text-zinc-950">
        How this estate fits history
      </h2>

      <div className="mt-6 space-y-5">
        {events.map((event, index) => (
          <article key={`${event.year}-${event.title}-${index}`} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-100 text-sm font-black text-emerald-800">
                {index + 1}
              </div>

              {index < events.length - 1 && (
                <div className="mt-2 h-full min-h-10 w-px bg-emerald-100" />
              )}
            </div>

            <div className="pb-3">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">
                {event.year}
              </p>

              <h3 className="mt-1 text-base font-bold text-zinc-950">
                {event.title}
              </h3>

              {event.description ? (
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  {event.description}
                </p>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}