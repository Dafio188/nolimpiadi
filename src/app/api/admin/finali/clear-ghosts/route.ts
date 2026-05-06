import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const matches = await prisma.match.findMany({
      where: { phase: "FINALI" },
      include: { sides: true }
    });

    let deleted = 0;
    for (const m of matches) {
      if (m.sides.length > 0 && m.sides[0].points === -1) {
        await prisma.match.delete({ where: { id: m.id } });
        deleted++;
      }
    }
    
    return NextResponse.json({ ok: true, deleted });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
