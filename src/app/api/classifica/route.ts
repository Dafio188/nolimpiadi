import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Row = {
  athlete_id: string;
  name: string;
  total_weighted: string | number;
  qualification_weighted: string | number;
  finals_weighted: string | number;
  matches_played: number;
};

export async function GET() {
  const rows = await prisma.$queryRaw<Row[]>`
    SELECT
      athlete_id,
      name,
      total_weighted,
      qualification_weighted,
      finals_weighted,
      matches_played::int AS matches_played
    FROM classifica_complessiva
    ORDER BY total_weighted DESC, name ASC
  `;

  return NextResponse.json({ ok: true, rows });
}
