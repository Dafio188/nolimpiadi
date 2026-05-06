import React from "react";
import { prisma } from "@/lib/prisma";
import { Target, ListOrdered } from "lucide-react";
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
    <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 pb-20">

      <header className="py-10 mb-8 border-b border-zinc-100/50">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-4">
              <ListOrdered className="w-10 h-10 text-cyan-500" />
              CLASSIFICA FASE 1
            </h1>
            <p className="mt-2 text-zinc-500 font-medium">Classifica completa di tutte le discipline.</p>
          </div>
          <a
            href="/admin/classifiche/generale"
            className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all hover:scale-105"
          >
            Vai alla Hall of Fame &rarr;
          </a>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {disciplineOrder.map((kind) => {
          const disciplineRows = byDiscipline[kind] || [];
          if (disciplineRows.length === 0) return null;
          
          const discName = disciplineRows[0].discipline_name;
          const qualLimit = kind === "CALCIO_BALILLA" ? 5 : 6;

          return (
            <section key={kind} className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <div className="bg-cyan-500/10 p-2 rounded-xl">
                  <Target className="w-6 h-6 text-cyan-600" />
                </div>
                <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">{discName}</h2>
              </div>

              <PremiumCard className="p-0 border-none ring-1 ring-zinc-200/50 overflow-hidden bg-white/80 backdrop-blur-md">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-zinc-100 bg-zinc-50/30">
                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400 w-12 text-center">#</th>
                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400">Atleta</th>
                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400 text-center hidden sm:table-cell">M</th>
                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-cyan-600 text-right">Ponderato</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {disciplineRows.map((r, idx) => {
                        const isQualified = idx < qualLimit;
                        const isCutoff = idx === qualLimit;

                        return (
                          <React.Fragment key={r.athlete_id}>
                            {isCutoff && (
                              <tr className="bg-zinc-50/80 border-y border-zinc-200/50">
                                <td colSpan={4} className="px-4 py-2">
                                  <div className="text-[8px] font-black uppercase tracking-[0.25em] text-zinc-400 text-center">
                                    Fine zona qualificazione
                                  </div>
                                </td>
                              </tr>
                            )}
                            <tr className={`group transition-all ${isQualified ? "hover:bg-cyan-50/30" : "hover:bg-zinc-50/50 opacity-60 grayscale-[0.3]"}`}>
                              <td className="px-4 py-3">
                                <div className={`flex h-7 w-7 items-center justify-center mx-auto rounded-lg font-black text-[10px] ${
                                  idx === 0 ? "bg-amber-400 text-white shadow-sm" : 
                                  idx === 1 ? "bg-zinc-300 text-zinc-600 shadow-sm" :
                                  idx === 2 ? "bg-orange-300 text-orange-800 shadow-sm" :
                                  isQualified ? "bg-cyan-50 text-cyan-700" : "bg-zinc-50 text-zinc-400"
                                }`}>
                                  {idx + 1}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className={`font-bold text-sm tracking-tight ${isQualified ? "text-foreground" : "text-zinc-500"}`}>
                                      {r.athlete_name}
                                    </span>
                                    {isQualified && (
                                      <div className="bg-cyan-500 w-1 h-1 rounded-full animate-pulse" />
                                    )}
                                  </div>
                                  <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">{r.letter}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center font-bold text-zinc-400 text-xs hidden sm:table-cell">
                                {r.matches_played}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className={`text-sm font-black tabular-nums ${isQualified ? "text-cyan-600" : "text-zinc-400"}`}>
                                  {Number(r.qualification_weighted).toFixed(2)}
                                </span>
                              </td>
                            </tr>
                          </React.Fragment>
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
