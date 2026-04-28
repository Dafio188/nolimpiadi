"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, ArrowLeft, Save, RefreshCw, AlertTriangle, CheckCircle2, Clock, ListChecks } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CalendarioPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    turnsPlanned: 0,
    turnDurationMinutes: 10,
    overwrite: false
  });
  const [result, setResult] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/turni/plan");
      const data = await res.json();
      if (data.ok) {
        setSettings({
          turnsPlanned: data.turnsPlanned,
          turnDurationMinutes: data.turnDurationMinutes,
          overwrite: false
        });
      }
    } catch (e) {
      console.error("Failed to fetch settings", e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (settings.turnsPlanned > 0 && !settings.overwrite) {
      setResult({ type: "error", text: "Il calendario esiste già. Spunta 'Sovrascrivi' per rigenerarlo." });
      return;
    }

    setSaving(true);
    setResult(null);
    try {
      const res = await fetch("/api/turni/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turns: settings.turnsPlanned || 24,
          turnDurationMinutes: settings.turnDurationMinutes,
          overwrite: settings.overwrite
        })
      });
      const data = await res.json();
      if (data.ok) {
        setResult({ type: "success", text: `Calendario generato con successo: ${data.turnsPlanned} turni pianificati.` });
        fetchSettings();
      } else {
        setResult({ type: "error", text: data.error || "Errore durante la generazione." });
      }
    } catch (e) {
      setResult({ type: "error", text: "Errore di connessione." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      <div className="max-w-4xl mx-auto py-8">

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <header>
            <h1 className="text-4xl font-black text-[#1d1d1f] mb-4">Pianificazione Serie</h1>
            <p className="text-xl text-[#86868b] font-medium">Configura la sequenza dei match e gli intervalli di tempo.</p>
          </header>

          {/* Settings Card */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-white/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Calendar className="w-32 h-32" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-[#1d1d1f] mb-2">Numero di Serie</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={settings.turnsPlanned}
                      onChange={(e) => setSettings({...settings, turnsPlanned: parseInt(e.target.value) || 0})}
                      className="w-full bg-[#f5f5f7] border-none rounded-2xl px-4 py-4 text-lg font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="Esempio: 24"
                    />
                    <ListChecks className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" />
                  </div>
                  <p className="mt-2 text-xs text-[#86868b]">Ogni serie include 4 discipline in parallelo.</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#1d1d1f] mb-2">Durata Turno (minuti)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={settings.turnDurationMinutes}
                      onChange={(e) => setSettings({...settings, turnDurationMinutes: parseInt(e.target.value) || 0})}
                      className="w-full bg-[#f5f5f7] border-none rounded-2xl px-4 py-4 text-lg font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    <Clock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between">
                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                  <h3 className="text-blue-900 font-bold mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Attenzione
                  </h3>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    La generazione del calendario distribuirà equamente gli atleti nelle varie discipline evitando ripetizioni ravvicinate dei compagni di squadra (nel Calcio Balilla) e garantendo i turni di riposo necessari.
                  </p>
                  
                  <label className="mt-6 flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={settings.overwrite}
                      onChange={(e) => setSettings({...settings, overwrite: e.target.checked})}
                      className="w-5 h-5 rounded border-blue-200 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-sm font-bold text-blue-900 group-hover:text-blue-700">Sovrascrivi calendario esistente</span>
                  </label>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={saving || loading}
                  className={`mt-6 w-full py-4 rounded-2xl font-black text-lg shadow-lg flex items-center justify-center gap-3 transition-all ${
                    saving ? "bg-[#86868b] cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white hover:scale-[1.02] active:scale-[0.98]"
                  }`}
                >
                  {saving ? (
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  ) : (
                    <RefreshCw className="w-6 h-6" />
                  )}
                  {settings.turnsPlanned > 0 ? "Rigenera Programma" : "Genera Programma"}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {result && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`mt-8 p-4 rounded-2xl flex items-center gap-3 border ${
                    result.type === "success" ? "bg-green-50 border-green-100 text-green-800" : "bg-red-50 border-red-100 text-red-800"
                  }`}
                >
                  {result.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  <span className="font-bold text-sm">{result.text}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Current Status */}
          {!loading && settings.turnsPlanned > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-white/50">
                <p className="text-[#86868b] text-sm font-bold uppercase tracking-wider mb-1">Serie Totali</p>
                <h4 className="text-3xl font-black text-[#1d1d1f]">{settings.turnsPlanned}</h4>
              </div>
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-white/50">
                <p className="text-[#86868b] text-sm font-bold uppercase tracking-wider mb-1">Durata Stimata</p>
                <h4 className="text-3xl font-black text-[#1d1d1f]">{Math.floor((settings.turnsPlanned * settings.turnDurationMinutes) / 60)}h { (settings.turnsPlanned * settings.turnDurationMinutes) % 60}m</h4>
              </div>
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-white/50">
                <p className="text-[#86868b] text-sm font-bold uppercase tracking-wider mb-1">Partite Totali</p>
                <h4 className="text-3xl font-black text-[#1d1d1f]">{settings.turnsPlanned * 4}</h4>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
