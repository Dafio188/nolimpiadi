"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Zap, Target, Activity, Shield, Radio, RefreshCw, ArrowLeft, Info } from "lucide-react";
import Link from "next/link";
import AthleteMatchModal from "@/components/ui/AthleteMatchModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type MatchStatus = "DONE" | "LIVE" | "UPCOMING";

interface FinalMatch {
  id: string;
  stage: string | null;
  label: string;
  status: MatchStatus;
  s1: { id: string | null; name: string }[];
  s2: { id: string | null; name: string }[];
  points1: number | null;
  points2: number | null;
  targetVictory: number;
}

interface DisciplineData {
  kind: string;
  name: string;
  matches: FinalMatch[];
}

interface Stats {
  live: number;
  done: number;
  upcoming: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DISCIPLINE_LABELS: Record<string, string> = {
  CALCIO_BALILLA: "Calcio Balilla",
  FRECCETTE: "Freccette",
  PING_PONG: "Ping Pong",
  AIR_HOCKEY: "Air Hockey",
};

const DISCIPLINE_ICONS: Record<string, React.ElementType> = {
  CALCIO_BALILLA: Shield,
  FRECCETTE: Target,
  PING_PONG: Activity,
  AIR_HOCKEY: Zap,
};

const DISCIPLINE_COLORS: Record<string, { border: string; bg: string; icon: string; accent: string }> = {
  CALCIO_BALILLA: {
    border: "border-blue-500/40",
    bg: "from-blue-950/60 to-zinc-950",
    icon: "text-blue-400",
    accent: "bg-blue-500",
  },
  FRECCETTE: {
    border: "border-red-500/40",
    bg: "from-red-950/60 to-zinc-950",
    icon: "text-red-400",
    accent: "bg-red-500",
  },
  PING_PONG: {
    border: "border-emerald-500/40",
    bg: "from-emerald-950/60 to-zinc-950",
    icon: "text-emerald-400",
    accent: "bg-emerald-500",
  },
  AIR_HOCKEY: {
    border: "border-orange-500/40",
    bg: "from-orange-950/60 to-zinc-950",
    icon: "text-orange-400",
    accent: "bg-orange-500",
  },
};

const STAGE_LABELS: Record<string, string> = {
  QUARTI: "Quarti",
  SEMIFINALI: "Semifinale",
  FINALE: "Finale",
  GIRONE: "Girone",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function firstName(name: string): string {
  return name.split(" ")[0] ?? name;
}

// ─── Single Match Row ─────────────────────────────────────────────────────────

function MatchRow({ match, isLast, onOpenAthlete }: { match: FinalMatch; isLast: boolean; onOpenAthlete: (id: string) => void }) {
  const isLive = match.status === "LIVE";
  const isDone = match.status === "DONE";
  const isUpcoming = match.status === "UPCOMING";
  const isFinal = match.stage === "FINALE";

  const s1 = match.s1.length > 0 ? match.s1.map(a => ({ ...a, firstName: firstName(a.name) })) : [{ id: null, name: "????", firstName: "????" }];
  const s2 = match.s2.length > 0 ? match.s2.map(a => ({ ...a, firstName: firstName(a.name) })) : [{ id: null, name: "????", firstName: "????" }];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative flex flex-col rounded-xl border transition-all duration-500 overflow-hidden ${
        isLive
          ? "border-emerald-400/80 bg-emerald-500/20 shadow-lg shadow-emerald-500/30"
          : isDone
          ? "border-red-700/50 bg-red-900/40"
          : isFinal
          ? "border-amber-500/50 bg-amber-900/30"
          : "border-amber-700/30 bg-amber-900/20"
      } ${isLast ? "" : "mb-2"}`}
    >
      {/* Barra laterale colorata per stato */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${
          isLive ? "bg-emerald-400" : isDone ? "bg-red-500" : isFinal ? "bg-amber-400" : "bg-amber-600/60"
        }`}
      />

      <div className="pl-4 pr-3 py-2.5 flex flex-col gap-1.5">
        {/* Stage label + stato */}
        <div className="flex items-center justify-between">
          <span
            className={`text-[9px] font-black uppercase tracking-widest ${
              isLive ? "text-emerald-300" : isDone ? "text-red-400" : isFinal ? "text-amber-300" : "text-amber-500"
            }`}
          >
            {STAGE_LABELS[match.stage ?? ""] ?? match.stage ?? "—"}
          </span>
          {/* Sotto-label (es. '3° vs 6°', '1° vs 2°', 'Partita 1') */}
          {match.label && (
            <span className={`text-[9px] font-bold normal-case ${
              isLive ? "text-emerald-200" : isDone ? "text-red-300/80" : "text-amber-400/80"
            }`}>
              {match.label}
            </span>
          )}

          {/* Badge stato */}
          {isLive && (
            <span className="flex items-center gap-1 text-[9px] font-black text-emerald-200 uppercase tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              LIVE
            </span>
          )}
          {isDone && match.targetVictory > 0 && (
            <span className="text-[8px] text-red-400/70 font-medium">ai {match.targetVictory}</span>
          )}
          {!isLive && !isDone && (
            <span className="text-[8px] text-amber-600 font-black uppercase tracking-wider">Attesa</span>
          )}
        </div>

        {/* Sfidanti + punteggio */}
        <div className="flex items-center gap-2">
          {/* Side 1 */}
          <div className="flex-1 text-right">
            {match.s1.map((a, i) => (
              <div
                key={i}
                className={`leading-tight font-bold truncate text-right flex items-center justify-end gap-1 ${
                  a.id ? "cursor-pointer hover:text-blue-400" : ""
                } ${
                  isLive
                    ? "text-white text-sm"
                    : isDone
                    ? "text-red-100 text-sm"
                    : "text-amber-200/80 text-xs"
                }`}
                onClick={() => a.id && onOpenAthlete(a.id)}
              >
                {a.name ?? a.firstName}
                {a.id && isLive && <Info className="w-2.5 h-2.5 text-emerald-300 opacity-50" />}
              </div>
            ))}
          </div>

          {/* Score / vs */}
          <div className={`shrink-0 text-center font-black tabular-nums leading-none ${
            isLive
              ? "text-emerald-200 text-base"
              : isDone
              ? "text-white text-base"
              : "text-amber-600/80 text-xs"
          }`}>
            {isDone
              ? `${match.points1} – ${match.points2}`
              : isLive
              ? "VS"
              : "–"}
          </div>

          {/* Side 2 */}
          <div className="flex-1 text-left">
            {match.s2.map((a, i) => (
              <div
                key={i}
                className={`leading-tight font-bold truncate text-left flex items-center justify-start gap-1 ${
                  a.id ? "cursor-pointer hover:text-blue-400" : ""
                } ${
                  isLive
                    ? "text-white text-sm"
                    : isDone
                    ? "text-red-100 text-sm"
                    : "text-amber-200/80 text-xs"
                }`}
                onClick={() => a.id && onOpenAthlete(a.id)}
              >
                {a.id && isLive && <Info className="w-2.5 h-2.5 text-emerald-300 opacity-50" />}
                {a.name ?? a.firstName}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Calcio Balilla Column (round-robin girone) ───────────────────────────────

function CalcioBalillaColumn({ data, onOpenAthlete }: { data: DisciplineData; onOpenAthlete: (id: string) => void }) {
  const colors = DISCIPLINE_COLORS["CALCIO_BALILLA"];
  const Icon = DISCIPLINE_ICONS["CALCIO_BALILLA"];
  const liveCount = data.matches.filter((m) => m.status === "LIVE").length;
  const doneCount = data.matches.filter((m) => m.status === "DONE").length;

  return (
    <div
      className={`flex flex-col flex-1 min-w-0 rounded-2xl border bg-gradient-to-b ${colors.bg} ${colors.border} overflow-hidden shadow-xl`}
    >
      {/* Header disciplina */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/20">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg bg-white/5 ${colors.icon}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-black text-white tracking-tight uppercase block">Calcio Balilla</span>
            <span className="text-[9px] text-zinc-500 font-medium">Girone all'italiana</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {liveCount > 0 && (
            <span className="flex items-center gap-1 text-[9px] font-black text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              {liveCount} LIVE
            </span>
          )}
          <span className="text-[9px] font-bold text-zinc-500">
            {doneCount}/{data.matches.length}
          </span>
        </div>
      </div>

      {/* Match list compatta */}
      <div className="flex flex-col flex-1 px-3 py-2 gap-1.5 overflow-hidden justify-evenly">
        {data.matches.length === 0 ? (
          <div className="flex items-center justify-center flex-1">
            <p className="text-zinc-600 text-xs italic font-medium">In attesa dei qualificati...</p>
          </div>
        ) : (
          data.matches.map((match, i) => {
            const isLive = match.status === "LIVE";
            const isDone = match.status === "DONE";
            const s1 = match.s1.length > 0 ? match.s1.map(firstName) : ["????"];
            const s2 = match.s2.length > 0 ? match.s2.map(firstName) : ["????"];

            return (
              <div
                key={match.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                  isLive
                    ? "border-emerald-400/80 bg-emerald-500/20 shadow-sm shadow-emerald-500/20"
                    : isDone
                    ? "border-red-700/50 bg-red-900/40"
                    : "border-amber-700/30 bg-amber-900/20"
                }`}
              >
                {/* Numero / label partita */}
                <span className={`text-[10px] font-black shrink-0 ${
                  isLive ? "text-emerald-300" : isDone ? "text-red-400" : "text-amber-600"
                }`}>
                  {match.label || `${i + 1}`}
                </span>

                {/* Sfidanti */}
                <div className="flex-1 flex items-center justify-between gap-1 min-w-0">
                    <span className="flex flex-wrap items-center justify-end gap-1">
                      {match.s1.map((a, i) => (
                        <span 
                          key={i} 
                          className={`cursor-pointer hover:text-blue-400 ${isLive ? "text-white" : isDone ? "text-red-100" : "text-amber-200/80"}`}
                          onClick={() => a.id && onOpenAthlete(a.id)}
                        >
                          {firstName(a.name)}{i < match.s1.length - 1 ? " & " : ""}
                        </span>
                      ))}
                    </span>



                  <span className={`shrink-0 font-black tabular-nums px-2 ${
                    isLive ? "text-emerald-200 text-sm" : isDone ? "text-white text-sm" : "text-amber-600/70 text-xs"
                  }`}>
                    {isDone
                      ? `${match.points1}–${match.points2}`
                      : isLive
                      ? "VS"
                      : "–"}
                  </span>

                  <span className="flex-1 min-w-0 text-xs font-bold text-right flex flex-col justify-center">
                    <span className="flex flex-wrap items-center justify-start gap-1">
                      {match.s2.map((a, i) => (
                        <span 
                          key={i} 
                          className={`cursor-pointer hover:text-blue-400 ${isLive ? "text-white" : isDone ? "text-red-100" : "text-amber-200/80"}`}
                          onClick={() => a.id && onOpenAthlete(a.id)}
                        >
                          {firstName(a.name)}{i < match.s2.length - 1 ? " & " : ""}
                        </span>
                      ))}
                    </span>
                  </span>
                </div>

                {/* Live indicator */}
                {isLive && (
                  <span className="shrink-0 relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}



// ─── Discipline Column (bracket: QUARTI → SEMIFINALI → FINALE) ───────────────

function DisciplineColumn({ data, onOpenAthlete }: { data: DisciplineData; onOpenAthlete: (id: string) => void }) {
  const colors = DISCIPLINE_COLORS[data.kind] ?? DISCIPLINE_COLORS["PING_PONG"];
  const Icon = DISCIPLINE_ICONS[data.kind] ?? Trophy;
  const liveCount = data.matches.filter((m) => m.status === "LIVE").length;
  const doneCount = data.matches.filter((m) => m.status === "DONE").length;

  return (
    <div
      className={`flex flex-col flex-1 min-w-0 rounded-2xl border bg-gradient-to-b ${colors.bg} ${colors.border} overflow-hidden shadow-xl`}
    >
      {/* Header disciplina */}
      <div className={`flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/20`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg bg-white/5 ${colors.icon}`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-sm font-black text-white tracking-tight uppercase">
            {DISCIPLINE_LABELS[data.kind] ?? data.name}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {liveCount > 0 && (
            <span className="flex items-center gap-1 text-[9px] font-black text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              {liveCount} LIVE
            </span>
          )}
          <span className="text-[9px] font-bold text-zinc-500">
            {doneCount}/{data.matches.length}
          </span>
        </div>
      </div>

      {/* Match list */}
      <div className="flex flex-col flex-1 p-3 gap-0 overflow-hidden justify-between">
        {data.matches.length === 0 ? (
          <div className="flex items-center justify-center flex-1">
            <p className="text-zinc-600 text-xs italic font-medium">Bracket in attesa...</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {data.matches.map((match, i) => (
                <MatchRow
                  key={match.id}
                  match={match}
                  isLast={i === data.matches.length - 1}
                  onOpenAthlete={onOpenAthlete}
                />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FinaliTVPage() {
  const [disciplines, setDisciplines] = useState<DisciplineData[]>([]);
  const [stats, setStats] = useState<Stats>({ live: 0, done: 0, upcoming: 0 });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal State
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (id: string) => {
    setSelectedAthleteId(id);
    setIsModalOpen(true);
  };

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await fetch(`/api/finali?t=${Date.now()}`, { cache: "no-store" });
      const json = await res.json();
      if (json.ok) {
        setDisciplines(json.data.disciplines);
        setStats(json.data.stats);
        setLastUpdate(new Date());
      }
    } catch { /* silenzioso */ } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(false);
    const interval = setInterval(() => fetchData(true), 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-14 w-14">
            <div className="h-14 w-14 rounded-full border-4 border-zinc-800" />
            <div className="absolute inset-0 rounded-full border-4 border-t-amber-500 animate-spin" />
          </div>
          <p className="text-zinc-500 font-medium text-sm tracking-wider uppercase">
            Caricamento Bracket…
          </p>
        </div>
      </div>
    );
  }

  const totalMatches = stats.done + stats.live + stats.upcoming;

  return (
    // Layout TV: 100vh, nessuno scroll
    <div className="fixed inset-0 bg-zinc-950 flex flex-col overflow-hidden">
      {/* Athlete Detail Modal */}
      <AthleteMatchModal 
        athleteId={selectedAthleteId} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      {/* ─── Header fisso ─── */}
      <header className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-white/5 bg-black/40 backdrop-blur-xl">
        {/* Logo + Titolo */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
            title="Torna alla Home"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">Home</span>
          </Link>
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black text-amber-300 uppercase tracking-widest">Fase Finale</span>
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight leading-none">NOLImpiadi 2026</h1>
            <p className="text-[10px] text-zinc-500 font-medium mt-0.5">Tabellone in tempo reale</p>
          </div>
        </div>

        {/* Stats centro */}
        <div className="flex items-center gap-3">
          {stats.live > 0 && (
            <motion.div
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 px-4 py-2 rounded-xl"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-sm font-black text-emerald-300">
                {stats.live} IN CORSO
              </span>
            </motion.div>
          )}
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-zinc-500 bg-white/5 px-3 py-2 rounded-xl">
            <span className="text-zinc-400">{stats.done}</span>
            <span>/</span>
            <span>{totalMatches}</span>
            <span className="text-zinc-600 ml-1">completati</span>
          </div>
          {stats.upcoming > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-amber-600 bg-amber-500/10 px-3 py-2 rounded-xl">
              <span>{stats.upcoming}</span>
              <span className="text-amber-700">da giocare</span>
            </div>
          )}
        </div>

        {/* Refresh indicator + time */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData(true)}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            title="Aggiorna"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-zinc-600 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
          {lastUpdate && (
            <div className="text-right">
              <div className="text-[9px] text-zinc-600 font-medium uppercase tracking-wider">Aggiornato</div>
              <div className="text-[11px] text-zinc-400 font-black tabular-nums">
                {lastUpdate.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ─── Griglia 4 colonne — occupa tutto lo spazio rimanente ─── */}
      <main className="flex-1 flex gap-4 p-4 min-h-0 overflow-hidden">
        {disciplines.map((d) =>
          d.kind === "CALCIO_BALILLA"
            ? <CalcioBalillaColumn key={d.kind} data={d} onOpenAthlete={openModal} />
            : <DisciplineColumn key={d.kind} data={d} onOpenAthlete={openModal} />
        )}

        {/* Fallback se non ci sono dati */}
        {disciplines.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Trophy className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500 font-bold text-lg">Bracket non ancora disponibile</p>
              <p className="text-zinc-700 text-sm mt-1">
                Le finali inizieranno al termine delle qualificazioni.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* ─── Footer sottile ─── */}
      <footer className="shrink-0 flex items-center justify-center py-1.5 border-t border-white/[0.03]">
        <p className="text-[9px] text-zinc-700 font-black uppercase tracking-[0.3em]">
          NOLImpiadi 2026 — Live Bracket © Auto-refresh 10s
        </p>
      </footer>
    </div>
  );
}
