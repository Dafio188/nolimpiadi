import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { athleteNames, disciplineSeeds } from "@/lib/nolimpiadi";
import { DisciplineKind } from "@prisma/client";
import bcrypt from "bcryptjs";

import { TOURNAMENT_CALENDAR, DISCIPLINE_KEY_MAP } from "@/data/tournament-calendar";

export async function GET() {
  try {
    // 1. Impostazioni di sistema
    await prisma.systemSetting.upsert({
      where: { id: 1 },
      create: { id: 1, malusDivisor: 1000, turnDurationMinutes: 10 },
      update: { malusDivisor: 1000 },
    });

    // 2. Inizializza Atleti (Assegnando le lettere A-L)
    await prisma.athlete.updateMany({ data: { letter: null } as any });

    const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
    const athletes = [];
    for (let i = 0; i < athleteNames.length; i++) {
      const name = athleteNames[i];
      const letter = letters[i];
      const a = await prisma.athlete.upsert({
        where: { name },
        create: { name, letter } as any,
        update: { letter } as any,
      });
      athletes.push(a);
    }

    // 3. Inizializza Discipline
    const disciplinesMap: Record<string, any> = {};
    for (const seed of disciplineSeeds) {
      const d = await prisma.discipline.upsert({
        where: { kind: seed.kind },
        create: {
          kind: seed.kind,
          name: seed.name,
          coefficient: seed.coefficient,
          teamSize: seed.teamSize,
          targetFixed: seed.targetFixed,
        },
        update: {
          name: seed.name,
          coefficient: seed.coefficient,
          teamSize: seed.teamSize,
          targetFixed: seed.targetFixed,
        },
      });
      disciplinesMap[seed.kind] = d;
    }

    // 4. Inizializza Turni e Slot (Pianificazione Fissa a Lettere)
    await prisma.qualificationSlot.deleteMany({});
    await prisma.qualificationTurn.deleteMany({});

    for (let roundIdx = 0; roundIdx < TOURNAMENT_CALENDAR.length; roundIdx++) {
      const roundData = TOURNAMENT_CALENDAR[roundIdx];
      for (let slotIdx = 0; slotIdx < roundData.length; slotIdx++) {
        const globalIdx = roundIdx * 8 + slotIdx + 1;
        const turn = await prisma.qualificationTurn.create({
          data: { index: globalIdx },
        });

        const slotData = roundData[slotIdx];
        
        for (const [key, kind] of Object.entries(DISCIPLINE_KEY_MAP)) {
          const disc = disciplinesMap[kind];
          if (!disc) continue;
          
          const letters = (slotData as any)[key];
          if (!letters) continue;

          await prisma.qualificationSlot.create({
            data: {
              turnId: turn.id,
              disciplineId: disc.id,
              kind: kind,
              targetVictory: disc.targetFixed || 10,
              side1Letters: letters[0],
              side2Letters: letters[1],
            } as any,
          });
        }
      }
    }

    }

    // 5. Admin
    const hashedPassword = await bcrypt.hash("nolimpiadi2026", 10);
    await prisma.admin.upsert({
      where: { username: "Pietro" },
      create: { username: "Pietro", password: hashedPassword },
      update: { password: hashedPassword },
    });

    const VIEWS_SQL = `
      DROP VIEW IF EXISTS classifica_qualificazione_disciplina CASCADE;
      DROP VIEW IF EXISTS classifica_complessiva CASCADE;
      DROP VIEW IF EXISTS v_participations CASCADE;

      CREATE OR REPLACE VIEW v_participations AS
      SELECT 
        msa.athlete_id,
        m.id AS match_id,
        m.discipline_id,
        m.phase,
        m.final_stage,
        ms.side,
        ms.points AS points_scored,
        (SELECT points FROM match_sides WHERE match_id = m.id AND side != ms.side LIMIT 1) AS points_conceded,
        CASE 
          WHEN ms.points > (SELECT points FROM match_sides WHERE match_id = m.id AND side != ms.side LIMIT 1) THEN 1 
          ELSE 0 
        END AS is_win
      FROM match_side_athletes msa
      JOIN match_sides ms ON ms.id = msa.side_id
      JOIN matches m ON m.id = ms.match_id;

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
        (SUM(v.points_scored) - (SUM(v.points_conceded) / 1000.0)) * (840.0 / (d.team_size * 4.0 * d.target_fixed)) AS qualification_weighted
      FROM v_participations v
      JOIN disciplines d ON d.id = v.discipline_id
      WHERE v.phase = 'QUALIFICAZIONE'
      GROUP BY v.athlete_id, v.discipline_id, d.kind, d.name, d.team_size, d.target_fixed;

      CREATE OR REPLACE VIEW classifica_complessiva AS
      WITH athlete_discipline_scores AS (
        SELECT 
          v.athlete_id,
          v.discipline_id,
          v.phase,
          (SUM(v.points_scored) - (SUM(v.points_conceded) / 1000.0)) * (840.0 / (d.team_size * 4.0 * d.target_fixed)) AS score,
          COUNT(v.match_id) AS matches_count
        FROM v_participations v
        JOIN disciplines d ON d.id = v.discipline_id
        GROUP BY v.athlete_id, v.discipline_id, v.phase, d.team_size, d.target_fixed
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
      message: "Bootstrap completato con successo",
      athletes: athletes.length,
      turns: 24,
      slots: 96,
      viewsCreated: true
    });
  } catch (error: any) {
    console.error("Bootstrap error:", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
