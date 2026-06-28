import type { ReactNode } from "react";

type Props = {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
};

export default function BusinessSection({
  id,
  title,
  description,
  children,
  actions,
}: Props) {
  return (
    <section
      id={id}
      className="scroll-mt-24 space-y-5 rounded-[2rem] border border-white/10 bg-white/[0.02] p-6"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-black text-white">
            {title}
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/60">
            {description}
          </p>
        </div>

        {actions}
      </div>

      {children}
    </section>
  );
}