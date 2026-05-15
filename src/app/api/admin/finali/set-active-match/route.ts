import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FinalStage } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const { disciplineId, stage, side1AthleteIds, side2AthleteIds } = await request.json();

    if (!disciplineId || !stage || !Array.isArray(side1AthleteIds) || !Array.isArray(side2AthleteIds)) {
      return NextResponse.json({ error: "Dati mancanti o formato non valido" }, { status: 400 });
    }

    // Rimuoviamo eventuali null/undefined ed evitiamo duplicati
    const cleanSide1 = Array.from(new Set(side1AthleteIds.filter(Boolean)));
    const cleanSide2 = Array.from(new Set(side2AthleteIds.filter(Boolean)));

    if (cleanSide1.length === 0 || cleanSide2.length === 0) {
      return NextResponse.json({ error: "Atleti non validi forniti" }, { status: 400 });
    }

    // 1. Cerchiamo se esiste già una partita esatta
    const existingMatches: any[] = await prisma.match.findMany({
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

    const exactExistingMatch = existingMatches.find(m => {
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

    if (exactExistingMatch) {
      // Se esiste già questa partita, dobbiamo assicurarci che sia "in campo", ovvero punti = -1
      // Aggiorniamo i lati della partita
      for (const side of exactExistingMatch.sides) {
        if (side.points !== -1) {
          await prisma.matchSide.update({
            where: { id: side.id },
            data: { points: -1 }
          });
        }
      }
      return NextResponse.json({ success: true, match: exactExistingMatch });
    }

    // 2. Controllo: Nessuno degli atleti deve essere in un altro match IN_PROGRESS (punti = -1)
    const allIds = Array.from(new Set([...cleanSide1, ...cleanSide2]));
    
    const activeMatches = await prisma.match.findMany({
      where: {
        phase: "FINALI",
        sides: {
          some: {
            points: -1,
            athletes: {
              some: {
                athleteId: { in: allIds }
              }
            }
          }
        }
      },
      include: { discipline: true }
    });

    if (activeMatches.length > 0) {
      return NextResponse.json({ 
        error: `Uno o più atleti sono già impegnati in un'altra partita in corso! (${activeMatches[0].discipline?.name || 'Sconosciuta'})`, 
        match: activeMatches[0] 
      }, { status: 400 });
    }

    // 3. Recuperiamo il targetVictory dalla disciplina
    const disc = await prisma.discipline.findUnique({ where: { id: disciplineId } });
    const target = disc?.targetFixed || 210;

    // 4. Creiamo il Match "IN_PROGRESS"
    const match = await prisma.match.create({
      data: {
        disciplineId,
        phase: 'FINALI',
        targetVictory: target,
        finalStage: stage as FinalStage,
      }
    });

    await prisma.matchSide.create({
      data: {
        matchId: match.id,
        side: 1,
        points: -1,
        athletes: {
          create: cleanSide1.map((id: string) => ({ athleteId: id }))
        }
      }
    });

    await prisma.matchSide.create({
      data: {
        matchId: match.id,
        side: 2,
        points: -1,
        athletes: {
          create: cleanSide2.map((id: string) => ({ athleteId: id }))
        }
      }
    });

    return NextResponse.json({ success: true, match });
  } catch (error: any) {
    console.error("[SetActiveMatch Error]", error);
    return NextResponse.json({ error: "Errore interno: " + (error?.message || String(error)) }, { status: 500 });
  }
}
