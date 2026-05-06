import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { matchId } = await req.json();

    if (!matchId) {
      return NextResponse.json({ ok: false, error: "Dati mancanti" }, { status: 400 });
    }

    await prisma.match.delete({
      where: { id: matchId }
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Delete match error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
