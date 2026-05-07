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

    // Normalizza un oggetto dal formato snake_case (DB raw) al camelCase (Prisma)
    const normAthlete = (a: any) => ({
      id: a.id,
      name: a.name,
      tier: a.tier,
      categoryScore: a.categoryScore ?? a.category_score ?? 100,
      letter: a.letter ?? null,
      createdAt: a.createdAt ?? a.created_at,
      updatedAt: a.updatedAt ?? a.updated_at,
    });

    const normDiscipline = (d: any) => ({
      id: d.id,
      kind: d.kind,
      name: d.name,
      coefficient: d.coefficient,
      teamSize: d.teamSize ?? d.team_size,
      targetMin: d.targetMin ?? d.target_min ?? null,
      targetMax: d.targetMax ?? d.target_max ?? null,
      targetFixed: d.targetFixed ?? d.target_fixed ?? null,
      targetOverride: d.targetOverride ?? d.target_override ?? null,
      createdAt: d.createdAt ?? d.created_at,
      updatedAt: d.updatedAt ?? d.updated_at,
    });

    const normTurn = (t: any) => ({
      id: t.id,
      index: t.index,
      scheduledAt: t.scheduledAt ?? t.scheduled_at ?? null,
      createdAt: t.createdAt ?? t.created_at,
      updatedAt: t.updatedAt ?? t.updated_at,
    });

    const normSlot = (s: any) => ({
      id: s.id,
      turnId: s.turnId ?? s.turn_id,
      disciplineId: s.disciplineId ?? s.discipline_id,
      kind: s.kind,
      targetVictory: s.targetVictory ?? s.target_victory,
      side1Letters: s.side1Letters ?? s.side1_athlete_ids ?? [],
      side2Letters: s.side2Letters ?? s.side2_athlete_ids ?? [],
      createdAt: s.createdAt ?? s.created_at,
      updatedAt: s.updatedAt ?? s.updated_at,
    });

    // Eseguiamo tutto in una transazione per sicurezza
    await prisma.$transaction(async (tx: any) => {
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
        await tx.discipline.createMany({ data: disciplines.map(normDiscipline) });
      }

      if (athletes?.length) {
        await tx.athlete.createMany({ data: athletes.map(normAthlete) });
      }

      if (turns?.length) {
        await tx.qualificationTurn.createMany({ data: turns.map(normTurn) });
      }

      if (slots?.length) {
        await tx.qualificationSlot.createMany({ data: slots.map(normSlot) });
      }

      if (matches?.length) {
        for (const m of matches) {
          const matchSides = m.sides ?? [];
          
          // 1. Crea il match
          await tx.match.create({
            data: {
              id: m.id,
              disciplineId: m.disciplineId ?? m.discipline_id,
              phase: m.phase,
              targetVictory: m.targetVictory ?? m.target_victory,
              finalStage: m.finalStage ?? m.final_stage ?? null,
              plannedSlotId: m.plannedSlotId ?? m.planned_slot_id ?? null,
              playedAt: m.playedAt ?? m.played_at,
              createdAt: m.createdAt ?? m.created_at,
              updatedAt: m.updatedAt ?? m.updated_at,
            }
          });

          // 2. Crea i lati uno alla volta per controllare esattamente l'ordine FK
          for (const s of matchSides) {
            const sideAthletes = s.athletes ?? [];
            
            await tx.matchSide.create({
              data: {
                id: s.id,
                matchId: s.matchId ?? s.match_id ?? m.id,
                side: s.side,
                points: s.points,
              }
            });

            // 3. Ora che il lato esiste, crea le associazioni atleti
            if (sideAthletes.length) {
              await tx.matchSideAthlete.createMany({
                data: sideAthletes.map((sa: any) => ({
                  sideId: s.id,
                  athleteId: sa.athleteId ?? sa.athlete_id,
                }))
              });
            }
          }
        }
      }
    }, { timeout: 30000 });

    return NextResponse.json({ ok: true, message: "Ripristino completato con successo" });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ ok: false, error: "Errore durante l'importazione: " + (error as any).message }, { status: 500 });
  }
}

