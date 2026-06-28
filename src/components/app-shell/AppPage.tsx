import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

type AppPageProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function AppPage({ children, className, contentClassName }: AppPageProps) {
  return (
    <main
      className={cn(
        "min-h-screen bg-[#061016] pb-40 text-white",
        className
      )}
    >
      <div className={cn("mx-auto max-w-6xl px-5 py-6 sm:px-8", contentClassName)}>
        {children}
      </div>
    </main>
  );
}

export function GlassCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 text-white shadow-2xl backdrop-blur",
        className
      )}
    >
      {children}
    </section>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 p-6 shadow-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.32),transparent_32%),linear-gradient(135deg,#020617,#064e3b_130%)]" />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {eyebrow ? (
            <p className="text-sm font-black uppercase tracking-[0.3em] text-emerald-300">
              {eyebrow}
            </p>
          ) : null}

          <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-6xl">
            {title}
          </h1>

          {description ? (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70">
              {description}
            </p>
          ) : null}
        </div>

        {action}
      </div>
    </section>
  );
}