"use client";

import React from "react";
import { Trophy, Medal, Activity, Users, Target, Zap, ChevronRight } from "lucide-react";
import PremiumCard from "@/components/ui/PremiumCard";

const ICON_MAP: Record<string, React.ElementType> = {
  PING_PONG: Activity,
  CALCIO_BALILLA: Users,
  FRECCETTE: Target,
  AIR_HOCKEY: Zap,
};

const DISCIPLINE_NAMES: Record<string, string> = {
  PING_PONG: "Ping Pong",
  CALCIO_BALILLA: "Calcio Balilla",
  FRECCETTE: "Freccette",
  AIR_HOCKEY: "Air Hockey",
};

interface DisciplineRanking {
  kind: string;
  standings: {
    pos: number;
    name: string;
    stage: string;
    isWinner: boolean;
  }[];
}

export default function DisciplineRankings({ rankings }: { rankings: DisciplineRanking[] }) {
  const [activeTab, setActiveTab] = React.useState(0);
  
  if (!rankings || rankings.length === 0) return null;

  const current = rankings[activeTab];

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-blue-500/10 p-2 rounded-lg">
          <Activity className="w-6 h-6 text-blue-600" />
        </div>
        <h2 className="text-2xl font-black text-foreground">Classifiche Fase 2 per Disciplina</h2>
      </div>

      {/* Tab Selector */}
      <div className="flex flex-wrap gap-2 p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl w-fit">
        {rankings.map((r, idx) => {
          const Icon = ICON_MAP[r.kind] || Activity;
          return (
            <button
              key={r.kind}
              onClick={() => setActiveTab(idx)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === idx 
                ? "bg-white dark:bg-zinc-700 shadow-sm text-blue-600" 
                : "text-zinc-500 hover:text-zinc-700 hover:bg-white/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {DISCIPLINE_NAMES[r.kind] || r.kind}
            </button>
          );
        })}
      </div>

      {/* Standings Table */}
      <PremiumCard className="p-0 border-none ring-1 ring-zinc-200 dark:ring-zinc-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 w-24">Pos</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Atleta</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Traguardo Raggiunto</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
              {current.standings.length > 0 ? (
                current.standings.map((s, idx) => (
                  <tr key={idx} className="group hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-2">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg font-black text-sm ${
                        s.pos === 1 ? "bg-amber-100 text-amber-700" :
                        s.pos === 2 ? "bg-zinc-100 text-zinc-500" :
                        s.pos === 3 ? "bg-orange-100 text-orange-700" :
                        "text-zinc-400"
                      }`}>
                        {s.pos}
                      </div>
                    </td>
                    <td className="px-6 py-2">
                      <span className="font-bold text-foreground">{s.name}</span>
                    </td>
                    <td className="px-6 py-2">
                      <span className="text-xs font-black uppercase tracking-tighter text-zinc-400">
                        {s.stage}
                      </span>
                    </td>
                    <td className="px-6 py-2 text-right">
                      {s.isWinner ? (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase">
                          <Trophy className="w-3 h-3" />
                          Vincitore
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-400 text-[10px] font-black uppercase">
                          Eliminato
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-400 font-medium italic">
                    Nessun risultato disponibile per questa disciplina nella Fase 2.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </PremiumCard>
    </section>
  );
}
