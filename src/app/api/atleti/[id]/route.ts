import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const athlete = await prisma.athlete.findUnique({
      where: { id },
      select: { id: true, name: true }
    });

    if (!athlete) {
      return NextResponse.json({ ok: false, error: "Atleta non trovato" }, { status: 404 });
    }

    // Totali dalla vista classifica_complessiva
    const totalsRow = await prisma.$queryRaw<any[]>`
      SELECT * FROM classifica_complessiva WHERE athlete_id = ${id}
    `;
    const totals = totalsRow[0] || { total_weighted: 0, qualification_weighted: 0, finals_weighted: 0, matches_played: 0 };

    // Malus divisor
    const setting = await prisma.systemSetting.findUnique({ where: { id: 1 } });
    const malusDivisor = setting?.malusDivisor || 1000;

    // Partite dalla vista v_participations
    const participations = await prisma.$queryRaw<any[]>`
      SELECT 
        p.*,
        d.name as "disciplineName",
        d.kind as "disciplineKind",
        qt.index as "seriesIndex"
      FROM v_participations p
      JOIN disciplines d ON d.id = p.discipline_id
      LEFT JOIN qualification_slots qs ON qs.id = p.match_id -- Nota: qui usiamo match_id per tentare il link, ma in realtà match.planned_slot_id è meglio
      LEFT JOIN qualification_turns qt ON qt.id = qs.turn_id
      WHERE p.athlete_id = ${id}
      ORDER BY p.played_at DESC
    `;

    // Per ogni partita, recuperiamo i nomi di tutti i partecipanti
    const matchIds = participations.map(p => p.match_id);
    const sides = await prisma.matchSide.findMany({
      where: { matchId: { in: matchIds } },
      include: { athletes: { include: { athlete: { select: { name: true, id: true } } } } }
    });

    const rows = participations.map(p => {
      const matchSides = sides.filter(s => s.matchId === p.match_id);
      const mySide = matchSides.find(s => s.athletes.some(a => a.athleteId === id));
      const oppSide = matchSides.find(s => s.id !== mySide?.id);

      return {
        id: p.match_id,
        playedAt: p.played_at,
        phase: p.phase,
        finalStage: p.final_stage,
        disciplineName: p.disciplineName,
        disciplineKind: p.disciplineKind,
        seriesIndex: p.seriesIndex,
        targetVictory: p.target_victory,
        pointsFor: p.points_for,
        pointsAgainst: p.points_against,
        myNames: mySide?.athletes.map(a => a.athlete.name) || [],
        oppNames: oppSide?.athletes.map(a => a.athlete.name) || [],
        weighted: Number(p.weighted)
      };
    });

    return NextResponse.json({
      athlete: { id: athlete.id, name: athlete.name },
      totals: {
        matches: Number(totals.matches_played),
        total: Number(totals.total_weighted),
        qual: Number(totals.qualification_weighted),
        finals: Number(totals.finals_weighted)
      },
      rows,
      malusDivisor
    });

  } catch (e: any) {
    console.error("Error fetching athlete details:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
