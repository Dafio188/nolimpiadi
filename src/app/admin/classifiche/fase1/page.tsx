import React from "react";
import { prisma } from "@/lib/prisma";
import { ListOrdered } from "lucide-react";
import Fase1RankingTables from "@/components/ui/admin/Fase1RankingTables";

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
        </div>
      </header>

      <Fase1RankingTables byDiscipline={byDiscipline} disciplineOrder={disciplineOrder} />
    </div>
  );
}

