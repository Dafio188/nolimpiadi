import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function parseTarget(value: unknown): number | null {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(n)) return null;
  return n > 0 && n <= 1000 ? n : null;
}

export async function PATCH(req: Request) {
  const body = (await req.json().catch(() => null)) as unknown;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "Body JSON non valido" }, { status: 400 });
  }

  const disciplineKind = (body as { disciplineKind?: unknown }).disciplineKind;
  const targetFixed = parseTarget((body as { targetFixed?: unknown }).targetFixed);

  if (typeof disciplineKind !== "string" || targetFixed === null) {
    return NextResponse.json(
      { ok: false, error: "Campi obbligatori: disciplineKind e targetFixed (numero > 0)" },
      { status: 400 },
    );
  }

  try {
    const discipline = await prisma.discipline.update({
      where: { kind: disciplineKind as any },
      data: { targetFixed },
      select: { id: true, kind: true, targetFixed: true },
    });
    return NextResponse.json({ ok: true, discipline });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Errore salvataggio disciplina" }, { status: 500 });
  }
}