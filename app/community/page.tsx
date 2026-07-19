import Link from "next/link";

export default function CommunityPage() {
  return (
    <main className="min-h-screen bg-[#f8f4ea] px-6 py-16 text-[#043331]">
      <section className="mx-auto max-w-4xl rounded-[36px] border border-slate-200 bg-white p-10 shadow-sm">
        <div className="text-[11px] font-black uppercase tracking-[0.28em] text-amber-500">
          Community
        </div>
        <h1 className="mt-3 text-4xl font-black italic tracking-tight">
          Virgin Islands community stories
        </h1>
        <p className="mt-4 max-w-2xl text-slate-600">
          Community publishing is being prepared. Explore the live territory map
          while local posts and conversations are curated.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-[#043331] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white"
        >
          Open territory map
        </Link>
      </section>
    </main>
  );
}
