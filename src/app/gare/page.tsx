"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Clock, CheckCircle2, RefreshCw, Zap, ChevronRight } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type SportState = "TODO" | "DONE";
type SlotStatus = "DONE" | "CURRENT" | "UPCOMING";

interface SportSlot {
  slotId: string;
  targetVictory: number;
  side1Letters: string[];
  side2Letters: string[];
  side1Names: string[];
  side2Names: string[];
  state: SportState;
  matchId: string | null;
  points1: number | null;
  points2: number | null;
}

interface Partita {
  partitaId: string;
  partitaIndex: number;
  partitaName: string;
  sports: Record<string, SportSlot>;
  restingLetters: string[];
  restingNames: string[];
}

interface TurnoBlock {
  id: number;
  name: string;
  partite: Partita[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DISCIPLINE_LABELS: Record<string, string> = {
  CALCIO_BALILLA: "Calcio Balilla",
  FRECCETTE: "Freccette",
  PING_PONG: "Ping Pong",
  AIR_HOCKEY: "Air Hockey",
};

const DISCIPLINE_ORDER = ["CALCIO_BALILLA", "FRECCETTE", "PING_PONG", "AIR_HOCKEY"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function firstName(fullName: string): string {
  return fullName.split(" ")[0] ?? fullName;
}

function isPartitaDone(partita: Partita): boolean {
  const slots = DISCIPLINE_ORDER.map(k => partita.sports[k]).filter(Boolean);
  return slots.length > 0 && slots.every(s => s.state === "DONE");
}

// Trova la prima partita UPCOMING globale (attraverso tutti i turni)
function findCurrentPartitaId(data: TurnoBlock[]): string | null {
  for (const turno of data) {
    for (const partita of turno.partite) {
      if (!isPartitaDone(partita)) return partita.partitaId;
    }
  }
  return null;
}

// ─── Current Match Card ───────────────────────────────────────────────────────

function CurrentMatchCard({ partita, turnoName }: { partita: Partita; turnoName: string }) {
  const slots = DISCIPLINE_ORDER.map(k => ({
    key: k,
    slot: partita.sports[k] as SportSlot | undefined,
  }));

  return (
    <motion.div
      layout
      layoutId={`partita-${partita.partitaId}`}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      className="relative overflow-hidden rounded-2xl border-2 border-emerald-400 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 shadow-xl shadow-emerald-500/15 ring-4 ring-emerald-300/20 my-3"
    >
      {/* Glow decorativo */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/5 via-transparent to-emerald-400/5 pointer-events-none" />

      {/* Header card */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-emerald-200/60 bg-emerald-500/5">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <span className="text-xs font-black uppercase tracking-widest text-emerald-700">
            Serie in corso
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-full">
            {turnoName}
          </span>
          <span className="text-xs font-black text-emerald-800">
            Serie #{partita.partitaIndex}
          </span>
        </div>
      </div>

      {/* Corpo card: le 4 discipline in colonne */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-0 divide-x divide-emerald-100">
        {slots.map(({ key, slot }) => {
          if (!slot) return <div key={key} className="p-4" />;

          const p1 = slot.side1Names.length > 0 ? slot.side1Names.map(firstName) : slot.side1Letters;
          const p2 = slot.side2Names.length > 0 ? slot.side2Names.map(firstName) : slot.side2Letters;

          return (
            <div key={key} className="p-4 flex flex-col items-center gap-3">
              {/* Nome disciplina */}
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                {DISCIPLINE_LABELS[key]}
              </span>

              {/* Sfidanti */}
              <div className="flex items-center justify-center gap-3 w-full">
                {/* Lato 1 */}
                <div className="flex flex-col items-end flex-1 min-w-0">
                  {p1.map((n, i) => (
                    <span key={i} className="text-sm font-bold text-zinc-800 truncate max-w-full text-right leading-tight">
                      {n}
                    </span>
                  ))}
                </div>

                {/* VS */}
                <span className="text-[10px] font-black text-zinc-300 shrink-0 italic">vs</span>

                {/* Lato 2 */}
                <div className="flex flex-col items-start flex-1 min-w-0">
                  {p2.map((n, i) => (
                    <span key={i} className="text-sm font-bold text-zinc-800 truncate max-w-full leading-tight">
                      {n}
                    </span>
                  ))}
                </div>
              </div>

              {/* Target + attesa punteggio */}
              <div className="flex flex-col items-center gap-1 mt-1">
                {slot.targetVictory > 0 && (
                  <span className="text-[9px] text-zinc-400 font-medium">Target: {slot.targetVictory}</span>
                )}
                <div className="text-xs font-black text-emerald-400 uppercase tracking-widest animate-pulse">
                  In attesa…
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer: atleti fermi */}
      {partita.restingNames.length > 0 && (
        <div className="px-5 py-2 bg-zinc-50/80 border-t border-emerald-100 text-center">
          <span className="text-[10px] text-zinc-400 font-medium italic">
            Fermi: {partita.restingNames.map(firstName).join(", ")}
          </span>
        </div>
      )}
    </motion.div>
  );
}

// ─── Scoreboard Row ───────────────────────────────────────────────────────────

function ScoreboardRow({ partita, globalIndex, status, delay }: {
  partita: Partita;
  globalIndex: number;
  status: "DONE" | "UPCOMING";
  delay: number;
}) {
  const rowStyles = {
    DONE: "bg-red-50/70 hover:bg-red-50 border-red-100",
    UPCOMING: "bg-amber-50/30 hover:bg-amber-50/60 border-amber-100/60",
  };

  const numStyles = {
    DONE: "bg-red-100 text-red-500",
    UPCOMING: "text-amber-500",
  };

  return (
    <motion.div
      layout
      layoutId={`partita-${partita.partitaId}`}
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -6 }}
      transition={{ type: "spring", stiffness: 400, damping: 38, delay }}
      className={`flex items-center border rounded-lg overflow-hidden transition-colors duration-300 ${rowStyles[status]}`}
      style={{ minHeight: "42px" }}
    >
      {/* Numero */}
      <div className={`shrink-0 w-9 flex items-center justify-center self-stretch text-xs font-black ${numStyles[status]}`}>
        {globalIndex}
      </div>

      {/* Stato pill */}
      <div className="shrink-0 w-20 flex items-center justify-center">
        {status === "DONE" ? (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-100 text-red-500 text-[8px] font-black uppercase">
            <CheckCircle2 className="w-2 h-2" /> Finita
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 text-[8px] font-black uppercase">
            <Clock className="w-2 h-2" /> Attesa
          </span>
        )}
      </div>

      {/* Celle disciplina */}
      {DISCIPLINE_ORDER.map((dk) => {
        const slot = partita.sports[dk];
        if (!slot) return <div key={dk} className="flex-1 border-l border-zinc-100" />;

        const p1 = slot.side1Names.length > 0 ? slot.side1Names.map(firstName) : slot.side1Letters;
        const p2 = slot.side2Names.length > 0 ? slot.side2Names.map(firstName) : slot.side2Letters;

        const textColor = status === "DONE" ? "text-red-600" : "text-amber-700";
        const scoreColor = status === "DONE" ? "text-red-500 font-black" : "text-zinc-300";

        return (
          <div key={dk} className="flex-1 min-w-0 flex items-center justify-between gap-1 px-2 border-l border-zinc-100 py-1">
            <span className={`text-[11px] font-medium truncate flex-1 text-right ${textColor}`}>
              {p1.join(" & ")}
            </span>
            <span className={`shrink-0 text-xs tabular-nums mx-1 ${scoreColor}`}>
              {status === "DONE" ? `${slot.points1}-${slot.points2}` : "vs"}
            </span>
            <span className={`text-[11px] font-medium truncate flex-1 text-left ${textColor}`}>
              {p2.join(" & ")}
            </span>
          </div>
        );
      })}

      {/* Fermi */}
      <div className="shrink-0 w-24 px-2 text-right">
        {partita.restingNames.length > 0 && (
          <span className="text-[8px] text-zinc-400 font-medium italic block leading-tight">
            {partita.restingNames.map(firstName).join(", ")}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function GarePage() {
  const [data, setData] = useState<TurnoBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/admin/schedule?t=${Date.now()}`, { cache: "no-store" });
      const json = await res.json();
      if (json.ok) {
        setData(json.data.phases);
        setLastUpdate(new Date());
      }
    } catch {
      // silenzioso
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 15000);
    return () => clearInterval(interval);
  }, []);

  // ID della serie "in corso" (prima UPCOMING globale)
  const currentId = findCurrentPartitaId(data);

  // Contatori
  const allPartite = data.flatMap(t => t.partite);
  const completate = allPartite.filter(p => isPartitaDone(p)).length;
  const daGiocare = allPartite.filter(p => !isPartitaDone(p) && p.partitaId !== currentId).length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-16 w-16">
            <div className="h-16 w-16 rounded-full border-4 border-zinc-200" />
            <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin" />
          </div>
          <p className="text-zinc-500 font-medium text-sm">Caricamento Scoreboard…</p>
        </div>
      </div>
    );
  }

  let globalCounter = 0;

  return (
    <div className="min-h-screen bg-zinc-50">

      {/* ─── Sticky Header ─── */}
      <div className="sticky top-[60px] z-50 bg-white/95 backdrop-blur-xl border-b border-zinc-200 shadow-sm">
        <div className="mx-auto max-w-screen-2xl px-4 py-3">

          {/* Riga titolo */}
          <div className="relative flex items-center justify-center mb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2 bg-zinc-900 text-white px-3 py-1.5 rounded-lg">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-wider">Live Scoreboard</span>
              </div>
              <h1 className="text-lg font-black text-zinc-800 hidden sm:block">Nolimpiadi 2026</h1>
            </div>

            <div className="absolute right-0 flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-full bg-red-50 text-red-500">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />{completate} Finite
              </span>
              {currentId && (
                <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />1 In Corso
                </span>
              )}
              <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-full bg-amber-50 text-amber-600">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />{daGiocare} Da Giocare
              </span>
              <button
                onClick={() => fetchData(true)}
                className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
                title="Aggiorna ora"
              >
                <RefreshCw className={`w-4 h-4 text-zinc-400 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Intestazioni colonne */}
          <div
            className="grid text-center text-[9px] font-black uppercase tracking-widest text-zinc-400"
            style={{ gridTemplateColumns: "36px 80px 1fr 1fr 1fr 1fr 96px" }}
          >
            <div>#</div>
            <div>Stato</div>
            {DISCIPLINE_ORDER.map(dk => (
              <div key={dk} className="border-l border-zinc-100">{DISCIPLINE_LABELS[dk]}</div>
            ))}
            <div>Fermi</div>
          </div>
        </div>
      </div>

      {/* ─── Corpo ─── */}
      <div className="mx-auto max-w-screen-2xl px-4 py-4 space-y-8 pb-24">
        <AnimatePresence mode="popLayout">
          {data.map((turno) => {
            const turnoHasContent = turno.partite.length > 0;
            if (!turnoHasContent) return null;

            return (
              <section key={turno.id}>
                {/* Label turno */}
                <div className="flex items-center gap-3 mb-2 pt-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 bg-zinc-100 px-3 py-1 rounded-full">
                    {turno.name}
                  </span>
                  <div className="flex-1 h-px bg-zinc-100" />
                  <span className="text-[10px] text-zinc-300 font-medium">{turno.partite.length} serie</span>
                </div>

                {/* Partite */}
                <div className="space-y-1.5">
                  {turno.partite.map((partita) => {
                    globalCounter++;
                    const gIdx = globalCounter;
                    const isDone = isPartitaDone(partita);
                    const isCurrent = partita.partitaId === currentId;

                    if (isCurrent) {
                      return (
                        <CurrentMatchCard
                          key={partita.partitaId}
                          partita={partita}
                          turnoName={turno.name}
                        />
                      );
                    }

                    return (
                      <ScoreboardRow
                        key={partita.partitaId}
                        partita={partita}
                        globalIndex={gIdx}
                        status={isDone ? "DONE" : "UPCOMING"}
                        delay={isDone ? 0 : 0.02}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}
        </AnimatePresence>

        {/* Legenda + timestamp */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4 pb-2 border-t border-zinc-100">
          <span className="text-[9px] text-zinc-400 font-black uppercase tracking-widest">Legenda</span>
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-500">
            <span className="w-3 h-3 rounded bg-red-100 border border-red-200 inline-block" />
            Partita conclusa
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
            <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300 inline-block" />
            Serie corrente
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600">
            <span className="w-3 h-3 rounded bg-amber-50 border border-amber-200 inline-block" />
            Da giocare
          </span>
          {lastUpdate && (
            <span className="text-[9px] text-zinc-300 ml-4">
              Aggiornato: {lastUpdate.toLocaleTimeString("it-IT")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}