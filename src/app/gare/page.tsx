"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Clock, CheckCircle2, Circle, Wifi, RefreshCw } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type SportState = "TODO" | "DONE";
type SlotStatus = "DONE" | "LIVE" | "UPCOMING";

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

const DISCIPLINE_SHORT: Record<string, string> = {
  CALCIO_BALILLA: "CB",
  FRECCETTE: "FR",
  PING_PONG: "PP",
  AIR_HOCKEY: "AH",
};

const DISCIPLINE_ORDER = ["CALCIO_BALILLA", "FRECCETTE", "PING_PONG", "AIR_HOCKEY"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function firstName(fullName: string): string {
  return fullName.split(" ")[0] ?? fullName;
}

function getSlotStatus(slot: SportSlot): SlotStatus {
  if (slot.state === "DONE") return "DONE";
  if (slot.matchId !== null) return "LIVE";
  return "UPCOMING";
}

function getRowStatus(partita: Partita): SlotStatus {
  const slots = DISCIPLINE_ORDER.map(k => partita.sports[k]).filter(Boolean);
  if (slots.length === 0) return "UPCOMING";
  // Se almeno uno è DONE e nessuno è LIVE → riga completata
  const hasLive = slots.some(s => getSlotStatus(s) === "LIVE");
  if (hasLive) return "LIVE";
  const allDone = slots.every(s => s.state === "DONE");
  if (allDone) return "DONE";
  return "UPCOMING";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusPill({ status }: { status: SlotStatus }) {
  if (status === "DONE") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-wider">
        <CheckCircle2 className="w-2.5 h-2.5" />
        Finita
      </span>
    );
  }
  if (status === "LIVE") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 text-[9px] font-black uppercase tracking-wider animate-pulse">
        <Radio className="w-2.5 h-2.5" />
        In Corso
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[9px] font-black uppercase tracking-wider">
      <Clock className="w-2.5 h-2.5" />
      Attesa
    </span>
  );
}

function ScoreCell({ slot, disciplineKey }: { slot: SportSlot | undefined; disciplineKey: string }) {
  if (!slot) {
    return <div className="flex-1 min-w-0 text-center text-zinc-200 text-xs">—</div>;
  }

  const status = getSlotStatus(slot);
  const p1 = slot.side1Names.length > 0 ? slot.side1Names.map(firstName) : slot.side1Letters;
  const p2 = slot.side2Names.length > 0 ? slot.side2Names.map(firstName) : slot.side2Letters;
  const p1Label = p1.join(" & ");
  const p2Label = p2.join(" & ");

  const cellColors: Record<SlotStatus, string> = {
    DONE: "text-red-600",
    LIVE: "text-emerald-600",
    UPCOMING: "text-amber-700",
  };

  const scoreColors: Record<SlotStatus, string> = {
    DONE: "text-red-500",
    LIVE: "text-emerald-500",
    UPCOMING: "text-zinc-300",
  };

  return (
    <div className={`flex-1 min-w-0 flex items-center justify-between gap-1 px-3 border-l border-zinc-100 first:border-l-0`}>
      {/* Lato 1 */}
      <span className={`text-xs font-semibold truncate flex-1 text-right ${cellColors[status]}`}>
        {p1Label}
      </span>

      {/* Punteggio */}
      <div className={`shrink-0 font-black text-sm tabular-nums mx-1 ${scoreColors[status]}`}>
        {status === "DONE" ? (
          <span>{slot.points1}<span className="text-zinc-300 mx-0.5">-</span>{slot.points2}</span>
        ) : status === "LIVE" ? (
          <span className="animate-pulse">●</span>
        ) : (
          <span className="text-zinc-300 text-[10px]">vs</span>
        )}
      </div>

      {/* Lato 2 */}
      <span className={`text-xs font-semibold truncate flex-1 text-left ${cellColors[status]}`}>
        {p2Label}
      </span>
    </div>
  );
}

function ScoreboardRow({ partita, index, globalIndex }: { partita: Partita; index: number; globalIndex: number }) {
  const rowStatus = getRowStatus(partita);

  const rowBg: Record<SlotStatus, string> = {
    DONE: "bg-red-50/60 hover:bg-red-50 border-red-100",
    LIVE: "bg-emerald-50/80 hover:bg-emerald-50 border-emerald-200 shadow-sm shadow-emerald-100 ring-1 ring-emerald-300/40",
    UPCOMING: "bg-amber-50/30 hover:bg-amber-50/60 border-amber-100/60",
  };

  const rowNumColors: Record<SlotStatus, string> = {
    DONE: "bg-red-500/10 text-red-500",
    LIVE: "bg-emerald-500/20 text-emerald-600",
    UPCOMING: "bg-amber-500/10 text-amber-600",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 35, delay: index * 0.015 }}
      className={`flex items-center gap-0 border rounded-lg overflow-hidden transition-all duration-300 ${rowBg[rowStatus]}`}
      style={{ minHeight: "44px" }}
    >
      {/* Numero riga */}
      <div className={`shrink-0 w-10 flex items-center justify-center self-stretch text-xs font-black ${rowNumColors[rowStatus]}`}>
        {globalIndex}
      </div>

      {/* Stato */}
      <div className="shrink-0 w-24 flex items-center justify-center px-1">
        <StatusPill status={rowStatus} />
      </div>

      {/* Celle discipline */}
      {DISCIPLINE_ORDER.map((dk) => (
        <ScoreCell key={dk} slot={partita.sports[dk]} disciplineKey={dk} />
      ))}

      {/* Atleti fermi */}
      <div className="shrink-0 w-28 px-2 text-right">
        {partita.restingNames.length > 0 && (
          <span className="text-[9px] text-zinc-400 font-medium italic leading-tight block">
            Fermi: {partita.restingNames.map(firstName).join(", ")}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

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

  // Contatori globali
  const allPartite = data.flatMap(t => t.partite);
  const totale = allPartite.length;
  const completate = allPartite.filter(p => getRowStatus(p) === "DONE").length;
  const inCorso = allPartite.filter(p => getRowStatus(p) === "LIVE").length;
  const daGiocare = allPartite.filter(p => getRowStatus(p) === "UPCOMING").length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-zinc-200" />
            <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-t-blue-500 animate-spin" />
          </div>
          <p className="text-zinc-500 font-medium text-sm">Caricamento Scoreboard…</p>
        </div>
      </div>
    );
  }

  // Contatore globale progressivo
  let globalCounter = 0;

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* ─── Header Fisso ─── */}
      <div className="sticky top-[60px] z-50 bg-white/95 backdrop-blur-xl border-b border-zinc-200 shadow-sm">
        <div className="mx-auto max-w-screen-2xl px-4 py-3">
          {/* Titolo centrato + counters a destra */}
          <div className="relative flex items-center justify-center mb-3">
            {/* Titolo — centro assoluto */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2 bg-zinc-900 text-white px-3 py-1.5 rounded-lg">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-wider">Live Scoreboard</span>
              </div>
              <h1 className="text-lg font-black text-zinc-800 hidden sm:block">Nolimpiadi 2026</h1>
            </div>

            {/* Counters — lato destro (absolute per non spostare il centro) */}
            <div className="absolute right-0 flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-full bg-red-50 text-red-500">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />
                  {completate} Finite
                </span>
                <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {inCorso} In Corso
                </span>
                <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-full bg-amber-50 text-amber-600">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {daGiocare} Da Giocare
                </span>
              </div>
              <button
                onClick={() => fetchData(true)}
                className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
                title="Aggiorna ora"
              >
                <RefreshCw className={`w-4 h-4 text-zinc-400 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Intestazioni colonne discipline — STICKY */}
          <div className="grid text-center text-[10px] font-black uppercase tracking-widest text-zinc-400"
            style={{ gridTemplateColumns: "40px 96px 1fr 1fr 1fr 1fr 112px" }}>
            <div>#</div>
            <div>Stato</div>
            {DISCIPLINE_ORDER.map(dk => (
              <div key={dk} className="border-l border-zinc-100">{DISCIPLINE_LABELS[dk]}</div>
            ))}
            <div>Fermi</div>
          </div>
        </div>
      </div>

      {/* ─── Corpo Tabellone ─── */}
      <div className="mx-auto max-w-screen-2xl px-4 py-4 space-y-8 pb-24">

        {data.map((turno) => (
          <section key={turno.id}>
            {/* Titolo turno */}
            <div className="flex items-center gap-3 mb-3 pt-2">
              <span className="text-xs font-black uppercase tracking-widest text-zinc-400 bg-zinc-100 px-3 py-1 rounded-full">
                {turno.name}
              </span>
              <div className="flex-1 h-px bg-zinc-100" />
              <span className="text-xs text-zinc-300 font-medium">{turno.partite.length} serie</span>
            </div>

            {/* Righe */}
            <div className="space-y-1">
              {turno.partite.map((partita, idx) => {
                globalCounter++;
                return (
                  <ScoreboardRow
                    key={partita.partitaId}
                    partita={partita}
                    index={idx}
                    globalIndex={globalCounter}
                  />
                );
              })}
            </div>
          </section>
        ))}

        {/* Legenda */}
        <div className="flex items-center justify-center gap-6 pt-4 pb-2 border-t border-zinc-100">
          <span className="text-[10px] text-zinc-400 font-medium">LEGENDA:</span>
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-500">
            <span className="inline-block w-3 h-3 rounded bg-red-100 border border-red-200" />
            Partita conclusa
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
            <span className="inline-block w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
            In corso (live)
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600">
            <span className="inline-block w-3 h-3 rounded bg-amber-50 border border-amber-200" />
            Da giocare
          </span>
          {lastUpdate && (
            <span className="text-[10px] text-zinc-300 ml-4">
              Aggiornato: {lastUpdate.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}