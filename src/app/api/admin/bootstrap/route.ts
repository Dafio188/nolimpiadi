import { prisma } from "@/lib/prisma";
import { athleteNames, defaultCategoryScoreByAthleteName, defaultTierByAthleteName, disciplineSeeds } from "@/lib/nolimpiadi";
import { Tier } from "@prisma/client";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const VIEWS_SQL = `
DROP VIEW IF EXISTS classifica_qualificazione_disciplina;
DROP VIEW IF EXISTS classifica_complessiva;
DROP VIEW IF EXISTS v_participations;

CREATE VIEW v_participations AS
WITH settings AS (
  SELECT COALESCE((SELECT malus_divisor::numeric FROM system_settings WHERE id = 1), 1000::numeric) AS malus_divisor
)
SELECT
  msa.athlete_id,
  m.id AS match_id,
  m.discipline_id,
  m.phase,
  m.final_stage,
  m.played_at,
  ms.points AS points_for,
  ms_opp.points AS points_against,
  m.target_victory,
  d.coefficient,
  (
    (ms.points::numeric - (ms_opp.points::numeric / settings.malus_divisor))
    / NULLIF(m.target_victory::numeric, 0)
  ) AS efficiency,
  (
    (
      (ms.points::numeric - (ms_opp.points::numeric / settings.malus_divisor))
      / NULLIF(m.target_victory::numeric, 0)
    )
    * d.coefficient::numeric
  ) AS weighted
FROM match_side_athletes msa
INNER JOIN match_sides ms ON ms.id = msa.side_id
INNER JOIN matches m ON m.id = ms.match_id
INNER JOIN disciplines d ON d.id = m.discipline_id
INNER JOIN match_sides ms_opp ON ms_opp.match_id = m.id AND ms_opp.side <> ms.side
CROSS JOIN settings;

CREATE VIEW classifica_complessiva AS
SELECT
  a.id AS athlete_id,
  a.name,
  a.category_score,
  COALESCE(SUM(p.weighted), 0) AS total_weighted,
  COALESCE(SUM(CASE WHEN p.phase = 'QUALIFICAZIONE' THEN p.weighted END), 0) AS qualification_weighted,
  COALESCE(SUM(CASE WHEN p.phase = 'FINALI' THEN p.weighted END), 0) AS finals_weighted,
  COUNT(DISTINCT p.match_id) AS matches_played
FROM athletes a
LEFT JOIN v_participations p ON p.athlete_id = a.id
GROUP BY a.id, a.name, a.category_score;

CREATE VIEW classifica_qualificazione_disciplina AS
SELECT
  a.id AS athlete_id,
  d.id AS discipline_id,
  d.kind,
  d.name AS discipline_name,
  COALESCE(SUM(p.weighted), 0) AS qualification_weighted,
  COUNT(DISTINCT p.match_id) AS matches_played
FROM athletes a
CROSS JOIN disciplines d
LEFT JOIN v_participations p
  ON p.athlete_id = a.id
  AND p.discipline_id = d.id
  AND p.phase = 'QUALIFICAZIONE'
GROUP BY a.id, d.id, d.kind, d.name;
`;

async function runBootstrap() {
  return await prisma.$transaction(async (tx: any) => {
    // 1. Impostazioni di sistema
    await tx.systemSetting.upsert({
      where: { id: 1 },
      create: { id: 1, malusDivisor: 1000, turnDurationMinutes: 10 },
      update: { malusDivisor: 1000 },
    });

    // 2. Discipline
    const disciplines = [];
    for (const seed of disciplineSeeds) {
      const d = await tx.discipline.upsert({
        where: { kind: seed.kind },
        create: {
          kind: seed.kind,
          name: seed.name,
          coefficient: seed.coefficient,
          teamSize: seed.teamSize,
          targetFixed: seed.targetFixed,
          targetMin: seed.targetMin,
          targetMax: seed.targetMax,
        },
        update: {
          name: seed.name,
          coefficient: seed.coefficient,
          teamSize: seed.teamSize,
          targetFixed: seed.targetFixed,
          targetMin: seed.targetMin,
          targetMax: seed.targetMax,
        },
      });
      disciplines.push(d);
    }

    // 3. Atleti
    const athletes = [];
    for (const name of athleteNames) {
      const a = await tx.athlete.upsert({
        where: { name },
        create: {
          name,
          tier: defaultTierByAthleteName[name] ?? Tier.MEDIO,
          categoryScore: defaultCategoryScoreByAthleteName[name] ?? 100,
        },
        update: {
          tier: defaultTierByAthleteName[name] ?? Tier.MEDIO,
          categoryScore: defaultCategoryScoreByAthleteName[name] ?? 100,
        },
      });
      athletes.push(a);
    }

    // 4. Admin
    const hashedPassword = await bcrypt.hash("nolimpiadi2026", 10);
    await tx.admin.upsert({
      where: { username: "Pietro" },
      create: { username: "Pietro", password: hashedPassword },
      update: { password: hashedPassword },
    });

    // 5. Creazione Viste (SQL Raw)
    // Nota: $executeRawUnsafe non può stare dentro una transazione in alcuni casi con Prisma,
    // ma qui lo usiamo per semplicità. Se fallisce, lo sposteremo fuori.
    await tx.$executeRawUnsafe(VIEWS_SQL);

    return {
      disciplines: disciplines.length,
      athletes: athletes.length,
      disciplinesCreatedOrUpdated: disciplines.length,
      athletesCreatedOrUpdated: athletes.length,
      viewsCreated: true,
      admin: "Pietro (creato o aggiornato)"
    };
  });
}

export async function GET() {
  try {
    const result = await runBootstrap();
    return NextResponse.json({ ok: true, message: "Bootstrap completato con successo (incluse le viste)", ...result });
  } catch (e: any) {
    console.error("Bootstrap error:", e);
    return NextResponse.json({ 
      ok: false, 
      error: e.message,
      hint: "Controlla i log di Vercel per i dettagli tecnici." 
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await runBootstrap();
    return NextResponse.json({ ok: true, message: "Bootstrap completato via POST", ...result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
