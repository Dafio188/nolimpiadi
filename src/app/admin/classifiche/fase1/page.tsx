import React from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Target, Trophy, ChevronRight, Activity, ListOrdered } from "lucide-react";
import PremiumCard from "@/components/ui/PremiumCard";

export const dynamic = "force-dynamic";

export default async function ClassificaFase1() {
  const rows = await prisma.$queryRaw<any[]>`
    SELECT 
      a.id        AS athlete_id,
      a.name      AS athlete_name,
      a.letter,
      d.kind,
      d.name      AS discipline_name,
      COALESCE(c.wins::int,            0) AS wins,
      COALESCE(c.total_scored::int,    0) AS total_scored,
      COALESCE(c.total_conceded::int,  0) AS total_conceded,
      COALESCE(c.matches_played::int,  0) AS matches_played,
      COALESCE(c.qualification_weighted, 0) AS qualification_weighted
    FROM athletes a
    CROSS JOIN disciplines d
    LEFT JOIN classifica_qualificazione_disciplina c
      ON c.athlete_id = a.id AND c.kind = d.kind
    ORDER BY d.kind, COALESCE(c.qualification_weighted, 0) DESC, a.name ASC
  `;

  const byDiscipline: Record<string, any[]> = {};
  for (const r of rows) {
    if (!byDiscipline[r.kind]) byDiscipline[r.kind] = [];
    byDiscipline[r.kind].push(r);
  }

  const disciplineOrder = ["CALCIO_BALILLA", "FRECCETTE", "PING_PONG", "AIR_HOCKEY"];

  return (
    <div className="mx-auto w-full max-w-7xl">

      <header className="mb-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-4">
              <ListOrdered className="w-10 h-10 text-cyan-500" />
              CLASSIFICA FASE 1
            </h1>
            <p className="mt-2 text-zinc-500 font-medium">Classifica prima fase e gironi.</p>
          </div>
          <a
            href="/admin/classifiche/fase2"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-colors"
          >
            Vai alla Seconda Fase &rarr;
          </a>
        </div>
      </header>

      <div className="space-y-16">
        {disciplineOrder.map((kind) => {
          const disciplineRows = byDiscipline[kind] || [];
          if (disciplineRows.length === 0) return null;
          
          const discName = disciplineRows[0].discipline_name;

          return (
            <section key={kind}>
              <div className="mb-6 flex items-center gap-3">
                <div className="bg-cyan-500/10 p-2 rounded-lg">
                  <Target className="w-6 h-6 text-cyan-600" />
                </div>
                <h2 className="text-2xl font-black text-foreground">{discName}</h2>
                <span className="rounded-full bg-cyan-100 dark:bg-cyan-900/30 px-3 py-1 text-[10px] font-black text-cyan-600 uppercase">
                  {kind === "CALCIO_BALILLA" ? "Prime 5" : "Primi 6"} qualificati
                </span>
              </div>

              <PremiumCard className="p-0 border-none ring-1 ring-zinc-200/50">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-zinc-100 bg-zinc-50/50">
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 w-24">Rank</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Atleta</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Partite</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Vittorie</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Pt. Fatti</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Pt. Subiti</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-cyan-600 text-right">Score Ponderato</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {/* Riga header zona qualificati */}
                      <tr className="bg-cyan-500/10">
                        <td colSpan={7} className="px-6 py-2">
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-cyan-700">
                            <span className="inline-block w-2 h-2 rounded-full bg-cyan-500" />
                            Zona qualificazione — {kind === "CALCIO_BALILLA" ? "Prime 5 coppie" : "Primi 6 atleti"}
                          </div>
                        </td>
                      </tr>
                      {disciplineRows.slice(0, kind === "CALCIO_BALILLA" ? 5 : 6).map((r, idx) => {
                        return (
                          <tr 
                            key={r.athlete_id} 
                            className="group transition-colors hover:bg-cyan-50/50"
                          >
                            <td className="px-6 py-2">
                              <div className={`flex h-8 w-8 items-center justify-center rounded-xl font-black text-sm ${
                                idx === 0 ? "bg-amber-400 text-white shadow-lg shadow-amber-400/30" : 
                                idx === 1 ? "bg-zinc-300 text-white shadow-lg shadow-zinc-300/30" :
                                idx === 2 ? "bg-amber-700/40 text-white shadow-lg shadow-amber-700/20" :
                                "bg-cyan-500/20 text-cyan-700"
                              }`}>
                                {idx + 1}
                              </div>
                            </td>
                            <td className="px-6 py-2">
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-foreground">{r.athlete_name}</span>
                                <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
                                  {r.letter}
                                </span>
                                <span className="text-[10px] font-black text-cyan-600 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full">
                                  ✓ QUALIFICATO
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-2 text-center font-bold text-zinc-600">{r.matches_played}</td>
                            <td className="px-6 py-2 text-center font-black text-foreground">{r.wins}</td>
                            <td className="px-6 py-2 text-center font-bold text-emerald-600">{r.total_scored}</td>
                            <td className="px-6 py-2 text-center font-bold text-red-600">{r.total_conceded}</td>
                            <td className="px-6 py-2 text-right">
                              <span className="text-lg font-black text-cyan-600">
                                {Number(r.qualification_weighted).toLocaleString("it-IT", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </PremiumCard>
            </section>
          );
        })}
      </div>
    </div>
  );
}
