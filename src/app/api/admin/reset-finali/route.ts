import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Cancella SOLO i match della fase finale (FINALI), lasciando intatti qualificazioni e atleti
export async function POST() {
  try {
    const deleted = await prisma.match.deleteMany({
      where: { phase: "FINALI" },
    });

    return NextResponse.json({
      ok: true,
      message: `Eliminati ${deleted.count} match FINALI. Il DB è pronto per la Fase 2.`,
      deleted: deleted.count,
    });
  } catch (e: any) {
    console.error("Reset finali error:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
