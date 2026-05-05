import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const VIEWS_SQL = `
      CREATE OR REPLACE VIEW classifica_qualificazione_disciplina AS
      SELECT 
        v.athlete_id,
        v.discipline_id,
        d.kind,
        d.name as discipline_name,
        SUM(v.is_win) AS wins,
        SUM(v.points_scored) AS total_scored,
        SUM(v.points_conceded) AS total_conceded,
        COUNT(*) AS matches_played,
        SUM(
          ((v.points_scored::float / GREATEST(v.points_scored, v.points_conceded)::float) * 210.0) - (v.points_conceded::float / 1000.0)
        ) AS qualification_weighted
      FROM v_participations v
      JOIN disciplines d ON d.id = v.discipline_id
      WHERE v.phase = 'QUALIFICAZIONE'
      GROUP BY v.athlete_id, v.discipline_id, d.kind, d.name;

      CREATE OR REPLACE VIEW classifica_complessiva AS
      WITH athlete_discipline_scores AS (
        SELECT 
          v.athlete_id,
          v.discipline_id,
          v.phase,
          SUM(
            ((v.points_scored::float / GREATEST(v.points_scored, v.points_conceded)::float) * 210.0) - (v.points_conceded::float / 1000.0)
          ) AS score,
          COUNT(v.match_id) AS matches_count
        FROM v_participations v
        JOIN disciplines d ON d.id = v.discipline_id
        GROUP BY v.athlete_id, v.discipline_id, v.phase
      )
      SELECT 
        a.id AS athlete_id,
        a.name,
        a.letter,
        COALESCE(SUM(CASE WHEN ads.phase = 'QUALIFICAZIONE' THEN ads.score ELSE 0 END), 0) AS qualification_weighted,
        COALESCE(SUM(CASE WHEN ads.phase = 'FINALI' THEN ads.score ELSE 0 END), 0) AS finals_weighted,
        COALESCE(SUM(ads.score), 0) AS total_weighted,
        COALESCE(SUM(ads.matches_count), 0)::int AS matches_played
      FROM athletes a
      LEFT JOIN athlete_discipline_scores ads ON ads.athlete_id = a.id
      GROUP BY a.id, a.name, a.letter;
    `;

    await prisma.$executeRawUnsafe(VIEWS_SQL);

    return NextResponse.json({ 
      ok: true, 
      message: "View del Database aggiornate con successo! I punteggi sono stati ricalcolati senza perdere dati."
    });
  } catch (error: any) {
    console.error("Errore durante l'aggiornamento delle view:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
