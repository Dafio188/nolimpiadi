"use client";

import React, { useState } from "react";
import { Target, Info, ChevronDown, ChevronUp, Users } from "lucide-react";
import PremiumCard from "@/components/ui/PremiumCard";
import AthleteMatchModal from "@/components/ui/AthleteMatchModal";

interface Fase1RankingTablesProps {
  byDiscipline: Record<string, any[]>;
  disciplineOrder: string[];
}

export default function Fase1RankingTables({ byDiscipline, disciplineOrder }: Fase1RankingTablesProps) {
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedDisciplines, setExpandedDisciplines] = useState<Record<string, boolean>>({});

  const toggleExpand = (kind: string) => {
    setExpandedDisciplines(prev => ({ ...prev, [kind]: !prev[kind] }));
  };

  const openModal = (id: string) => {
    setSelectedAthleteId(id);
    setIsModalOpen(true);
  };

  return (
    <>
      <AthleteMatchModal 
        athleteId={selectedAthleteId} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {disciplineOrder.map((kind) => {
          const disciplineRows = byDiscipline[kind] || [];
          if (disciplineRows.length === 0) return null;
          
          const discName = disciplineRows[0].discipline_name;
          const qualLimit = kind === "CALCIO_BALILLA" ? 5 : 6;

          return (
            <section key={kind} className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <div className="bg-cyan-500/10 p-2 rounded-xl">
                  <Target className="w-6 h-6 text-cyan-600" />
                </div>
                <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">{discName}</h2>
              </div>

              <PremiumCard className="p-0 border-none ring-1 ring-zinc-200/50 overflow-hidden bg-white/80 backdrop-blur-md">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-zinc-100 bg-zinc-50/30">
                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400 w-12 text-center">#</th>
                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400">Atleta</th>
                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400 text-center hidden sm:table-cell">M</th>
                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-cyan-600 text-right">Ponderato</th>
                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400 text-right w-20">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {disciplineRows.map((r, idx) => {
                        const isQualified = idx < qualLimit;
                        const isExpanded = expandedDisciplines[kind];
                        
                        // Se non è espanso e non è qualificato, non visualizziamo la riga
                        if (!isExpanded && !isQualified) return null;

                        const isCutoff = idx === qualLimit;
                        const percentage = ((Number(r.qualification_weighted) / 840) * 100).toFixed(2);

                        return (
                          <React.Fragment key={r.athlete_id}>
                            {isCutoff && isExpanded && (
                              <tr className="bg-zinc-50/80 border-y border-zinc-200/50">
                                <td colSpan={5} className="px-4 py-2">
                                  <div className="text-[8px] font-black uppercase tracking-[0.25em] text-zinc-400 text-center">
                                    Fine zona qualificazione
                                  </div>
                                </td>
                              </tr>
                            )}
                            <tr className={`group transition-all ${isQualified ? "hover:bg-cyan-50/30" : "hover:bg-zinc-50/50 opacity-60 grayscale-[0.3]"}`}>
                              <td className="px-4 py-3">
                                <div className={`flex h-8 w-8 items-center justify-center mx-auto rounded-lg font-black text-xs ${
                                  idx === 0 ? "bg-amber-400 text-white shadow-sm" : 
                                  idx === 1 ? "bg-zinc-300 text-zinc-600 shadow-sm" :
                                  idx === 2 ? "bg-orange-300 text-orange-800 shadow-sm" :
                                  isQualified ? "bg-cyan-50 text-cyan-700" : "bg-zinc-50 text-zinc-400"
                                }`}>
                                  {idx + 1}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div 
                                  className="flex items-center gap-3 cursor-pointer group/item"
                                  onClick={() => openModal(r.athlete_id)}
                                >
                                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-100 text-[10px] font-black text-zinc-500 uppercase">
                                    {r.letter}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className={`font-black text-lg tracking-tight transition-colors ${isQualified ? "text-foreground group-hover/item:text-indigo-600" : "text-zinc-500 group-hover/item:text-zinc-700"}`}>
                                      {r.athlete_name}
                                    </span>
                                    {isQualified && (
                                      <div className="bg-cyan-500 w-1.5 h-1.5 rounded-full animate-pulse" />
                                    )}
                                    <Info className="w-4 h-4 text-zinc-300 opacity-0 group-hover/item:opacity-100 transition-all" />
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center font-bold text-zinc-400 text-sm hidden sm:table-cell">
                                {r.matches_played}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className={`text-lg font-black tabular-nums ${isQualified ? "text-cyan-600" : "text-zinc-400"}`}>
                                  {Number(r.qualification_weighted).toFixed(2)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="text-[10px] font-bold text-zinc-400 tabular-nums">
                                  {percentage}%
                                </span>
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {disciplineRows.length > qualLimit && (
                  <div className="p-3 bg-zinc-50/30 border-t border-zinc-100 flex justify-center">
                    <button
                      onClick={() => toggleExpand(kind)}
                      className="flex items-center gap-2 px-6 py-2 rounded-xl bg-white border border-zinc-200 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm active:scale-95"
                    >
                      {expandedDisciplines[kind] ? (
                        <>
                          <ChevronUp className="w-3 h-3" />
                          Nascondi non qualificati
                        </>
                      ) : (
                        <>
                          <Users className="w-3 h-3" />
                          Mostra tutti ({disciplineRows.length - qualLimit} altri)
                        </>
                      )}
                    </button>
                  </div>
                )}
              </PremiumCard>
            </section>
          );
        })}
      </div>
    </>
  );
}
