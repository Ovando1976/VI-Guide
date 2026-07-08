import { useState } from "react";
import { CalendarDays, Car, Coffee, Send, Sparkles, Waves } from "lucide-react";

type QuickMode = "coffee" | "beach" | "dinner" | "event" | "ride";

type VIConnectMessageComposerProps = {
  disabled?: boolean;
  onSend: (text: string) => void;
  onQuickSend: (mode: QuickMode) => void;
};

const quickActions: Array<{
  mode: QuickMode;
  label: string;
  icon: typeof Coffee;
}> = [
  { mode: "coffee", label: "Coffee", icon: Coffee },
  { mode: "beach", label: "Beach", icon: Waves },
  { mode: "dinner", label: "Dinner", icon: CalendarDays },
  { mode: "event", label: "Event", icon: Sparkles },
  { mode: "ride", label: "Ride plan", icon: Car },
];

function VIConnectMessageComposer({
  disabled,
  onSend,
  onQuickSend,
}: VIConnectMessageComposerProps) {
  const [text, setText] = useState("");

  function submit() {
    const clean = text.trim();
    if (!clean || disabled) return;
    onSend(clean);
    setText("");
  }

  return (
    <div className="border-t border-white/10 bg-slate-950/95 p-4">
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {quickActions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.mode}
              type="button"
              disabled={disabled}
              onClick={() => onQuickSend(action.mode)}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-cyan-300/50 hover:bg-cyan-300/10 disabled:opacity-50"
            >
              <Icon className="h-3.5 w-3.5" />
              {action.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-end gap-3">
        <textarea
          value={text}
          disabled={disabled}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          rows={2}
          maxLength={1200}
          placeholder="Send a respectful message or suggest a public date plan..."
          className="min-h-[52px] flex-1 resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/60"
        />

        <button
          type="button"
          disabled={!text.trim() || disabled}
          onClick={submit}
          className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-950/40 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Send message"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export default VIConnectMessageComposer;
