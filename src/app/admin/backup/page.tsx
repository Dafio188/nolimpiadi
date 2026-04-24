"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Database, 
  ArrowLeft, 
  Download, 
  Upload, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  FileJson,
  ShieldAlert,
  History
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function BackupPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);

  const handleExport = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/backup");
      const data = await res.json();
      
      if (res.ok) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const date = new Date().toISOString().split('T')[0];
        a.download = `backup_nolimpiadi_${date}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setResult({ type: "success", text: "Database esportato con successo!" });
      } else {
        setResult({ type: "error", text: data.error || "Errore durante l'esportazione." });
      }
    } catch (e) {
      setResult({ type: "error", text: "Errore di connessione." });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    
    if (!confirm("ATTENZIONE: Questa operazione cancellerà tutti i dati attuali e li sostituirà con quelli del backup. Sei sicuro?")) {
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const text = await importFile.text();
      const backup = JSON.parse(text);
      
      const res = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backup)
      });
      
      const data = await res.json();
      if (data.ok) {
        setResult({ type: "success", text: "Database ripristinato con successo! Ricarica la pagina." });
        setImportFile(null);
      } else {
        setResult({ type: "error", text: data.error || "Errore durante l'importazione." });
      }
    } catch (e) {
      setResult({ type: "error", text: "Errore nel formato del file o di connessione." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f5f7] py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <Link href="/admin" className="inline-flex items-center gap-2 text-[#86868b] hover:text-[#1d1d1f] font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Torna alla Centrale
          </Link>
          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md py-2 px-4 rounded-2xl border border-white/50 shadow-sm">
            <Database className="w-5 h-5 text-indigo-600" />
            <span className="text-sm font-bold text-[#1d1d1f]">Manutenzione Dati</span>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <header>
            <h1 className="text-4xl font-black text-[#1d1d1f] mb-4">Backup e Ripristino</h1>
            <p className="text-xl text-[#86868b] font-medium">Esporta lo stato del torneo o ripristina dati da un salvataggio precedente.</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Export Section */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-white/50 flex flex-col">
              <div className="p-4 bg-indigo-50 rounded-2xl w-fit mb-6">
                <Download className="w-8 h-8 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-black text-[#1d1d1f] mb-2">Esporta Dati</h2>
              <p className="text-[#86868b] font-medium mb-8 flex-1">
                Genera un file JSON contenente atleti, discipline, match e calendario. Utile per archiviare l'edizione corrente o spostare i dati.
              </p>
              <button
                onClick={handleExport}
                disabled={loading}
                className="w-full py-4 bg-[#1d1d1f] text-white rounded-2xl font-black text-lg shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:bg-zinc-400"
              >
                {loading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <FileJson className="w-6 h-6" />}
                Scarica Backup
              </button>
            </div>

            {/* Import Section */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-white/50 flex flex-col">
              <div className="p-4 bg-amber-50 rounded-2xl w-fit mb-6">
                <Upload className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-2xl font-black text-[#1d1d1f] mb-2">Ripristina Dati</h2>
              <p className="text-[#86868b] font-medium mb-4">
                Carica un file di backup per ripristinare il database. 
              </p>
              
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl mb-6 flex gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-xs font-bold text-amber-900 leading-tight">
                  ATTENZIONE: L'importazione sovrascrive IRREVERSIBILMENTE tutti i dati correnti.
                </p>
              </div>

              <div className="flex-1">
                <input 
                  type="file" 
                  accept=".json"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="import-file"
                />
                <label 
                  htmlFor="import-file"
                  className="flex items-center justify-center gap-3 w-full border-2 border-dashed border-zinc-200 rounded-2xl p-4 cursor-pointer hover:border-amber-400 transition-colors mb-4"
                >
                  <FileJson className="w-5 h-5 text-zinc-400" />
                  <span className="font-bold text-zinc-500 truncate max-w-[200px]">
                    {importFile ? importFile.name : "Seleziona file .json"}
                  </span>
                </label>
              </div>

              <button
                onClick={handleImport}
                disabled={loading || !importFile}
                className={`w-full py-4 rounded-2xl font-black text-lg shadow-lg transition-all flex items-center justify-center gap-3 ${
                  !importFile || loading 
                  ? "bg-zinc-100 text-zinc-400 cursor-not-allowed" 
                  : "bg-amber-600 text-white hover:bg-amber-700 hover:scale-[1.02] active:scale-[0.98]"
                }`}
              >
                {loading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                Avvia Ripristino
              </button>
            </div>
          </div>

          <AnimatePresence>
            {result && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-6 rounded-[32px] flex items-center gap-4 border shadow-xl ${
                  result.type === "success" 
                  ? "bg-green-50 border-green-200 text-green-800" 
                  : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                <div className={`p-2 rounded-full ${result.type === "success" ? "bg-green-100" : "bg-red-100"}`}>
                  {result.type === "success" ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                </div>
                <div>
                  <h4 className="font-black">Risultato Operazione</h4>
                  <p className="font-bold text-sm opacity-80">{result.text}</p>
                </div>
                {result.type === "success" && (
                  <button 
                    onClick={() => window.location.reload()}
                    className="ml-auto bg-white/50 hover:bg-white px-4 py-2 rounded-xl text-xs font-black transition-colors"
                  >
                    Ricarica App
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tips Section */}
          <div className="bg-zinc-900 rounded-[40px] p-10 text-white relative overflow-hidden">
            <History className="absolute -bottom-8 -right-8 w-64 h-64 text-white/5 opacity-10" />
            <div className="relative z-10 max-w-2xl">
              <h3 className="text-2xl font-black mb-4">Perché usare il Backup?</h3>
              <ul className="space-y-4">
                <li className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-indigo-400" />
                  </div>
                  <p className="text-zinc-400 font-medium"><span className="text-white font-bold">Sicurezza Totale:</span> Prima di grandi modifiche o della generazione del calendario finale, esporta i dati per evitare perdite.</p>
                </li>
                <li className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-indigo-400" />
                  </div>
                  <p className="text-zinc-400 font-medium"><span className="text-white font-bold">Test Multi-device:</span> Puoi esportare il database dal computer principale e caricarlo su un tablet locale per simulare le gare.</p>
                </li>
                <li className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-indigo-400" />
                  </div>
                  <p className="text-zinc-400 font-medium"><span className="text-white font-bold">Archivio Storico:</span> A fine giornata, salva un file col nome della data per tenere traccia dell'evoluzione del torneo.</p>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
