"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, RefreshCw, User, Medal, TrendingUp } from "lucide-react";
import PremiumCard from "@/components/ui/PremiumCard";

type Row = {
  athlete_id: string;
  name: string;
  total_weighted: string | number;
  qualification_weighted: string | number;
  finals_weighted: string | number;
  matches_played: number;
};

type Props = {
  initialRows?: Row[];
};

function formatNumber(value: string | number) {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return String(value);
  return n.toLocaleString("it-IT", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

export default function ClassificaLive({ initialRows = [] }: Props) {
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [loading, setLoading] = useState(!initialRows.length);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/classifica", { cache: "no-store" });
      const data = (await res.json()) as { ok: boolean; rows?: Row[]; error?: string };
      if (!res.ok || !data.ok || !data.rows) throw new Error(data.error ?? "Errore caricamento classifica");
      setRows(data.rows);
      setUpdatedAt(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore sconosciuto");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let id: NodeJS.Timeout;
    async function tick() {
      try {
        const res = await fetch("/api/classifica", { cache: "no-store" });
        const data = (await res.json()) as { ok: boolean; rows?: Row[]; error?: string };
        if (data.ok && data.rows) {
          setRows(data.rows);
          setUpdatedAt(Date.now());
          setLoading(false);
          setError(null);
        }
      } catch (e) {
        // Silently fail for background updates
      }
    }

    if (!initialRows.length) void tick();
    id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [initialRows.length]);

  const leader = useMemo(() => rows[0] ?? null, [rows]);

  return (
    <div className="flex flex-col gap-8">
      {/* Top Leader Card */}
      <PremiumCard className="relative overflow-visible bg-accent/5 ring-1 ring-accent/20">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="bg-accent p-4 rounded-3xl shadow-xl shadow-accent/40 rotate-3">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <motion.div 
                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-3 -right-3 bg-amber-400 p-1.5 rounded-full shadow-lg"
              >
                <Medal className="w-4 h-4 text-white" />
              </motion.div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent/70 mb-1">In Vetta</p>
              <h2 className="text-3xl font-black text-foreground leading-none">
                {loading ? "Caricamento..." : leader ? leader.name : "Nessun dato"}
              </h2>
              <div className="mt-2 flex items-center gap-2 text-zinc-500 font-bold text-sm">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                {loading ? "—" : leader ? formatNumber(leader.total_weighted) : "0.000"} Punti Totali
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={() => void load()}
              disabled={loading}
              className="group flex items-center gap-2 rounded-2xl bg-foreground px-5 py-2.5 text-sm font-bold text-background hover:opacity-90 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />
              Aggiorna Live
            </button>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              {updatedAt ? `Ultimo Sync: ${new Date(updatedAt).toLocaleTimeString()}` : "In attesa..."}
            </p>
          </div>
        </div>
        {error && <p className="mt-4 text-center text-sm font-bold text-red-500 bg-red-50 py-2 rounded-xl">{error}</p>}
      </PremiumCard>

      {/* Leaderboard Table */}
      <PremiumCard className="p-0 border-none ring-1 ring-zinc-200/50" delay={0.1}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400"># Rank</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Atleta</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Qualifiche</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Finali</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Match</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-accent text-right">Punteggio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              <AnimatePresence mode="popLayout">
                {rows.map((r, idx) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={r.athlete_id} 
                    className={`group transition-colors hover:bg-zinc-50/80 ${idx === 0 ? "bg-accent/5" : ""}`}
                  >
                    <td className="px-6 py-4">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-xl font-black text-sm ${
                        idx === 0 ? "bg-amber-400 text-white shadow-lg shadow-amber-400/30" : 
                        idx === 1 ? "bg-zinc-300 text-white shadow-lg shadow-zinc-300/30" :
                        idx === 2 ? "bg-amber-700/40 text-white shadow-lg shadow-amber-700/20" :
                        "text-zinc-400"
                      }`}>
                        {idx + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/atleti/${r.athlete_id}`} className="flex items-center gap-3 group/link">
                        <div className="bg-zinc-100 p-2 rounded-lg group-hover/link:bg-accent/10 transition-colors">
                          <User className="w-4 h-4 text-zinc-500 group-hover/link:text-accent transition-colors" />
                        </div>
                        <span className="font-bold text-foreground group-hover/link:text-accent transition-colors">{r.name}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-zinc-600 text-sm">{formatNumber(r.qualification_weighted)}</td>
                    <td className="px-6 py-4 text-center font-bold text-zinc-600 text-sm">{formatNumber(r.finals_weighted)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-black text-zinc-500">
                        {r.matches_played}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-lg font-black ${idx === 0 ? "text-accent" : "text-foreground"}`}>
                        {formatNumber(r.total_weighted)}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {rows.length === 0 && !loading && (
                <tr>
                  <td className="px-6 py-12 text-center text-zinc-400 font-medium italic" colSpan={6}>
                    Nessun dato registrato. Inizia la competizione!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </PremiumCard>
    </div>
  );
}
