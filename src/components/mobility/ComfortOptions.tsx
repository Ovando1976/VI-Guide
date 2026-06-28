import type { ReactNode } from "react";
import { Accessibility, Baby, Briefcase, Clock, Users } from "lucide-react";
import type { ServiceClass } from "../../types";
import { cn } from "../../lib/utils";

export type ComfortState = {
  passengers: number;
  luggage: number;
  serviceClass: ServiceClass;
  childSeat: boolean;
  accessibleRide: boolean;
  elderlyGuest: boolean;
  timeSensitive: boolean;
};

export default function ComfortOptions({
  value,
  onChange,
}: {
  value: ComfortState;
  onChange: (next: ComfortState) => void;
}) {
  const set = <K extends keyof ComfortState>(key: K, next: ComfortState[K]) =>
    onChange({ ...value, [key]: next });

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <CounterCard
          label="Passengers"
          icon={<Users size={18} />}
          value={value.passengers}
          min={1}
          max={12}
          onChange={(next) => set("passengers", next)}
        />

        <CounterCard
          label="Luggage"
          icon={<Briefcase size={18} />}
          value={value.luggage}
          min={0}
          max={10}
          onChange={(next) => set("luggage", next)}
        />
      </div>

      <div className="flex rounded-3xl border border-white/10 bg-white/10 p-2 shadow-2xl backdrop-blur-xl">
        <ServiceClassButton
          label="Shared Ride"
          active={value.serviceClass === "shared"}
          onClick={() => set("serviceClass", "shared")}
        />

        <ServiceClassButton
          label="Private SUV"
          active={value.serviceClass === "private"}
          onClick={() => set("serviceClass", "private")}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ToggleCard icon={<Baby size={18} />} label="Child Seat" active={value.childSeat} onClick={() => set("childSeat", !value.childSeat)} />
        <ToggleCard icon={<Accessibility size={18} />} label="Accessible Ride" active={value.accessibleRide} onClick={() => set("accessibleRide", !value.accessibleRide)} />
        <ToggleCard icon={<Users size={18} />} label="Elderly Guest" active={value.elderlyGuest} onClick={() => set("elderlyGuest", !value.elderlyGuest)} />
        <ToggleCard icon={<Clock size={18} />} label="Time Sensitive" active={value.timeSensitive} onClick={() => set("timeSensitive", !value.timeSensitive)} />
      </div>
    </section>
  );
}

function CounterCard({
  icon,
  label,
  value,
  min,
  max,
  onChange,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-turquoise/10 text-turquoise">
          {icon}
        </div>
        <span className="text-sm font-bold text-white">{label}</span>
      </div>

      <div className="flex items-center gap-3">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-white">
          -
        </button>
        <span className="w-4 text-center text-sm font-bold text-white">{value}</span>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-white">
          +
        </button>
      </div>
    </div>
  );
}

function ServiceClassButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-2xl py-3 text-[10px] font-black uppercase tracking-[0.2em] transition",
        active ? "bg-turquoise text-ink shadow-lg" : "text-white/50 hover:text-white"
      )}
    >
      {label}
    </button>
  );
}

function ToggleCard({
  icon,
  label,
  active,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-2xl border p-4 text-left shadow-xl transition",
        active
          ? "border-turquoise bg-turquoise text-ink"
          : "border-white/10 bg-white/10 text-white hover:bg-white/20"
      )}
    >
      <span className={cn("grid h-10 w-10 place-items-center rounded-xl", active ? "bg-ink text-turquoise" : "bg-white/10 text-turquoise")}>
        {icon}
      </span>
      <span className="text-xs font-black uppercase tracking-[0.16em]">{label}</span>
    </button>
  );
}