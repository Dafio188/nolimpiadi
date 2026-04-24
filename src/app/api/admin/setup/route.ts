import { prisma } from "@/lib/prisma";
import { DisciplineKind } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [athletes, disciplines] = await Promise.all([
      prisma.athlete.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, categoryScore: true } }),
      prisma.discipline.findMany({ orderBy: { name: "asc" }, select: { id: true, kind: true, name: true, targetFixed: true } }),
    ]);
    return NextResponse.json({ athletes, disciplines });
  } catch (e) {
    return NextResponse.json({ error: "Errore caricamento dati" }, { status: 500 });
  }
}