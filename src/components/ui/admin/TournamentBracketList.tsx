"use client";

import { useState } from "react";
import PremiumCard from "@/components/ui/PremiumCard";
import { Trophy, Save, Trash2, Info, Users, ChevronUp, ChevronDown, Swords } from "lucide-react";
import { toast } from "sonner";
import AthleteMatchModal from "@/components/ui/AthleteMatchModal";
import { motion, AnimatePresence } from "framer-motion";

interface TournamentBracketListProps {
  disciplines: Record<string, any>;
  matches: any[];
}

function firstName(name: string): string {
  return name.split(" ")[0] ?? name;
}

function LetterBadge({ letter, isBusy, isStarted }: { letter: string | null; isBusy?: boolean; isStarted?: boolean }) {
  if (!letter) return null;
  
  let colorClass = "bg-white/80 text-zinc-600 border-zinc-200";
  if (isBusy && !isStarted) {
    colorClass = "bg-orange-100/80 text-orange-600 border-orange-200 shadow-[0_0_10px_rgba(249,115,22,0.1)]";
  } else if (isStarted) {
    colorClass = "bg-green-100/80 text-green-600 border-green-200 shadow-[0_0_10px_rgba(34,197,94,0.1)]";
  }

  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-[11px] font-black shrink-0 border backdrop-blur-sm shadow-sm transition-all ${colorClass}`}>
      {letter}
    </span>
  );
}

export default function TournamentBracketList({ disciplines, matches }: TournamentBracketListProps) {
  // Calcolo atleti attualmente in campo (status IN_PROGRESS / points: -1)
  const busyAthleteIds = new Set<string>();
  matches.forEach(m => {
    if (m.sides && m.sides.length > 0 && m.sides[0].points === -1) {
      m.sides.forEach((side: any) => {
        side.athletes?.forEach((a: any) => {
          busyAthleteIds.add(a.athleteId);
        });
      });
    }
  });

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm("Sei sicuro di voler eliminare o resettare questo match?")) return;
    try {
      const res = await fetch("/api/admin/finali/delete-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });
      if (res.ok) {
        toast.success("Match eliminato!");
        window.location.reload();
      } else {
        toast.error("Errore eliminazione");
      }
    } catch (e) {
      toast.error("Errore di rete");
    }
  };

  const handleClearGhosts = async () => {
    if (!confirm("Vuoi sbloccare tutti i giocatori bloccati eliminando i match 'in sospeso' nascosti?")) return;
    try {
      const res = await fetch("/api/admin/finali/clear-ghosts", { method: "POST" });
      if (res.ok) {
        toast.success("Giocatori sbloccati con successo!");
        window.location.reload();
      } else {
        toast.error("Errore nello sblocco");
      }
    } catch (e) {
      toast.error("Errore di rete");
    }
  };

  const [showSuggestions, setShowSuggestions] = useState(false);

  // Modal State
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (id: string) => {
    setSelectedAthleteId(id);
    setIsModalOpen(true);
  };

  const getPlayableMatches = () => {
    const playable: { discId: string, disc: string, title: string, athletes: string, athleteIds: string[] }[] = [];

    Object.values(disciplines).forEach((disc: any) => {
      const discMatches = matches.filter(m => m.disciplineId === disc.id);
      const rankings = disc.rankings || [];

      if (disc.kind === "CALCIO_BALILLA") {
        const top5 = rankings.slice(0, 5);
        if (top5.length < 5) return;
        const c1=top5[0], c2=top5[1], c3=top5[2], c4=top5[3], c5=top5[4];
        const schedule = [
          { id: 1, title: "Partita 1", s1: [c1, c2], s2: [c3, c4] },
          { id: 2, title: "Partita 2", s1: [c1, c3], s2: [c2, c5] },
          { id: 3, title: "Partita 3", s1: [c1, c5], s2: [c2, c4] },
          { id: 4, title: "Partita 4", s1: [c1, c4], s2: [c3, c5] },
          { id: 5, title: "Partita 5", s1: [c2, c3], s2: [c4, c5] },
        ];
        schedule.forEach(m => {
          const hasExact = (s:any, ids:string[]) => s?.athletes?.map((a:any)=>a.athleteId).sort().join(",") === ids.sort().join(",");
          const saved = discMatches.find(dm => {
            return (hasExact(dm.sides[0], m.s1.map(x=>x.id)) && hasExact(dm.sides[1], m.s2.map(x=>x.id))) || 
                   (hasExact(dm.sides[0], m.s2.map(x=>x.id)) && hasExact(dm.sides[1], m.s1.map(x=>x.id)));
          });
          if (!saved) {
            const isBusy = m.s1.some(a => busyAthleteIds.has(a.id)) || m.s2.some(a => busyAthleteIds.has(a.id));
            if (!isBusy) {
              playable.push({ 
                discId: disc.id,
                disc: disc.name, 
                title: m.title, 
                athletes: `${m.s1.map(a=>`${a.letter ? `[${a.letter}] ` : ""}${firstName(a.name)}`).join(" + ")} VS ${m.s2.map(a=>`${a.letter ? `[${a.letter}] ` : ""}${firstName(a.name)}`).join(" + ")}`,
                athleteIds: [...m.s1.map(a=>a.id), ...m.s2.map(a=>a.id)]
              });
            }
          }
        });
      } else {
        const quarti = discMatches.filter(m => m.finalStage === "QUARTI");
        const semi = discMatches.filter(m => m.finalStage === "SEMIFINALI");
        const f12 = discMatches.filter(m => m.finalStage === "FINALE");
        const f34 = discMatches.filter(m => m.finalStage === "FINALE_34");
        const f56 = discMatches.filter(m => m.finalStage === "FINALE_56");

        const getAthleteId = (side: any) => side?.athletes?.[0]?.athleteId;
        const hasAthlete = (match: any, athleteId: string) => match && (getAthleteId(match.sides[0]) === athleteId || getAthleteId(match.sides[1]) === athleteId);
        
        const getWinner = (match: any) => {
          if (!match) return null;
          const s1 = match.sides.find((s:any)=>s.side===1);
          const s2 = match.sides.find((s:any)=>s.side===2);
          if(!s1||!s2) return null;
          if(s1.points > s2.points) return getAthleteId(s1);
          if(s2.points > s1.points) return getAthleteId(s2);
          return null;
        };

        const getLoser = (match: any) => {
          if (!match) return null;
          const s1 = match.sides.find((s:any)=>s.side===1);
          const s2 = match.sides.find((s:any)=>s.side===2);
          if(!s1||!s2) return null;
          if(s1.points < s2.points) return getAthleteId(s1);
          if(s2.points < s1.points) return getAthleteId(s2);
          return null;
        };

        let q1 = quarti.find(m => hasAthlete(m, rankings[2]?.id) || hasAthlete(m, rankings[5]?.id));
        let q2 = quarti.find(m => m.id !== q1?.id && (hasAthlete(m, rankings[3]?.id) || hasAthlete(m, rankings[4]?.id)));
        if (!q1) q1 = quarti.find((m:any) => m.id !== q2?.id);
        if (!q2) q2 = quarti.find((m:any) => m.id !== q1?.id);

        let s1 = semi.find(m => hasAthlete(m, rankings[0]?.id));
        let s2 = semi.find(m => m.id !== s1?.id && hasAthlete(m, rankings[1]?.id));
        if (!s1) s1 = semi.find((m:any) => m.id !== s2?.id);
        if (!s2) s2 = semi.find((m:any) => m.id !== s1?.id);

        // Identificazione specifica per le finali (possono essere tutte in 'f12' causa limiti DB)
        let f1 = f12.find(m => hasAthlete(m, getWinner(s1)));
        let f3 = f34.find(m => hasAthlete(m, getLoser(s1))) || f12.find(m => m.id !== f1?.id && hasAthlete(m, getLoser(s1)));
        let f5 = f56.find(m => hasAthlete(m, getLoser(q1))) || f12.find(m => m.id !== f1?.id && m.id !== f3?.id && hasAthlete(m, getLoser(q1)));

        // Fallback estremo se non li troviamo per atleta (es. match appena popolati e senza risultati)
        if (!f1 && f12.length > 0) f1 = f12[0];
        if (!f3 && (f34.length > 0 || f12.length > 1)) f3 = f34[0] || f12.find(m => m.id !== f1?.id);
        if (!f5 && (f56.length > 0 || f12.length > 2)) f5 = f56[0] || f12.find(m => m.id !== f1?.id && m.id !== f3?.id);

        const checkPlayable = (match: any, a1: any, a2: any, title: string) => {
          if (!a1 || !a2) return;
          if (match) return; // Già in corso o salvato
          if (!busyAthleteIds.has(a1.id) && !busyAthleteIds.has(a2.id)) {
            playable.push({ 
              discId: disc.id,
              disc: disc.name, 
              title, 
              athletes: `${firstName(a1.name)} VS ${firstName(a2.name)}`,
              athleteIds: [a1.id, a2.id]
            });
          }
        };

        if (rankings.length >= 6) {
          checkPlayable(q1, rankings[2], rankings[5], "Quarto di Finale (3° vs 6°)");
        }
        if (rankings.length >= 5) {
          checkPlayable(q2, rankings[3], rankings[4], "Quarto di Finale (4° vs 5°)");
        }
        
        const wQ1 = getWinner(q1);
        const wQ2 = getWinner(q2);
        
        const aS1_2 = rankings.length >= 5 ? rankings.find((a:any)=>a.id===wQ2) : rankings[3];
        const aS2_2 = rankings.length >= 6 ? rankings.find((a:any)=>a.id===wQ1) : rankings[2];

        checkPlayable(s1, rankings[0], aS1_2, "Semifinale 1");
        checkPlayable(s2, rankings[1], aS2_2, "Semifinale 2");

        const wS1 = getWinner(s1);
        const wS2 = getWinner(s2);
        const lS1 = getLoser(s1);
        const lS2 = getLoser(s2);
        const lQ1 = getLoser(q1);
        const lQ2 = getLoser(q2);
        
        checkPlayable(f1, rankings.find((a:any)=>a.id===wS1), rankings.find((a:any)=>a.id===wS2), "Finale 1°/2°");
        checkPlayable(f3, rankings.find((a:any)=>a.id===lS1), rankings.find((a:any)=>a.id===lS2), "Finale 3°/4°");
        checkPlayable(f5, rankings.find((a:any)=>a.id===lQ1), rankings.find((a:any)=>a.id===lQ2), "Finale 5°/6°");
      }
    });
    return playable;
  };

  const getOptimalSchedule = (playable: ReturnType<typeof getPlayableMatches>) => {
    let bestSchedule: typeof playable = [];

    const backtrack = (index: number, currentSchedule: typeof playable, usedDisciplines: Set<string>, usedAthletes: Set<string>) => {
      if (currentSchedule.length > bestSchedule.length) {
        bestSchedule = [...currentSchedule];
      }
      
      for (let i = index; i < playable.length; i++) {
        const match = playable[i];
        if (usedDisciplines.has(match.discId)) continue; // Si presume 1 campo per disciplina
        
        const hasConflict = match.athleteIds.some(id => usedAthletes.has(id));
        if (!hasConflict) {
          match.athleteIds.forEach(id => usedAthletes.add(id));
          usedDisciplines.add(match.discId);
          currentSchedule.push(match);
          
          backtrack(i + 1, currentSchedule, usedDisciplines, usedAthletes);
          
          currentSchedule.pop();
          usedDisciplines.delete(match.discId);
          match.athleteIds.forEach(id => usedAthletes.delete(id));
        }
      }
    };

    backtrack(0, [], new Set(), new Set());
    return bestSchedule;
  };

  const playableMatches = getPlayableMatches();
  const suggestedMatches = getOptimalSchedule(playableMatches);

  return (
    <div className="space-y-12">
      {/* Athlete Detail Modal */}
      <AthleteMatchModal 
        athleteId={selectedAthleteId} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      <div className="flex justify-end bg-amber-50 p-4 rounded-xl border border-amber-200 shadow-sm">
        <div className="flex-1">
          <h3 className="font-bold text-amber-800">Risoluzione Problemi (Giocatori Bloccati)</h3>
          <p className="text-sm text-amber-700">Se vedi atleti occupati ma nessuna partita è "IN CAMPO", usa questo tasto per forzare lo sblocco.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-all flex items-center gap-2"
          >
            <Trophy className="w-4 h-4" />
            {showSuggestions ? "NASCONDI SUGGERIMENTI" : "SUGGERIMENTI INCONTRI"}
          </button>

          <button 
            onClick={handleClearGhosts}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-all flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            SBLOCCA TUTTI
          </button>
        </div>
      </div>

      {showSuggestions && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-indigo-50/50 backdrop-blur-md p-6 rounded-3xl border border-indigo-200/50 shadow-xl mb-12"
        >
          <div className="mb-6">
            <h3 className="text-2xl font-black text-indigo-900 flex items-center gap-3">
              <Swords className="w-6 h-6 text-indigo-500" />
              Turno Ottimale Consigliato
            </h3>
            <p className="text-indigo-700/70 text-sm font-semibold mt-1">
              Flusso di gioco massimizzato: questi incontri non hanno conflitti e possono partire insieme.
            </p>
          </div>
          
          {suggestedMatches.length === 0 ? (
            <div className="bg-white/50 rounded-2xl p-8 border border-indigo-100 text-center">
              <p className="text-indigo-700 font-bold">Nessun set di incontri contemporanei disponibile.</p>
              <p className="text-indigo-500 text-xs mt-1">Attendi la fine dei match live o verifica i qualificati.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestedMatches.map((sm, idx) => (
                <motion.div 
                  key={idx} 
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-indigo-100/50 flex flex-col gap-2 relative overflow-hidden group hover:border-indigo-300 transition-all"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500/20 group-hover:bg-indigo-500 transition-colors"></div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{sm.disc}</span>
                    <span className="text-[9px] bg-green-500 text-white font-black px-2 py-0.5 rounded-full shadow-sm">PRONTO</span>
                  </div>
                  <span className="font-black text-sm text-zinc-800 leading-tight">{sm.title}</span>
                  <div className="bg-indigo-50/30 p-2 rounded-xl border border-indigo-100/50 mt-1">
                    <span className="text-xs font-bold text-indigo-900/80 block text-center">{sm.athletes}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {Object.values(disciplines).map((disc: any) => {
        const discMatches = matches.filter(m => m.disciplineId === disc.id);
        
        if (disc.kind === "CALCIO_BALILLA") {
          return <CalcioBalillaFinals key={disc.kind} discipline={disc} matches={discMatches} onDeleteMatch={handleDeleteMatch} busyAthletes={busyAthleteIds} onOpenAthlete={openModal} />;
        }
        
        return <DisciplineBracket key={disc.kind} discipline={disc} matches={discMatches} onDeleteMatch={handleDeleteMatch} busyAthletes={busyAthleteIds} onOpenAthlete={openModal} />;
      })}
    </div>
  );
}

// --------------------------------------------------------------------------------------
// 1. CALCIO-BALILLA: GIRONE ALL'ITALIANA (5 PLAYERS, IN DOPPIO)
// --------------------------------------------------------------------------------------
function CalcioBalillaFinals({ discipline, matches, onDeleteMatch, busyAthletes, onOpenAthlete }: { discipline: any, matches: any[], onDeleteMatch: (id: string) => void, busyAthletes: Set<string>, onOpenAthlete: (id: string) => void }) {
  const rankings = discipline.rankings || [];
  
  // Top 5 athletes
  const c1 = rankings[0];
  const c2 = rankings[1];
  const c3 = rankings[2];
  const c4 = rankings[3];
  const c5 = rankings[4];

  // Definition of the 5 matches
  const schedule = [
    { id: 1, title: "Partita 1", s1: [c1, c2], s2: [c3, c4] },
    { id: 2, title: "Partita 2", s1: [c1, c3], s2: [c2, c5] },
    { id: 3, title: "Partita 3", s1: [c1, c5], s2: [c2, c4] },
    { id: 4, title: "Partita 4", s1: [c1, c4], s2: [c3, c5] },
    { id: 5, title: "Partita 5", s1: [c2, c3], s2: [c4, c5] },
  ];

  const hasExactAthletes = (side: any, ids: string[]) => {
    const sideIds = side?.athletes?.map((a:any)=>a.athleteId).sort().join(",") || "";
    const targetIds = [...ids].sort().join(",");
    return sideIds === targetIds;
  };

  const getSavedMatch = (mS1Ids: string[], mS2Ids: string[]) => {
    return matches.find(m => {
      const s1 = m.sides[0];
      const s2 = m.sides[1];
      return (hasExactAthletes(s1, mS1Ids) && hasExactAthletes(s2, mS2Ids)) || 
             (hasExactAthletes(s1, mS2Ids) && hasExactAthletes(s2, mS1Ids));
    });
  };

  const [scores, setScores] = useState<Record<number, {p1: number, p2: number}>>({});

  // Initialize scores from DB
  if (Object.keys(scores).length === 0 && schedule.every(m => m.s1.every(Boolean))) {
    const initialScores: Record<number, any> = {};
    schedule.forEach(m => {
      const saved = getSavedMatch(m.s1.map(x=>x.id), m.s2.map(x=>x.id));
      if (saved) {
        const side1 = saved.sides.find((s:any) => hasExactAthletes(s, m.s1.map(x=>x.id)));
        const side2 = saved.sides.find((s:any) => hasExactAthletes(s, m.s2.map(x=>x.id)));
        initialScores[m.id] = { p1: side1?.points || 0, p2: side2?.points || 0 };
      } else {
        initialScores[m.id] = { p1: 0, p2: 0 };
      }
    });
    setScores(initialScores);
  }

  const handleSave = async (matchDef: typeof schedule[0]) => {
    try {
      const matchScores = scores[matchDef.id];
      const res = await fetch("/api/admin/finali/save-single-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disciplineId: discipline.id,
          stage: "FINALE",
          side1AthleteIds: matchDef.s1.map(a => a.id),
          side2AthleteIds: matchDef.s2.map(a => a.id),
          points1: matchScores.p1,
          points2: matchScores.p2
        }),
      });

      if (res.ok) {
        toast.success("Match salvato!");
        window.location.reload();
      } else {
        toast.error("Errore salvataggio");
      }
    } catch (e) {
      toast.error("Errore di rete");
    }
  };

  const handleSetActive = async (matchDef: typeof schedule[0]) => {
    try {
      const res = await fetch("/api/admin/finali/set-active-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disciplineId: discipline.id,
          stage: "FINALE",
          side1AthleteIds: matchDef.s1.map(a => a.id),
          side2AthleteIds: matchDef.s2.map(a => a.id),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Giocatori mandati in campo!");
        window.location.reload(); 
      } else {
        toast.error(data.error || "Errore");
      }
    } catch (e) {
      toast.error("Errore di rete");
    }
  };

  const isReady = c1 && c2 && c3 && c4 && c5;

  return (
    <PremiumCard className="p-8 relative overflow-hidden border-2 border-indigo-500/10 shadow-2xl bg-white/40 backdrop-blur-sm">
      <div className="flex items-center gap-5 mb-10">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Trophy className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-4xl font-black tracking-tight text-zinc-900">{discipline.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <p className="text-indigo-600 font-black text-xs uppercase tracking-widest">Girone Finale all'Italiana (5 Giocatori)</p>
          </div>
        </div>
      </div>

      {!isReady ? (
        <div className="p-10 bg-red-50/50 backdrop-blur-md border-2 border-red-100 rounded-3xl text-center">
          <p className="text-red-600 font-black text-lg">QUALIFICAZIONI INCOMPLETE</p>
          <p className="text-red-500/80 text-sm mt-1 font-bold">Servono i primi 5 classificati. Attualmente: {rankings.length}/5</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {schedule.map(m => {
            const savedMatch = getSavedMatch(m.s1.map(x=>x.id), m.s2.map(x=>x.id));
            const isSaved = !!savedMatch && savedMatch.sides[0].points >= 0;
            const isInProgress = !!savedMatch && savedMatch.sides[0].points === -1;
            const isStarted = isSaved || isInProgress;

            const isS1Busy = m.s1.some(a => busyAthletes.has(a?.id));
            const isS2Busy = m.s2.some(a => busyAthletes.has(a?.id));
            const isBlocked = !isStarted && (isS1Busy || isS2Busy);

            return (
              <motion.div 
                key={m.id} 
                whileHover={{ y: -4 }}
                className={`p-6 rounded-3xl border-2 transition-all relative overflow-hidden ${
                isInProgress ? "bg-green-50/80 border-green-500 shadow-xl shadow-green-500/10 ring-4 ring-green-500/10 backdrop-blur-sm" :
                isSaved ? "bg-zinc-50/50 border-zinc-200/50 grayscale-[0.5]" :
                "bg-white border-zinc-100 shadow-xl shadow-zinc-200/20"
              }`}>
                <div className="flex justify-between items-center mb-6">
                  <h4 className={`text-[11px] font-black uppercase tracking-[0.2em] ${isInProgress ? "text-green-700" : "text-zinc-400"}`}>{m.title}</h4>
                  {isSaved && <div className="text-[10px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">COMPLETATO</div>}
                  {isInProgress && (
                    <div className="flex items-center gap-2 text-[10px] font-black text-white bg-green-500 px-3 py-1 rounded-full shadow-lg shadow-green-500/20 animate-pulse">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      LIVE
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-6 mb-6">
                  {/* SQUADRA 1 */}
                  <div className="flex-1 flex flex-col items-center gap-3">
                    <div className="flex flex-col gap-2 w-full">
                      {[m.s1[0], m.s1[1]].map((a, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-zinc-50/50 p-2 rounded-xl border border-zinc-100/50">
                          <LetterBadge letter={a?.letter} isBusy={busyAthletes.has(a?.id)} isStarted={isStarted} />
                          <span 
                            className={`text-sm font-black truncate ${busyAthletes.has(a?.id) && !isStarted ? "text-orange-500" : "text-zinc-800"}`}
                            onClick={() => onOpenAthlete(a.id)}
                          >
                            {firstName(a.name)}
                          </span>
                        </div>
                      ))}
                    </div>
                    {isStarted && (
                      <motion.input 
                        initial={false}
                        type="number" 
                        value={scores[m.id]?.p1 === -1 ? 0 : scores[m.id]?.p1} 
                        onChange={(e) => setScores(prev => ({...prev, [m.id]: { ...prev[m.id], p1: parseInt(e.target.value) || 0 }}))}
                        className={`w-full h-14 text-center rounded-2xl border-none text-3xl font-black shadow-inner transition-all focus:ring-4 focus:ring-indigo-500/20 ${isInProgress ? "bg-white text-green-900" : "bg-zinc-200/50 text-zinc-500"}`}
                      />
                    )}
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="w-0.5 h-12 bg-zinc-100 rounded-full" />
                    <span className={`my-2 text-[10px] font-black ${isInProgress ? "text-green-500" : "text-zinc-300"}`}>VS</span>
                    <div className="w-0.5 h-12 bg-zinc-100 rounded-full" />
                  </div>

                  {/* SQUADRA 2 */}
                  <div className="flex-1 flex flex-col items-center gap-3">
                    <div className="flex flex-col gap-2 w-full">
                      {[m.s2[0], m.s2[1]].map((a, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-zinc-50/50 p-2 rounded-xl border border-zinc-100/50">
                          <LetterBadge letter={a?.letter} isBusy={busyAthletes.has(a?.id)} isStarted={isStarted} />
                          <span 
                            className={`text-sm font-black truncate ${busyAthletes.has(a?.id) && !isStarted ? "text-orange-500" : "text-zinc-800"}`}
                            onClick={() => onOpenAthlete(a.id)}
                          >
                            {firstName(a.name)}
                          </span>
                        </div>
                      ))}
                    </div>
                    {isStarted && (
                      <motion.input 
                        initial={false}
                        type="number" 
                        value={scores[m.id]?.p2 === -1 ? 0 : scores[m.id]?.p2} 
                        onChange={(e) => setScores(prev => ({...prev, [m.id]: { ...prev[m.id], p2: parseInt(e.target.value) || 0 }}))}
                        className={`w-full h-14 text-center rounded-2xl border-none text-3xl font-black shadow-inner transition-all focus:ring-4 focus:ring-indigo-500/20 ${isInProgress ? "bg-white text-green-900" : "bg-zinc-200/50 text-zinc-500"}`}
                      />
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  {!isStarted ? (
                    <button 
                      onClick={() => handleSetActive(m)}
                      disabled={isBlocked}
                      className={`w-full py-4 rounded-2xl font-black text-xs tracking-[0.2em] uppercase flex items-center justify-center gap-3 transition-all shadow-xl ${
                        isBlocked
                          ? "bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30 active:scale-95"
                      }`}
                    >
                      {isBlocked ? "ATLETI OCCUPATI" : "MANDA IN CAMPO"}
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => onDeleteMatch(savedMatch!.id)}
                        className="w-14 flex-shrink-0 h-14 flex items-center justify-center rounded-2xl bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 transition-all active:scale-90"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleSave(m)}
                        className={`flex-1 h-14 rounded-2xl font-black text-xs tracking-[0.2em] uppercase flex items-center justify-center gap-3 transition-all shadow-xl active:scale-[0.98] ${
                          isSaved 
                            ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30" 
                            : "bg-green-600 hover:bg-green-700 text-white shadow-green-600/30"
                        }`}
                      >
                        <Save className="w-5 h-5" />
                        {isSaved ? "AGGIORNA" : "SALVA MATCH"}
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </PremiumCard>
  );
}


// --------------------------------------------------------------------------------------
// 2. ALTRE DISCIPLINE: TABELLONE A ELIMINAZIONE DIRETTA (TENNIS)
// --------------------------------------------------------------------------------------
function DisciplineBracket({ discipline, matches, onDeleteMatch, busyAthletes, onOpenAthlete }: { discipline: any, matches: any[], onDeleteMatch: (id: string) => void, busyAthletes: Set<string>, onOpenAthlete: (id: string) => void }) {
  const rankings = discipline.rankings || [];
  
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  const getAthleteId = (side: any) => side?.athletes?.[0]?.athleteId;
  const hasAthlete = (match: any, athleteId: string) => {
    if (!athleteId) return false;
    return getAthleteId(match.sides[0]) === athleteId || getAthleteId(match.sides[1]) === athleteId;
  };
  const getWinner = (match: any) => {
    if (!match) return null;
    const s1 = match.sides.find((s: any) => s.side === 1);
    const s2 = match.sides.find((s: any) => s.side === 2);
    if (!s1 || !s2) return null;
    if (s1.points > s2.points) return getAthleteId(s1);
    if (s2.points > s1.points) return getAthleteId(s2);
    return null;
  };
  const getLoser = (match: any) => {
    if (!match) return null;
    const s1 = match.sides.find((s: any) => s.side === 1);
    const s2 = match.sides.find((s: any) => s.side === 2);
    if (!s1 || !s2) return null;
    if (s1.points < s2.points) return getAthleteId(s1);
    if (s2.points < s1.points) return getAthleteId(s2);
    return null;
  };

  // Ottieni atleti dal DB se il match esiste
  const getDbA = (match: any, sideIdx: number) => {
    if (!match) return null;
    const side = match.sides.find((s: any) => s.side === sideIdx);
    if (!side || !side.athletes || side.athletes.length === 0) return null;
    return rankings.find((a: any) => a.id === side.athletes[0].athleteId);
  };

  const getA = (defaultA: any, key: string, dbMatch: any, sideIdx: number) => {
    const dbA = getDbA(dbMatch, sideIdx);
    if (dbA) return dbA; // Se c'è un match nel db, GLI ATLETI COMANDANO SUL DEFAULT
    if (overrides[key]) return rankings.find((a:any) => a.id === overrides[key]);
    return defaultA;
  };

  // Prima di tutto, classifichiamo i match del DB
  const quarti = matches.filter(m => m.finalStage === "QUARTI");
  const semi = matches.filter(m => m.finalStage === "SEMIFINALI");
  const f12 = matches.filter(m => m.finalStage === "FINALE");
  const f34 = matches.filter(m => m.finalStage === "FINALE_34");
  const f56 = matches.filter(m => m.finalStage === "FINALE_56");

  let q1 = quarti.find(m => hasAthlete(m, rankings[2]?.id) || hasAthlete(m, rankings[5]?.id));
  let q2 = quarti.find(m => m.id !== q1?.id && (hasAthlete(m, rankings[3]?.id) || hasAthlete(m, rankings[4]?.id)));
  if (!q1) q1 = quarti.find((m:any) => m.id !== q2?.id);
  if (!q2) q2 = quarti.find((m:any) => m.id !== q1?.id);

  let s1 = semi.find(m => hasAthlete(m, rankings[0]?.id));
  let s2 = semi.find(m => m.id !== s1?.id && hasAthlete(m, rankings[1]?.id));
  if (!s1) s1 = semi.find((m:any) => m.id !== s2?.id);
  if (!s2) s2 = semi.find((m:any) => m.id !== s1?.id);

  const wQ1 = getWinner(q1);
  const wQ2 = getWinner(q2);
  const lQ1 = getLoser(q1);
  const lQ2 = getLoser(q2);

  const wS1 = getWinner(s1);
  const wS2 = getWinner(s2);
  const lS1 = getLoser(s1);
  const lS2 = getLoser(s2);

  // Identificazione specifica basata sugli atleti (vincitori/perdenti delle fasi precedenti)
  let f1 = f12.find(m => hasAthlete(m, wS1));
  let f3 = f34.find(m => hasAthlete(m, lS1)) || f12.find(m => m.id !== f1?.id && hasAthlete(m, lS1));
  let f5 = f56.find(m => hasAthlete(m, lQ1)) || f12.find(m => m.id !== f1?.id && m.id !== f3?.id && hasAthlete(m, lQ1));

  // Fallback se la logica degli atleti fallisce (match nuovi o dati parziali)
  if (!f1 && f12.length > 0) f1 = f12[0];
  if (!f3 && (f34.length > 0 || f12.length > 1)) f3 = f34[0] || f12.find(m => m.id !== f1?.id);
  if (!f5 && (f56.length > 0 || f12.length > 2)) f5 = f56[0] || f12.find(m => m.id !== f1?.id && m.id !== f3?.id);

  const aQ1_1 = getA(rankings[2], "q1_1", q1, 1);
  const aQ1_2 = getA(rankings[5], "q1_2", q1, 2);
  const aQ2_1 = getA(rankings[3], "q2_1", q2, 1);
  const aQ2_2 = getA(rankings[4], "q2_2", q2, 2);

  const defaultS1_2 = rankings[4] ? wQ2 : rankings[3]?.id; 
  const defaultS2_2 = rankings[5] ? wQ1 : rankings[2]?.id; 

  const aS1_1 = getA(rankings[0], "s1_1", s1, 1);
  const aS1_2 = getA(rankings.find((a:any)=>a.id===defaultS1_2), "s1_2", s1, 2);
  const aS2_1 = getA(rankings[1], "s2_1", s2, 1);
  const aS2_2 = getA(rankings.find((a:any)=>a.id===defaultS2_2), "s2_2", s2, 2);

  const aF1_1 = getA(rankings.find((a:any)=>a.id===wS1), "f1_1", f1, 1);
  const aF1_2 = getA(rankings.find((a:any)=>a.id===wS2), "f1_2", f1, 2);
  const aF3_1 = getA(rankings.find((a:any)=>a.id===lS1), "f3_1", f3, 1);
  const aF3_2 = getA(rankings.find((a:any)=>a.id===lS2), "f3_2", f3, 2);
  const aF5_1 = getA(rankings.find((a:any)=>a.id===lQ1), "f5_1", f5, 1);
  const aF5_2 = getA(rankings.find((a:any)=>a.id===lQ2), "f5_2", f5, 2);

  const [scores, setScores] = useState({
    q1: { p1: q1?.sides.find((s:any)=>s.side===1)?.points || 0, p2: q1?.sides.find((s:any)=>s.side===2)?.points || 0 },
    q2: { p1: q2?.sides.find((s:any)=>s.side===1)?.points || 0, p2: q2?.sides.find((s:any)=>s.side===2)?.points || 0 },
    s1: { p1: s1?.sides.find((s:any)=>s.side===1)?.points || 0, p2: s1?.sides.find((s:any)=>s.side===2)?.points || 0 },
    s2: { p1: s2?.sides.find((s:any)=>s.side===1)?.points || 0, p2: s2?.sides.find((s:any)=>s.side===2)?.points || 0 },
    f1: { p1: f1?.sides.find((s:any)=>s.side===1)?.points || 0, p2: f1?.sides.find((s:any)=>s.side===2)?.points || 0 },
    f3: { p1: f3?.sides.find((s:any)=>s.side===1)?.points || 0, p2: f3?.sides.find((s:any)=>s.side===2)?.points || 0 },
    f5: { p1: f5?.sides.find((s:any)=>s.side===1)?.points || 0, p2: f5?.sides.find((s:any)=>s.side===2)?.points || 0 },
  });

  const handleSave = async (stageKey: keyof typeof scores, stageLabel: string, athlete1Id: string, athlete2Id: string) => {
    try {
      const matchScores = scores[stageKey];
      const res = await fetch("/api/admin/finali/save-single-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disciplineId: discipline.id,
          stage: stageLabel,
          side1AthleteIds: [athlete1Id],
          side2AthleteIds: [athlete2Id],
          points1: matchScores.p1,
          points2: matchScores.p2
        }),
      });

      if (res.ok) {
        toast.success("Match salvato!");
        window.location.reload(); 
      } else {
        toast.error("Errore salvataggio");
      }
    } catch (e) {
      toast.error("Errore di rete");
    }
  };

  const handleSetActive = async (stageKey: keyof typeof scores, stageLabel: string, athlete1Id: string, athlete2Id: string) => {
    try {
      const res = await fetch("/api/admin/finali/set-active-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disciplineId: discipline.id,
          stage: stageLabel,
          side1AthleteIds: [athlete1Id],
          side2AthleteIds: [athlete2Id],
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Giocatori mandati in campo!");
        window.location.reload(); 
      } else {
        toast.error(data.error || "Errore");
      }
    } catch (e) {
      toast.error("Errore di rete");
    }
  };

  const updateScore = (match: keyof typeof scores, p1: number, p2: number) => {
    setScores(prev => ({ ...prev, [match]: { p1, p2 } }));
  };

  const aWQ2 = rankings.find((a:any) => a.id === wQ2);
  const aWQ1 = rankings.find((a:any) => a.id === wQ1);
  const aWS1 = rankings.find((a:any) => a.id === wS1);
  const aWS2 = rankings.find((a:any) => a.id === wS2);
  const aLS1 = rankings.find((a:any) => a.id === lS1);
  const aLS2 = rankings.find((a:any) => a.id === lS2);

  return (
    <PremiumCard className="p-8 relative overflow-hidden">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <Trophy className="w-6 h-6 text-amber-600" />
        </div>
        <h2 className="text-3xl font-black">{discipline.name}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* COLONNA 1: QUARTI */}
        {rankings[5] && rankings[4] && (
          <div className="space-y-6">
            <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-4">Quarti</h3>
            <MatchBox 
              title="3° vs 6°"
              a1={aQ1_1} a2={aQ1_2}
              p1={scores.q1.p1} p2={scores.q1.p2}
              onChange={(p1: number, p2: number) => updateScore("q1", p1, p2)}
              onSave={() => handleSave("q1", "QUARTI", aQ1_1.id, aQ1_2.id)}
              isSaved={!!q1 && q1.sides[0]?.points >= 0}
              isInProgress={!!q1 && q1.sides[0]?.points === -1}
              onSendToCourt={() => handleSetActive("q1", "QUARTI", aQ1_1.id, aQ1_2.id)}
              allAthletes={rankings}
              onOverrideA1={(id: string) => setOverrides(prev => ({...prev, q1_1: id}))}
              onOverrideA2={(id: string) => setOverrides(prev => ({...prev, q1_2: id}))}
              onDelete={q1 ? () => onDeleteMatch(q1.id) : undefined}
              busyAthletes={busyAthletes}
            />
            <div className="h-4 border-l-2 border-b-2 border-zinc-200 ml-8 my-2 rounded-bl-xl opacity-30"></div>
            <MatchBox 
              title="4° vs 5°"
              a1={aQ2_1} a2={aQ2_2}
              p1={scores.q2.p1} p2={scores.q2.p2}
              onChange={(p1: number, p2: number) => updateScore("q2", p1, p2)}
              onSave={() => handleSave("q2", "QUARTI", aQ2_1.id, aQ2_2.id)}
              isSaved={!!q2 && q2.sides[0]?.points >= 0}
              isInProgress={!!q2 && q2.sides[0]?.points === -1}
              onSendToCourt={() => handleSetActive("q2", "QUARTI", aQ2_1.id, aQ2_2.id)}
              allAthletes={rankings}
              onOverrideA1={(id: string) => setOverrides(prev => ({...prev, q2_1: id}))}
              onOverrideA2={(id: string) => setOverrides(prev => ({...prev, q2_2: id}))}
              onDelete={q2 ? () => onDeleteMatch(q2.id) : undefined}
              busyAthletes={busyAthletes}
            />
          </div>
        )}

        {/* COLONNA 2: SEMIFINALI */}
        <div className="space-y-6">
          <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-4">Semifinali</h3>
          <MatchBox 
            title={rankings[4] ? "1° vs Vincitore Q2" : "1° vs 4°"}
            a1={aS1_1} a2={aS1_2}
            p1={scores.s1.p1} p2={scores.s1.p2}
            onChange={(p1: number, p2: number) => updateScore("s1", p1, p2)}
            onSave={() => handleSave("s1", "SEMIFINALI", aS1_1.id, aS1_2.id)}
            disabled={!aS1_1 || !aS1_2}
            isSaved={!!s1 && s1.sides[0]?.points >= 0}
            isInProgress={!!s1 && s1.sides[0]?.points === -1}
            onSendToCourt={() => handleSetActive("s1", "SEMIFINALI", aS1_1.id, aS1_2.id)}
            waitingLabel="In attesa (Q2)"
            allAthletes={rankings}
            onOverrideA1={(id: string) => setOverrides(prev => ({...prev, s1_1: id}))}
            onOverrideA2={(id: string) => setOverrides(prev => ({...prev, s1_2: id}))}
            onDelete={s1 ? () => onDeleteMatch(s1.id) : undefined}
            busyAthletes={busyAthletes}
          />
          <div className="h-4 border-l-2 border-b-2 border-zinc-200 ml-8 my-2 rounded-bl-xl opacity-30"></div>
          <MatchBox 
            title={rankings[5] ? "2° vs Vincitore Q1" : "2° vs 3°"}
            a1={aS2_1} a2={aS2_2}
            p1={scores.s2.p1} p2={scores.s2.p2}
            onChange={(p1: number, p2: number) => updateScore("s2", p1, p2)}
            onSave={() => handleSave("s2", "SEMIFINALI", aS2_1.id, aS2_2.id)}
            disabled={!aS2_1 || !aS2_2}
            isSaved={!!s2 && s2.sides[0]?.points >= 0}
            isInProgress={!!s2 && s2.sides[0]?.points === -1}
            onSendToCourt={() => handleSetActive("s2", "SEMIFINALI", aS2_1.id, aS2_2.id)}
            waitingLabel="In attesa (Q1)"
            allAthletes={rankings}
            onOverrideA1={(id: string) => setOverrides(prev => ({...prev, s2_1: id}))}
            onOverrideA2={(id: string) => setOverrides(prev => ({...prev, s2_2: id}))}
            onDelete={s2 ? () => onDeleteMatch(s2.id) : undefined}
            busyAthletes={busyAthletes}
          />
        </div>

        {/* COLONNA 3: FINALI */}
        <div className="space-y-6">
          <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest mb-4">Finali</h3>
          <MatchBox 
            title="Finale 1°/2° Posto"
            a1={aF1_1} a2={aF1_2}
            p1={scores.f1.p1} p2={scores.f1.p2}
            onChange={(p1: number, p2: number) => updateScore("f1", p1, p2)}
            onSave={() => handleSave("f1", "FINALE", aF1_1.id, aF1_2.id)}
            disabled={!aF1_1 || !aF1_2}
            isSaved={!!f1 && f1.sides[0]?.points >= 0}
            isInProgress={!!f1 && f1.sides[0]?.points === -1}
            onSendToCourt={() => handleSetActive("f1", "FINALE", aF1_1.id, aF1_2.id)}
            waitingLabel="In attesa Semifinali"
            accent
            allAthletes={rankings}
            onOverrideA1={(id: string) => setOverrides(prev => ({...prev, f1_1: id}))}
            onOverrideA2={(id: string) => setOverrides(prev => ({...prev, f1_2: id}))}
            onDelete={f1 ? () => onDeleteMatch(f1.id) : undefined}
            busyAthletes={busyAthletes}
          />
          <MatchBox 
            title="Finale 3°/4° Posto"
            a1={aF3_1} a2={aF3_2}
            p1={scores.f3.p1} p2={scores.f3.p2}
            onChange={(p1: number, p2: number) => updateScore("f3", p1, p2)}
            onSave={() => handleSave("f3", "FINALE_34", aF3_1.id, aF3_2.id)}
            disabled={!aF3_1 || !aF3_2}
            isSaved={!!f3 && f3.sides[0]?.points >= 0}
            isInProgress={!!f3 && f3.sides[0]?.points === -1}
            onSendToCourt={() => handleSetActive("f3", "FINALE_34", aF3_1.id, aF3_2.id)}
            waitingLabel="In attesa Semifinali"
            allAthletes={rankings}
            onOverrideA1={(id: string) => setOverrides(prev => ({...prev, f3_1: id}))}
            onOverrideA2={(id: string) => setOverrides(prev => ({...prev, f3_2: id}))}
            onDelete={f3 ? () => onDeleteMatch(f3.id) : undefined}
            busyAthletes={busyAthletes}
            onOpenAthlete={onOpenAthlete}
          />
          <MatchBox 
            title="Finale 5°/6° Posto"
            a1={aF5_1} a2={aF5_2}
            p1={scores.f5.p1} p2={scores.f5.p2}
            onChange={(p1: number, p2: number) => updateScore("f5", p1, p2)}
            onSave={() => handleSave("f5", "FINALE_56", aF5_1.id, aF5_2.id)}
            disabled={!aF5_1 || !aF5_2}
            isSaved={!!f5 && f5.sides[0]?.points >= 0}
            isInProgress={!!f5 && f5.sides[0]?.points === -1}
            onSendToCourt={() => handleSetActive("f5", "FINALE_56", aF5_1.id, aF5_2.id)}
            waitingLabel="In attesa Quarti"
            allAthletes={rankings}
            onOverrideA1={(id: string) => setOverrides(prev => ({...prev, f5_1: id}))}
            onOverrideA2={(id: string) => setOverrides(prev => ({...prev, f5_2: id}))}
            onDelete={f5 ? () => onDeleteMatch(f5.id) : undefined}
            busyAthletes={busyAthletes}
            onOpenAthlete={onOpenAthlete}
          />
        </div>
      </div>
    </PremiumCard>
  );
}

function MatchBox({ 
  title, a1, a2, p1, p2, onChange, onSave, disabled, isSaved, waitingLabel = "In attesa...", accent, isInProgress, onSendToCourt,
  allAthletes, onOverrideA1, onOverrideA2, onDelete, busyAthletes, onOpenAthlete
}: any) {
  const isStarted = isSaved || isInProgress;
  const isA1Busy = a1 && busyAthletes?.has(a1.id);
  const isA2Busy = a2 && busyAthletes?.has(a2.id);
  const isBlocked = !isStarted && (isA1Busy || isA2Busy);

  return (
    <motion.div 
      whileHover={!isBlocked ? { y: -2 } : {}}
      className={`p-6 rounded-3xl border-2 transition-all relative overflow-hidden backdrop-blur-md shadow-xl ${
      isInProgress ? "bg-green-50/80 border-green-500 ring-4 ring-green-500/10 shadow-green-500/10" :
      accent ? "bg-amber-50/50 border-amber-200/50 shadow-amber-500/5" : 
      isSaved ? "bg-zinc-50/50 border-zinc-100 opacity-80" :
      "bg-white/80 border-zinc-100 shadow-zinc-200/20"
    }`}>
      <div className="flex justify-between items-center mb-5">
        <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] ${isInProgress ? "text-green-700" : "text-zinc-400"}`}>{title}</h4>
        {isSaved && <div className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 uppercase">OK</div>}
        {isInProgress && (
          <div className="flex items-center gap-1.5 text-[9px] font-black text-white bg-green-500 px-2 py-0.5 rounded-full shadow-lg shadow-green-500/20">
            <div className="w-1 h-1 rounded-full bg-white animate-ping" />
            LIVE
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* A1 */}
        <div className="flex items-center gap-4">
          {allAthletes && !isStarted ? (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-3 bg-zinc-50/50 p-2 rounded-xl border border-zinc-100/30">
                <LetterBadge letter={a1?.letter} isBusy={isA1Busy} isStarted={isStarted} />
                <select 
                  value={a1?.id || ""} 
                  onChange={(e) => onOverrideA1 && onOverrideA1(e.target.value)}
                  className={`flex-1 text-sm font-black truncate bg-transparent border-none p-0 focus:ring-0 appearance-none ${!a1 && "text-zinc-300 italic"}`}
                >
                  <option value="" disabled>{waitingLabel}</option>
                  {allAthletes.map((a:any) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              {isA1Busy && <span className="text-[9px] text-orange-500 font-black mt-1 ml-1 uppercase tracking-wider">Impegnato</span>}
            </div>
          ) : (
            <div className="flex-1 flex items-center gap-3">
              <LetterBadge letter={a1?.letter} isBusy={isA1Busy} isStarted={isStarted} />
              <span 
                className={`text-sm font-black truncate transition-colors ${a1 ? "cursor-pointer hover:text-indigo-600" : "text-zinc-300 italic"} ${isInProgress ? "text-green-900" : ""}`}
                onClick={() => a1 && onOpenAthlete(a1.id)}
              >
                {a1 ? a1.name : waitingLabel}
              </span>
            </div>
          )}
          {isStarted && (
            <input 
              type="number" 
              value={p1 === -1 ? 0 : p1} 
              onChange={(e) => onChange(parseInt(e.target.value) || 0, p2)}
              disabled={disabled}
              className={`w-14 h-10 text-center rounded-xl border-none text-lg font-black shadow-inner focus:ring-4 focus:ring-indigo-500/20 ${isInProgress ? "bg-white text-green-900" : "bg-zinc-200/50 text-zinc-500"}`}
            />
          )}
        </div>

        {/* A2 */}
        <div className="flex items-center gap-4">
          {allAthletes && !isStarted ? (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-3 bg-zinc-50/50 p-2 rounded-xl border border-zinc-100/30">
                <LetterBadge letter={a2?.letter} isBusy={isA2Busy} isStarted={isStarted} />
                <select 
                  value={a2?.id || ""} 
                  onChange={(e) => onOverrideA2 && onOverrideA2(e.target.value)}
                  className={`flex-1 text-sm font-black truncate bg-transparent border-none p-0 focus:ring-0 appearance-none ${!a2 && "text-zinc-300 italic"}`}
                >
                  <option value="" disabled>{waitingLabel}</option>
                  {allAthletes.map((a:any) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              {isA2Busy && <span className="text-[9px] text-orange-500 font-black mt-1 ml-1 uppercase tracking-wider">Impegnato</span>}
            </div>
          ) : (
            <div className="flex-1 flex items-center gap-3">
              <LetterBadge letter={a2?.letter} isBusy={isA2Busy} isStarted={isStarted} />
              <span 
                className={`text-sm font-black truncate transition-colors ${a2 ? "cursor-pointer hover:text-indigo-600" : "text-zinc-300 italic"} ${isInProgress ? "text-green-900" : ""}`}
                onClick={() => a2 && onOpenAthlete(a2.id)}
              >
                {a2 ? a2.name : waitingLabel}
              </span>
            </div>
          )}
          {isStarted && (
            <input 
              type="number" 
              value={p2 === -1 ? 0 : p2} 
              onChange={(e) => onChange(p1, parseInt(e.target.value) || 0)}
              disabled={disabled}
              className={`w-14 h-10 text-center rounded-xl border-none text-lg font-black shadow-inner focus:ring-4 focus:ring-indigo-500/20 ${isInProgress ? "bg-white text-green-900" : "bg-zinc-200/50 text-zinc-500"}`}
            />
          )}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-zinc-100/50">
        {!isStarted && a1 && a2 ? (
          <button 
            onClick={onSendToCourt}
            disabled={disabled || isBlocked}
            className={`w-full py-3 rounded-2xl font-black text-[10px] tracking-[0.15em] uppercase flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 ${
              isBlocked
                ? "bg-zinc-50 text-zinc-300 cursor-not-allowed border border-zinc-100"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20"
            }`}
          >
            {isBlocked ? "ATLETI OCCUPATI" : "MANDA IN CAMPO"}
          </button>
        ) : isStarted ? (
          <div className="flex gap-2">
            {onDelete && (
              <button 
                onClick={onDelete}
                className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-2xl bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 transition-all active:scale-90"
                title="Annulla Match"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button 
              onClick={onSave}
              disabled={disabled || !a1 || !a2}
              className={`flex-1 h-12 rounded-2xl font-black text-[10px] tracking-[0.15em] uppercase flex items-center justify-center gap-2 transition-all shadow-xl active:scale-[0.98] ${
                disabled || !a1 || !a2 
                  ? "bg-zinc-50 text-zinc-300 cursor-not-allowed" 
                  : isSaved 
                    ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30" 
                    : "bg-green-600 hover:bg-green-700 text-white shadow-green-600/30"
              }`}
            >
              <Save className="w-4 h-4" />
              {isSaved ? "AGGIORNA" : "SALVA MATCH"}
            </button>
          </div>
        ) : (
          <div className="w-full py-3 rounded-2xl font-black text-[9px] tracking-[0.15em] uppercase flex items-center justify-center gap-2 bg-zinc-50 text-zinc-300 border border-zinc-100">
            ATTESA SFIDANTI
          </div>
        )}
      </div>
    </motion.div>
  );
}
