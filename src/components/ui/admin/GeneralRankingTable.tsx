"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import PremiumCard from "@/components/ui/PremiumCard";
import AthleteMatchModal from "@/components/ui/AthleteMatchModal";

interface GeneralRankingTableProps {
  rows: any[];
}

export default function GeneralRankingTable({ rows }: GeneralRankingTableProps) {
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

      <PremiumCard className="p-0 border-none ring-1 ring-zinc-200/50 dark:ring-zinc-800 shadow-2xl shadow-zinc-200/40 dark:shadow-none overflow-hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="border-b border-zinc-100/50 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800/30">
                <th className="px-3 py-5 text-[9px] font-black uppercase tracking-widest text-zinc-400 w-[50px]">#</th>
                <th className="px-3 py-5 text-[9px] font-black uppercase tracking-widest text-zinc-400 w-[180px]">Atleta</th>
                <th className="px-3 py-5 text-[9px] font-black uppercase tracking-widest text-zinc-400 text-center w-[70px]">Match</th>
                <th className="px-3 py-5 text-[9px] font-black uppercase tracking-widest text-cyan-500/70 text-center hidden md:table-cell w-[80px]">Qual.</th>
                <th className="px-3 py-5 text-[9px] font-black uppercase tracking-widest text-indigo-500/70 text-center hidden md:table-cell w-[80px]">Finali</th>
                <th className="px-3 py-5 text-[9px] font-black uppercase tracking-widest text-amber-600 text-right w-[100px]">Totale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100/50 dark:divide-zinc-800/50">
              {rows.map((r, idx) => {
                const isPodium = idx < 3;
                const displayName = r.name.split(' ').slice(0, 2).join(' ');

                return (
                  <tr 
                    key={r.athlete_id} 
                    className={`group transition-all duration-300 ${isPodium ? "bg-amber-500/[0.02]" : "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"}`}
                  >
                    <td className="px-3 py-3">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-lg font-black text-[10px] transition-transform group-hover:scale-110 ${
                        idx === 0 ? "bg-amber-400 text-white shadow-lg shadow-amber-400/30" : 
                        idx === 1 ? "bg-zinc-300 text-zinc-600" :
                        idx === 2 ? "bg-orange-300 text-orange-800" :
                        "text-zinc-400 font-bold"
                      }`}>
                        {idx + 1}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div 
                        className="flex flex-col min-w-0 cursor-pointer group/item"
                        onClick={() => openModal(r.athlete_id)}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`font-bold tracking-tight truncate transition-colors ${idx === 0 ? 'text-base text-amber-600' : 'text-sm text-zinc-800 dark:text-zinc-200 group-hover/item:text-indigo-500'}`}>
                            {displayName}
                          </span>
                          <Info className="w-3 h-3 text-zinc-300 opacity-0 group-hover/item:opacity-100 transition-all" />
                        </div>
                        <span className="text-[9px] w-fit font-black text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700 px-1.5 py-0 rounded tracking-tighter uppercase">
                          {r.letter}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="inline-flex items-center gap-1 text-zinc-600 font-bold text-sm bg-zinc-50 dark:bg-zinc-800/50 px-2 py-0.5 rounded">
                        {r.matches_played}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-cyan-600/90 text-sm hidden md:table-cell font-mono">
                      {Number(r.qualification_weighted).toFixed(1)}
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-indigo-600/90 text-sm hidden md:table-cell font-mono">
                      {Number(r.finals_weighted).toFixed(1)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`text-base font-black tabular-nums tracking-tighter ${idx === 0 ? 'text-amber-600 drop-shadow-sm' : 'text-zinc-800 dark:text-zinc-100'}`}>
                          {Number(r.total_weighted).toLocaleString("it-IT", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                        </span>
                        <div className="w-10 h-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full mt-0.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${idx === 0 ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} 
                            style={{ width: `${Math.max(10, (Number(r.total_weighted) / Number(rows[0].total_weighted)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </PremiumCard>
    </>
  );
}
