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

  // 2. Recuperiamo tutte le discipline attive per assicurarci che la sezione sia sempre visibile
  const allDisciplines = await prisma.discipline.findMany({
    where: { isActive: true }
  });

  // 2.1 Classifiche per Disciplina (Fase 2)
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

  // Organizziamo i risultati per disciplina, inizializzando con tutte le discipline attive
  const disciplineRankingsMap: Record<string, any> = {};
  
  allDisciplines.forEach(d => {
    disciplineRankingsMap[d.kind] = { kind: d.kind, standings: [] };
  });

  finalMatches.forEach(match => {
    const kind = match.discipline.kind;
    // Se per qualche motivo la disciplina non era in allDisciplines, la aggiungiamo
    if (!disciplineRankingsMap[kind]) {
      disciplineRankingsMap[kind] = { kind, standings: [] };
    }

    const side1 = match.sides.find(s => s.side === 1);
    const side2 = match.sides.find(s => s.side === 2);
    if (!side1 || !side2) return;

    // Consideriamo il match solo se è stato giocato (almeno un punto segnato o flag isPlayed)
    if (side1.points === 0 && side2.points === 0) return;

    const winner = side1.points > side2.points ? side1 : side2;
    const loser = side1.points > side2.points ? side2 : side1;

    const stageNames: Record<string, string> = {
      FINALE: "Finale",
      SEMIFINALI: "Semifinale",
      QUARTI: "Quarti di Finale"
    };

    // Aggiungiamo il vincitore se è la finale (1° posto)
    if (match.finalStage === "FINALE") {
      winner.athletes.forEach(sa => {
        disciplineRankingsMap[kind].standings.push({
          pos: 1,
          name: sa.athlete.name.split(' ').slice(0, 2).join(' '), // Togliamo iniziali/cognomi extra
          stage: "Campione",
          isWinner: true
        });
      });
      loser.athletes.forEach(sa => {
        disciplineRankingsMap[kind].standings.push({
          pos: 2,
          name: sa.athlete.name.split(' ').slice(0, 2).join(' '),
          stage: "Finalista",
          isWinner: false
        });
      });
    } else if (match.finalStage === "SEMIFINALI") {
      loser.athletes.forEach(sa => {
        disciplineRankingsMap[kind].standings.push({
          pos: 3,
          name: sa.athlete.name.split(' ').slice(0, 2).join(' '),
          stage: "Semifinalista",
          isWinner: false
        });
      });
    } else if (match.finalStage === "QUARTI") {
       loser.athletes.forEach(sa => {
        disciplineRankingsMap[kind].standings.push({
          pos: 5,
          name: sa.athlete.name.split(' ').slice(0, 2).join(' '),
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
    <div className="mx-auto w-full max-w-7xl pb-20 px-4">

      <header className="mb-12">
        <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-4">
          <Trophy className="w-10 h-10 text-amber-500" />
          CLASSIFICHE GENERALI
        </h1>
        <p className="mt-2 text-zinc-500 font-medium italic">Risultati aggregati e classifiche finali per disciplina.</p>
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

          <PremiumCard className="p-0 border-none ring-1 ring-amber-500/10 shadow-xl shadow-zinc-200/50 dark:shadow-none overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/50">
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
                    // Togliamo iniziali/cognomi extra (es: "Gustavo B. V." -> "Gustavo")
                    const displayName = r.name.split(' ').slice(0, 2).join(' ');

                    return (
                      <tr 
                        key={r.athlete_id} 
                        className={`group transition-colors ${isPodium ? "bg-amber-50/5" : "hover:bg-zinc-50/80"}`}
                      >
                        <td className="px-6 py-1.5">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-lg font-black text-sm ${
                            idx === 0 ? "bg-amber-100 text-amber-600 ring-1 ring-amber-200" : 
                            idx === 1 ? "bg-zinc-100 text-zinc-500 ring-1 ring-zinc-200" :
                            idx === 2 ? "bg-orange-100 text-orange-700 ring-1 ring-orange-200" :
                            "text-zinc-400"
                          }`}>
                            {idx + 1}
                          </div>
                        </td>
                        <td className="px-6 py-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${idx === 0 ? 'text-lg text-amber-700' : 'text-base text-zinc-800'}`}>
                              {displayName}
                            </span>
                            <span className="text-[9px] font-black text-zinc-300 bg-zinc-50 border border-zinc-100 px-1.5 py-0.5 rounded uppercase">
                              {r.letter}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-1.5 text-center font-bold text-zinc-500 text-sm">{r.matches_played}</td>
                        <td className="px-6 py-1.5 text-center font-bold text-cyan-600 text-xs">
                          {Number(r.qualification_weighted).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-1.5 text-center font-bold text-indigo-600 text-xs">
                          {Number(r.finals_weighted).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-1.5 text-right">
                          <span className={`text-xl font-black ${idx === 0 ? 'text-amber-600' : 'text-zinc-700'}`}>
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
        <div className="pt-10 border-t border-zinc-100">
          <DisciplineRankings rankings={rankings} />
        </div>
      </div>
    </div>
  );
}


