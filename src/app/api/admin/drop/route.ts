import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Eliminiamo le viste
    await prisma.$executeRawUnsafe("DROP VIEW IF EXISTS classifica_qualificazione_disciplina CASCADE;");
    await prisma.$executeRawUnsafe("DROP VIEW IF EXISTS classifica_complessiva CASCADE;");
    await prisma.$executeRawUnsafe("DROP VIEW IF EXISTS v_participations CASCADE;");
    
    // Pulizia totale tabelle (ordine corretto per FK)
    await prisma.matchSideAthlete.deleteMany({});
    await prisma.matchSide.deleteMany({});
    await prisma.match.deleteMany({});
    await prisma.qualificationSlot.deleteMany({});
    await prisma.qualificationTurn.deleteMany({});
    await prisma.athlete.deleteMany({});
    await prisma.discipline.deleteMany({});
    
    return NextResponse.json({ 
      success: true, 
      message: "DATABASE RESETTATO COMPLETAMENTE! Ora puoi procedere con il Bootstrap." 
    });
  } catch(e: any) {
    console.error("Drop error:", e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
