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

  // 2. Recuperiamo tutte le discipline
  const allDisciplinesRaw = await prisma.discipline.findMany();
  
  // Ordine ufficiale del Live Score / Calendario
  const orderMap: Record<string, number> = {
    CALCIO_BALILLA: 1,
    FRECCETTE: 2,
    PING_PONG: 3,
    AIR_HOCKEY: 4
  };

  const allDisciplines = allDisciplinesRaw.sort((a, b) => 
    (orderMap[a.kind] || 99) - (orderMap[b.kind] || 99)
  );


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

  // Organizziamo i risultati per disciplina, seguendo l'ordine di allDisciplines
  const disciplineRankingsMap: Record<string, any> = {};
  
  allDisciplines.forEach(d => {
    disciplineRankingsMap[d.kind] = { kind: d.kind, standings: [] };
  });

  finalMatches.forEach(match => {
    const kind = match.discipline.kind;
    if (!disciplineRankingsMap[kind]) {
      disciplineRankingsMap[kind] = { kind, standings: [] };
    }

    const side1 = match.sides.find(s => s.side === 1);
    const side2 = match.sides.find(s => s.side === 2);
    if (!side1 || !side2) return;

    if (side1.points === 0 && side2.points === 0) return;

    const winner = side1.points > side2.points ? side1 : side2;
    const loser = side1.points > side2.points ? side2 : side1;

    if (kind === "CALCIO_BALILLA") {
      // Accumuleremo i punti per il girone all'italiana
      // Inizializziamo atleti se non esistono
      side1.athletes.forEach(sa => {
        let existing = disciplineRankingsMap[kind].standings.find((s: any) => s.id === sa.athleteId);
        if (!existing) {
          existing = {
            id: sa.athleteId,
            name: sa.athlete.name.split(' ').slice(0, 2).join(' '),
            stage: "Girone",
            score: 0,
            isWinner: false
          };
          disciplineRankingsMap[kind].standings.push(existing);
        }
        existing.score += side1.points;
      });
      side2.athletes.forEach(sa => {
        let existing = disciplineRankingsMap[kind].standings.find((s: any) => s.id === sa.athleteId);
        if (!existing) {
          existing = {
            id: sa.athleteId,
            name: sa.athlete.name.split(' ').slice(0, 2).join(' '),
            stage: "Girone",
            score: 0,
            isWinner: false
          };
          disciplineRankingsMap[kind].standings.push(existing);
        }
        existing.score += side2.points;
      });
    } else {
      if (match.finalStage === "FINALE") {
        winner.athletes.forEach(sa => {
          disciplineRankingsMap[kind].standings.push({
            pos: 1,
            name: sa.athlete.name.split(' ').slice(0, 2).join(' '),
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
    }
  });

  // Calcola posizioni finali per CALCIO_BALILLA
  if (disciplineRankingsMap["CALCIO_BALILLA"]) {
    disciplineRankingsMap["CALCIO_BALILLA"].standings.sort((a: any, b: any) => b.score - a.score);
    disciplineRankingsMap["CALCIO_BALILLA"].standings.forEach((s: any, i: number) => {
      s.pos = i + 1;
      if (i === 0) {
        s.stage = "Campione";
        s.isWinner = true;
      } else if (i === 1) {
        s.stage = "Secondo Posto";
      } else if (i === 2) {
        s.stage = "Terzo Posto";
      } else {
        s.stage = "Piazzato";
      }
    });
  }

  // 2.2 Qualificati dalla Fase 1 (per popolare la lista da 1 a 6)
  const phase1Rankings = await prisma.$queryRaw<any[]>`
    SELECT 
      c.discipline_id, 
      c.athlete_id, 
      a.name as athlete_name, 
      c.qualification_weighted as score
    FROM classifica_qualificazione_disciplina c
    JOIN athletes a ON a.id = c.athlete_id
    ORDER BY c.discipline_id, c.qualification_weighted DESC
  `;

  // 2.3 Punteggi totali pesati per disciplina (Fase 1 + Fase 2)
  const disciplineTotalScores = await prisma.$queryRaw<any[]>`
    WITH athlete_match_scores AS (
      SELECT 
        v.athlete_id,
        v.discipline_id,
        v.phase,
        v.match_id,
        (
          (LEAST(v.points_scored::float, v.target_victory::float) * ( 840.0 / NULLIF(COUNT(*) OVER(PARTITION BY v.athlete_id, v.discipline_id, v.phase), 0)::float / NULLIF(v.target_victory, 0)::float))
          - ((LEAST(v.points_conceded::float, v.target_victory::float) * ( 840.0 / NULLIF(COUNT(*) OVER(PARTITION BY v.athlete_id, v.discipline_id, v.phase), 0)::float / NULLIF(v.target_victory, 0)::float)) / 1000.0)
        ) AS match_score
      FROM v_participations v
      WHERE v.phase = 'FINALI'
    )
    SELECT 
      athlete_id, 
      discipline_id, 
      SUM(match_score) as total_weighted
    FROM athlete_match_scores
    GROUP BY athlete_id, discipline_id
  `;

  // Manteniamo l'ordine basato su allDisciplines per l'output finale
  const rankings = allDisciplines.map(d => {
    const discPhase1 = phase1Rankings.filter(r => r.discipline_id === d.id);
    const limit = d.kind === "CALCIO_BALILLA" ? 5 : 6;
    const topQualifiers = discPhase1.slice(0, limit);

    const finalStandings = disciplineRankingsMap[d.kind]?.standings || [];

    // Creiamo la lista mergiando i dati
    const mergedStandings = topQualifiers.map((q, idx) => {
      const qName = q.athlete_name.split(' ').slice(0, 2).join(' ');
      const finalS = finalStandings.find((s: any) => s.name === qName);
      
      const totalScore = disciplineTotalScores.find(
        (ts: any) => ts.athlete_id === q.athlete_id && ts.discipline_id === d.id
      )?.total_weighted;

      return {
        originalPos: idx + 1,
        finalPos: finalS ? finalS.pos : 99, // 99 means not finalized yet
        name: qName,
        stage: finalS ? finalS.stage : (idx < limit ? "Qualificato (In Gara)" : ""),
        isWinner: finalS ? finalS.isWinner : false,
        score: totalScore !== undefined ? totalScore : 0
      };
    });

    // Ordiniamo prima per posizione finale (se presente), altrimenti per posizione di qualifica
    mergedStandings.sort((a, b) => {
      if (a.finalPos !== 99 || b.finalPos !== 99) {
        return a.finalPos - b.finalPos;
      }
      return a.originalPos - b.originalPos;
    });

    // Assegniamo la pos visuale (1 a 6)
    mergedStandings.forEach((s, i) => {
      (s as any).displayPos = i + 1;
    });

    return {
      ...d,
      standings: mergedStandings
    };
  });

  // 3. Recuperiamo tutti gli atleti per la selezione manuale (Fase 2)
  const allAthletes = await prisma.athlete.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true }
  });

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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLONNA SINISTRA: RANKING ASSOLUTO (7/12) */}
        <section className="lg:col-span-7 space-y-6">
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
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="border-b border-zinc-100/50 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800/30">
                    <th className="px-3 py-5 text-[9px] font-black uppercase tracking-widest text-zinc-400 w-[50px]">#</th>
                    <th className="px-3 py-5 text-[9px] font-black uppercase tracking-widest text-zinc-400 w-[180px]">Atleta</th>
                    <th className="px-3 py-5 text-[9px] font-black uppercase tracking-widest text-zinc-400 text-center w-[70px]">Match</th>
                    <th className="px-3 py-5 text-[9px] font-black uppercase tracking-widest text-cyan-500/70 text-center hidden md:table-cell w-[80px]">Qual.</th>
                    <th className="px-3 py-5 text-[9px] font-black uppercase tracking-widest text-indigo-500/70 text-center hidden md:table-cell w-[80px]">Finali</th>
                    <th className="px-3 py-5 text-[9px] font-black uppercase tracking-widest text-amber-600 text-right w-[100px]">Totale</th>
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
                        <td className="px-3 py-3">
                          <div className={`flex h-7 w-7 items-center justify-center rounded-lg font-black text-[10px] transition-transform group-hover:scale-110 ${
                            idx === 0 ? "bg-amber-400 text-white shadow-lg shadow-amber-400/30" : 
                            idx === 1 ? "bg-zinc-300 text-zinc-600" :
                            idx === 2 ? "bg-orange-300 text-orange-800" :
                            "text-zinc-400 font-bold"
                          }`}>
                            {idx + 1}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-col min-w-0">
                            <span className={`font-bold tracking-tight truncate ${idx === 0 ? 'text-base text-amber-600' : 'text-sm text-zinc-800 dark:text-zinc-200'}`}>
                              {displayName}
                            </span>
                            <span className="text-[9px] w-fit font-black text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700 px-1.5 py-0 rounded tracking-tighter uppercase">
                              {r.letter}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <div className="inline-flex items-center gap-1 text-zinc-600 font-bold text-sm bg-zinc-50 dark:bg-zinc-800/50 px-2 py-0.5 rounded">
                            {r.matches_played}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center font-bold text-cyan-600/90 text-sm hidden md:table-cell font-mono">
                          {Number(r.qualification_weighted).toFixed(1)}
                        </td>
                        <td className="px-3 py-3 text-center font-bold text-indigo-600/90 text-sm hidden md:table-cell font-mono">
                          {Number(r.finals_weighted).toFixed(1)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex flex-col items-end">
                            <span className={`text-base font-black tabular-nums tracking-tighter ${idx === 0 ? 'text-amber-600 drop-shadow-sm' : 'text-zinc-800 dark:text-zinc-100'}`}>
                              {Number(r.total_weighted).toLocaleString("it-IT", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                            </span>
                            <div className="w-10 h-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full mt-0.5 overflow-hidden">
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

        {/* COLONNA DESTRA: SIDEBAR DISCIPLINE (5/12) */}
        <aside className="lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500/10 p-2 rounded-lg">
                <Medal className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-xl font-black text-foreground">Classifiche per Disciplina</h2>
            </div>
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-100 px-2 py-1 rounded">Fase 2</span>
          </div>

          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-[2.5rem] border border-zinc-200/50 dark:border-zinc-800 shadow-xl shadow-zinc-200/20 overflow-hidden">
             <DisciplineRankings rankings={rankings} athletes={allAthletes} />
          </div>

          <div className="p-6 bg-gradient-to-br from-zinc-800 to-black rounded-3xl text-white shadow-xl shadow-black/10 overflow-hidden relative group">
            <Zap className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 rotate-12 transition-transform group-hover:scale-110" />
            <h3 className="text-lg font-black mb-2 relative z-10">Pesi Punteggio</h3>
            <p className="text-zinc-400 text-[10px] font-medium leading-relaxed relative z-10">
              La classifica assoluta è determinata dalla somma pesata delle due fasi. La vittoria in una disciplina nella Fase 2 garantisce un balzo significativo nel Ranking Assoluto.
            </p>
            <div className="mt-4 flex gap-2 relative z-10">
               <div className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase border border-white/5">Fase 1: 40%</div>
               <div className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase border border-white/5">Fase 2: 60%</div>
            </div>
          </div>
        </aside>

      </div>
    </div>

  );
}


