"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Trophy, Clock, Target as TargetIcon } from "lucide-react";
import PremiumCard from "@/components/ui/PremiumCard";

const disciplineImages: Record<string, string> = {
  AIR_HOCKEY: "/immagini/Air Hockey.png",
  PING_PONG: "/immagini/ping pong.png",
  FRECCETTE: "/immagini/Freccette.png",
  CALCIO_BALILLA: "/immagini/Calcio-balilla.png",
};

export default function GarePage() {
  const [data, setData] = useState<{ scheduled: any[]; played: any[] }>({ scheduled: [], played: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/gare");
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const { scheduled, played } = data;

  return (
    <div className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center justify-between"
      >
        <Link 
          href="/" 
          className="flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-accent transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Torna alla Home
        </Link>
        <div className="flex gap-4">
          <Link 
            href="/classifica" 
            className="flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-accent transition-colors"
          >
            Classifica Generale
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>

      <motion.header
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-12"
      >
        <h1 className="text-4xl font-black tracking-tight text-foreground">
          Live <span className="text-accent">Competitions</span>
        </h1>
        <p className="mt-2 text-zinc-500 font-medium">Monitoraggio in tempo reale dei match in corso e conclusi.</p>
      </motion.header>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-3xl bg-zinc-200 dark:bg-zinc-800" />
          ))}
        </div>
      ) : (
        <div className="space-y-16">
          {/* In Programma */}
          <section>
            <div className="mb-6 flex items-center gap-3">
              <div className="bg-accent/10 p-2 rounded-lg">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <h2 className="text-2xl font-bold">Prossimi Match</h2>
              {scheduled.length > 0 && (
                <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-xs font-bold text-zinc-500">
                  SERIE {scheduled[0]?.turnIndex}
                </span>
              )}
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <AnimatePresence mode="popLayout">
                {scheduled.map((match: any, idx: number) => (
                  <PremiumCard key={`sched-${idx}`} className="p-0 border-none ring-1 ring-zinc-200/50 dark:ring-zinc-800/50" delay={idx * 0.05}>
                    <div className="relative h-32 w-full overflow-hidden">
                      <img 
                        src={disciplineImages[match.disciplineKind] || "/placeholder.png"} 
                        alt={match.discipline}
                        className="h-full w-full object-cover transition-transform duration-700 hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
                        <span className="font-bold tracking-tight">{match.discipline}</span>
                        <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          <TargetIcon className="w-3 h-3" />
                          {match.target}
                        </div>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-2">
                        <div className="text-center">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">TEAM A</p>
                          <p className="text-sm font-bold leading-tight">{match.side1.join(" + ")}</p>
                        </div>
                        <div className="text-zinc-300 font-black italic text-xl">VS</div>
                        <div className="text-center">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">TEAM B</p>
                          <p className="text-sm font-bold leading-tight">{match.side2.join(" + ")}</p>
                        </div>
                      </div>
                    </div>
                  </PremiumCard>
                ))}
              </AnimatePresence>
              {scheduled.length === 0 && (
                <div className="col-span-full rounded-3xl border-2 border-dashed border-zinc-200 p-12 text-center">
                  <p className="text-zinc-400 font-medium italic">Nessun match programmato per questa serie.</p>
                </div>
              )}
            </div>
          </section>

          {/* Risultati Recenti */}
          {played.length > 0 && (
            <section>
              <div className="mb-6 flex items-center gap-3">
                <div className="bg-emerald-500/10 p-2 rounded-lg">
                  <Trophy className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold">Risultati di Oggi</h2>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {played.map((match: any, idx: number) => {
                  const winnerSide1 = match.side1.points >= match.target;
                  const winnerSide2 = match.side2.points >= match.target;

                  return (
                    <PremiumCard key={`played-${idx}`} className="p-0 border-none ring-1 ring-zinc-200/50 dark:ring-zinc-800/50 shadow-emerald-500/5" delay={idx * 0.05}>
                      <div className="relative h-24 w-full overflow-hidden opacity-80 grayscale-[0.3]">
                        <img 
                          src={disciplineImages[match.disciplineKind] || "/placeholder.png"} 
                          alt={match.discipline}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-emerald-900/20" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="bg-white/90 dark:bg-black/80 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
                            {match.phase === "FINALI" ? match.finalStage : "Qualificazione"}
                          </span>
                        </div>
                      </div>
                      <div className="p-5">
                        <div className="mb-3 flex items-center justify-center gap-2">
                          <span className="h-px flex-1 bg-zinc-100" />
                          <span className="text-[10px] font-bold text-zinc-400">{match.discipline}</span>
                          <span className="h-px flex-1 bg-zinc-100" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className={`relative rounded-2xl p-3 text-center transition-all ${winnerSide1 ? "bg-emerald-500/10 ring-1 ring-emerald-500/20" : "bg-zinc-50"}`}>
                            {winnerSide1 && <Trophy className="absolute -top-2 -right-1 w-4 h-4 text-emerald-500" />}
                            <p className="text-2xl font-black text-foreground">{match.side1.points}</p>
                            <p className="mt-1 text-[10px] font-bold text-zinc-500 line-clamp-1">{match.side1.athletes.join(" + ")}</p>
                          </div>
                          <div className={`relative rounded-2xl p-3 text-center transition-all ${winnerSide2 ? "bg-emerald-500/10 ring-1 ring-emerald-500/20" : "bg-zinc-50"}`}>
                            {winnerSide2 && <Trophy className="absolute -top-2 -right-1 w-4 h-4 text-emerald-500" />}
                            <p className="text-2xl font-black text-foreground">{match.side2.points}</p>
                            <p className="mt-1 text-[10px] font-bold text-zinc-500 line-clamp-1">{match.side2.athletes.join(" + ")}</p>
                          </div>
                        </div>
                        <p className="mt-4 text-center text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                          {new Date(match.playedAt).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </PremiumCard>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}