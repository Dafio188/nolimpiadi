import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Fetch all athletes to create a dictionary
    const athletes = await prisma.athlete.findMany({
      select: { id: true, name: true, letter: true },
    });
    
    const athleteDict: Record<string, { id: string; name: string }> = {};
    athletes.forEach(a => {
      if (a.letter) {
        athleteDict[a.letter] = { id: a.id, name: a.name };
      }
    });

    const allLetters = athletes.map(a => a.letter).filter(Boolean) as string[];

    // 2. Fetch all QualificationTurns with their Slots and Match details
    const turns = await prisma.qualificationTurn.findMany({
      orderBy: { index: "asc" },
      include: {
        slots: {
          include: {
            discipline: true,
            match: {
              include: {
                sides: {
                  orderBy: { side: "asc" }
                }
              }
            }
          }
        }
      }
    });

    // 3. Group by Block (1° Turno, 2° Turno, 3° Turno)
    const blocks: Record<number, any> = {};

    for (const turn of turns) {
      const blockIdx = Math.floor(turn.index / 100);
      const partitaIdx = (turn.index % 100) + 1; // 1-based (Partita 1, Partita 2...)

      if (!blocks[blockIdx]) {
        blocks[blockIdx] = {
          id: blockIdx,
          name: `${blockIdx + 1}° TURNO`,
          partite: []
        };
      }

      // Collect all letters used in this partita
      const usedLetters = new Set<string>();
      const sports: Record<string, any> = {};

      for (const slot of turn.slots) {
        slot.side1Letters.forEach(l => usedLetters.add(l));
        slot.side2Letters.forEach(l => usedLetters.add(l));

        sports[slot.kind] = {
          slotId: slot.id,
          targetVictory: slot.targetVictory,
          side1Letters: slot.side1Letters,
          side2Letters: slot.side2Letters,
          side1Names: slot.side1Letters.map(l => athleteDict[l]?.name || l),
          side2Names: slot.side2Letters.map(l => athleteDict[l]?.name || l),
          state: slot.match ? "DONE" : "TODO",
          matchId: slot.match?.id || null,
          points1: slot.match?.sides[0]?.points ?? null,
          points2: slot.match?.sides[1]?.points ?? null,
        };
      }

      // Calculate resting athletes
      const restingLetters = allLetters.filter(l => !usedLetters.has(l));
      const restingNames = restingLetters.map(l => athleteDict[l]?.name || l);

      blocks[blockIdx].partite.push({
        partitaId: turn.id,
        partitaIndex: partitaIdx,
        partitaName: `Partita ${partitaIdx}`,
        sports,
        restingLetters,
        restingNames,
      });
    }

    const responseData = {
      phases: Object.values(blocks),
      athletes: athleteDict,
    };

    return NextResponse.json({ ok: true, data: responseData });
  } catch (error: any) {
    console.error("Schedule API Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
