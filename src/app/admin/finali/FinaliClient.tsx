"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Trophy, 
  Medal, 
  Target, 
  Zap, 
  Activity, 
  ChevronRight,
  Shield,
  Star
} from "lucide-react";
import PremiumCard from "@/components/ui/PremiumCard";
import Link from "next/link";

import { DisciplineKind } from "@prisma/client";

type QualRow = {
  athlete_id: string;
  name: string;
  qualification_weighted: string | number;
  matches_played: number;
};

type DisciplineData = {
  kind: string;
  rows: QualRow[];
  limit: number;
};

const disciplineIcons: Record<string, any> = {
  CALCIO_BALILLA: Shield,
  FRECCETTE: Target,
  PING_PONG: Activity,
  AIR_HOCKEY: Zap,
};

const disciplineColors: Record<string, string> = {
  CALCIO_BALILLA: "text-blue-500",
  FRECCETTE: "text-red-500",
  PING_PONG: "text-emerald-500",
  AIR_HOCKEY: "text-purple-500",
};

export default function FinaliClient() {
  const [data, setData] = useState<DisciplineData[]>([]);
  const [loading, setLoading] = useState(true);

  const kinds = ["CALCIO_BALILLA", "FRECCETTE", "PING_PONG", "AIR_HOCKEY"];

  useEffect(() => {
    async function fetchData() {
      try {
        const results = await Promise.all(
          kinds.map(async (k) => {
            const res = await fetch(`/api/qualificati?kind=${k}`);
            const json = await res.json();
            return {
              kind: k,
              rows: json.rows || [],
              limit: json.limit || 0
            };
          })
        );
        setData(results);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  function getBracketLines(kind: string, seeds: QualRow[]) {
    const n = seeds.length;
    if (n === 0) return [];
    const name = (i: number) => (seeds[i] ? seeds[i].name : "—");

    const getTarget = (phase: "Q" | "SF" | "F") => {
      if (kind === DisciplineKind.FRECCETTE) {
        if (phase === "Q") return " (ai 100)";
        if (phase === "SF") return " (ai 150)";
        return " (ai 200)";
      }
      if (kind === DisciplineKind.AIR_HOCKEY) {
        if (phase === "Q") return " (ai 40)";
        if (phase === "SF") return " (ai 60)";
        return " (ai 80)";
      }
      // Ping pong e altri
      if (phase === "Q") return " (ai 10)";
      if (phase === "SF") return " (ai 15)";
      return " (ai 20)";
    };

    if (n === 6) {
      return [
        { label: `Quarti A${getTarget("Q")}`, match: `${name(3)} vs ${name(4)}` },
        { label: `Quarti B${getTarget("Q")}`, match: `${name(2)} vs ${name(5)}` },
        { label: `Semifinale 1${getTarget("SF")}`, match: `${name(0)} vs Vincente Q-A` },
        { label: `Semifinale 2${getTarget("SF")}`, match: `${name(1)} vs Vincente Q-B` },
        { label: `FINALE${getTarget("F")}`, match: "Vincente SF1 vs Vincente SF2", isFinal: true },
      ];
    }

    if (n === 5) {
      // Calcio balilla - Girone all'italiana (sempre ai 5)
      return [
        { label: "Partita 1 (ai 5)", match: `${name(0)},${name(1)} vs ${name(2)},${name(3)}` },
        { label: "Partita 2 (ai 5)", match: `${name(0)},${name(2)} vs ${name(1)},${name(4)}` },
        { label: "Partita 3 (ai 5)", match: `${name(0)},${name(4)} vs ${name(1)},${name(3)}` },
        { label: "Partita 4 (ai 5)", match: `${name(0)},${name(3)} vs ${name(2)},${name(4)}` },
        { label: "Partita 5 (ai 5)", match: `${name(1)},${name(2)} vs ${name(3)},${name(4)}` },
        { label: "CLASSIFICA", match: "In base a punti fatti/subiti", isFinal: true },
      ];
    }

    return [{ label: "Stato", match: "Formato finali in attesa di qualificati..." }];
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-64 bg-zinc-100 animate-pulse rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {data.map((d, idx) => {
          const Icon = disciplineIcons[d.kind] || Star;
          const bracket = getBracketLines(d.kind, d.rows);
          
          return (
            <motion.div
              key={d.kind}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <PremiumCard className="h-full flex flex-col p-0 overflow-hidden ring-1 ring-zinc-200/50">
                {/* Header Disciplina */}
                <div className="p-6 border-b border-zinc-100 bg-zinc-50/30 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/50 ${disciplineColors[d.kind]}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-foreground tracking-tight">
                        {d.kind.replaceAll("_", " ")}
                      </h2>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        Top {d.limit} Qualificati
                      </p>
                    </div>
                  </div>
                  <div className="bg-accent/10 text-accent px-3 py-1 rounded-full text-xs font-black">
                    FINALS
                  </div>
                </div>

                {/* Lista Qualificati */}
                <div className="p-6 flex-1">
                  <div className="flex flex-col gap-3">
                    {d.rows.map((row, i) => (
                      <div key={row.athlete_id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-black ${
                            i < 3 ? "bg-accent text-white" : "bg-zinc-100 text-zinc-400"
                          }`}>
                            {i + 1}
                          </span>
                          <span className="font-bold text-zinc-700 group-hover:text-accent transition-colors">
                            {row.name}
                          </span>
                        </div>
                        <span className="text-xs font-black text-zinc-400">
                          {Number(row.qualification_weighted).toFixed(3)}
                        </span>
                      </div>
                    ))}
                    {d.rows.length === 0 && (
                      <div className="text-center py-4 text-zinc-400 text-sm italic font-medium">
                        Qualificazioni in corso...
                      </div>
                    )}
                  </div>
                </div>

                {/* Bracket Preview */}
                <div className="p-6 bg-zinc-900 text-white mt-auto">
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="w-4 h-4 text-accent" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Road to Gold</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {bracket.map((step, i) => (
                      <div key={i} className={`flex items-center justify-between gap-4 ${
                        step.isFinal ? "pt-2 border-t border-white/10" : ""
                      }`}>
                        <span className={`text-[10px] font-bold uppercase tracking-tighter ${
                          step.isFinal ? "text-accent" : "text-white/40"
                        }`}>
                          {step.label}
                        </span>
                        <span className={`text-xs font-black truncate text-right ${
                          step.isFinal ? "text-white" : "text-white/80"
                        }`}>
                          {step.match}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </PremiumCard>
            </motion.div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="flex justify-center pb-12">
        <Link href="/giudici" className="group relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-accent to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <button className="relative px-8 py-4 bg-foreground text-background rounded-2xl font-black text-sm flex items-center gap-3 hover:scale-105 transition-transform">
            GESTISCI RISULTATI FINALI
            <ChevronRight className="w-4 h-4" />
          </button>
        </Link>
      </div>
    </div>
  );
}
