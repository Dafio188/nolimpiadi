import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FinalStage } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const { disciplineId, stage, side1AthleteIds, side2AthleteIds } = await request.json();

    if (!disciplineId || !stage || !Array.isArray(side1AthleteIds) || !Array.isArray(side2AthleteIds)) {
      return NextResponse.json({ error: "Dati mancanti o formato non valido" }, { status: 400 });
    }

    // Rimuoviamo eventuali null/undefined
    const cleanSide1 = side1AthleteIds.filter(Boolean);
    const cleanSide2 = side2AthleteIds.filter(Boolean);

    if (cleanSide1.length === 0 || cleanSide2.length === 0) {
      return NextResponse.json({ error: "Atleti non validi forniti" }, { status: 400 });
    }

    // NOTA: Usiamo solo lo stage 'FINALE' che esiste sicuramente nel DB. 
    // Distinguiamo i match in base agli atleti.
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
      // Se esiste già esattamente questa partita, restituiamo successo
      return NextResponse.json({ success: true, match: exactExistingMatch });
    }

    // 2. Controllo: Nessuno degli atleti deve essere in un altro match IN_PROGRESS (punti = -1)
    const allIds = [...cleanSide1, ...cleanSide2];
    
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

    // 3. Creiamo il Match "IN_PROGRESS" impostando points a -1
    const match = await prisma.match.create({
      data: {
        disciplineId,
        phase: 'FINALI',
        targetVictory: 0,
        finalStage: stage as FinalStage,
        sides: {
          create: [
            {
              side: 1,
              points: -1,
              athletes: {
                create: cleanSide1.map((id: string) => ({ athleteId: id }))
              }
            },
            {
              side: 2,
              points: -1,
              athletes: {
                create: cleanSide2.map((id: string) => ({ athleteId: id }))
              }
            }
          ]
        }
      }
    });

    return NextResponse.json({ success: true, match });
  } catch (error) {
    console.error("[SetActiveMatch Error]", error);
    return NextResponse.json({ error: "Errore interno: " + (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
