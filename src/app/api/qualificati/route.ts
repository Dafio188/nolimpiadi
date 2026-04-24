import { prisma } from "@/lib/prisma";
import { DisciplineKind } from "@prisma/client";
import { NextResponse } from "next/server";

function parseKind(value: string | null): DisciplineKind | null {
  if (!value) return null;
  const values = Object.values(DisciplineKind) as DisciplineKind[];
  return values.includes(value as DisciplineKind) ? (value as DisciplineKind) : null;
}

type Row = {
  athlete_id: string;
  name: string;
  kind: string;
  discipline_name: string;
  qualification_weighted: string | number;
  matches_played: number;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const kind = parseKind(url.searchParams.get("kind"));
  if (!kind) {
    return NextResponse.json({ ok: false, error: "Param kind mancante o non valido" }, { status: 400 });
  }

  const limit = kind === DisciplineKind.CALCIO_BALILLA ? 5 : 6;

  const rows = await prisma.$queryRaw<Row[]>`
    SELECT
      q.athlete_id,
      a.name,
      q.kind,
      q.discipline_name,
      q.qualification_weighted,
      q.matches_played::int AS matches_played
    FROM classifica_qualificazione_disciplina q
    INNER JOIN athletes a ON a.id = q.athlete_id
    WHERE q.kind = ${kind}
    ORDER BY q.qualification_weighted DESC, q.matches_played DESC, a.name ASC
    LIMIT ${limit}
  `;

  return NextResponse.json({ ok: true, kind, limit, rows });
}
