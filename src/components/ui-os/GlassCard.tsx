import type React from "react";
import { cn } from "../../lib/utils";

export function GlassCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[2rem] border border-white/10 bg-white/[0.05] shadow-2xl backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </section>
  );
}