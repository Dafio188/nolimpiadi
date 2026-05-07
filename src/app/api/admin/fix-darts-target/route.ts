import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    console.log('Aggiornamento target vittoria per Freccette a 210...');

    // 1. Aggiorna la disciplina
    const discipline = await prisma.discipline.update({
      where: { kind: 'FRECCETTE' },
      data: { targetFixed: 210 },
    });

    // 2. Aggiorna tutti i match di Freccette
    const matches = await prisma.match.updateMany({
      where: { disciplineId: discipline.id },
      data: { targetVictory: 210 },
    });

    // 3. Aggiorna tutti i QualificationSlot di Freccette
    const slots = await prisma.qualificationSlot.updateMany({
      where: { disciplineId: discipline.id },
      data: { targetVictory: 210 },
    });

    return NextResponse.json({ 
      ok: true, 
      message: `Target Freccette aggiornato a 210. Disciplina: ${discipline.id}, Match: ${matches.count}, Slot: ${slots.count}` 
    });
  } catch (error: any) {
    console.error("Update darts target error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
