import { prisma } from "@/lib/prisma";
import { DisciplineKind, FinalStage, MatchPhase } from "@prisma/client";
import { NextResponse } from "next/server";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseEnumValue<T extends Record<string, string>>(
  enumObj: T,
  value: unknown,
): T[keyof T] | null {
  if (typeof value !== "string") return null;
  const values = Object.values(enumObj);
  return values.includes(value) ? (value as T[keyof T]) : null;
}

function parseIntField(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (!Number.isInteger(value)) return null;
  return value;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as unknown;
  if (!isRecord(body)) {
    return NextResponse.json({ ok: false, error: "Body JSON non valido" }, { status: 400 });
  }

  const disciplineKind = parseEnumValue(DisciplineKind, body.disciplineKind);
  const phase = parseEnumValue(MatchPhase, body.phase);
  const finalStage = body.finalStage ? parseEnumValue(FinalStage, body.finalStage) : null;
  const targetVictory = parseIntField(body.targetVictory);
  const plannedSlotId = typeof body.plannedSlotId === "string" && body.plannedSlotId.trim() ? body.plannedSlotId : null;

  if (!disciplineKind || !phase || !targetVictory) {
    return NextResponse.json(
      { ok: false, error: "Campi obbligatori mancanti: disciplineKind, phase, targetVictory" },
      { status: 400 },
    );
  }

  const sides = Array.isArray(body.sides) ? body.sides : null;
  if (!sides || sides.length !== 2) {
    return NextResponse.json({ ok: false, error: "Servono esattamente 2 lati (side 1 e 2)" }, { status: 400 });
  }

  if (plannedSlotId && phase !== MatchPhase.QUALIFICAZIONE) {
    return NextResponse.json(
      { ok: false, error: "plannedSlotId è supportato solo in QUALIFICAZIONE" },
      { status: 400 },
    );
  }

  const discipline = await prisma.discipline.findUnique({ where: { kind: disciplineKind } });
  if (!discipline) {
    return NextResponse.json({ ok: false, error: "Disciplina non trovata" }, { status: 404 });
  }

  if (discipline.targetMin !== null && targetVictory < discipline.targetMin) {
    return NextResponse.json(
      { ok: false, error: `Target vittoria minimo per ${discipline.name}: ${discipline.targetMin}` },
      { status: 400 },
    );
  }
  if (discipline.targetMax !== null && targetVictory > discipline.targetMax) {
    return NextResponse.json(
      { ok: false, error: `Target vittoria massimo per ${discipline.name}: ${discipline.targetMax}` },
      { status: 400 },
    );
  }

  const normalizedSides = sides.map((side: any) => {
    if (!isRecord(side)) return null;
    const points = parseIntField(side.points);
    const athleteIds = Array.isArray(side.athleteIds)
      ? side.athleteIds.filter((id) => typeof id === "string")
      : null;

    if (points === null || !athleteIds) return null;
    return { points, athleteIds };
  });

  if (normalizedSides.some((s) => s === null)) {
    return NextResponse.json({ ok: false, error: "Formato sides non valido" }, { status: 400 });
  }

  const [side1, side2] = normalizedSides as Array<{ points: number; athleteIds: string[] }>;

  if (side1.athleteIds.length !== discipline.teamSize || side2.athleteIds.length !== discipline.teamSize) {
    return NextResponse.json(
      { ok: false, error: `Ogni lato deve avere ${discipline.teamSize} atleta/i per ${discipline.name}` },
      { status: 400 },
    );
  }

  const uniqueAthletes = new Set([...side1.athleteIds, ...side2.athleteIds]);
  if (uniqueAthletes.size !== side1.athleteIds.length + side2.athleteIds.length) {
    return NextResponse.json({ ok: false, error: "Un atleta non può essere su entrambi i lati" }, { status: 400 });
  }

  if (side1.points < 0 || side2.points < 0) {
    return NextResponse.json({ ok: false, error: "I punti devono essere >= 0" }, { status: 400 });
  }

  if (discipline.kind === DisciplineKind.CALCIO_BALILLA) {
    const target = discipline.targetFixed ?? 4;
    const s1Win = side1.points >= target;
    const s2Win = side2.points >= target;
    const maxLoser = target - 1;
    if (!(s1Win || s2Win)) {
      return NextResponse.json(
        { ok: false, error: `Calcio-balilla: una delle 2 squadre deve arrivare a ${target}` },
        { status: 400 },
      );
    }
    if (s1Win && side2.points > maxLoser) {
      return NextResponse.json({ ok: false, error: `Calcio-balilla: punteggio avversario deve essere 0–${maxLoser}` }, { status: 400 });
    }
    if (s2Win && side1.points > maxLoser) {
      return NextResponse.json({ ok: false, error: `Calcio-balilla: punteggio avversario deve essere 0–${maxLoser}` }, { status: 400 });
    }
  }

  if (phase === MatchPhase.FINALI && !finalStage) {
    return NextResponse.json(
      { ok: false, error: "Per le finali serve finalStage (QUARTI/SEMIFINALI/FINALE)" },
      { status: 400 },
    );
  }

if (plannedSlotId) {
    const slot = await prisma.qualificationSlot.findUnique({
      where: { id: plannedSlotId },
      include: { match: { select: { id: true } } },
    });
    if (!slot) {
      return NextResponse.json({ ok: false, error: "Slot pianificato non trovato" }, { status: 404 });
    }
    if (slot.match) {
      return NextResponse.json({ ok: false, error: "Questo slot è già stato compilato" }, { status: 400 });
    }
    if (slot.kind !== disciplineKind) {
      return NextResponse.json({ ok: false, error: "Disciplina non coerente con lo slot pianificato" }, { status: 400 });
    }
    if (slot.targetVictory !== targetVictory) {
      await prisma.qualificationSlot.update({
        where: { id: slot.id },
        data: { targetVictory },
      });
    }

    // Recuperiamo le lettere degli atleti coinvolti nel match per confrontarle con lo slot
    const athletesInMatch = await prisma.athlete.findMany({
      where: { id: { in: [...side1.athleteIds, ...side2.athleteIds] } },
      select: { id: true, letter: true }
    });
    const idToLetter = new Map(athletesInMatch.map(a => [a.id, a.letter]));

    const sortStrings = (strs: (string | null)[]) => [...strs].map(s => s || "").sort();
    const s1L = sortStrings(side1.athleteIds.map(id => idToLetter.get(id) || ""));
    const s2L = sortStrings(side2.athleteIds.map(id => idToLetter.get(id) || ""));
    const p1L = sortStrings(slot.side1Letters);
    const p2L = sortStrings(slot.side2Letters);

    const okDirect = s1L.join("|") === p1L.join("|") && s2L.join("|") === p2L.join("|");
    const okSwap = s1L.join("|") === p2L.join("|") && s2L.join("|") === p1L.join("|");

    if (!okDirect && !okSwap) {
      return NextResponse.json({ ok: false, error: "Atleti non coerenti con lo slot pianificato" }, { status: 400 });
    }
  }

  if (discipline.targetFixed !== null && targetVictory !== discipline.targetFixed) {
    await prisma.discipline.update({
      where: { id: discipline.id },
      data: { targetOverride: targetVictory },
    });
  }

  const match = await prisma.match.create({
    data: {
      disciplineId: discipline.id,
      phase,
      targetVictory,
      finalStage: phase === MatchPhase.FINALI ? finalStage : null,
      plannedSlotId,
      sides: {
        create: [
          {
            side: 1,
            points: side1.points,
            athletes: { create: side1.athleteIds.map((athleteId: any) => ({ athleteId })) },
          },
          {
            side: 2,
            points: side2.points,
            athletes: { create: side2.athleteIds.map((athleteId: any) => ({ athleteId })) },
          },
        ],
      },
    },
    include: { discipline: true, sides: { include: { athletes: true } } },
  });

  return NextResponse.json({ ok: true, match });
}
