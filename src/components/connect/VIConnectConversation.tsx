import { useMemo } from "react";
import { CalendarDays, Car, MapPin, ShieldCheck, UserRound } from "lucide-react";

import type { VIConnectProfile } from "../../types/viConnect";
import type {
  VIConnectConversation as VIConnectConversationType,
  VIConnectMessage,
} from "../../types/viConnectMessages";
import VIConnectMessageComposer from "./VIConnectMessageComposer";

type QuickMode = "coffee" | "beach" | "dinner" | "event" | "ride";

type VIConnectConversationProps = {
  conversation: VIConnectConversationType;
  profile: VIConnectProfile;
  messages: VIConnectMessage[];
  onSend: (text: string) => void;
  onQuickSend: (mode: QuickMode) => void;
  onShareDatePlan: () => void;
  onOpenMap: () => void;
  onOpenMobility: () => void;
};

function formatTime(value: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function VIConnectConversation({
  conversation,
  profile,
  messages,
  onSend,
  onQuickSend,
  onShareDatePlan,
  onOpenMap,
  onOpenMobility,
}: VIConnectConversationProps) {
  const compatibilityTags = useMemo(
    () => profile.vibeTags.slice(0, 4),
    [profile.vibeTags]
  );

  return (
    <section className="flex min-h-[calc(100vh-140px)] flex-1 flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/90 shadow-2xl shadow-slate-950/40">
      <header className="border-b border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <div className="flex items-center gap-4">
          <img
            src={profile.imageUrl}
            alt=""
            className="h-16 w-16 rounded-2xl object-cover ring-2 ring-cyan-300/40"
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-black text-white">
                {profile.displayName}
              </h2>
              <span className="rounded-full bg-emerald-300/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-200">
                Matched
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-400">
              {profile.neighborhood} · {profile.age} · {conversation.status}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {compatibilityTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={onShareDatePlan}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-sm font-bold text-cyan-100 transition hover:bg-cyan-300/20"
          >
            <CalendarDays className="h-4 w-4" />
            Send Date Plan
          </button>

          <button
            type="button"
            onClick={onOpenMap}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-white transition hover:bg-white/10"
          >
            <MapPin className="h-4 w-4" />
            Open Map
          </button>

          <button
            type="button"
            onClick={onOpenMobility}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-white transition hover:bg-white/10"
          >
            <Car className="h-4 w-4" />
            Plan Ride
          </button>
        </div>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_35%),linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,0.98))] p-4 sm:p-6">
        <div className="mx-auto mb-6 max-w-xl rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm text-emerald-50">
          <div className="mb-1 flex items-center gap-2 font-black">
            <ShieldCheck className="h-4 w-4" />
            Safety-first messaging
          </div>
          Keep early conversations inside VI Connect. Meet in public, share date plans through the app, and use block/report if anything feels off.
        </div>

        {messages.map((message) => {
          const isMine = message.senderLabel === "me";
          const isSystem = message.senderLabel === "system";

          if (isSystem) {
            return (
              <div
                key={message.id}
                className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-xs font-semibold text-slate-300"
              >
                {message.text}
              </div>
            );
          }

          return (
            <div
              key={message.id}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[78%] rounded-[1.4rem] px-4 py-3 text-sm shadow-lg ${
                  isMine
                    ? "bg-cyan-300 text-slate-950 shadow-cyan-950/30"
                    : "border border-white/10 bg-white/10 text-white shadow-slate-950/30"
                }`}
              >
                <div className="mb-1 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] opacity-70">
                  {isMine ? "You" : profile.displayName}
                </div>

                <p className="whitespace-pre-wrap leading-6">{message.text}</p>

                <div className="mt-2 text-[11px] opacity-60">
                  {formatTime(message.createdAt)}
                </div>

                {message.kind === "date_plan" || message.kind === "ride_plan" ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.metadata?.mapPath ? (
                      <button
                        type="button"
                        onClick={onOpenMap}
                        className="rounded-full bg-black/10 px-3 py-1 text-[11px] font-black"
                      >
                        Open map
                      </button>
                    ) : null}

                    {message.metadata?.ridePath ? (
                      <button
                        type="button"
                        onClick={onOpenMobility}
                        className="rounded-full bg-black/10 px-3 py-1 text-[11px] font-black"
                      >
                        Plan ride
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}

        {!messages.length ? (
          <div className="mx-auto max-w-md rounded-3xl border border-dashed border-white/15 bg-white/5 p-8 text-center">
            <UserRound className="mx-auto mb-3 h-8 w-8 text-slate-400" />
            <h3 className="text-lg font-black text-white">Start the conversation</h3>
            <p className="mt-2 text-sm text-slate-400">
              Use a guided opener or send a respectful first message.
            </p>
          </div>
        ) : null}
      </div>

      <VIConnectMessageComposer onSend={onSend} onQuickSend={onQuickSend} />
    </section>
  );
}

export default VIConnectConversation;
