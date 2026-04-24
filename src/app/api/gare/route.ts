import { prisma } from "@/lib/prisma";
import { DisciplineKind, MatchPhase } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const kinds = [
      DisciplineKind.AIR_HOCKEY,
      DisciplineKind.PING_PONG,
      DisciplineKind.FRECCETTE,
      DisciplineKind.CALCIO_BALILLA,
    ];

    const plannedTurn = await prisma.qualificationTurn.findFirst({
      where: { slots: { some: { match: { is: null } } } },
      orderBy: { index: "asc" },
      include: {
        slots: {
          where: { match: { is: null } },
          include: { match: { select: { id: true } } },
        },
      },
    });

    const athleteMap = new Map(
      (await prisma.athlete.findMany({ select: { id: true, name: true } })).map((a) => [a.id, a.name])
    );

    const disciplineMap = new Map(
      (await prisma.discipline.findMany({ select: { id: true, kind: true, name: true, teamSize: true } })).map(
        (d) => [d.kind, d]
      )
    );

    const scheduled: Array<{
      discipline: string;
      disciplineKind: string;
      target: number;
      turnIndex: number;
      side1: string[];
      side2: string[];
    }> = [];

    if (plannedTurn) {
      for (const slot of plannedTurn.slots) {
        if (slot.match) continue;
        const d = disciplineMap.get(slot.kind);
        if (!d) continue;
        scheduled.push({
          discipline: d.name,
          disciplineKind: slot.kind,
          target: slot.targetVictory,
          turnIndex: plannedTurn.index,
          side1: slot.side1AthleteIds.map((id) => athleteMap.get(id) ?? id),
          side2: slot.side2AthleteIds.map((id) => athleteMap.get(id) ?? id),
        });
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayMatches = await prisma.match.findMany({
      where: {
        playedAt: { gte: today },
      },
      orderBy: { playedAt: "desc" },
      include: {
        discipline: { select: { kind: true, name: true, teamSize: true } },
        sides: {
          orderBy: { side: "asc" },
          include: {
            athletes: { include: { athlete: { select: { name: true } } } },
          },
        },
      },
    });

    const played = todayMatches.map((m) => ({
      discipline: m.discipline.name,
      disciplineKind: m.discipline.kind,
      target: m.targetVictory,
      phase: m.phase,
      finalStage: m.finalStage,
      playedAt: m.playedAt.toISOString(),
      side1: {
        points: m.sides[0]?.points ?? 0,
        athletes: m.sides[0]?.athletes.map((a) => a.athlete.name) ?? [],
      },
      side2: {
        points: m.sides[1]?.points ?? 0,
        athletes: m.sides[1]?.athletes.map((a) => a.athlete.name) ?? [],
      },
    }));

    return NextResponse.json({ ok: true, scheduled, played });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Errore" },
      { status: 500 }
    );
  }
}