import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Trophy, Medal, Star, Activity } from "lucide-react";
import PremiumCard from "@/components/ui/PremiumCard";
import DisciplineRankings from "@/components/ui/admin/DisciplineRankings";
import GeneralRankingTable from "@/components/ui/admin/GeneralRankingTable";

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
    ORDER BY c.discipline_id, c.qualification_weighted DESC, a.name ASC
  `;

  // 2.3 Punteggi totali pesati per disciplina (Fase 2 - coefficiente fisso 840)
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
        athleteId: q.athlete_id,
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

          <GeneralRankingTable rows={rows} />
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



        </aside>

      </div>
    </div>

  );
}


