import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const athletes = await prisma.athlete.findMany();
    const disciplines = await prisma.discipline.findMany();
    const systemSettings = await prisma.systemSetting.findMany();
    const turns = await prisma.qualificationTurn.findMany();
    const slots = await prisma.qualificationSlot.findMany();
    const matches = await prisma.match.findMany({
      include: {
        sides: {
          include: {
            athletes: true
          }
        }
      }
    });

    const backup = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      data: {
        athletes,
        disciplines,
        systemSettings,
        turns,
        slots,
        matches
      }
    };

    return NextResponse.json(backup);
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ ok: false, error: "Errore durante l'esportazione" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const backup = await req.json();
    if (!backup.data || !backup.version) {
      return NextResponse.json({ ok: false, error: "Formato backup non valido" }, { status: 400 });
    }

    const { athletes, disciplines, systemSettings, turns, slots, matches } = backup.data;

    // Eseguiamo tutto in una transazione per sicurezza
    await prisma.$transaction(async (tx) => {
      // 1. Pulizia database (ordine inverso rispetto alle dipendenze)
      await tx.matchSideAthlete.deleteMany();
      await tx.matchSide.deleteMany();
      await tx.match.deleteMany();
      await tx.qualificationSlot.deleteMany();
      await tx.qualificationTurn.deleteMany();
      await tx.athlete.deleteMany();
      await tx.discipline.deleteMany();
      await tx.systemSetting.deleteMany();

      // 2. Ripristino (seguendo le dipendenze)
      if (systemSettings?.length) {
        await tx.systemSetting.createMany({ data: systemSettings });
      }
      
      if (disciplines?.length) {
        await tx.discipline.createMany({ data: disciplines });
      }

      if (athletes?.length) {
        await tx.athlete.createMany({ data: athletes });
      }

      if (turns?.length) {
        await tx.qualificationTurn.createMany({ data: turns });
      }

      if (slots?.length) {
        await tx.qualificationSlot.createMany({ data: slots });
      }

      if (matches?.length) {
        for (const m of matches) {
          // Creiamo il match e i suoi lati separatamente perché Prisma createMany non supporta relazioni nidificate
          await tx.match.create({
            data: {
              id: m.id,
              disciplineId: m.disciplineId,
              phase: m.phase,
              targetVictory: m.targetVictory,
              finalStage: m.finalStage,
              plannedSlotId: m.plannedSlotId,
              playedAt: m.playedAt,
              createdAt: m.createdAt,
              updatedAt: m.updatedAt,
              sides: {
                create: m.sides.map((s: any) => ({
                  id: s.id,
                  side: s.side,
                  points: s.points,
                  athletes: {
                    create: s.athletes.map((sa: any) => ({
                      athleteId: sa.athleteId
                    }))
                  }
                }))
              }
            }
          });
        }
      }
    });

    return NextResponse.json({ ok: true, message: "Ripristino completato con successo" });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ ok: false, error: "Errore durante l'importazione: " + (error as any).message }, { status: 500 });
  }
}
