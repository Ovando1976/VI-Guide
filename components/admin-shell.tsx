import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin-nav";

export function AdminShell({
  eyebrow = "Admin OS",
  title,
  description,
  children,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <main className="admin-page min-h-screen px-4 py-6 text-[#043331] sm:px-6 lg:py-8">
      <div className="mx-auto max-w-[1440px] space-y-5">
        <section className="rounded-[28px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_16px_40px_rgba(4,51,49,.07)] sm:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <div className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-500">
                {eyebrow}
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-[-.035em] text-[#043331] sm:text-4xl">
                  {title}
                </h1>
                {description ? (
                  <p className="mt-3 max-w-3xl text-sm font-semibold text-slate-500">
                    {description}
                  </p>
                ) : null}
              </div>
              <AdminNav />
            </div>

            {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
          </div>
        </section>

        <div className="admin-page__content">{children}</div>
      </div>
    </main>
  );
}
