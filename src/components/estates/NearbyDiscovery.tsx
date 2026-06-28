type NearbyItem = {
  id: string;
  name: string;
  type: "estate" | "beach" | "historic" | "place";
  description?: string;
};

type NearbyDiscoveryProps = {
  items?: NearbyItem[];
};

const fallbackItems: NearbyItem[] = [
  {
    id: "nearby-estates",
    name: "Nearby estates",
    type: "estate",
    description: "Explore neighboring estate records and quarter geography.",
  },
  {
    id: "nearby-beaches",
    name: "Nearby beaches",
    type: "beach",
    description: "Connect estate geography with visitor destinations.",
  },
  {
    id: "historic-sites",
    name: "Historic sites",
    type: "historic",
    description: "Find cultural landmarks, archive references, and heritage sites.",
  },
];

export function NearbyDiscovery({ items }: NearbyDiscoveryProps) {
  const safeItems = Array.isArray(items) && items.length > 0 ? items : fallbackItems;

  return (
    <section className="rounded-[2rem] bg-white p-6 shadow-xl shadow-black/10">
      <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-700">
        Nearby
      </p>

      <h2 className="mt-2 font-serif text-2xl text-zinc-950">
        What surrounds this estate
      </h2>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {safeItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className="rounded-2xl bg-zinc-50 p-4 text-left transition hover:bg-emerald-50"
          >
            <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">
              {item.type}
            </p>

            <h3 className="mt-2 font-bold text-zinc-950">{item.name}</h3>

            {item.description ? (
              <p className="mt-2 text-sm leading-5 text-zinc-600">
                {item.description}
              </p>
            ) : null}
          </button>
        ))}
      </div>
    </section>
  );
}