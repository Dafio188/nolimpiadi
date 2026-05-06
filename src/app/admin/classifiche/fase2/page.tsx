import { prisma } from "@/lib/prisma";
import { Medal } from "lucide-react";
import TournamentBracketList from "@/components/ui/admin/TournamentBracketList";

export default async function ClassificaFase2Page() {
  // 1. Recupera le classifiche di qualificazione per popolare le card
  const rawRankings = await prisma.$queryRaw`
    SELECT 
      c.*,
      a.name as athlete_name
    FROM classifica_qualificazione_disciplina c
    JOIN athletes a ON a.id = c.athlete_id
    ORDER BY c.kind ASC, c.qualification_weighted DESC, a.name ASC
  `;

  // 2. Recupera tutti i match della Fase Finale
  const finalMatches = await prisma.match.findMany({
    where: { phase: "FINALI" },
    include: {
      sides: {
        include: { athletes: true }
      }
    }
  });

  // Raggruppa i dati per disciplina
  const disciplineRankings: Record<string, any> = {};
  (rawRankings as any[]).forEach((row) => {
    if (!disciplineRankings[row.kind]) {
      disciplineRankings[row.kind] = {
        id: row.discipline_id,
        kind: row.kind,
        name: row.discipline_name,
        rankings: [],
      };
    }
    disciplineRankings[row.kind].rankings.push({
      id: row.athlete_id,
      name: row.athlete_name,
      score: row.qualification_weighted,
      wins: row.wins,
      total_scored: row.total_scored,
      total_conceded: row.total_conceded,
      matches_played: row.matches_played,
    });
  });

  return (
    <div className="mx-auto w-full max-w-7xl">
      <header className="mb-12">
        <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-4">
          <Medal className="w-10 h-10 text-amber-500" />
          GESTIONE FASE FINALE
        </h1>
        <p className="mt-2 text-zinc-500 font-medium">
          Inserisci i risultati dei match nel tabellone a eliminazione diretta. Il Ranking Assoluto verrà aggiornato automaticamente.
        </p>
      </header>

      <TournamentBracketList 
        disciplines={disciplineRankings} 
        matches={finalMatches}
      />
    </div>
  );
}
