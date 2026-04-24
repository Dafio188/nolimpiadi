import { prisma } from "@/lib/prisma";
import { defaultCategoryScoreByAthleteName, defaultTierByAthleteName, disciplineSeeds } from "@/lib/nolimpiadi";
import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as unknown;
  const action = isRecord(body) && typeof body.action === "string" ? body.action : "bootstrap";

  if (action === "reset_results") {
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const matchesDeleted = await tx.match.count();
      const slotsDeleted = await tx.qualificationSlot.count();
      const turnsDeleted = await tx.qualificationTurn.count();
      await tx.match.deleteMany();
      await tx.qualificationSlot.deleteMany();
      await tx.qualificationTurn.deleteMany();
      return { matchesDeleted, slotsDeleted, turnsDeleted };
    });
    return NextResponse.json({ ok: true, ...result });
  }

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.systemSetting.upsert({
      where: { id: 1 },
      create: { id: 1, malusDivisor: 1000, turnDurationMinutes: 10 },
      update: { malusDivisor: 1000 },
    });

    const disciplines = [];
    for (const seed of disciplineSeeds) {
      const discipline = await tx.discipline.upsert({
        where: { kind: seed.kind },
        create: {
          kind: seed.kind,
          name: seed.name,
          coefficient: seed.coefficient,
          teamSize: seed.teamSize,
          targetFixed: seed.targetFixed,
          targetMin: seed.targetMin,
          targetMax: seed.targetMax,
        },
        update: {
          name: seed.name,
          coefficient: seed.coefficient,
          teamSize: seed.teamSize,
          targetFixed: seed.targetFixed,
          targetMin: seed.targetMin,
          targetMax: seed.targetMax,
        },
      });
      disciplines.push(discipline);
    }

    // Creazione Utente Admin Pietro
    const hashedPassword = await bcrypt.hash("nolimpiadi2026", 10);
    await tx.admin.upsert({
      where: { username: "Pietro" },
      create: { 
        username: "Pietro", 
        password: hashedPassword 
      },
      update: { 
        password: hashedPassword 
      }
    });

    return { 
      disciplinesCreatedOrUpdated: disciplines.length, 
      athletesCreatedOrUpdated: athletes.length,
      adminCreated: "Pietro"
    };
  });

  return NextResponse.json({ ok: true, ...result });
}
