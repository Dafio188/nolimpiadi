"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  User, 
  Trophy, 
  Medal, 
  Activity, 
  ChevronLeft, 
  Calendar,
  Zap,
  Target
} from "lucide-react";
import PremiumCard from "@/components/ui/PremiumCard";

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

export default function AthletePage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<AthleteData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAthlete() {
      try {
        const res = await fetch(`/api/atleti/${id}`);
        if (!res.ok) throw new Error("Atleta non trovato");
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchAthlete();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-zinc-200 rounded-full" />
        <div className="h-4 w-32 bg-zinc-200 rounded" />
      </div>
    </div>
  );

  if (!data) return notFound();

  const { athlete, totals, rows, malusDivisor } = data;

  return (
    <div className="flex flex-col gap-8">
      {/* Header & Stats */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Link href="/classifica" className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-accent transition-colors group">
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Torna alla Classifica
          </Link>
        </div>

        <PremiumCard className="relative overflow-visible">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative">
              <div className="w-24 h-24 bg-accent/10 rounded-3xl flex items-center justify-center ring-1 ring-accent/20">
                <User className="w-12 h-12 text-accent" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-foreground text-background p-1.5 rounded-xl shadow-lg">
                <Medal className="w-4 h-4" />
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-black text-foreground tracking-tight">{athlete.name}</h1>
              <p className="text-zinc-500 font-bold text-sm uppercase tracking-widest mt-1">Scheda Atleta Olimpico</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto">
              <StatItem icon={<Zap className="w-4 h-4" />} label="Totale" value={formatNumber(totals.total)} highlight />
              <StatItem icon={<Trophy className="w-4 h-4" />} label="Qualifiche" value={formatNumber(totals.qual)} />
              <StatItem icon={<Medal className="w-4 h-4" />} label="Finali" value={formatNumber(totals.finals)} />
              <StatItem icon={<Activity className="w-4 h-4" />} label="Match" value={totals.matches.toString()} />
            </div>
          </div>
        </PremiumCard>
      </div>

      {/* Match History */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 px-2">
          <Calendar className="w-5 h-5 text-accent" />
          <h2 className="text-xl font-black text-foreground">Cronostoria Match</h2>
        </div>

        <PremiumCard className="p-0 border-none ring-1 ring-zinc-200/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Data & Fase</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Disciplina</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Incontro</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Score</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-accent text-right">Punti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {rows.map((r, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    key={r.id} 
                    className="group hover:bg-zinc-50/80 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground">{new Date(r.playedAt).toLocaleDateString()}</span>
                        <span className="text-[10px] font-black uppercase text-accent tracking-tighter">
                          {r.phase === "QUALIFICAZIONE" ? `Serie ${r.seriesIndex || "—"}` : stageLabel(r.finalStage)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-accent" />
                        <span className="font-bold text-zinc-700">{r.disciplineName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-zinc-800">{r.myNames.join(" + ")}</span>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">vs {r.oppNames.join(" + ")}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-2 bg-zinc-100 px-3 py-1 rounded-full">
                        <span className="text-xs font-black text-zinc-900">{r.pointsFor} - {r.pointsAgainst}</span>
                        <span className="text-[10px] font-bold text-zinc-400">/ {r.targetVictory}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-black text-accent">{formatNumber(r.weighted)}</span>
                    </td>
                  </motion.tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-400 font-medium italic">
                      Nessun match disputato finora.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </PremiumCard>
      </div>
      
      <p className="text-[10px] text-center font-bold text-zinc-400 uppercase tracking-widest pb-8">
        Sistema Malus: Attivo (/{malusDivisor}) · Design by Antigravity OS
      </p>
    </div>
  );
}

function StatItem({ icon, label, value, highlight = false }: { icon: any; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-2xl ring-1 transition-all ${
      highlight ? "bg-accent text-white ring-accent/20 shadow-lg shadow-accent/20" : "bg-zinc-50 text-zinc-900 ring-zinc-200"
    }`}>
      <div className={`flex items-center gap-2 mb-1 ${highlight ? "text-white/70" : "text-zinc-400"}`}>
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-xl font-black">{value}</div>
    </div>
  );
}

