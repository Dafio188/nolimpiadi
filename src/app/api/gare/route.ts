import { prisma } from "@/lib/prisma";
import { DisciplineKind } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const plannedTurns = await prisma.qualificationTurn.findMany({
      where: { slots: { some: { match: { is: null } } } },
      orderBy: { index: "asc" },
      take: 2,
      include: {
        slots: {
          include: { match: { select: { id: true } } },
        },
      },
    });

    const athletes = await prisma.athlete.findMany({ select: { id: true, name: true, letter: true } });
    const letterToName = new Map<string, string>(athletes.filter(a => a.letter).map(a => [a.letter!, a.name]));
    const athleteMap = new Map(athletes.map((a) => [a.id, a.name]));

    const disciplineMap = new Map(
      (await prisma.discipline.findMany({ select: { id: true, kind: true, name: true, teamSize: true } })).map(
        (d) => [d.kind, d]
      )
    );

    const upcoming = plannedTurns.map((turn) => {
      const activeLetters = new Set<string>();
      const matches: any[] = [];

      for (const slot of turn.slots) {
        slot.side1Letters.forEach((l) => activeLetters.add(l));
        slot.side2Letters.forEach((l) => activeLetters.add(l));

        if (!slot.match) {
          const d = disciplineMap.get(slot.kind);
          if (d) {
            matches.push({
              discipline: d.name,
              disciplineKind: slot.kind,
              target: slot.targetVictory,
              side1: slot.side1Letters.map((l) => letterToName.get(l) || `Atleta ${l}`),
              side2: slot.side2Letters.map((l) => letterToName.get(l) || `Atleta ${l}`),
            });
          }
        }
      }

      // Standby: atleti la cui lettera non è tra quelle attive nel turno
      const standby = athletes
        .filter(a => a.letter && !activeLetters.has(a.letter))
        .map(a => a.name)
        .sort((a, b) => a.localeCompare(b));

      return {
        index: turn.index,
        matches,
        standby,
      };
    });

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

    return NextResponse.json({ ok: true, upcoming, played });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Errore" },
      { status: 500 }
    );
  }
}