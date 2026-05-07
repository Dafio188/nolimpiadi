"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Trophy, 
  Medal, 
  Activity, 
  Target, 
  Zap, 
  Calendar,
  User,
  ArrowRight
} from "lucide-react";
import PremiumCard from "./PremiumCard";

type Match = {
  id: string;
  playedAt: string;
  phase: string;
  finalStage: string | null;
  disciplineName: string;
  disciplineKind: string;
  seriesIndex: number | null;
  targetVictory: number;
  pointsFor: number;
  pointsAgainst: number;
  myNames: string[];
  oppNames: string[];
  weighted: number;
};

type AthleteData = {
  athlete: { id: string; name: string };
  totals: { matches: number; total: number; qual: number; finals: number };
  rows: Match[];
  malusDivisor: number;
};

interface AthleteMatchModalProps {
  athleteId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return "0.000";
  return value.toLocaleString("it-IT", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

function stageLabel(stage: string | null) {
  if (!stage) return "—";
  const labels: Record<string, string> = {
    QUARTI: "Quarti",
    SEMIFINALI: "Semifinali",
    FINALE: "Finale"
  };
  return labels[stage] || stage;
}

export default function AthleteMatchModal({ athleteId, isOpen, onClose }: AthleteMatchModalProps) {
  const [data, setData] = useState<AthleteData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && athleteId) {
      setLoading(true);
      fetch(`/api/atleti/${athleteId}`)
        .then(res => res.json())
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setData(null);
    }
  }, [isOpen, athleteId]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-xl"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-4xl max-h-[90vh] bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden pointer-events-auto flex flex-col border border-white/20 dark:border-zinc-800"
            >
              {/* Header */}
              <div className="relative p-8 border-b border-zinc-100/50 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/30 dark:bg-zinc-800/30">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white leading-tight tracking-tight">
                      {loading ? "Caricamento..." : data?.athlete?.name || "Scheda Atleta"}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Analisi Performance Live</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-90"
                >
                  <X className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-6">
                    <div className="relative">
                       <div className="w-16 h-16 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
                       <Zap className="absolute inset-0 m-auto w-6 h-6 text-indigo-500 animate-pulse" />
                    </div>
                    <p className="text-sm font-black text-zinc-400 uppercase tracking-widest">Sincronizzazione dati...</p>
                  </div>
                ) : data && data.totals ? (
                  <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <StatItem 
                        icon={<Zap className="w-4 h-4" />} 
                        label="Totale Assoluto" 
                        value={formatNumber(data.totals.total).slice(0, -2)} 
                        highlight 
                      />
                      <StatItem 
                        icon={<Trophy className="w-4 h-4" />} 
                        label="Ranking Fase 1" 
                        value={formatNumber(data.totals.qual).slice(0, -2)} 
                      />
                      <StatItem 
                        icon={<Medal className="w-4 h-4" />} 
                        label="Ranking Fase 2" 
                        value={formatNumber(data.totals.finals).slice(0, -2)} 
                      />
                      <StatItem 
                        icon={<Activity className="w-4 h-4" />} 
                        label="Match Giocati" 
                        value={data.totals.matches.toString()} 
                      />
                    </div>

                    {/* Match List */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                          <div className="w-1 h-5 bg-indigo-500 rounded-full" />
                          <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Cronostoria Incontri</h3>
                        </div>
                        <span className="text-[10px] font-black text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full uppercase tracking-tighter">
                          Punteggi Ponderati
                        </span>
                      </div>

                      <div className="overflow-hidden rounded-3xl border border-zinc-100 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-zinc-50/50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Disciplina / Fase</th>
                              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Avversario</th>
                              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Risultato</th>
                              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-indigo-500 text-right">Peso</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                            {data.rows.map((r, idx) => (
                              <tr key={r.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-all duration-300">
                                <td className="px-6 py-5">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{r.disciplineName}</span>
                                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-tight mt-0.5">
                                      {r.phase === "QUALIFICAZIONE" ? `Qualifiche · Serie ${r.seriesIndex || "—"}` : `Finali · ${stageLabel(r.finalStage)}`}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-zinc-400 italic">vs</span>
                                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{r.oppNames.join(" + ")}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-5 text-center">
                                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-xs font-black shadow-sm ${
                                    r.pointsFor > r.pointsAgainst 
                                      ? "bg-green-500/10 text-green-600 dark:text-green-400 ring-1 ring-green-500/20" 
                                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                                  }`}>
                                    {r.pointsFor} <span className="opacity-30">—</span> {r.pointsAgainst}
                                  </div>
                                </td>
                                <td className="px-6 py-5 text-right">
                                  <span className="text-sm font-black text-indigo-500 tabular-nums">{formatNumber(r.weighted)}</span>
                                </td>
                              </tr>
                            ))}
                            {data.rows.length === 0 && (
                              <tr>
                                <td colSpan={4} className="px-6 py-16 text-center">
                                  <div className="flex flex-col items-center gap-3">
                                    <Activity className="w-10 h-10 text-zinc-200 dark:text-zinc-800" />
                                    <p className="text-sm font-bold text-zinc-400 italic">Nessun match disputato in questa edizione.</p>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-20 text-zinc-400 font-bold">
                    {(data as any)?.error || "Errore nel recupero dati."}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 bg-zinc-50/50 dark:bg-zinc-800/30 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
                    Nolimpiadi 2026 Dashboard · Live Analysis
                  </p>
                </div>
                <div className="text-[9px] font-black text-zinc-300 dark:text-zinc-600 uppercase tracking-widest">
                  Powered by Antigravity OS
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function StatItem({ icon, label, value, highlight = false }: { icon: any; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`p-5 rounded-3xl border transition-all duration-300 group ${
      highlight 
        ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-indigo-400 shadow-xl shadow-indigo-500/20" 
        : "bg-white dark:bg-zinc-800/50 text-zinc-900 dark:text-white border-zinc-100 dark:border-zinc-800 hover:border-indigo-500/30"
    }`}>
      <div className={`flex items-center gap-2 mb-2 ${highlight ? "text-white/70" : "text-zinc-400"}`}>
        <div className={highlight ? "" : "group-hover:text-indigo-500 transition-colors"}>{icon}</div>
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-2xl font-black tracking-tight tabular-nums">{value}</div>
    </div>
  );
}
