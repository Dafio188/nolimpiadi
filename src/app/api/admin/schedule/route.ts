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
      const partitaIdx = turn.index % 100; // già 1-based: bootstrap genera slotIdx+1 (1,2...8 per ogni turno)

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

        const p1 = slot.match?.sides[0]?.points ?? null;
        const p2 = slot.match?.sides[1]?.points ?? null;
        const isLive = p1 === -1 || p2 === -1;

        sports[slot.kind] = {
          slotId: slot.id,
          targetVictory: slot.targetVictory,
          side1Letters: slot.side1Letters,
          side2Letters: slot.side2Letters,
          side1Names: slot.side1Letters.map(l => athleteDict[l]?.name || l),
          side2Names: slot.side2Letters.map(l => athleteDict[l]?.name || l),
          state: isLive ? "IN_PROGRESS" : (slot.match ? "DONE" : "TODO"),
          matchId: slot.match?.id || null,
          points1: p1,
          points2: p2,
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

    // 4. Fetch ALL FINALI matches (Request 5)
    const allFinalsMatches = await prisma.match.findMany({
      where: {
        phase: "FINALI",
      },
      include: {
        discipline: true,
        sides: {
          include: {
            athletes: {
              include: { athlete: true }
            }
          },
          orderBy: { side: 'asc' }
        }
      },
      orderBy: { playedAt: "asc" }
    });

    if (allFinalsMatches.length > 0) {
      const finalsBlock = {
        id: 999, // Unique ID for finals
        name: "FINALI",
        partite: [] as any[]
      };

      // Group finals by discipline or just list them
      // To fit the "Partita" structure, we can group them by some criteria or just show them as individual entries
      // Let's create one "Partita" per unique combination of matches if they were played together, 
      // but usually finals are sequential. We'll show each final match as a "virtual partita".
      
      allFinalsMatches.forEach((m, idx) => {
        const s1 = m.sides[0];
        const s2 = m.sides[1];
        const p1 = s1?.points ?? null;
        const p2 = s2?.points ?? null;
        const isLive = p1 === -1 || p2 === -1;

        const sports: Record<string, any> = {};
        sports[m.discipline.kind] = {
          slotId: `final-${m.id}`,
          targetVictory: m.targetVictory,
          side1Letters: s1?.athletes.map(a => a.athlete.letter).filter(Boolean) || [],
          side2Letters: s2?.athletes.map(a => a.athlete.letter).filter(Boolean) || [],
          side1Names: s1?.athletes.map(a => a.athlete.name) || [],
          side2Names: s2?.athletes.map(a => a.athlete.name) || [],
          state: isLive ? "IN_PROGRESS" : "DONE",
          matchId: m.id,
          points1: p1,
          points2: p2,
          finalStage: m.finalStage
        };

        finalsBlock.partite.push({
          partitaId: `final-turn-${m.id}`,
          partitaIndex: idx + 1,
          partitaName: m.finalStage ? m.finalStage.replace(/_/g, " ") : "Finale",
          sports,
          restingLetters: [],
          restingNames: [],
        });
      });

      blocks[999] = finalsBlock;
    }

    const responseData = {
      phases: Object.values(blocks).sort((a: any, b: any) => a.id - b.id),
      athletes: athleteDict,
    };

    return NextResponse.json({ ok: true, data: responseData });
  } catch (error: any) {
    console.error("Schedule API Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
