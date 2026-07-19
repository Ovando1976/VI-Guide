type Props = {
    label: string;
  };
  
  export function TagPill({ label }: Props) {
    return (
      <span className="rounded-full border border-slate-200 bg-[#f8f4ea] px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#043331]">
        {label}
      </span>
    );
  }