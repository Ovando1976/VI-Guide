import type { IslandCode } from "../../types";

export default function GalleryPage({
  selectedIsland = "st_thomas",
}: {
  selectedIsland?: IslandCode;
}) {
  return (
    <main className="min-h-screen bg-stone-50 px-5 py-6 pb-32">
      <section className="rounded-[2rem] bg-sky-950 p-6 text-white shadow-2xl">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-300">
          Historic Gallery
        </p>
        <h1 className="mt-3 text-4xl font-black">Visual Archive</h1>
        <p className="mt-3 text-sm text-sky-50">
          Gallery for {selectedIsland.replaceAll("_", " ")}.
        </p>
      </section>
    </main>
  );
}
