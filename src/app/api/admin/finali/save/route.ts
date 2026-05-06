import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { disciplineId, matches } = await req.json();

    if (!disciplineId || !matches) {
      return NextResponse.json({ ok: false, error: "Dati mancanti" }, { status: 400 });
    }

    // 1. Elimina eventuali match di finale esistenti per questa disciplina per evitare duplicati
    await prisma.match.deleteMany({
      where: {
        disciplineId,
        phase: "FINALI"
      }
    });

    // 2. Crea i nuovi match con i punteggi forniti
    for (const m of matches) {
      // Determiniamo il target victory della disciplina se non fornito
      const disc = await prisma.discipline.findUnique({ where: { id: disciplineId } });
      const target = m.targetVictory || disc?.targetFixed || 210;

      const createdMatch = await prisma.match.create({
        data: {
          disciplineId,
          phase: "FINALI",
          finalStage: m.stage, // SEMIFINALE, FINALE_1_2, FINALE_3_4
          targetVictory: target,
        }
      });

      // Side 1
      await prisma.matchSide.create({
        data: {
          matchId: createdMatch.id,
          side: 1,
          points: m.side1Points,
          athletes: {
            create: { athleteId: m.side1AthleteId }
          }
        }
      });

      // Side 2
      await prisma.matchSide.create({
        data: {
          matchId: createdMatch.id,
          side: 2,
          points: m.side2Points,
          athletes: {
            create: { athleteId: m.side2AthleteId }
          }
        }
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Save finali error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
