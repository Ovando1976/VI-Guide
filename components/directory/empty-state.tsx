type Props = {
    title: string;
    description: string;
  };
  
  export function EmptyState({ title, description }: Props) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="text-xl font-black italic tracking-tight text-[#043331]">
          {title}
        </div>
        <div className="mt-3 text-sm font-semibold text-slate-500">
          {description}
        </div>
      </div>
    );
  }