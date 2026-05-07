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

    // Partite: join diretto con la tabella matches per evitare dipendenza
    // dalla colonna played_at nella vista v_participations (che potrebbe non averla)
    const participations = await prisma.$queryRaw<any[]>`
      SELECT 
        p.athlete_id,
        p.match_id,
        p.discipline_id,
        p.phase,
        p.final_stage,
        p.target_victory,
        p.side,
        p.points_scored,
        p.points_conceded,
        p.is_win,
        m.played_at,
        d.name as "disciplineName",
        d.kind as "disciplineKind",
        qt.index as "seriesIndex"
      FROM v_participations p
      JOIN matches m ON m.id = p.match_id
      JOIN disciplines d ON d.id = p.discipline_id
      LEFT JOIN qualification_slots qs ON qs.id = m.planned_slot_id
      LEFT JOIN qualification_turns qt ON qt.id = qs.turn_id
      WHERE p.athlete_id = ${id}
      ORDER BY m.played_at DESC
    `;

    // Per ogni partita, recuperiamo i nomi di tutti i partecipanti
    const matchIds = participations.map(p => p.match_id);
    const sides = await prisma.matchSide.findMany({
      where: { matchId: { in: matchIds } },
      include: { athletes: { include: { athlete: { select: { name: true, id: true } } } } }
    });

    // Calcola il punteggio ponderato per partita (stesso algoritmo delle viste)
    const matchCountByPhase: Record<string, number> = {};
    for (const p of participations) {
      const key = `${p.discipline_id}-${p.phase}`;
      matchCountByPhase[key] = (matchCountByPhase[key] || 0) + 1;
    }

    const rows = participations.map(p => {
      const matchSides = sides.filter(s => s.matchId === p.match_id);
      const mySide = matchSides.find(s => s.athletes.some(a => a.athleteId === id));
      const oppSide = matchSides.find(s => s.id !== mySide?.id);

      const scoreFor = Number(p.points_scored) || 0;
      const scoreAgainst = Number(p.points_conceded) || 0;
      const target = Number(p.target_victory) || 1;
      const baseWeight = p.phase === 'FINALI' ? 1260.0 : 840.0;
      const key = `${p.discipline_id}-${p.phase}`;
      const n = matchCountByPhase[key] || 1;
      const weighted = (Math.min(scoreFor, target) * (baseWeight / n / target))
                     - (Math.min(scoreAgainst, target) * (baseWeight / n / target)) / 1000.0;

      return {
        id: p.match_id,
        playedAt: p.played_at,
        phase: p.phase,
        finalStage: p.final_stage,
        disciplineName: p.disciplineName,
        disciplineKind: p.disciplineKind,
        seriesIndex: p.seriesIndex,
        targetVictory: target,
        pointsFor: scoreFor,
        pointsAgainst: scoreAgainst,
        myNames: mySide?.athletes.map(a => a.athlete.name) || [],
        oppNames: oppSide?.athletes.map(a => a.athlete.name) || [],
        weighted
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
