
import { ArrowLeft, Crown } from "lucide-react";

import { useNavigate } from "react-router-dom";

import HistoryKnowledgePage from "../HistoryKnowledgePage";

export default function GovernorsPage() {

  const navigate = useNavigate();

  return (

    <div className="min-h-screen bg-[#05060a] text-white">

      <div className="sticky top-0 z-50 border-b border-white/10 bg-[#05060a]/90 px-4 py-3 backdrop-blur-xl">

        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">

          <button

            type="button"

            onClick={() => navigate("/history")}

            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-black text-white/75 transition hover:bg-white/10"

          >

            <ArrowLeft className="h-4 w-4" />

            History Hub

          </button>

          <div className="hidden items-center gap-2 rounded-2xl bg-amber-300 px-4 py-3 text-sm font-black text-zinc-950 sm:flex">

            <Crown className="h-4 w-4" />

            Danish West Indies Governors

          </div>

        </div>

      </div>

      <HistoryKnowledgePage initialView="governors" />

    </div>

  );

}

