import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Trophy, Medal, Star, Activity, Zap } from "lucide-react";
import PremiumCard from "@/components/ui/PremiumCard";
import DisciplineRankings from "@/components/ui/admin/DisciplineRankings";

export const dynamic = "force-dynamic";

export default async function ClassificaGeneraleAdmin() {
  // 1. Classifica Generale Complessiva
  const rows = await prisma.$queryRaw<{
    athlete_id: string;
    name: string;
    letter: string;
    total_weighted: string | number;
    qualification_weighted: string | number;
    finals_weighted: string | number;
    matches_played: number;
  }[]>`
    SELECT
      c.athlete_id,
      a.name,
      a.letter,
      c.total_weighted::text AS total_weighted,
      c.qualification_weighted::text AS qualification_weighted,
      c.finals_weighted::text AS finals_weighted,
      c.matches_played::int AS matches_played
    FROM classifica_complessiva c
    JOIN athletes a ON a.id = c.athlete_id
    ORDER BY c.total_weighted::numeric DESC, a.name ASC
  `;

  // 2. Classifiche per Disciplina (Fase 2)
  const finalMatches = await prisma.match.findMany({
    where: { phase: "FINALI" },
    include: {
      discipline: true,
      sides: {
        include: {
          athletes: {
            include: { athlete: true }
          }
        }
      }
    },
    orderBy: { playedAt: 'desc' }
  });

  // Organizziamo i risultati per disciplina
  const disciplineRankingsMap: Record<string, any> = {};

  finalMatches.forEach(match => {
    const kind = match.discipline.kind;
    if (!disciplineRankingsMap[kind]) {
      disciplineRankingsMap[kind] = { kind, standings: [] };
    }

    const side1 = match.sides.find(s => s.side === 1);
    const side2 = match.sides.find(s => s.side === 2);
    if (!side1 || !side2) return;

    const winner = side1.points > side2.points ? side1 : side2;
    const loser = side1.points > side2.points ? side2 : side1;

    const stageNames: Record<string, string> = {
      FINALE: "Finale",
      SEMIFINALI: "Semifinale",
      QUARTI: "Quarti di Finale"
    };

    const currentStage = match.finalStage ? stageNames[match.finalStage] : "Finale";

    // Aggiungiamo il vincitore se è la finale (1° posto)
    if (match.finalStage === "FINALE") {
      winner.athletes.forEach(sa => {
        disciplineRankingsMap[kind].standings.push({
          pos: 1,
          name: sa.athlete.name,
          stage: "Campione",
          isWinner: true
        });
      });
      loser.athletes.forEach(sa => {
        disciplineRankingsMap[kind].standings.push({
          pos: 2,
          name: sa.athlete.name,
          stage: "Finalista",
          isWinner: false
        });
      });
    } else if (match.finalStage === "SEMIFINALI") {
      loser.athletes.forEach(sa => {
        disciplineRankingsMap[kind].standings.push({
          pos: 3,
          name: sa.athlete.name,
          stage: "Semifinalista",
          isWinner: false
        });
      });
    } else if (match.finalStage === "QUARTI") {
       loser.athletes.forEach(sa => {
        disciplineRankingsMap[kind].standings.push({
          pos: 5,
          name: sa.athlete.name,
          stage: "Quarti di Finale",
          isWinner: false
        });
      });
    }
  });

  // Ordiniamo le classifiche disciplinari per posizione
  const rankings = Object.values(disciplineRankingsMap).map(r => ({
    ...r,
    standings: r.standings.sort((a: any, b: any) => a.pos - b.pos)
  }));

  return (
    <div className="mx-auto w-full max-w-7xl pb-20">

      <header className="mb-12">
        <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-4">
          <Trophy className="w-10 h-10 text-amber-500" />
          CLASSIFICHE GENERALI
        </h1>
        <p className="mt-2 text-zinc-500 font-medium">Risultati aggregati e classifiche finali per disciplina.</p>
      </header>

      <div className="space-y-20">
        {/* Classifica Assoluta */}
        <section>
          <div className="mb-6 flex items-center gap-3">
            <div className="bg-amber-500/10 p-2 rounded-lg">
              <Star className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="text-2xl font-black text-foreground">Ranking Assoluto 2026</h2>
            <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-[10px] font-black text-zinc-500 uppercase">
              {rows.length} Atleti
            </span>
          </div>

          <PremiumCard className="p-0 border-none ring-1 ring-amber-500/20 shadow-amber-500/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-100 bg-amber-50/30">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 w-24">Pos</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Atleta</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Partite</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-cyan-600 text-center">Pt. Qual.</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-indigo-600 text-center">Pt. Finali</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-amber-600 text-right">Totale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {rows.map((r, idx) => {
                    const isPodium = idx < 3;

                    return (
                      <tr 
                        key={r.athlete_id} 
                        className={`group transition-colors ${isPodium ? "hover:bg-amber-50/50 bg-amber-50/10" : "hover:bg-zinc-50/80"}`}
                      >
                        <td className="px-6 py-2">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-black text-lg ${
                            idx === 0 ? "bg-gradient-to-br from-yellow-300 to-amber-500 text-white shadow-lg shadow-amber-500/40 ring-2 ring-amber-200" : 
                            idx === 1 ? "bg-gradient-to-br from-gray-300 to-zinc-400 text-white shadow-lg shadow-zinc-400/30 ring-2 ring-zinc-200" :
                            idx === 2 ? "bg-gradient-to-br from-amber-700 to-orange-800 text-white shadow-lg shadow-orange-800/30 ring-2 ring-orange-900/50" :
                            "bg-zinc-100 text-zinc-400"
                          }`}>
                            {idx === 0 ? <Trophy className="w-5 h-5 text-yellow-50" /> : idx + 1}
                          </div>
                        </td>
                        <td className="px-6 py-2">
                          <div className="flex items-center gap-3">
                            <span className={`font-bold ${idx === 0 ? 'text-xl text-amber-700' : 'text-lg text-foreground'}`}>
                              {r.name}
                            </span>
                            <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
                              {r.letter}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-2 text-center font-bold text-zinc-600">{r.matches_played}</td>
                        <td className="px-6 py-2 text-center font-bold text-cyan-600 text-sm">
                          {Number(r.qualification_weighted).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-2 text-center font-bold text-indigo-600 text-sm">
                          {Number(r.finals_weighted).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-2 text-right">
                          <span className={`text-2xl font-black ${idx === 0 ? 'text-amber-600' : 'text-zinc-800'}`}>
                            {Number(r.total_weighted).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

        {/* Classifiche per Disciplina Fase 2 */}
        <DisciplineRankings rankings={rankings} />
      </div>
    </div>
  );
}

