export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ClassificaLive from "@/app/classifica/ClassificaLive";

export default async function ClassificaPage() {
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

  const plainRows = rows.map((row) => ({
    ...row,
    total_weighted: Number(row.total_weighted),
    qualification_weighted: Number(row.qualification_weighted),
    finals_weighted: Number(row.finals_weighted),
  }));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-6">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Classifica generale</h1>
        <Link className="text-sm text-zinc-600 hover:text-zinc-900" href="/">
          Home
        </Link>
      </div>
      <ClassificaLive initialRows={plainRows} />
    </div>
  );
}
