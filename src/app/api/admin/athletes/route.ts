export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

import { NextResponse } from "next/server";

function parseCategoryScore(value: unknown): number | null {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(n)) return null;
  const allowed = new Set([100, 75, 50, 25]);
  return allowed.has(n) ? n : null;
}

function parseName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > 60) return null;
  return trimmed;
}

export async function PATCH(req: Request) {
  const body = (await req.json().catch(() => null)) as unknown;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "Body JSON non valido" }, { status: 400 });
  }

  const athleteId = (body as { athleteId?: unknown }).athleteId;
  const categoryScore = parseCategoryScore((body as { categoryScore?: unknown }).categoryScore);
  const name = parseName((body as { name?: unknown }).name);

  if (typeof athleteId !== "string" || (!name && categoryScore === null)) {
    return NextResponse.json(
      { ok: false, error: "Campi obbligatori: athleteId e almeno uno tra name o categoryScore (100/75/50/25)" },
      { status: 400 },
    );
  }

  try {
    const athlete = await prisma.athlete.update({
      where: { id: athleteId },
      data: {
        ...(name ? { name } : {}),
        ...(categoryScore !== null ? { categoryScore } : {}),
      },
      select: { id: true, name: true, categoryScore: true },
    });
    return NextResponse.json({ ok: true, athlete });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Errore salvataggio atleta";
    if (message.toLowerCase().includes("unique") || message.toLowerCase().includes("duplicate")) {
      return NextResponse.json({ ok: false, error: "Nome atleta già esistente" }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: "Errore salvataggio atleta" }, { status: 500 });
  }
}
