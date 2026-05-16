"use client";

import { useState } from "react";
import { Trophy, Zap, Info } from "lucide-react";
import AthleteMatchModal from "../AthleteMatchModal";

interface DisciplineRankingsProps {
  rankings: any[];
  athletes?: any[];
}

export default function DisciplineRankings({ rankings }: DisciplineRankingsProps) {
  const [activeTab, setActiveTab] = useState(rankings[0]?.id || null);

  // Modal State
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (id: string) => {
    setSelectedAthleteId(id);
    setIsModalOpen(true);
  };

  const activeDiscipline = rankings.find(r => r.id === activeTab);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border-none">
      {/* Athlete Detail Modal */}
      <AthleteMatchModal 
        athleteId={selectedAthleteId} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      {/* Tabs Header */}
      <div className="p-6 pb-0">
        <div className="flex flex-wrap gap-2">
          {rankings.map(disc => (
            <button
              key={disc.id}
              onClick={() => setActiveTab(disc.id)}
              className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${
                activeTab === disc.id
                  ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20 ring-2 ring-indigo-500/50"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              {activeTab === disc.id && <Zap className="w-3.5 h-3.5" />}
              {disc.name}
            </button>
          ))}
        </div>
      </div>

      {/* Table Content */}
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 w-12 text-center">Pos</th>
                <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-zinc-400">Atleta</th>
                <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Punteggio</th>
                <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-zinc-400">Traguardo Raggiunto</th>
                <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
              {activeDiscipline?.standings && activeDiscipline.standings.length > 0 ? (
                activeDiscipline.standings.map((s: any, idx: number) => {
                  const isFinished = s.finalPos !== 99;
                  
                  return (
                    <tr key={idx} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="py-4 text-center">
                        <div className={`inline-flex w-7 h-7 items-center justify-center rounded-lg font-black text-[11px] ${
                          isFinished && s.finalPos === 1 ? "bg-amber-400 text-amber-900 shadow-sm shadow-amber-400/30" :
                          isFinished && s.finalPos === 2 ? "bg-zinc-300 text-zinc-700" :
                          isFinished && s.finalPos === 3 ? "bg-orange-300 text-orange-900" :
                          "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                        }`}>
                          {s.displayPos}
                        </div>
                      </td>
                      <td className="py-4">
                        <div 
                          className="flex items-center gap-2 cursor-pointer group/item"
                          onClick={() => s.athleteId && openModal(s.athleteId)}
                        >
                          <span className={`font-bold text-sm transition-colors ${
                            isFinished && s.finalPos === 1 ? "text-amber-600" : "text-zinc-700 dark:text-zinc-200 group-hover/item:text-indigo-500"
                          }`}>
                            {s.name}
                          </span>
                          <Info className="w-3 h-3 text-zinc-300 opacity-0 group-hover/item:opacity-100 transition-all" />
                        </div>
                      </td>
                      <td className="py-4 text-center">
                        <span className="font-mono text-xs font-bold text-zinc-600 dark:text-zinc-300">
                          {s.score !== undefined && s.score !== null ? Number(s.score).toLocaleString("it-IT", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : "-"}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${
                            !isFinished ? "text-zinc-400 italic" :
                            s.finalPos === 1 ? "text-amber-500" :
                            "text-zinc-600 dark:text-zinc-300"
                          }`}>
                            {s.stage}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        {!isFinished ? (
                          <span className="inline-flex items-center px-2 py-1 rounded bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase tracking-widest">
                            In Gara
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${
                            s.finalPos === 1 ? "bg-amber-50 text-amber-600" :
                            "bg-red-50 text-red-600"
                          }`}>
                            {s.finalPos === 1 ? <Trophy className="w-3 h-3" /> : null}
                            {s.finalPos === 1 ? "Vincitore" : "Eliminato"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm font-bold text-zinc-400">
                    Nessun dato disponibile.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
