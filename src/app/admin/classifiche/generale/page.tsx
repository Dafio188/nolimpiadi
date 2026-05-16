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
      // Identificazione della finale (1-2, 3-4 o 5-6) se lo stage è genericamente 'FINALE'
      let isTrueFinal = match.finalStage === "FINALE";
      let isConsolation34 = match.finalStage === ("FINALE_34" as any);
      let isConsolation56 = match.finalStage === ("FINALE_56" as any);

      if (isTrueFinal) {
        // 1. Recuperiamo i vincitori delle semi per questo sport
        const winnersOfSemis = finalMatches
          .filter(m => m.discipline.kind === kind && m.finalStage === "SEMIFINALI")
          .map(m => {
            const s1 = m.sides.find(s => s.side === 1);
            const s2 = m.sides.find(s => s.side === 2);
            if (s1 && s2 && s1.points >= 0 && s2.points >= 0) {
              return s1.points > s2.points ? s1.athletes[0]?.athleteId : s2.athletes[0]?.athleteId;
            }
            return null;
          })
          .filter(Boolean);

        // 2. Recuperiamo i perdenti dei quarti per questo sport
        const losersOfQuarts = finalMatches
          .filter(m => m.discipline.kind === kind && m.finalStage === "QUARTI")
          .map(m => {
            const s1 = m.sides.find(s => s.side === 1);
            const s2 = m.sides.find(s => s.side === 2);
            if (s1 && s2 && s1.points >= 0 && s2.points >= 0) {
              return s1.points < s2.points ? s1.athletes[0]?.athleteId : s2.athletes[0]?.athleteId;
            }
            return null;
          })
          .filter(Boolean);

        const playersInMatch = [...side1.athletes, ...side2.athletes].map(a => a.athleteId);

        if (winnersOfSemis.length > 0) {
          const hasWinner = playersInMatch.some(id => winnersOfSemis.includes(id));
          if (!hasWinner) {
            // Se non ci sono vincitori di semi, è una finale di consolazione
            isTrueFinal = false;
            // Verifichiamo se sono perdenti dei quarti (5-6) o altro (3-4)
            if (losersOfQuarts.length > 0 && playersInMatch.some(id => losersOfQuarts.includes(id))) {
              isConsolation56 = true;
            } else {
              isConsolation34 = true;
            }
          }
        }
      }

      if (isTrueFinal) {
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
      } else if (isConsolation34) {
        winner.athletes.forEach(sa => {
          disciplineRankingsMap[kind].standings.push({
            pos: 3,
            name: sa.athlete.name.split(' ').slice(0, 2).join(' '),
            stage: "3° Posto",
            isWinner: false
          });
        });
        loser.athletes.forEach(sa => {
          disciplineRankingsMap[kind].standings.push({
            pos: 4,
            name: sa.athlete.name.split(' ').slice(0, 2).join(' '),
            stage: "4° Posto",
            isWinner: false
          });
        });
      } else if (isConsolation56) {
        winner.athletes.forEach(sa => {
          disciplineRankingsMap[kind].standings.push({
            pos: 5,
            name: sa.athlete.name.split(' ').slice(0, 2).join(' '),
            stage: "5° Posto",
            isWinner: false
          });
        });
        loser.athletes.forEach(sa => {
          disciplineRankingsMap[kind].standings.push({
            pos: 6,
            name: sa.athlete.name.split(' ').slice(0, 2).join(' '),
            stage: "6° Posto",
            isWinner: false
          });
        });
      } else if (match.finalStage === "SEMIFINALI") {
        loser.athletes.forEach(sa => {
          // Solo se non abbiamo già un piazzamento specifico da una finale 3/4
          if (!disciplineRankingsMap[kind].standings.find((s: any) => s.name === sa.athlete.name.split(' ').slice(0, 2).join(' ') && s.pos < 5)) {
            disciplineRankingsMap[kind].standings.push({
              pos: 3,
              name: sa.athlete.name.split(' ').slice(0, 2).join(' '),
              stage: "Semifinalista",
              isWinner: false
            });
          }
        });
      } else if (match.finalStage === "QUARTI") {
         loser.athletes.forEach(sa => {
          // Solo se non abbiamo già un piazzamento specifico da una finale 5/6
          if (!disciplineRankingsMap[kind].standings.find((s: any) => s.name === sa.athlete.name.split(' ').slice(0, 2).join(' '))) {
            disciplineRankingsMap[kind].standings.push({
              pos: 5,
              name: sa.athlete.name.split(' ').slice(0, 2).join(' '),
              stage: "Quarti di Finale",
              isWinner: false
            });
          }
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

  // 2.2 Classifica Finale per Disciplina (Somma Fase 1 + Fase 2 per tutti i 12 atleti - Richiesta 4 e 6)
  const finalDisciplineRankings = await prisma.$queryRaw<any[]>`
    SELECT 
      c.discipline_id, 
      c.athlete_id, 
      a.name as athlete_name, 
      c.total_weighted as total_score,
      c.qualification_weighted as phase1_score,
      c.finals_weighted as phase2_score
    FROM classifica_finale_disciplina c
    JOIN athletes a ON a.id = c.athlete_id
    ORDER BY c.discipline_id, c.total_weighted DESC, a.name ASC
  `;

  // Manteniamo l'ordine basato su allDisciplines per l'output finale
    const rankings = allDisciplines.map(d => {
      const discResults = finalDisciplineRankings.filter(r => r.discipline_id === d.id);
      
      // Calcoliamo il rank di fase 1 internamente per determinare "Qualificato"
      const phase1Sorted = [...discResults].sort((a, b) => Number(b.phase1_score) - Number(a.phase1_score));
      const qualLimit = d.kind === "CALCIO_BALILLA" ? 5 : 6;

      const finalStandings = disciplineRankingsMap[d.kind]?.standings || [];

      // Creiamo la lista mergiando i dati
      const mergedStandings = discResults.map((r) => {
        const qName = r.athlete_name.split(' ').slice(0, 2).join(' ');
        const finalS = finalStandings.find((s: any) => s.name === qName);
        
        const phase1Rank = phase1Sorted.findIndex(p => p.athlete_id === r.athlete_id) + 1;
        const wasQualified = phase1Rank <= qualLimit;

        return {
          athleteId: r.athlete_id,
          originalPos: phase1Rank,
          finalPos: finalS ? finalS.pos : 99, 
          name: qName,
          stage: finalS ? finalS.stage : (wasQualified ? "Qualificato" : "Non qualificato"),
          isWinner: finalS ? finalS.isWinner : false,
          score: Number(r.total_score)
        };
      });

      // Ordiniamo per posizione finale (se presente), altrimenti per punteggio totale
      mergedStandings.sort((a, b) => {
        if (a.finalPos !== 99 || b.finalPos !== 99) {
          if (a.finalPos !== b.finalPos) return a.finalPos - b.finalPos;
        }
        return b.score - a.score;
      });

    // Assegniamo la pos visuale (1 a 12)
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

  // 4. Calcolo totali punti/gol per disciplina
  const totalPointsRaw = await prisma.$queryRaw<{ kind: string; total: string | number }[]>`
    SELECT 
      d.kind, 
      SUM(s.points) as total
    FROM match_sides s
    JOIN matches m ON s.match_id = m.id
    JOIN disciplines d ON m.discipline_id = d.id
    WHERE s.points > 0
    GROUP BY d.kind
  `;

  const totalPoints: Record<string, number> = {};
  totalPointsRaw.forEach((row) => {
    totalPoints[row.kind] = Number(row.total);
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

      {/* STATISTICHE GLOBALI */}
      <section className="mt-12 space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 p-2 rounded-lg">
              <Activity className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-xl font-black text-foreground">Statistiche Globali</h2>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <PremiumCard className="p-6 flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-black text-emerald-500">{totalPoints["CALCIO_BALILLA"] || 0}</span>
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-2">Gol Calcio-Balilla</span>
          </PremiumCard>
          <PremiumCard className="p-6 flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-black text-emerald-500">{totalPoints["FRECCETTE"] || 0}</span>
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-2">Punti Freccette</span>
          </PremiumCard>
          <PremiumCard className="p-6 flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-black text-emerald-500">{totalPoints["PING_PONG"] || 0}</span>
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-2">Punti Ping-Pong</span>
          </PremiumCard>
          <PremiumCard className="p-6 flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-black text-emerald-500">{totalPoints["AIR_HOCKEY"] || 0}</span>
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-2">Gol Air-Hockey</span>
          </PremiumCard>
        </div>
      </section>
    </div>
  );
}


