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

  // 2. Recuperiamo tutte le discipline per assicurarci che la sezione sia sempre visibile
  const allDisciplines = await prisma.discipline.findMany({
    orderBy: { name: "asc" }
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
    <div className="mx-auto w-full max-w-[1600px] pb-20 px-4 sm:px-6 lg:px-8">
      {/* Header Dashboard */}
      <header className="py-10 mb-8 border-b border-zinc-100/50 dark:border-zinc-800/50 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-amber-500 p-2 rounded-xl shadow-lg shadow-amber-500/20">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
              Edizione 2026
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
            Hall of <span className="text-zinc-400">Fame</span>
          </h1>
          <p className="mt-3 text-zinc-500 font-medium max-w-xl leading-relaxed">
            Il cuore pulsante delle Nolimpiadi. Monitora il ranking assoluto e i campioni di ogni singola disciplina.
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl shadow-sm">
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Status Torneo</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Live Updates</span>
            </div>
          </div>
        </div>
      </header>

      {/* Grid Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* COLONNA SINISTRA: RANKING ASSOLUTO (8/12) */}
        <section className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
              <h2 className="text-xl font-black text-foreground">Ranking Assoluto</h2>
              <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[10px] font-black px-2 py-1 rounded-full uppercase">
                {rows.length} Atleti
              </span>
            </div>
            <div className="flex gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
              <span>Fase 1 + Fase 2</span>
            </div>
          </div>

          <PremiumCard className="p-0 border-none ring-1 ring-zinc-200/50 dark:ring-zinc-800 shadow-2xl shadow-zinc-200/40 dark:shadow-none overflow-hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100/50 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800/30">
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400 w-20">#</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">Atleta</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Match</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-cyan-500/70 text-center hidden md:table-cell">Qual.</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-indigo-500/70 text-center hidden md:table-cell">Finali</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-amber-600 text-right">Totale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100/50 dark:divide-zinc-800/50">
                  {rows.map((r, idx) => {
                    const isPodium = idx < 3;
                    const displayName = r.name.split(' ').slice(0, 2).join(' ');

                    return (
                      <tr 
                        key={r.athlete_id} 
                        className={`group transition-all duration-300 ${isPodium ? "bg-amber-500/[0.02]" : "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"}`}
                      >
                        <td className="px-6 py-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg font-black text-xs transition-transform group-hover:scale-110 ${
                            idx === 0 ? "bg-amber-400 text-white shadow-lg shadow-amber-400/30" : 
                            idx === 1 ? "bg-zinc-300 text-zinc-600" :
                            idx === 2 ? "bg-orange-300 text-orange-800" :
                            "text-zinc-400 font-bold"
                          }`}>
                            {idx + 1}
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <span className={`font-bold tracking-tight ${idx === 0 ? 'text-lg text-amber-600' : 'text-zinc-800 dark:text-zinc-200'}`}>
                                {displayName}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-[8px] font-black text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700 px-1.5 py-0.5 rounded tracking-tighter uppercase">
                                  Cod. {r.letter}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-center">
                          <div className="inline-flex items-center gap-1 text-zinc-500 font-bold text-sm bg-zinc-50 dark:bg-zinc-800/50 px-2 py-1 rounded-md">
                            <Activity className="w-3 h-3 opacity-30" />
                            {r.matches_played}
                          </div>
                        </td>
                        <td className="px-6 py-3 text-center font-bold text-cyan-600/80 text-xs hidden md:table-cell font-mono">
                          {Number(r.qualification_weighted).toFixed(2)}
                        </td>
                        <td className="px-6 py-3 text-center font-bold text-indigo-600/80 text-xs hidden md:table-cell font-mono">
                          {Number(r.finals_weighted).toFixed(2)}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <div className="flex flex-col items-end">
                            <span className={`text-xl font-black tabular-nums tracking-tighter ${idx === 0 ? 'text-amber-600 drop-shadow-sm' : 'text-zinc-800 dark:text-zinc-100'}`}>
                              {Number(r.total_weighted).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <div className="w-12 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full mt-1 overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${idx === 0 ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} 
                                style={{ width: `${Math.max(10, (Number(r.total_weighted) / Number(rows[0].total_weighted)) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </PremiumCard>
        </section>

        {/* COLONNA DESTRA: SIDEBAR DISCIPLINE (4/12) */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="bg-indigo-500/10 p-2 rounded-lg">
              <Medal className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-black text-foreground">Classifiche Fase 2</h2>
          </div>

          <div className="bg-zinc-50/50 dark:bg-zinc-900/50 p-1 rounded-3xl border border-zinc-100 dark:border-zinc-800">
             <DisciplineRankings rankings={rankings} />
          </div>

          <div className="p-6 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl text-white shadow-xl shadow-indigo-500/20 overflow-hidden relative group">
            <Zap className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12 transition-transform group-hover:scale-110" />
            <h3 className="text-lg font-black mb-2 relative z-10">Statistiche Fase 2</h3>
            <p className="text-white/80 text-xs font-medium leading-relaxed relative z-10">
              I punteggi della Fase 2 sono pesati al 60% sul totale. 
              Ogni vittoria in finale vale oro puro per il Ranking Assoluto.
            </p>
            <div className="mt-4 flex gap-2 relative z-10">
               <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase">Weight: 0.6</div>
               <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase">Fase Finale</div>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}


