import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Query sulla VIEW che abbiamo creato, così vediamo i dati come li vede il calcolo
  const data = await prisma.$queryRaw`
    SELECT 
      a.name, 
      v.points_scored, 
      v.points_conceded,
      v.target_victory, 
      v.match_id,
      v.phase
    FROM v_participations v
    JOIN athletes a ON a.id = v.athlete_id
    JOIN disciplines d ON d.id = v.discipline_id
    WHERE d.kind = 'FRECCETTE'
    ORDER BY a.name
    LIMIT 20;
  `;
  return NextResponse.json(data);
}
