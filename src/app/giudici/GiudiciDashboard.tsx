"use client";

import { DisciplineKind, FinalStage, MatchPhase } from "@/generated/prisma/browser";
import { type ReactElement, useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  Users, 
  Settings, 
  ChevronRight, 
  Target, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Dices,
  Sword,
  Gauge
} from "lucide-react";
import Link from "next/link";
import PremiumCard from "@/components/ui/PremiumCard";

type Athlete = { id: string; name: string };
type Discipline = {
  id: string;
  kind: DisciplineKind;
  name: string;
  teamSize: number;
  coefficient: number;
  targetMin: number | null;
  targetMax: number | null;
  targetFixed: number | null;
  targetOverride: number | null;
};

type Props = {
  athletes: Athlete[];
  disciplines: Discipline[];
};

type SideState = { points: string; athleteIds: string[] };

type FormState = {
  phase: MatchPhase;
  finalStage: FinalStage;
  targetVictory: string;
  plannedSlotId: string | null;
  sides: [SideState, SideState];
  busy: boolean;
  message: { type: "ok" | "error"; text: string } | null;
  suggestions: unknown[] | null;
  suggestionsOpen: boolean;
};

const disciplineIcons: Record<string, any> = {
  AIR_HOCKEY: <Sword className="w-5 h-5" />,
  PING_PONG: <Dices className="w-5 h-5" />,
  FRECCETTE: <Target className="w-5 h-5" />,
  CALCIO_BALILLA: <Users className="w-5 h-5" />,
};

const disciplineImages: Record<string, string> = {
  AIR_HOCKEY: "/immagini/Air Hockey.png",
  PING_PONG: "/immagini/ping pong.png",
  FRECCETTE: "/immagini/Freccette.png",
  CALCIO_BALILLA: "/immagini/Calcio-balilla.png",
};

function defaultFormState(discipline: Discipline): FormState {
  const teamSize = Math.max(1, discipline.teamSize);
  const blankSide = (): SideState => ({ points: "", athleteIds: Array.from({ length: teamSize }, () => "") });
  const defaultTarget = discipline.targetOverride ?? discipline.targetFixed;
  return {
    phase: MatchPhase.QUALIFICAZIONE,
    finalStage: FinalStage.QUARTI,
    targetVictory: defaultTarget !== null ? String(defaultTarget) : "",
    plannedSlotId: null,
    sides: [blankSide(), blankSide()],
    busy: false,
    message: null,
    suggestions: null,
    suggestionsOpen: false,
  };
}

function parseIntOrNull(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
  return n;
}

export default function GiudiciDashboard({ athletes, disciplines }: Props) {
  const byKind = useMemo(() => new Map(disciplines.map((d) => [d.kind, d])), [disciplines]);
  const athleteById = useMemo(() => new Map(athletes.map((a) => [a.id, a])), [athletes]);
  const [stateByKind, setStateByKind] = useState<Record<string, FormState>>(() => {
    const init: Record<string, FormState> = {};
    for (const d of disciplines) init[d.kind] = defaultFormState(d);
    return init;
  });
  const [idleAthletes, setIdleAthletes] = useState<Athlete[]>([]);
  const [turnBusy, setTurnBusy] = useState(false);
  const [turnMessage, setTurnMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [turnInfo, setTurnInfo] = useState<{ index: number; scheduledAt: string | null } | null>(null);
  const [turnMode, setTurnMode] = useState<"planned" | "suggested" | "finals" | "phase1_complete" | null>(null);
  const [turnDurationMinutes, setTurnDurationMinutes] = useState<number | null>(null);
  const [phase1Meta, setPhase1Meta] = useState<{ seriesPlanned: number | null; macroTurnsPlanned: number | null }>(() => ({
    seriesPlanned: null,
    macroTurnsPlanned: null,
  }));
  const [turnPlannedSlotByKind, setTurnPlannedSlotByKind] = useState<Record<string, string | null>>({});
  const [turnCompletedByKind, setTurnCompletedByKind] = useState<Record<string, boolean>>({});
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/turni/plan", { cache: "no-store" });
        const data = (await res.json()) as {
          ok: boolean;
          turnDurationMinutes?: number;
          turnsPlanned?: number;
        };
        if (!cancelled && res.ok && data.ok && typeof data.turnDurationMinutes === "number") {
          setTurnDurationMinutes(data.turnDurationMinutes);
          setPhase1Meta({
            seriesPlanned: typeof data.turnsPlanned === "number" ? data.turnsPlanned : null,
            macroTurnsPlanned: null,
          });
        }
      } catch {
        if (!cancelled) setTurnDurationMinutes(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!turnInfo?.scheduledAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [turnInfo?.scheduledAt]);

  function update(kind: DisciplineKind, updater: (prev: FormState) => FormState) {
    setStateByKind((prev) => ({ ...prev, [kind]: updater(prev[kind]) }));
  }

  const generateTurn = useCallback(async () => {
    setTurnBusy(true);
    setTurnMessage(null);
    try {
      const res = await fetch("/api/turni/suggest", { cache: "no-store" });
      const data = (await res.json()) as any;
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Errore caricamento serie");

      if (data.mode === "phase1_complete") {
        setTurnMode("phase1_complete");
        setTurnInfo(null);
        setIdleAthletes([]);
        setTurnPlannedSlotByKind({});
        setTurnCompletedByKind({});
        setStateByKind((prev) => {
          const next = { ...prev };
          for (const d of disciplines) {
            const current = next[d.kind] ?? defaultFormState(d);
            next[d.kind] = {
              ...current,
              phase: MatchPhase.FINALI,
              finalStage: FinalStage.QUARTI,
              plannedSlotId: null,
              sides: current.sides.map((side) => ({ ...side, points: "", athleteIds: side.athleteIds.map(() => "") })) as any,
              busy: false,
              message: null,
              suggestionsOpen: false,
            };
          }
          return next;
        });
        setTurnMessage({ type: "ok", text: data.message ?? "Qualificazioni completate. Vai a Finali." });
        return;
      }

      if (data.mode === "finals") {
        setTurnMode("finals");
        setTurnInfo(null);
        setIdleAthletes([]);
        setTurnPlannedSlotByKind({});
        setTurnCompletedByKind({});
        if (!data.matches) throw new Error(data.error ?? "Errore caricamento finali");
        setStateByKind((prev) => {
          const next = { ...prev };
          for (const d of disciplines) {
            const current = next[d.kind] ?? defaultFormState(d);
            const match = data.matches?.[d.kind];
            if (!match) {
              next[d.kind] = { ...current, phase: MatchPhase.FINALI, plannedSlotId: null, busy: false, message: null, suggestionsOpen: false };
              continue;
            }
            next[d.kind] = {
              ...current,
              phase: MatchPhase.FINALI,
              finalStage: match.finalStage ?? FinalStage.QUARTI,
              targetVictory: String(match.targetVictory),
              plannedSlotId: null,
              sides: [
                { ...current.sides[0], points: "", athleteIds: match.side1 },
                { ...current.sides[1], points: "", athleteIds: match.side2 },
              ],
              busy: false,
              message: null,
              suggestionsOpen: false,
            };
          }
          return next;
        });
        setTurnMessage({ type: "ok", text: data.message ?? "Finali: caricato prossimo match" });
        return;
      }

      setTurnInfo(data.turn ? { index: data.turn.index, scheduledAt: data.turn.scheduledAt } : null);
      setTurnMode(data.mode ?? null);
      const nextIdle = (data.idleAthletes ?? []).map((a: any) => athleteById.get(a.id) ?? a).filter(Boolean) as Athlete[];
      setIdleAthletes(nextIdle);

      setTurnCompletedByKind({});
      setTurnPlannedSlotByKind(() => {
        const next: Record<string, string | null> = {};
        for (const [kindKey, match] of Object.entries(data.matches || {})) {
          next[kindKey] = (match as any).plannedSlotId ?? null;
        }
        return next;
      });

      setStateByKind((prev) => {
        const next = { ...prev };
        for (const d of disciplines) {
          const match = data.matches?.[d.kind];
          const current = next[d.kind] ?? defaultFormState(d);
          if (!match) {
            next[d.kind] = { ...defaultFormState(d), message: null, suggestionsOpen: false };
            continue;
          }
          next[d.kind] = {
            ...current,
            phase: MatchPhase.QUALIFICAZIONE,
            targetVictory: String(match.targetVictory),
            plannedSlotId: match.plannedSlotId ?? null,
            sides: [
              { ...current.sides[0], points: "", athleteIds: match.side1 },
              { ...current.sides[1], points: "", athleteIds: match.side2 },
            ],
            message: null,
            suggestionsOpen: false,
          };
        }
        return next;
      });

      setTurnMessage({ type: "ok", text: data.mode === "planned" ? "Serie pianificata caricata" : "Serie generata" });
    } catch (e) {
      setTurnMessage({ type: "error", text: e instanceof Error ? e.message : "Errore caricamento serie" });
    } finally {
      setTurnBusy(false);
    }
  }, [athleteById, disciplines]);

  const plannedTurnActiveKinds = disciplines.map((d) => d.kind).filter((k) => Boolean(turnPlannedSlotByKind[k]));
  const plannedTurnDoneCount = plannedTurnActiveKinds.filter((k) => Boolean(turnCompletedByKind[k])).length;
  const plannedTurnAllDone = turnMode === "planned" && plannedTurnActiveKinds.length > 0 && plannedTurnDoneCount === plannedTurnActiveKinds.length;

  async function loadSuggestions(kind: DisciplineKind) {
    update(kind, (s) => ({ ...s, busy: true, message: null }));
    try {
      const res = await fetch(`/api/suggestions?kind=${encodeURIComponent(kind)}`, { cache: "no-store" });
      const data = (await res.json()) as { ok: boolean; rows?: unknown[]; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Errore suggerimenti");
      update(kind, (s) => ({ ...s, suggestions: data.rows ?? [], suggestionsOpen: true, busy: false }));
    } catch (e) {
      update(kind, (s) => ({
        ...s,
        busy: false,
        message: { type: "error", text: e instanceof Error ? e.message : "Errore suggerimenti" },
      }));
    }
  }

  async function submit(kind: DisciplineKind) {
    const discipline = byKind.get(kind);
    if (!discipline) return;
    const s = stateByKind[kind];

    const targetVictory = parseIntOrNull(s.targetVictory);
    const points1 = parseIntOrNull(s.sides[0].points);
    const points2 = parseIntOrNull(s.sides[1].points);

    if (targetVictory === null || points1 === null || points2 === null) {
      update(kind, (prev) => ({ ...prev, message: { type: "error", text: "Inserisci punti per entrambi i lati" } }));
      return;
    }

    const side1Ids = s.sides[0].athleteIds.filter(Boolean);
    const side2Ids = s.sides[1].athleteIds.filter(Boolean);
    if (side1Ids.length !== discipline.teamSize || side2Ids.length !== discipline.teamSize) {
      update(kind, (prev) => ({
        ...prev,
        message: { type: "error", text: `Seleziona ${discipline.teamSize} atleta/i` },
      }));
      return;
    }

    update(kind, (prev) => ({ ...prev, busy: true, message: null }));
    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          disciplineKind: kind,
          phase: s.phase,
          finalStage: s.phase === MatchPhase.FINALI ? s.finalStage : undefined,
          targetVictory,
          plannedSlotId: s.plannedSlotId ?? undefined,
          sides: [
            { points: points1, athleteIds: side1Ids },
            { points: points2, athleteIds: side2Ids },
          ],
        }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Errore salvataggio");

      if (turnMode === "planned" && s.plannedSlotId && turnPlannedSlotByKind[kind] === s.plannedSlotId) {
        setTurnCompletedByKind((prev) => ({ ...prev, [kind]: true }));
      }

      update(kind, () => ({
        ...defaultFormState(discipline),
        message: { type: "ok", text: "Risultato inserito" },
      }));
    } catch (e) {
      update(kind, (prev) => ({
        ...prev,
        busy: false,
        message: { type: "error", text: e instanceof Error ? e.message : "Errore salvataggio" },
      }));
    }
  }

  const phaseBadge =
    turnMode === "planned" ? "Qualificazioni" :
    turnMode === "suggested" ? "Turno manuale" :
    turnMode === "finals" ? "Finali" :
    turnMode === "phase1_complete" ? "Fase 1 completata" : "Qualificazioni";

  return (
    <div className="flex flex-col gap-6">
      {/* Header Bar */}
      <PremiumCard className="bg-white/80 backdrop-blur-2xl ring-1 ring-black/5 shadow-xl">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
                <Gauge className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-[#1d1d1f]">Centrale Giudici</h1>
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">
                  <span className="text-blue-600 px-2 py-0.5 bg-blue-50 rounded-full">{phaseBadge}</span>
                  {turnInfo && (
                    <>
                      <span className="opacity-30">•</span> 
                      <span className="text-[#1d1d1f]">Serie {turnInfo.index} {phase1Meta.seriesPlanned && `di ${phase1Meta.seriesPlanned}`}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => void generateTurn()}
                disabled={turnBusy || !!(turnMode === "planned" && turnInfo && !plannedTurnAllDone)}
                className="group flex items-center gap-2 rounded-2xl bg-[#1d1d1f] px-6 py-3 text-sm font-bold text-white hover:bg-black transition-all shadow-lg disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${turnBusy ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />
                {turnMode === "planned" && turnInfo ? "Prossima Serie" : "Carica Serie"}
              </button>
              {turnMode === "phase1_complete" && (
                <Link href="/admin/finali" className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:shadow-lg hover:shadow-blue-300 transition-all">
                  Vai a Finali
                </Link>
              )}
            </div>
          </div>

          {/* Progress Bar Area */}
          {turnInfo && phase1Meta.seriesPlanned && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1">
                <span>Progresso Torneo</span>
                <span>{Math.round((turnInfo.index / phase1Meta.seriesPlanned) * 100)}%</span>
              </div>
              <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden p-0.5 ring-1 ring-zinc-200/50">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(turnInfo.index / phase1Meta.seriesPlanned) * 100}%` }}
                  className="h-full bg-blue-600 rounded-full shadow-[0_0_12px_rgba(0,113,227,0.4)]"
                />
              </div>
            </div>
          )}
        </div>
      </PremiumCard>

      {/* Info Bar */}
      <AnimatePresence>
        {(idleAthletes.length > 0 || turnMessage) && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col gap-2"
          >
            {idleAthletes.length > 0 && (
              <div className="bg-emerald-50/50 ring-1 ring-emerald-500/20 rounded-2xl px-4 py-2.5 flex items-center gap-3">
                <Trophy className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-bold text-emerald-800">
                  <span className="opacity-60">A riposo:</span> {idleAthletes.map(a => a.name).join(", ")}
                </span>
              </div>
            )}
            {turnMessage && (
              <div className={`rounded-2xl px-4 py-2.5 flex items-center gap-3 ring-1 ${
                turnMessage.type === "ok" ? "bg-accent/5 ring-accent/20 text-accent" : "bg-red-50 ring-red-200 text-red-600"
              }`}>
                {turnMessage.type === "ok" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span className="text-sm font-bold">{turnMessage.text}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disciplines Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {disciplines.map((d, idx) => {
          const s = stateByKind[d.kind];
          const disciplineTarget = d.targetOverride ?? d.targetFixed;
          const bgImage = disciplineImages[d.kind];

          return (
            <PremiumCard key={d.id} delay={idx * 0.05} className="flex flex-col p-0 overflow-hidden group/card relative">
              {/* Background Image with Overlay */}
              {bgImage && (
                <div className="absolute inset-0 z-0">
                  <img src={bgImage} alt="" className="w-full h-full object-cover opacity-20 grayscale group-hover/card:scale-110 group-hover/card:opacity-30 transition-all duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/80 to-white/95" />
                </div>
              )}

              <div className="relative z-10 flex flex-col h-full">
                {/* Card Header: Name & Target */}
                <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-white/40 backdrop-blur-md rounded-t-[32px]">
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2.5 rounded-2xl shadow-sm text-blue-600 ring-1 ring-zinc-200/50">
                      {disciplineIcons[d.kind] || <Target className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-black text-zinc-900 leading-tight">{d.name}</h3>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                        {d.teamSize === 2 ? "Doppio" : "Singolo"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter">Target</span>
                    <span className="text-sm font-black text-blue-600 leading-none">{disciplineTarget ?? "—"}</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex flex-col gap-6">
                  {/* 1. Suggestions Button */}
                  <div className="relative">
                    <button
                      onClick={() => s.suggestionsOpen ? update(d.kind, (p) => ({ ...p, suggestionsOpen: false })) : void loadSuggestions(d.kind)}
                      disabled={s.busy}
                      className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
                        s.suggestionsOpen ? "bg-zinc-900 text-white" : "bg-white/60 backdrop-blur-sm text-zinc-500 ring-1 ring-zinc-200 hover:bg-white"
                      }`}
                    >
                      {s.suggestionsOpen ? "Chiudi Suggerimenti" : "Suggerisci Match"}
                    </button>
                    
                    <AnimatePresence>
                      {s.suggestionsOpen && Array.isArray(s.suggestions) && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-50 top-full left-0 right-0 mt-2 bg-white rounded-2xl p-2 shadow-2xl ring-1 ring-black/5 flex flex-col gap-1.5"
                        >
                          {s.suggestions.length === 0 ? (
                            <p className="text-[10px] font-bold text-zinc-400 text-center py-3">Nessun match disponibile</p>
                          ) : (
                            s.suggestions.slice(0, 3).map((row: any, i) => (
                              <button
                                key={i}
                                onClick={() => {
                                  const side1 = d.teamSize === 1 ? [row.athleteA.id] : [row.teamA[0].id, row.teamA[1].id];
                                  const side2 = d.teamSize === 1 ? [row.athleteB.id] : [row.teamB[0].id, row.teamB[1].id];
                                  update(d.kind, (p) => ({
                                    ...p,
                                    sides: [
                                      { ...p.sides[0], athleteIds: side1 },
                                      { ...p.sides[1], athleteIds: side2 },
                                    ],
                                    suggestionsOpen: false
                                  }));
                                }}
                                className="text-left p-3 rounded-xl bg-zinc-50 border border-zinc-100 hover:border-blue-500 hover:bg-blue-50/30 transition-all group/sugg"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-bold text-zinc-700 truncate leading-snug">
                                    {d.teamSize === 1 ? `${row.athleteA.name} vs ${row.athleteB.name}` : `${row.teamA[0].name}+${row.teamA[1].name} vs...`}
                                  </span>
                                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover/sugg:text-blue-600 transition-transform group-hover/sugg:translate-x-0.5" />
                                </div>
                              </button>
                            ))
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 2. Sides & Points */}
                  <div className="grid grid-cols-2 gap-4">
                    <SideInput
                      title="Lato A"
                      color="emerald"
                      points={s.sides[0].points}
                      athleteIds={s.sides[0].athleteIds}
                      athletes={athletes}
                      onChange={(next) => update(d.kind, (p) => ({ ...p, sides: [next, p.sides[1]] }))}
                    />
                    <SideInput
                      title="Lato B"
                      color="blue"
                      points={s.sides[1].points}
                      athleteIds={s.sides[1].athleteIds}
                      athletes={athletes}
                      onChange={(next) => update(d.kind, (p) => ({ ...p, sides: [p.sides[0], next] }))}
                    />
                  </div>

                  {/* 3. Action Section */}
                  <div className="flex flex-col gap-3 mt-auto">
                    <button
                      onClick={() => void submit(d.kind)}
                      disabled={s.busy}
                      className="w-full bg-blue-600 text-white py-5 rounded-[24px] font-black text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-[0.97] transition-all disabled:opacity-50 flex flex-col items-center justify-center relative overflow-hidden group/btn"
                    >
                      <div className="relative z-10 flex items-center gap-2">
                        {s.busy ? (
                          <RefreshCw className="w-6 h-6 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-6 h-6" />
                            <span>REGISTRA</span>
                          </>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                    </button>
                  </div>

                  {/* Status Messages */}
                  {s.message && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`text-[10px] font-black uppercase tracking-widest text-center py-2 rounded-xl border ${
                        s.message.type === "ok" ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-red-50 border-red-100 text-red-600"
                      }`}
                    >
                      {s.message.text}
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Busy Overlay */}
              {s.busy && (
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-30 rounded-[32px] flex items-center justify-center" />
              )}
            </PremiumCard>
          );
        })}
      </div>
    </div>
  );
}

function SideInput({ title, color, points, athleteIds, athletes, onChange }: { 
  title: string; 
  color: "emerald" | "blue";
  points: string;
  athleteIds: string[];
  athletes: Athlete[];
  onChange: (next: SideState) => void;
}) {
  return (
    <div className={`flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-black uppercase tracking-widest text-${color}-500`}>{title}</span>
        <input 
          type="number"
          placeholder="Pts"
          value={points}
          onChange={(e) => onChange({ points: e.target.value, athleteIds })}
          className={`w-12 h-10 rounded-xl text-center font-black text-base bg-white/80 ring-1 ring-zinc-200 focus:ring-blue-500 focus:outline-none transition-all shadow-sm`}
        />
      </div>
      <div className="flex flex-col gap-2">
        {athleteIds.map((id, i) => (
          <select
            key={i}
            value={id}
            onChange={(e) => {
              const next = [...athleteIds];
              next[i] = e.target.value;
              onChange({ points, athleteIds: next });
            }}
            className="w-full h-10 rounded-xl text-xs font-black bg-white ring-1 ring-zinc-200 px-2 focus:ring-blue-500 focus:outline-none transition-all hover:bg-zinc-50 shadow-sm appearance-none cursor-pointer"
          >
            <option value="">Atleta...</option>
            {athletes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        ))}
      </div>
    </div>
  );
}