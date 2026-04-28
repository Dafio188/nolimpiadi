"use client";

import { useEffect, useState } from "react";
// Shadcn UI components sostituiti da tag HTML con Tailwind
// perché non installati nel progetto.
import { Loader2, Save, Edit3, CheckCircle, AlertCircle, Gauge } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// Types matching the API response
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
}

interface TurnoBlock {
  id: number;
  name: string;
  partite: Partita[];
}

const DISCIPLINE_TITLES: Record<string, string> = {
  CALCIO_BALILLA: "Calcio-balilla (doppio)",
  FRECCETTE: "Freccette (singolare)",
  PING_PONG: "Ping-pong (singolare)",
  AIR_HOCKEY: "Air Hockey (singolare)", // Formerly Basket
};

const DISCIPLINE_ORDER = ["CALCIO_BALILLA", "FRECCETTE", "PING_PONG", "AIR_HOCKEY"];

export default function ProgrammaPage() {
  const [data, setData] = useState<TurnoBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSlotId, setSavingSlotId] = useState<string | null>(null);

  // Local state to keep track of inputs before saving
  const [inputs, setInputs] = useState<Record<string, { p1: string; p2: string }>>({});

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/admin/schedule?t=${Date.now()}`, { cache: 'no-store' });
      const json = await res.json();
      if (json.ok) {
        setData(json.data.phases);
      } else {
        alert("Errore nel caricamento del programma");
      }
    } catch (e) {
      alert("Errore di connessione");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (slotId: string, side: 1 | 2, value: string) => {
    setInputs(prev => ({
      ...prev,
      [slotId]: {
        ...prev[slotId],
        [`p${side}`]: value
      }
    }));
  };

  const initEditMode = (slot: SportSlot) => {
    setInputs(prev => ({
      ...prev,
      [slot.slotId]: {
        p1: slot.points1?.toString() || "",
        p2: slot.points2?.toString() || "",
      }
    }));
    
    setData(prev => prev.map(block => ({
      ...block,
      partite: block.partite.map(p => {
        const newSports = { ...p.sports };
        for (const key in newSports) {
          if (newSports[key].slotId === slot.slotId) {
            newSports[key].state = "TODO";
          }
        }
        return { ...p, sports: newSports };
      })
    })));
  };

  const handleSave = async (slotId: string) => {
    const input = inputs[slotId];
    if (!input || input.p1 === "" || input.p2 === "") {
      alert("Inserisci entrambi i punteggi");
      return;
    }

    const p1 = parseInt(input.p1, 10);
    const p2 = parseInt(input.p2, 10);

    if (isNaN(p1) || isNaN(p2)) {
      alert("I punteggi devono essere numeri validi");
      return;
    }

    setSavingSlotId(slotId);
    try {
      const res = await fetch("/api/admin/schedule/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId, points1: p1, points2: p2 })
      });
      const json = await res.json();
      if (json.ok) {
        // Usa setTimeout per fare prima ricaricare e poi magari mostrare notifica (sonner potrebbe non esserci in layout)
        await fetchData(); 
      } else {
        alert("Errore nel salvataggio: " + json.error);
      }
    } catch (e) {
      alert("Errore di rete");
    } finally {
      setSavingSlotId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-24">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-4">
            <Gauge className="w-10 h-10 text-green-500" />
            LIVE SCORE
          </h1>
          <p className="text-gray-500 mt-2">Inserimento punteggi e gestione VAR.</p>
        </div>
        <a href="/admin/classifiche/fase2" className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow hover:bg-indigo-700 transition-colors">
          Vai alla Seconda Fase &rarr;
        </a>
      </div>

      <div className="space-y-16">
        {data.map((turno) => (
          <section key={turno.id} className="space-y-6">
            <div className="flex items-center gap-4">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                {turno.name}
              </h2>
              <div className="h-px flex-1 bg-border/50"></div>
            </div>

            {/* Layout a Griglia: Intestazioni Colonne */}
            <div className="sticky top-[84px] z-40 hidden xl:grid xl:grid-cols-4 gap-6 mb-2 py-6 bg-white/95 backdrop-blur-md border-b shadow-md rounded-t-lg -mx-2 px-4">
              {DISCIPLINE_ORDER.map(disciplineKey => (
                <div key={disciplineKey} className="bg-zinc-900 p-4 rounded-xl text-center font-black text-xl lg:text-2xl text-white shadow-lg uppercase tracking-tighter">
                  {DISCIPLINE_TITLES[disciplineKey]}
                </div>
              ))}
            </div>

            {/* Righe delle Partite */}
            <div className="space-y-12">
              {turno.partite.map(partita => (
                <div key={partita.partitaId} className="relative pt-6">
                  {/* Etichetta Riposi per questa Partita: AL CENTRO */}
                  {partita.restingNames.length > 0 && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-50 border border-red-200 text-red-700 font-bold text-sm px-6 py-1.5 rounded-full z-10 shadow-sm">
                      ATLETI FERMI: {partita.restingNames.length > 0 ? partita.restingNames.join(", ") : partita.restingLetters.join(", ")}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {DISCIPLINE_ORDER.map(disciplineKey => {
                      const slot = partita.sports[disciplineKey];
                      if (!slot) return <div key={disciplineKey} />;

                      const isDone = slot.state === "DONE";
                      const isSaving = savingSlotId === slot.slotId;

                      // Riempiamo i nomi mancanti con le lettere se l'utente non ha completato il setup
                      const p1Names = slot.side1Names.length > 0 ? slot.side1Names : slot.side1Letters;
                      const p2Names = slot.side2Names.length > 0 ? slot.side2Names : slot.side2Letters;

                      return (
                        <motion.div
                          key={slot.slotId}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          className="h-full"
                        >
                          <div className={`h-full flex flex-col overflow-hidden rounded-xl border transition-all duration-300 ${isDone ? 'bg-green-500/10 border-green-500/30' : 'bg-white hover:shadow-md'}`}>
                            <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 text-xs text-gray-500 border-b">
                              <span className="font-semibold">Partita {partita.partitaIndex}</span>
                              {slot.targetVictory > 0 && <span>Target: {slot.targetVictory}</span>}
                            </div>
                            <div className="p-4 flex flex-col flex-1">
                              {/* Titolo Disciplina (Visibile solo su mobile/tablet) */}
                              <div className="xl:hidden mb-4">
                                <span className="inline-block px-4 py-2 rounded-xl bg-zinc-900 text-white text-base font-black uppercase tracking-tighter shadow-md">
                                  {DISCIPLINE_TITLES[disciplineKey]}
                                </span>
                              </div>
                              
                              {/* Players */}
                              <div className="flex justify-between items-center text-2xl lg:text-3xl font-black mb-auto leading-none tracking-tighter">
                                <div className="flex flex-col flex-1 min-w-0">
                                  {p1Names.map((n, i) => <span key={i} className="truncate">{n}</span>)}
                                </div>
                                <span className="text-gray-300 mx-4 text-sm italic shrink-0">vs</span>
                                <div className="flex flex-col text-right flex-1 min-w-0">
                                  {p2Names.map((n, i) => <span key={i} className="truncate text-right w-full">{n}</span>)}
                                </div>
                              </div>

                              {/* Interactive Score Area */}
                              <div className="mt-4 pt-4 border-t border-gray-100">
                                <AnimatePresence mode="wait">
                                  {isDone ? (
                                    <motion.div
                                      key="done"
                                      initial={{ opacity: 0, scale: 0.95 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0 }}
                                      className="flex items-center justify-center relative w-full py-4 bg-green-50 rounded-2xl border border-green-100"
                                    >
                                      <div className="text-5xl font-black text-green-600 dark:text-green-400 tracking-tighter">
                                        {slot.points1} - {slot.points2}
                                      </div>
                                      <button 
                                        className="absolute right-3 inline-flex items-center justify-center h-10 w-10 rounded-full text-zinc-400 hover:text-green-600 hover:bg-green-500/10 transition-colors" 
                                        onClick={() => initEditMode(slot)} 
                                        title="VAR (Modifica)"
                                      >
                                        <Edit3 className="w-5 h-5" />
                                      </button>
                                    </motion.div>
                                  ) : (
                                    <motion.div
                                      key="todo"
                                      initial={{ opacity: 0, scale: 0.95 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0 }}
                                      className="flex items-center justify-between gap-3"
                                    >
                                        <input 
                                          type="number" 
                                          className="flex h-14 w-24 rounded-2xl border-2 border-zinc-200 bg-white px-2 py-1 text-2xl text-center font-black shadow-sm transition-all focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 outline-none disabled:opacity-50" 
                                        placeholder="0"
                                        value={inputs[slot.slotId]?.p1 ?? ""}
                                        onChange={(e) => handleInputChange(slot.slotId, 1, e.target.value)}
                                        disabled={isSaving}
                                      />
                                      <button 
                                        className="inline-flex h-14 flex-1 items-center justify-center rounded-2xl bg-blue-600 px-4 py-2 text-base font-black text-white shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                                        disabled={isSaving || !inputs[slot.slotId]?.p1 || !inputs[slot.slotId]?.p2}
                                        onClick={() => handleSave(slot.slotId)}
                                      >
                                        {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-7 h-7" />}
                                      </button>
                                      <input 
                                        type="number" 
                                        className="flex h-14 w-24 rounded-2xl border-2 border-zinc-200 bg-white px-2 py-1 text-2xl text-center font-black shadow-sm transition-all focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 outline-none disabled:opacity-50" 
                                        placeholder="0"
                                        value={inputs[slot.slotId]?.p2 ?? ""}
                                        onChange={(e) => handleInputChange(slot.slotId, 2, e.target.value)}
                                        disabled={isSaving}
                                      />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

          </section>
        ))}
      </div>
    </div>
  );
}
