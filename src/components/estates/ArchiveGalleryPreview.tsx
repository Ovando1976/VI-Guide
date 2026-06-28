type ArchiveGalleryPreviewProps = {
  estateName: string;
};

const archiveTypes = [
  "Historic maps",
  "Census records",
  "Plantation documents",
  "Church records",
  "Photographs",
  "Land records",
];

export function ArchiveGalleryPreview({ estateName }: ArchiveGalleryPreviewProps) {
  const name = estateName || "this estate";

  return (
    <section className="rounded-[2rem] bg-white p-6 shadow-xl shadow-black/10">
      <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-700">
        Archive gallery
      </p>

      <h2 className="mt-2 font-serif text-2xl text-zinc-950">
        Records connected to {name}
      </h2>

      <p className="mt-2 text-sm leading-6 text-zinc-600">
        This section will connect estate geography to Danish West Indies records,
        historical maps, census material, photographs, and local memory.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {archiveTypes.map((type) => (
          <div key={type} className="rounded-2xl bg-amber-50 p-4">
            <p className="text-sm font-bold text-zinc-950">{type}</p>
            <p className="mt-1 text-xs text-zinc-600">Coming soon</p>
          </div>
        ))}
      </div>
    </section>
  );
}