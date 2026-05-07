import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { disciplineId, stage, side1AthleteIds, side2AthleteIds } = await request.json();

    if (!disciplineId || !stage || !side1AthleteIds || !side2AthleteIds) {
      return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
    }

    // NOTA: Usiamo solo lo stage 'FINALE' che esiste sicuramente nel DB. 
    // Distinguiamo i match in base agli atleti.
    const existingMatches: any[] = await prisma.match.findMany({
      where: {
        disciplineId,
        phase: "FINALI",
        finalStage: "FINALE",
      },
      include: {
        sides: {
          include: { athletes: true }
        }
      }
    });

    const exactExistingMatch = existingMatches.find(m => {
      const s1Athletes = m.sides[0]?.athletes.map((a: any) => a.athleteId).sort().join(",") || "";
      const s2Athletes = m.sides[1]?.athletes.map((a: any) => a.athleteId).sort().join(",") || "";
      const targetS1 = [...side1AthleteIds].sort().join(",");
      const targetS2 = [...side2AthleteIds].sort().join(",");
      
      return (s1Athletes === targetS1 && s2Athletes === targetS2) || 
             (s1Athletes === targetS2 && s2Athletes === targetS1);
    });

    if (exactExistingMatch) {
      // Se esiste già esattamente questa partita, restituiamo successo
      return NextResponse.json({ success: true, match: exactExistingMatch });
    }

    // 2. Controllo: Nessuno degli atleti deve essere in un altro match IN_PROGRESS (punti = -1)
    const allIds = [...side1AthleteIds, ...side2AthleteIds];
    
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
        error: `Uno o più atleti sono già impegnati in un'altra partita in corso! (${activeMatches[0].discipline.name})`, 
        match: activeMatches[0] 
      }, { status: 400 });
    }

    // 3. Creiamo il Match "IN_PROGRESS" impostando points a -1
    // NOTA: Usiamo un approccio in due step per evitare errori di validazione del client Prisma non aggiornato
    const match = await prisma.match.create({
      data: {
        disciplineId,
        phase: 'FINALI',
        targetVictory: 0,
        finalStage: 'FINALE',
        sides: {
          create: [
            {
              side: 1,
              points: -1,
              athletes: {
                create: side1AthleteIds.map((id: string) => ({ athleteId: id }))
              }
            },
            {
              side: 2,
              points: -1,
              athletes: {
                create: side2AthleteIds.map((id: string) => ({ athleteId: id }))
              }
            }
          ]
        }
      }
    });

    return NextResponse.json({ success: true, match });
  } catch (error) {
    console.error("[SetActiveMatch Error]", error);
    return NextResponse.json({ error: "Errore interno: " + (error as any).message }, { status: 500 });
  }
}
