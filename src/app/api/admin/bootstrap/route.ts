import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { athleteNames, disciplineSeeds } from "@/lib/nolimpiadi";
import { DisciplineKind } from "@prisma/client";
import bcrypt from "bcryptjs";

const SCHEDULE_DATA = [
  // ROUND 1
  [
    { cb: [["D", "L"], ["H", "K"]], fr: [["A"], ["E"]], pp: [["C"], ["G"]], bk: [["B"], ["F"]] }, // P1
    { cb: [["H", "J"], ["A", "F"]], fr: [["G"], ["L"]], pp: [["D"], ["I"]], bk: [["C"], ["E"]] }, // P2
    { cb: [["C", "I"], ["D", "E"]], fr: [["B"], ["H"]], pp: [["K"], ["L"]], bk: [["F"], ["J"]] }, // P3
    { cb: [["F", "L"], ["G", "J"]], fr: [["C"], ["H"]], pp: [["B"], ["E"]], bk: [["A"], ["I"]] }, // P4
    { cb: [["E", "K"], ["B", "L"]], fr: [["G"], ["I"]], pp: [["A"], ["H"]], bk: [["D"], ["J"]] }, // P5
    { cb: [["B", "I"], ["A", "L"]], fr: [["D"], ["F"]], pp: [["E"], ["J"]], bk: [["G"], ["K"]] }, // P6
    { cb: [["A", "K"], ["F", "I"]], fr: [["C"], ["J"]], pp: [["B"], ["G"]], bk: [["D"], ["H"]] }, // P7
    { cb: [["D", "G"], ["C", "K"]], fr: [["H"], ["J"]], pp: [["F"], ["I"]], bk: [["A"], ["L"]] }, // P8
  ],
  // ROUND 2
  [
    { cb: [["E", "H"], ["C", "G"]], fr: [["F"], ["K"]], pp: [["A"], ["J"]], bk: [["B"], ["L"]] }, // P1
    { cb: [["F", "J"], ["H", "I"]], fr: [["A"], ["B"]], pp: [["C"], ["D"]], bk: [["E"], ["K"]] }, // P2
    { cb: [["D", "K"], ["B", "J"]], fr: [["E"], ["I"]], pp: [["F"], ["G"]], bk: [["C"], ["L"]] }, // P3
    { cb: [["A", "J"], ["D", "E"]], fr: [["B"], ["F"]], pp: [["H"], ["L"]], bk: [["G"], ["I"]] }, // P4
    { cb: [["F", "G"], ["H", "I"]], fr: [["D"], ["L"]], pp: [["C"], ["E"]], bk: [["A"], ["K"]] }, // P5
    { cb: [["C", "I"], ["A", "E"]], fr: [["G"], ["K"]], pp: [["F"], ["L"]], bk: [["B"], ["H"]] }, // P6
    { cb: [["B", "G"], ["E", "L"]], fr: [["A"], ["I"]], pp: [["H"], ["K"]], bk: [["C"], ["J"]] }, // P7
    { cb: [["K", "L"], ["G", "J"]], fr: [["C"], ["D"]], pp: [["A"], ["B"]], bk: [["E"], ["H"]] }, // P8
  ],
  // ROUND 3
  [
    { cb: [["A", "I"], ["C", "F"]], fr: [["E"], ["J"]], pp: [["B"], ["K"]], bk: [["D"], ["G"]] }, // P1
    { cb: [["B", "H"], ["C", "F"]], fr: [["K"], ["L"]], pp: [["D"], ["J"]], bk: [["E"], ["I"]] }, // P2
    { cb: [["C", "E"], ["B", "K"]], fr: [["D"], ["H"]], pp: [["I"], ["J"]], bk: [["A"], ["F"]] }, // P3
    { cb: [["A", "H"], ["D", "G"]], fr: [["C"], ["L"]], pp: [["F"], ["K"]], bk: [["B"], ["I"]] }, // P4
    { cb: [["B", "E"], ["H", "L"]], fr: [["A"], ["G"]], pp: [["D"], ["I"]], bk: [["C"], ["J"]] }, // P5
    { cb: [["C", "G"], ["A", "J"]], fr: [["B"], ["F"]], pp: [["E"], ["L"]], bk: [["D"], ["K"]] }, // P6
    { cb: [["D", "F"], ["I", "L"]], fr: [["J"], ["K"]], pp: [["A"], ["C"]], bk: [["G"], ["H"]] }, // P7
    { cb: [["J", "K"], ["B", "D"]], fr: [["E"], ["I"]], pp: [["G"], ["H"]], bk: [["F"], ["L"]] }, // P8
  ],
];

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

    for (let roundIdx = 0; roundIdx < SCHEDULE_DATA.length; roundIdx++) {
      const roundData = SCHEDULE_DATA[roundIdx];
      for (let slotIdx = 0; slotIdx < roundData.length; slotIdx++) {
        const globalIdx = roundIdx * 8 + slotIdx + 1;
        const turn = await prisma.qualificationTurn.create({
          data: { index: globalIdx },
        });

        const slotData = roundData[slotIdx];
        const disciplineMapping = [
          { kind: DisciplineKind.CALCIO_BALILLA, letters: slotData.cb },
          { kind: DisciplineKind.FRECCETTE, letters: slotData.fr },
          { kind: DisciplineKind.PING_PONG, letters: slotData.pp },
          { kind: DisciplineKind.AIR_HOCKEY, letters: slotData.bk },
        ];

        for (const item of disciplineMapping) {
          const disc = disciplinesMap[item.kind];
          if (!disc) continue;
          await prisma.qualificationSlot.create({
            data: {
              turnId: turn.id,
              disciplineId: disc.id,
              kind: item.kind,
              targetVictory: disc.targetFixed || 10,
              side1Letters: item.letters[0],
              side2Letters: item.letters[1],
            } as any,
          });
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
