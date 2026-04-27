import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MatchPhase } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { slotId, points1, points2 } = body;

    if (!slotId || typeof points1 !== "number" || typeof points2 !== "number") {
      return NextResponse.json({ ok: false, error: "Dati mancanti o non validi" }, { status: 400 });
    }

    // Find the slot to know the discipline
    const slot = await prisma.qualificationSlot.findUnique({
      where: { id: slotId },
      include: { match: { include: { sides: true } } }
    });

    if (!slot) {
      return NextResponse.json({ ok: false, error: "Slot non trovato" }, { status: 404 });
    }

    // Fetch athletes based on letters to link them properly
    const athletes1 = await prisma.athlete.findMany({ where: { letter: { in: slot.side1Letters } } });
    const athletes2 = await prisma.athlete.findMany({ where: { letter: { in: slot.side2Letters } } });

    // Upsert Match
    let matchId = slot.match?.id;

    if (!matchId) {
      // Create new match
      const newMatch = await prisma.match.create({
        data: {
          disciplineId: slot.disciplineId,
          phase: MatchPhase.QUALIFICAZIONE,
          targetVictory: slot.targetVictory,
          plannedSlotId: slot.id,
          playedAt: new Date(),
          sides: {
            create: [
              { 
                side: 1, 
                points: points1,
                athletes: { create: athletes1.map(a => ({ athleteId: a.id })) }
              },
              { 
                side: 2, 
                points: points2,
                athletes: { create: athletes2.map(a => ({ athleteId: a.id })) }
              },
            ]
          }
        }
      });
      matchId = newMatch.id;
    } else {
      // Update existing match
      await prisma.$transaction([
        prisma.match.update({
          where: { id: matchId },
          data: { playedAt: new Date(), targetVictory: slot.targetVictory },
        }),
        prisma.matchSide.upsert({
          where: { matchId_side: { matchId, side: 1 } },
          create: { 
            matchId, side: 1, points: points1,
            athletes: { create: athletes1.map(a => ({ athleteId: a.id })) }
          },
          update: { points: points1 }
        }),
        prisma.matchSide.upsert({
          where: { matchId_side: { matchId, side: 2 } },
          create: { 
            matchId, side: 2, points: points2,
            athletes: { create: athletes2.map(a => ({ athleteId: a.id })) }
          },
          update: { points: points2 }
        })
      ]);
    }

    return NextResponse.json({ ok: true, message: "Punteggio salvato con successo" });
  } catch (error: any) {
    console.error("Save Match API Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
