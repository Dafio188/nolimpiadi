import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Dati raw dalla vista
  const raw = await prisma.$queryRaw<any[]>`
    SELECT 
      a.name, 
      d.kind,
      v.points_scored, 
      v.points_conceded,
      v.target_victory, 
      v.match_id,
      v.phase,
      COUNT(*) OVER(PARTITION BY v.athlete_id, v.discipline_id, v.phase) AS n_matches,
      LEAST(v.points_scored::float, v.target_victory::float) * (840.0 / 
        NULLIF(COUNT(*) OVER(PARTITION BY v.athlete_id, v.discipline_id, v.phase), 0)::float / 
        NULLIF(v.target_victory, 0)::float
      ) AS weighted_for,
      (LEAST(v.points_conceded::float, v.target_victory::float) * (840.0 / 
        NULLIF(COUNT(*) OVER(PARTITION BY v.athlete_id, v.discipline_id, v.phase), 0)::float / 
        NULLIF(v.target_victory, 0)::float
      ) / 1000.0) AS weighted_malus
    FROM v_participations v
    JOIN athletes a ON a.id = v.athlete_id
    JOIN disciplines d ON d.id = v.discipline_id
    WHERE d.kind = 'FRECCETTE'
    ORDER BY a.name, v.phase
  `;

  // Score totali aggregati per atleta
  const totals = await prisma.$queryRaw<any[]>`
    WITH scores AS (
      SELECT 
        a.name,
        v.phase,
        v.points_scored,
        v.points_conceded,
        v.target_victory,
        COUNT(*) OVER(PARTITION BY v.athlete_id, v.discipline_id, v.phase) AS n_matches,
        (LEAST(v.points_scored::float, v.target_victory::float) * (840.0 / 
          NULLIF(COUNT(*) OVER(PARTITION BY v.athlete_id, v.discipline_id, v.phase), 0)::float / 
          NULLIF(v.target_victory, 0)::float
        ) - (LEAST(v.points_conceded::float, v.target_victory::float) * (840.0 / 
          NULLIF(COUNT(*) OVER(PARTITION BY v.athlete_id, v.discipline_id, v.phase), 0)::float / 
          NULLIF(v.target_victory, 0)::float
        ) / 1000.0)) AS match_score
      FROM v_participations v
      JOIN athletes a ON a.id = v.athlete_id
      JOIN disciplines d ON d.id = v.discipline_id
      WHERE d.kind = 'FRECCETTE' AND v.phase = 'FINALI'
    )
    SELECT name, SUM(match_score) as total_weighted FROM scores GROUP BY name ORDER BY total_weighted DESC
  `;

  // BigInt → Number per serializzazione JSON (COUNT(*) Postgres restituisce BigInt)
  const serialize = (rows: any[]) =>
    rows.map(r =>
      Object.fromEntries(
        Object.entries(r).map(([k, v]) => [k, typeof v === "bigint" ? Number(v) : v])
      )
    );

  return NextResponse.json({ raw: serialize(raw), totals: serialize(totals) });
}
