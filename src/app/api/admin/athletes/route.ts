export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

import { NextResponse } from "next/server";

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
  const name = parseName((body as { name?: unknown }).name);
  const letter = (body as { letter?: unknown }).letter;

  if (typeof athleteId !== "string" || (!name && letter === undefined)) {
    return NextResponse.json(
      { ok: false, error: "Campi obbligatori: athleteId e almeno uno tra name o letter" },
      { status: 400 },
    );
  }

  try {
    let athlete;
    if (athleteId === "new") {
      if (!name) {
        return NextResponse.json({ ok: false, error: "Il nome è obbligatorio per i nuovi atleti" }, { status: 400 });
      }
      athlete = await prisma.athlete.create({
        data: {
          name,
          letter: letter === "" ? null : (letter as string),
        },
        select: { id: true, name: true, letter: true },
      });
    } else {
      athlete = await prisma.athlete.update({
        where: { id: athleteId },
        data: {
          ...(name ? { name } : {}),
          ...(letter !== undefined ? { letter: letter === "" ? null : (letter as string) } : {}),
        },
        select: { id: true, name: true, letter: true },
      });
    }
    return NextResponse.json({ ok: true, athlete });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Errore salvataggio atleta";
    if (message.toLowerCase().includes("unique") || message.toLowerCase().includes("duplicate")) {
      return NextResponse.json({ ok: false, error: "Nome o lettera atleta già esistente" }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: "Errore salvataggio atleta" }, { status: 500 });
  }
}
