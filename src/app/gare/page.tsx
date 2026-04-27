"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
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
  AIR_HOCKEY: "Air Hockey (singolare)",
};

const DISCIPLINE_ORDER = ["CALCIO_BALILLA", "FRECCETTE", "PING_PONG", "AIR_HOCKEY"];

export default function GarePage() {
  const [data, setData] = useState<TurnoBlock[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/admin/schedule?t=${Date.now()}`, { cache: 'no-store' });
      const json = await res.json();
      if (json.ok) {
        setData(json.data.phases);
      } else {
        console.error("Errore nel caricamento del programma");
      }
    } catch (e) {
      console.error("Errore di connessione");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Aggiornamento automatico ogni 15 secondi per renderlo un vero "Live Scoreboard" da spettatori
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-12 pb-24">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <a href="/" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-gray-200 h-9 px-3 border bg-white shadow-sm">
              &larr; Torna alla Home
            </a>
            <h1 className="text-4xl font-extrabold tracking-tight">Live Scoreboard Pubblico</h1>
          </div>
          <p className="text-gray-500 mt-2">Segui in tempo reale l'andamento di tutte le partite. Aggiornamento automatico ogni 15 secondi.</p>
        </div>
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
            <div className="sticky top-0 z-40 hidden xl:grid xl:grid-cols-4 gap-6 mb-2 py-3 bg-white/95 backdrop-blur-md border-b shadow-sm rounded-t-lg -mx-2 px-2">
              {DISCIPLINE_ORDER.map(disciplineKey => (
                <div key={disciplineKey} className="bg-gray-100 p-3 rounded-lg border text-center font-bold text-sm text-gray-700 shadow-sm">
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
                          <div className={`h-full flex flex-col overflow-hidden rounded-xl border transition-all duration-300 ${isDone ? 'bg-green-500/10 border-green-500/30 shadow-sm' : 'bg-white opacity-60'}`}>
                            <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 text-xs text-gray-500 border-b">
                              <span className="font-semibold">Partita {partita.partitaIndex}</span>
                              {slot.targetVictory > 0 && <span>Target: {slot.targetVictory}</span>}
                            </div>
                            <div className="p-4 flex flex-col flex-1">
                              
                              {/* Players */}
                              <div className="flex justify-between items-center text-sm font-medium mb-auto">
                                <div className="flex flex-col">
                                  {p1Names.map((n, i) => <span key={i} className="truncate max-w-[100px]">{n}</span>)}
                                </div>
                                <span className="text-gray-400 mx-2 text-xs">vs</span>
                                <div className="flex flex-col text-right">
                                  {p2Names.map((n, i) => <span key={i} className="truncate max-w-[100px]">{n}</span>)}
                                </div>
                              </div>

                              {/* Interactive Score Area */}
                              <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                                {isDone ? (
                                  <div className="text-3xl font-black text-green-600 dark:text-green-400 tracking-tight">
                                    {slot.points1} - {slot.points2}
                                  </div>
                                ) : (
                                  <div className="text-sm font-bold text-gray-400 uppercase tracking-widest py-1.5">
                                    Da disputare
                                  </div>
                                )}
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