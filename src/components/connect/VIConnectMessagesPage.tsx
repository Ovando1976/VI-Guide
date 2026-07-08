import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Heart,
  MessageCircle,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { viConnectDateIdeas, viConnectProfiles } from "../../data/viConnect";
import type { VIConnectProfile } from "../../types/viConnect";
import type {
  VIConnectConversation as VIConnectConversationType,
  VIConnectMessage,
} from "../../types/viConnectMessages";
import {
  getOrCreateVIConnectConversation,
  getVIConnectConversations,
  getVIConnectMessages,
  sendVIConnectMessage,
  sendVIConnectQuickInvite,
  shareVIConnectDatePlanMessage,
} from "../../services/connect/viConnectMessageService";
import VIConnectConversation from "./VIConnectConversation";

function profileForConversation(conversation: VIConnectConversationType) {
  return (
    viConnectProfiles.find((profile) => profile.id === conversation.profileId) ||
    null
  );
}

function latestTime(conversation: VIConnectConversationType) {
  return conversation.lastMessageAt || conversation.updatedAt || conversation.createdAt;
}

function VIConnectMessagesPage() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState<VIConnectConversationType[]>(
    () => getVIConnectConversations()
  );
  const [activeConversationId, setActiveConversationId] = useState(
    params.conversationId || ""
  );
  const [messages, setMessages] = useState<VIConnectMessage[]>([]);

  const requestedProfileId = searchParams.get("profileId") || "";

  useEffect(() => {
    if (!requestedProfileId) return;

    const profile = viConnectProfiles.find((item) => item.id === requestedProfileId);
    if (!profile) return;

    const conversation = getOrCreateVIConnectConversation(profile);
    setActiveConversationId(conversation.id);
    navigate(`/connect/messages/${conversation.id}`, { replace: true });
  }, [navigate, requestedProfileId]);

  useEffect(() => {
    function refresh() {
      setConversations(getVIConnectConversations());
      if (activeConversationId) {
        setMessages(getVIConnectMessages(activeConversationId));
      }
    }

    refresh();

    window.addEventListener("vi-connect-messages-changed", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("vi-connect-messages-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [activeConversationId]);

  useEffect(() => {
    if (!activeConversationId) return;
    setMessages(getVIConnectMessages(activeConversationId));
  }, [activeConversationId]);

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return conversations;

    return conversations.filter((conversation) => {
      const profile = profileForConversation(conversation);
      const haystack = `${conversation.profileDisplayName} ${
        conversation.lastMessageText || ""
      } ${profile?.neighborhood || ""} ${profile?.vibeTags.join(" ") || ""}`.toLowerCase();

      return haystack.includes(q);
    });
  }, [conversations, search]);

  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId
  );
  const activeProfile = activeConversation
    ? profileForConversation(activeConversation)
    : null;

  function openConversation(conversation: VIConnectConversationType) {
    setActiveConversationId(conversation.id);
    navigate(`/connect/messages/${conversation.id}`);
  }

  function sendText(text: string) {
    if (!activeConversation) return;

    sendVIConnectMessage({
      conversationId: activeConversation.id,
      text,
    });

    setMessages(getVIConnectMessages(activeConversation.id));
    setConversations(getVIConnectConversations());
  }

  function sendQuick(mode: "coffee" | "beach" | "dinner" | "event" | "ride") {
    if (!activeConversation || !activeProfile) return;

    sendVIConnectQuickInvite({
      conversationId: activeConversation.id,
      profile: activeProfile,
      mode,
    });

    setMessages(getVIConnectMessages(activeConversation.id));
    setConversations(getVIConnectConversations());
  }

  function shareDatePlan() {
    if (!activeConversation || !activeProfile) return;

    const idea =
      viConnectDateIdeas.find((item) =>
        item.bestFor.some((tag) => activeProfile.vibeTags.includes(tag))
      ) || viConnectDateIdeas[0];

    shareVIConnectDatePlanMessage({
      conversationId: activeConversation.id,
      profile: activeProfile,
      dateIdeaTitle: idea?.title || "a public island date plan",
    });

    setMessages(getVIConnectMessages(activeConversation.id));
    setConversations(getVIConnectConversations());
  }

  function openMap() {
    if (!activeProfile) return;
    navigate(`/map?island=${activeProfile.island}`);
  }

  function openMobility() {
    if (!activeProfile) return;
    navigate(`/mobility?island=${activeProfile.island}`);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-5 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-slate-950/40 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              to="/connect"
              className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-cyan-200 hover:text-cyan-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to VI Connect
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
                <MessageCircle className="h-6 w-6" />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200">
                  VI Connect Messages
                </p>
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                  Match. Message. Plan safely.
                </h1>
              </div>
            </div>
          </div>

          <div className="max-w-xl rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm text-emerald-50">
            <div className="mb-1 flex items-center gap-2 font-black">
              <ShieldCheck className="h-4 w-4" />
              Safety layer included
            </div>
            Messaging is designed around public date plans, map context, and ride planning instead of rushing users off-app.
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-slate-950/40">
            <div className="mb-4 rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2">
              <label className="flex items-center gap-2 text-sm text-slate-400">
                <Search className="h-4 w-4" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search matches"
                  className="w-full bg-transparent text-white outline-none placeholder:text-slate-500"
                />
              </label>
            </div>

            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-300">
                Inbox
              </h2>
              <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-bold text-slate-300">
                {filteredConversations.length}
              </span>
            </div>

            <div className="space-y-2">
              {filteredConversations.map((conversation) => {
                const profile = profileForConversation(conversation);
                const isActive = conversation.id === activeConversationId;

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => openConversation(conversation)}
                    className={`w-full rounded-3xl border p-3 text-left transition ${
                      isActive
                        ? "border-cyan-300/60 bg-cyan-300/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {profile?.imageUrl || conversation.profileImageUrl ? (
                        <img
                          src={profile?.imageUrl || conversation.profileImageUrl}
                          alt=""
                          className="h-12 w-12 rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                          <UserRound className="h-5 w-5 text-slate-400" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate font-black text-white">
                            {conversation.profileDisplayName}
                          </p>
                          <span className="shrink-0 text-[10px] font-semibold text-slate-500">
                            {new Date(latestTime(conversation)).toLocaleDateString()}
                          </span>
                        </div>

                        <p className="mt-1 truncate text-xs text-slate-400">
                          {conversation.lastMessageText ||
                            "Start with a guided opener or date plan."}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}

              {!filteredConversations.length ? (
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-center">
                  <Heart className="mx-auto mb-3 h-8 w-8 text-slate-500" />
                  <h3 className="font-black text-white">No conversations yet</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Like a profile in VI Connect, then open messages from the match.
                  </p>
                  <Link
                    to="/connect"
                    className="mt-4 inline-flex rounded-full bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950"
                  >
                    Discover matches
                  </Link>
                </div>
              ) : null}
            </div>
          </aside>

          {activeConversation && activeProfile ? (
            <VIConnectConversation
              conversation={activeConversation}
              profile={activeProfile as VIConnectProfile}
              messages={messages}
              onSend={sendText}
              onQuickSend={sendQuick}
              onShareDatePlan={shareDatePlan}
              onOpenMap={openMap}
              onOpenMobility={openMobility}
            />
          ) : (
            <section className="flex min-h-[calc(100vh-140px)] items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl shadow-slate-950/40">
              <div className="max-w-md">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-300 text-slate-950">
                  <CalendarDays className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-black text-white">
                  Pick a match to start planning
                </h2>
                <p className="mt-3 text-slate-400">
                  VI Connect Messages turns the match into a safe plan: chat, send date ideas, open the map, and plan a ride.
                </p>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

export default VIConnectMessagesPage;
