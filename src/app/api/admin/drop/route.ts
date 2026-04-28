import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$executeRawUnsafe("DROP VIEW IF EXISTS classifica_qualificazione_disciplina CASCADE;");
    await prisma.$executeRawUnsafe("DROP VIEW IF EXISTS classifica_complessiva CASCADE;");
    await prisma.$executeRawUnsafe("DROP VIEW IF EXISTS v_participations CASCADE;");
    
    // Eliminiamo record per pulizia
    await prisma.$executeRawUnsafe("DELETE FROM match_side_athletes WHERE athlete_id IN (SELECT id FROM athletes);");
    await prisma.$executeRawUnsafe("DELETE FROM match_sides;");
    await prisma.$executeRawUnsafe("DELETE FROM matches;");
    await prisma.$executeRawUnsafe("DELETE FROM qualification_slots WHERE kind IN ('BASKET', 'AIR_HOCKEY');");
    await prisma.$executeRawUnsafe("DELETE FROM disciplines WHERE kind IN ('BASKET', 'AIR_HOCKEY');");
    
    return NextResponse.json({ 
      success: true, 
      message: "VISTE ELIMINATE CON SUCCESSO! Ora vai nel terminale ed esegui npx prisma db push --accept-data-loss" 
    });
  } catch(e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
