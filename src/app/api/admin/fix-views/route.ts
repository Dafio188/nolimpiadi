import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const VIEWS_SQL = `
      DROP VIEW IF EXISTS classifica_complessiva CASCADE;
      DROP VIEW IF EXISTS classifica_qualificazione_disciplina CASCADE;
      DROP VIEW IF EXISTS v_participations CASCADE;

      CREATE OR REPLACE VIEW v_participations AS
      SELECT 
        msa.athlete_id,
        m.id AS match_id,
        m.discipline_id,
        m.phase,
        m.final_stage,
        m.target_victory,
        ms.side,
        ms.points AS points_scored,
        (SELECT points FROM match_sides WHERE match_id = m.id AND side != ms.side LIMIT 1) AS points_conceded,
        CASE 
          WHEN ms.points > (SELECT points FROM match_sides WHERE match_id = m.id AND side != ms.side LIMIT 1) THEN 1 
          ELSE 0 
        END AS is_win,
        m.played_at
      FROM match_side_athletes msa
      JOIN match_sides ms ON ms.id = msa.side_id
      JOIN matches m ON m.id = ms.match_id;

      CREATE OR REPLACE VIEW classifica_qualificazione_disciplina AS
      WITH athlete_stats AS (
        SELECT 
          athlete_id, 
          discipline_id, 
          COUNT(*) as total_matches
        FROM v_participations
        WHERE phase = 'QUALIFICAZIONE'
        GROUP BY athlete_id, discipline_id
      )
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
          (v.points_scored::float * (840.0 / NULLIF(ast.total_matches, 0)::float / NULLIF(v.target_victory, 0)::float))
          - ((v.points_conceded::float * (840.0 / NULLIF(ast.total_matches, 0)::float / NULLIF(v.target_victory, 0)::float)) / 1000.0)
        ) AS qualification_weighted
      FROM v_participations v
      JOIN disciplines d ON d.id = v.discipline_id
      JOIN athlete_stats ast ON ast.athlete_id = v.athlete_id AND ast.discipline_id = v.discipline_id
      WHERE v.phase = 'QUALIFICAZIONE'
      GROUP BY v.athlete_id, v.discipline_id, d.kind, d.name, ast.total_matches;

      CREATE OR REPLACE VIEW classifica_complessiva AS
      WITH athlete_match_scores AS (
        SELECT 
          v.athlete_id,
          v.discipline_id,
          v.phase,
          v.match_id,
          v.points_scored,
          v.points_conceded,
          v.target_victory,
          d.kind,
          (
            (v.points_scored::float * ( 840.0 / NULLIF(COUNT(*) OVER(PARTITION BY v.athlete_id, v.discipline_id, v.phase), 0)::float / NULLIF(v.target_victory, 0)::float))
            - ((v.points_conceded::float * ( 840.0 / NULLIF(COUNT(*) OVER(PARTITION BY v.athlete_id, v.discipline_id, v.phase), 0)::float / NULLIF(v.target_victory, 0)::float)) / 1000.0)
          ) AS match_score
        FROM v_participations v
        JOIN disciplines d ON d.id = v.discipline_id
      )
      SELECT 
        a.id AS athlete_id,
        a.name,
        a.letter,
        COALESCE(SUM(CASE WHEN ams.phase = 'QUALIFICAZIONE' THEN ams.match_score ELSE 0 END), 0) AS qualification_weighted,
        COALESCE(SUM(CASE WHEN ams.phase = 'FINALI' THEN ams.match_score ELSE 0 END), 0) AS finals_weighted,
        COALESCE(SUM(ams.match_score), 0) AS total_weighted,
        COUNT(DISTINCT ams.match_id) FILTER (WHERE ams.match_id IS NOT NULL)::int AS matches_played
      FROM athletes a
      LEFT JOIN athlete_match_scores ams ON ams.athlete_id = a.id
      GROUP BY a.id, a.name, a.letter;
    `;

    await prisma.$executeRawUnsafe(VIEWS_SQL);

    return NextResponse.json({ 
      ok: true, 
      message: "View del Database aggiornate con successo! Regola 840 applicata su tutto il torneo." 
    });
  } catch (error: any) {
    console.error("Update views error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
