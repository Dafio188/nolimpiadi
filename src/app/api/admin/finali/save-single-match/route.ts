import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FinalStage } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { disciplineId, stage, side1AthleteIds, side2AthleteIds, points1, points2 } = await req.json();

    if (!disciplineId || !stage || !Array.isArray(side1AthleteIds) || !Array.isArray(side2AthleteIds)) {
      return NextResponse.json({ ok: false, error: "Dati mancanti o formato non valido" }, { status: 400 });
    }

    const cleanSide1 = side1AthleteIds.filter(Boolean);
    const cleanSide2 = side2AthleteIds.filter(Boolean);

    if (cleanSide1.length === 0 || cleanSide2.length === 0) {
      return NextResponse.json({ ok: false, error: "Atleti non validi forniti" }, { status: 400 });
    }

    // 1. Troviamo eventuali match esistenti tra queste esatte formazioni
    const existingMatches = await prisma.match.findMany({
      where: {
        disciplineId,
        phase: "FINALI",
      },
      include: {
        sides: {
          include: { athletes: true }
        }
      }
    });

    const matchesToDelete = existingMatches.filter(m => {
      const getSideStr = (sideIdx: number) => {
        const side = m.sides.find((s: any) => s.side === sideIdx);
        if (!side || !side.athletes) return "";
        return side.athletes.map((a: any) => a.athleteId).filter(Boolean).sort().join(",");
      };
      
      const s1Athletes = getSideStr(1);
      const s2Athletes = getSideStr(2);
      
      const targetS1 = [...cleanSide1].sort().join(",");
      const targetS2 = [...cleanSide2].sort().join(",");
      
      return (s1Athletes === targetS1 && s2Athletes === targetS2) || 
             (s1Athletes === targetS2 && s2Athletes === targetS1);
    });

    for (const match of matchesToDelete) {
      await prisma.match.delete({ where: { id: match.id } });
    }

    // 2. Creiamo il nuovo match
    const disc = await prisma.discipline.findUnique({ where: { id: disciplineId } });
    const target = disc?.targetFixed || 210;

    const createdMatch = await prisma.match.create({
      data: {
        disciplineId,
        phase: "FINALI",
        finalStage: stage as FinalStage,
        targetVictory: target,
      }
    });

    await prisma.matchSide.create({
      data: {
        matchId: createdMatch.id,
        side: 1,
        points: points1,
        athletes: {
          create: cleanSide1.map((id: string) => ({ athleteId: id }))
        }
      }
    });

    await prisma.matchSide.create({
      data: {
        matchId: createdMatch.id,
        side: 2,
        points: points2,
        athletes: {
          create: cleanSide2.map((id: string) => ({ athleteId: id }))
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Save match error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
