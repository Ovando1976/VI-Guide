import Link from "next/link";

export default function CommunityPostPage({
  params,
}: {
  params: { postId: string };
}) {
  return (
    <main className="min-h-screen bg-[#f8f4ea] px-6 py-16 text-[#043331]">
      <section className="mx-auto max-w-3xl rounded-[36px] border border-slate-200 bg-white p-10 shadow-sm">
        <div className="text-[11px] font-black uppercase tracking-[0.28em] text-amber-500">
          Community post
        </div>
        <h1 className="mt-3 text-3xl font-black italic tracking-tight">
          Post {params.postId}
        </h1>
        <p className="mt-4 text-slate-600">
          This community post is not available yet.
        </p>
        <Link
          href="/community"
          className="mt-6 inline-flex rounded-full bg-[#043331] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white"
        >
          Back to community
        </Link>
      </section>
    </main>
  );
}
