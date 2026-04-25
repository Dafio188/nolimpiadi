import { prisma } from "@/lib/prisma";
import { athleteNames, defaultCategoryScoreByAthleteName, defaultTierByAthleteName, disciplineSeeds } from "@/lib/nolimpiadi";
import { Tier } from "@prisma/client";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

// Funzione comune per eseguire il bootstrap
async function runBootstrap() {
  return await prisma.$transaction(async (tx: any) => {
    // 1. Impostazioni di sistema
    await tx.systemSetting.upsert({
      where: { id: 1 },
      create: { id: 1, malusDivisor: 1000, turnDurationMinutes: 10 },
      update: { malusDivisor: 1000 },
    });

    // 2. Discipline
    const disciplines = [];
    for (const seed of disciplineSeeds) {
      const d = await tx.discipline.upsert({
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
      disciplines.push(d);
    }

    // 3. Atleti
    const athletes = [];
    for (const name of athleteNames) {
      const a = await tx.athlete.upsert({
        where: { name },
        create: {
          name,
          tier: defaultTierByAthleteName[name] ?? Tier.MEDIO,
          categoryScore: defaultCategoryScoreByAthleteName[name] ?? 100,
        },
        update: {
          tier: defaultTierByAthleteName[name] ?? Tier.MEDIO,
          categoryScore: defaultCategoryScoreByAthleteName[name] ?? 100,
        },
      });
      athletes.push(a);
    }

    // 4. Admin
    const hashedPassword = await bcrypt.hash("nolimpiadi2026", 10);
    await tx.admin.upsert({
      where: { username: "Pietro" },
      create: { username: "Pietro", password: hashedPassword },
      update: { password: hashedPassword },
    });

    return {
      disciplines: disciplines.length,
      athletes: athletes.length,
      admin: "Pietro (creato o aggiornato)"
    };
  });
}

export async function GET() {
  try {
    const result = await runBootstrap();
    return NextResponse.json({ ok: true, message: "Bootstrap completato con successo (via GET)", ...result });
  } catch (e: any) {
    console.error("Bootstrap error:", e);
    return NextResponse.json({ 
      ok: false, 
      error: e.message,
      hint: "Hai eseguito 'npx prisma db push' nel terminale?" 
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await runBootstrap();
    return NextResponse.json({ ok: true, message: "Bootstrap completato via POST", ...result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
