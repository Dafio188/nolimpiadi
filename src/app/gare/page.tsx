"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Clock, CheckCircle2, RefreshCw } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type SportState = "TODO" | "DONE";

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
  turnoName: string; // aggiunto in fase di flatten
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

function flattenPartite(data: TurnoBlock[]): Partita[] {
  return data.flatMap(turno =>
    turno.partite.map(p => ({ ...p, turnoName: turno.name }))
  );
}

// ─── Sticky Scoreboard Header ─────────────────────────────────────────────────

function ScoreboardHeader({
  completate, daGiocare, currentPartita, isRefreshing, onRefresh,
}: {
  completate: number;
  daGiocare: number;
  currentPartita: Partita | null;
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
  const currentFermi = currentPartita?.restingNames.map(firstName).join(", ") ?? null;

  return (
    <div className="sticky top-[60px] z-50 bg-white/97 backdrop-blur-xl border-b border-zinc-200 shadow-sm">
      <div className="mx-auto max-w-screen-2xl px-4 py-2.5">

        {/* Riga titolo + counter */}
        <div className="relative flex items-center justify-center mb-2.5">
          {/* Titolo centrato */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 bg-zinc-900 text-white px-3 py-1.5 rounded-lg">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-black uppercase tracking-wider">Live Scoreboard</span>
            </div>
            <h1 className="text-lg font-black text-zinc-800 hidden sm:block">Nolimpiadi 2026</h1>
          </div>

          {/* Counter + refresh — destra */}
          <div className="absolute right-0 flex items-center gap-1.5">
            <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-full bg-red-50 text-red-500">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />{completate} Finite
            </span>
            {currentPartita && (
              <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />1 In Corso
              </span>
            )}
            <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-full bg-amber-50 text-amber-600">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />{daGiocare} Da Giocare
            </span>
            <button onClick={onRefresh} className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors" title="Aggiorna ora">
              <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Intestazioni colonne */}
        <div
          className="grid items-center text-center text-[9px] font-black uppercase tracking-widest text-zinc-400"
          style={{ gridTemplateColumns: "40px 88px 1fr 1fr 1fr 1fr 140px" }}
        >
          <div className="text-center">#</div>
          <div>Stato</div>
          {DISCIPLINE_ORDER.map(dk => (
            <div key={dk} className="border-l border-zinc-100 px-1">{DISCIPLINE_LABELS[dk]}</div>
          ))}
          {/* Colonna FERMI — dinamica con atleti della serie corrente */}
          <div className="border-l border-zinc-100 px-2 text-left">
            {currentFermi ? (
              <span className="text-emerald-600 normal-case font-bold text-[9px]">
                Fermi: <span className="font-black">{currentFermi}</span>
              </span>
            ) : (
              "Fermi"
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Current Match Card (STICKY) ──────────────────────────────────────────────

function CurrentMatchCard({ partita }: { partita: Partita }) {
  const slots = DISCIPLINE_ORDER.map(k => ({
    key: k,
    slot: partita.sports[k] as SportSlot | undefined,
  }));

  return (
    <motion.div
      layout
      layoutId={`partita-${partita.partitaId}`}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      // STICKY: rimane ancorata sotto l'header mentre si scrolla
      className="sticky z-40 overflow-hidden rounded-xl border-2 border-emerald-400 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-300/20"
      style={{ top: "148px" }}
    >
      {/* Glow decorativo */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/5 via-transparent to-emerald-400/5 pointer-events-none" />

      {/* Header card compatto */}
      <div
        className="grid items-center px-3 py-2 border-b border-emerald-200/60 bg-emerald-500/5"
        style={{ gridTemplateColumns: "40px 88px 1fr 1fr 1fr 1fr 140px" }}
      >
        {/* Numero */}
        <div className="flex items-center justify-center">
          <span className="text-sm font-black text-emerald-700">{partita.partitaIndex}</span>
        </div>

        {/* Badge "In Corso" */}
        <div className="flex items-center justify-center">
          <span className="relative flex items-center gap-1.5 text-[10px] font-black text-emerald-700 uppercase tracking-wider">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            In Corso
          </span>
        </div>

        {/* Sfidanti per disciplina — allineati alle colonne */}
        {slots.map(({ key, slot }) => {
          if (!slot) return <div key={key} className="border-l border-emerald-100" />;
          const p1 = slot.side1Names.length > 0 ? slot.side1Names.map(firstName) : slot.side1Letters;
          const p2 = slot.side2Names.length > 0 ? slot.side2Names.map(firstName) : slot.side2Letters;

          return (
            <div key={key} className="flex flex-col items-center border-l border-emerald-100 px-2 py-1">
              {/* Badge disciplina */}
              <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 mb-1">
                {DISCIPLINE_LABELS[key]}
              </span>
              {/* Nomi sfidanti */}
              <div className="flex items-center justify-center gap-1.5 w-full">
                <div className="flex flex-col items-end flex-1 min-w-0">
                  {p1.map((n, i) => (
                    <span key={i} className="text-sm font-bold text-zinc-800 truncate max-w-full text-right leading-tight">{n}</span>
                  ))}
                </div>
                <span className="text-[9px] text-zinc-300 font-black italic shrink-0">vs</span>
                <div className="flex flex-col items-start flex-1 min-w-0">
                  {p2.map((n, i) => (
                    <span key={i} className="text-sm font-bold text-zinc-800 truncate max-w-full leading-tight">{n}</span>
                  ))}
                </div>
              </div>
              {/* Target */}
              {slot.targetVictory > 0 && (
                <span className="text-[8px] text-zinc-400 mt-0.5">Target: {slot.targetVictory}</span>
              )}
              {/* Status */}
              <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest animate-pulse mt-0.5">
                In attesa…
              </div>
            </div>
          );
        })}

        {/* Turno info (colonna fermi - header card mostra il turno) */}
        <div className="border-l border-emerald-100 px-2 text-left">
          <span className="text-[9px] text-emerald-600 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
            {partita.turnoName}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Scoreboard Row ───────────────────────────────────────────────────────────

function ScoreboardRow({
  partita, globalIndex, status, delay,
}: {
  partita: Partita;
  globalIndex: number;
  status: "DONE" | "UPCOMING";
  delay: number;
}) {
  const rowStyles = {
    DONE: "bg-red-50/60 hover:bg-red-50 border-red-100",
    UPCOMING: "bg-amber-50/30 hover:bg-amber-50/60 border-amber-100/60",
  };
  const numStyles = {
    DONE: "text-red-400 font-black",
    UPCOMING: "text-amber-500 font-black",
  };

  return (
    <motion.div
      layout
      layoutId={`partita-${partita.partitaId}`}
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 4 }}
      transition={{ type: "spring", stiffness: 400, damping: 38, delay }}
      className={`grid items-center border rounded-lg overflow-hidden transition-colors duration-300 ${rowStyles[status]}`}
      style={{ gridTemplateColumns: "40px 88px 1fr 1fr 1fr 1fr 140px", minHeight: "46px" }}
    >
      {/* # */}
      <div className={`flex items-center justify-center self-stretch text-sm ${numStyles[status]}`}>
        {globalIndex}
      </div>

      {/* Status pill */}
      <div className="flex items-center justify-center">
        {status === "DONE" ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-500 text-[10px] font-black uppercase">
            <CheckCircle2 className="w-2.5 h-2.5" /> Finita
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 text-[10px] font-black uppercase">
            <Clock className="w-2.5 h-2.5" /> Attesa
          </span>
        )}
      </div>

      {/* Celle disciplina */}
      {DISCIPLINE_ORDER.map((dk) => {
        const slot = partita.sports[dk];
        if (!slot) return <div key={dk} className="border-l border-zinc-100" />;

        const p1 = slot.side1Names.length > 0 ? slot.side1Names.map(firstName) : slot.side1Letters;
        const p2 = slot.side2Names.length > 0 ? slot.side2Names.map(firstName) : slot.side2Letters;
        const textColor = status === "DONE" ? "text-red-600" : "text-amber-700";
        const scoreColor = status === "DONE" ? "text-red-500 font-black text-sm" : "text-zinc-300 text-xs";

        return (
          <div key={dk} className="flex items-center justify-between gap-1 px-2.5 border-l border-zinc-100 py-1.5">
            <span className={`text-xs font-semibold truncate flex-1 text-right ${textColor}`}>
              {p1.join(" & ")}
            </span>
            <span className={`shrink-0 tabular-nums font-black mx-1.5 ${scoreColor}`}>
              {status === "DONE" ? `${slot.points1}–${slot.points2}` : "vs"}
            </span>
            <span className={`text-xs font-semibold truncate flex-1 text-left ${textColor}`}>
              {p2.join(" & ")}
            </span>
          </div>
        );
      })}

      {/* Fermi */}
      <div className="border-l border-zinc-100 px-2.5 text-left">
        {partita.restingNames.length > 0 && (
          <span className="text-[9px] text-zinc-400 font-medium italic leading-tight block">
            {partita.restingNames.map(firstName).join(", ")}
          </span>
        )}
      </div>
    </motion.div>
  );
}

interface ActiveFinale {
  id: string;
  disciplineName: string;
  disciplineKind: string;
  s1: string[];
  s2: string[];
}

export default function GarePage() {
  const [data, setData] = useState<TurnoBlock[]>([]);
  const [activeFinals, setActiveFinals] = useState<ActiveFinale[]>([]);
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
        setActiveFinals(json.data.activeFinals || []);
        setLastUpdate(new Date());
      }
    } catch { /* silenzioso */ }
    finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 15000);
    return () => clearInterval(interval);
  }, []);

  // Flatten tutte le partite in ordine mantenendo il nome turno
  const allPartite: Partita[] = data.flatMap(turno =>
    turno.partite.map(p => ({ ...p, turnoName: turno.name }))
  );

  // Partizioniamo: done, current, upcoming
  const donePartite = allPartite.filter(p => isPartitaDone(p));
  const notDone = allPartite.filter(p => !isPartitaDone(p));
  const currentPartita = notDone[0] ?? null;
  const upcomingPartite = notDone.slice(1);

  const completate = donePartite.length;
  const daGiocare = upcomingPartite.length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-14 w-14">
            <div className="h-14 w-14 rounded-full border-4 border-zinc-200" />
            <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin" />
          </div>
          <p className="text-zinc-500 font-medium text-sm">Caricamento Scoreboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">

      {/* ─── Sticky Scoreboard Header ─── */}
      <ScoreboardHeader
        completate={completate}
        daGiocare={daGiocare}
        currentPartita={currentPartita}
        isRefreshing={isRefreshing}
        onRefresh={() => fetchData(true)}
      />

      {/* ─── Corpo pagina ─── */}
      <div className="mx-auto max-w-screen-2xl px-4 pt-3 pb-32 space-y-1">

        {activeFinals.length > 0 && (
          <div className="mb-8 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-green-200" />
              <span className="text-xs font-black uppercase tracking-widest text-green-600 bg-green-100 px-3 py-1 rounded-full animate-pulse flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                FINALI IN CORSO ({activeFinals.length})
              </span>
              <div className="flex-1 h-px bg-green-200" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeFinals.map(fin => (
                <div key={fin.id} className="p-4 rounded-xl border-2 border-green-500 bg-gradient-to-br from-green-50 to-white shadow-lg shadow-green-500/20 ring-2 ring-green-300/20">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-green-700">{fin.disciplineName}</span>
                    <span className="text-[10px] font-bold text-white bg-green-500 px-2 py-0.5 rounded-full animate-pulse">IN CAMPO</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 text-right">
                      {fin.s1.map((n, i) => <div key={i} className="text-sm font-bold text-zinc-800 truncate leading-tight">{n}</div>)}
                    </div>
                    <span className="mx-4 font-black text-green-500 text-sm">VS</span>
                    <div className="flex-1 text-left">
                      {fin.s2.map((n, i) => <div key={i} className="text-sm font-bold text-zinc-800 truncate leading-tight">{n}</div>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ZONA A: Partite FINITE — scorrono verso l'alto */}
        <AnimatePresence mode="popLayout">
          {donePartite.map((partita, idx) => (
            <ScoreboardRow
              key={partita.partitaId}
              partita={partita}
              globalIndex={idx + 1}
              status="DONE"
              delay={0}
            />
          ))}
        </AnimatePresence>

        {/* ZONA B: Serie corrente — STICKY, sempre visibile */}
        <AnimatePresence mode="popLayout">
          {currentPartita && (
            <CurrentMatchCard
              key={currentPartita.partitaId}
              partita={currentPartita}
            />
          )}
        </AnimatePresence>

        {/* Separatore visivo */}
        {upcomingPartite.length > 0 && (
          <div className="flex items-center gap-3 pt-1 pb-0.5">
            <div className="flex-1 h-px bg-amber-100" />
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">
              {upcomingPartite.length} serie in attesa
            </span>
            <div className="flex-1 h-px bg-amber-100" />
          </div>
        )}

        {/* ZONA C: Partite in ATTESA — si avvicinano verso la corrente */}
        <AnimatePresence mode="popLayout">
          {upcomingPartite.map((partita, idx) => (
            <ScoreboardRow
              key={partita.partitaId}
              partita={partita}
              globalIndex={donePartite.length + 1 + 1 + idx} // +1 current
              status="UPCOMING"
              delay={idx * 0.012}
            />
          ))}
        </AnimatePresence>

        {/* Legenda + timestamp */}
        <div className="flex flex-wrap items-center justify-center gap-5 pt-8 pb-2 border-t border-zinc-100 mt-6">
          <span className="text-[9px] text-zinc-400 font-black uppercase tracking-widest">Legenda</span>
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-500">
            <span className="w-3 h-3 rounded bg-red-100 border border-red-200 inline-block" /> Partita conclusa
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
            <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300 inline-block" /> Serie corrente
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600">
            <span className="w-3 h-3 rounded bg-amber-50 border border-amber-200 inline-block" /> Da giocare
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