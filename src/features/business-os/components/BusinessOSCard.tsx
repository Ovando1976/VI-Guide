import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function BusinessOSCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[2rem] border border-white/10 bg-white/[0.055] shadow-2xl ring-1 ring-white/5 backdrop-blur-xl ${className}`}
    >
      {children}
    </section>
  );
}

export function SectionHeader({
  title,
  text,
  icon: Icon,
}: {
  title: string;
  text?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 p-5">
      <div>
        <h2 className="text-2xl font-black">{title}</h2>
        {text ? <p className="mt-1 text-sm text-white/60">{text}</p> : null}
      </div>

      {Icon ? <Icon className="h-7 w-7 text-cyan-300" /> : null}
    </div>
  );
}