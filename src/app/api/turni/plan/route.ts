import { prisma } from "@/lib/prisma";
import { QUALIFICATION_TEMPLATE } from "@/lib/schedule-template";
import { DisciplineKind, MatchPhase } from "@prisma/client";
import { NextResponse } from "next/server";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseIntOrNull(value: unknown) {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isInteger(n)) return n;
  }
  return null;
}

function parseBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return null;
}

function parseDateOrNull(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

export async function GET() {
  const [settings, turns] = await Promise.all([
    prisma.systemSetting.findUnique({ where: { id: 1 } }),
    prisma.qualificationTurn.count(),
  ]);
  return NextResponse.json({
    ok: true,
    turnsPlanned: turns,
    turnDurationMinutes: settings?.turnDurationMinutes ?? 10,
    malusDivisor: settings?.malusDivisor ?? 1000,
  });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as unknown;
  const duration = isRecord(body) ? parseIntOrNull(body.turnDurationMinutes) : null;
  const overwrite = isRecord(body) ? parseBoolean(body.overwrite) : null;
  const startAt = isRecord(body) ? parseDateOrNull(body.startAt) : null;

  const turnDurationMinutes = duration ?? 10;
  const allowOverwrite = overwrite ?? false;

  if (turnDurationMinutes < 1 || turnDurationMinutes > 120) {
    return NextResponse.json({ ok: false, error: "turnDurationMinutes deve essere tra 1 e 120" }, { status: 400 });
  }

  const result = await prisma.$transaction(
    async (tx: any) => {
      const playedQual = await tx.match.count({ where: { phase: MatchPhase.QUALIFICAZIONE } });
      if (playedQual > 0 && !allowOverwrite) {
        throw new Error("Qualificazioni già iniziate: per rigenerare serve overwrite=true");
      }

      await tx.systemSetting.upsert({
        where: { id: 1 },
        create: { id: 1, malusDivisor: 1000, turnDurationMinutes },
        update: { turnDurationMinutes },
      });

      if (allowOverwrite) {
        await tx.qualificationSlot.deleteMany();
        await tx.qualificationTurn.deleteMany();
      } else {
        const existing = await tx.qualificationTurn.count();
        if (existing > 0) {
          throw new Error("Calendario già presente: per rigenerare serve overwrite=true");
        }
      }

      const athletes = await tx.athlete.findMany({
        select: { id: true, name: true, letter: true },
      });

      if (athletes.length !== 12) {
        throw new Error(`Servono esattamente 12 atleti (attuali: ${athletes.length})`);
      }

      const letterToId = new Map<string, string>();
      for (const a of athletes) {
        if (!a.letter) {
          throw new Error(`L'atleta '${a.name}' non ha una lettera assegnata (A-L)`);
        }
        letterToId.set(a.letter.toUpperCase(), a.id);
      }

      const lettersRequired = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

      const disciplines = await tx.discipline.findMany({
        where: {
          kind: { in: [DisciplineKind.BASKET, DisciplineKind.PING_PONG, DisciplineKind.FRECCETTE, DisciplineKind.CALCIO_BALILLA] },
        },
        select: { id: true, kind: true, targetFixed: true, targetMin: true, targetMax: true },
      });
      const disciplineByKind = new Map(disciplines.map((d: any) => [d.kind, d]));
      for (const k of [DisciplineKind.BASKET, DisciplineKind.PING_PONG, DisciplineKind.FRECCETTE, DisciplineKind.CALCIO_BALILLA]) {
        if (!disciplineByKind.get(k)) throw new Error(`Disciplina mancante nel database: ${k}`);
      }

      const base = startAt ?? new Date();

      for (let idx = 0; idx < QUALIFICATION_TEMPLATE.length; idx++) {
        const t = await tx.qualificationTurn.create({
          data: {
            index: idx + 1,
            scheduledAt: new Date(base.getTime() + idx * turnDurationMinutes * 60_000),
          },
          select: { id: true },
        });

        const template = QUALIFICATION_TEMPLATE[idx];

        const createSlot = async (kind: DisciplineKind, side1Letters: string[], side2Letters: string[]) => {
          const d: any = disciplineByKind.get(kind)!;
          const targetVictory =
            d.targetFixed !== null
              ? d.targetFixed
              : d.targetMin !== null && d.targetMax !== null
                ? Math.round((d.targetMin + d.targetMax) / 2)
                : 1;

          return tx.qualificationSlot.create({
            data: {
              turnId: t.id,
              disciplineId: d.id,
              kind,
              targetVictory,
              side1Letters,
              side2Letters,
            },
          });
        };

        const calcio = template[DisciplineKind.CALCIO_BALILLA];
        await createSlot(DisciplineKind.CALCIO_BALILLA, calcio.teamA, calcio.teamB);
        await createSlot(DisciplineKind.FRECCETTE, [template[DisciplineKind.FRECCETTE][0]], [template[DisciplineKind.FRECCETTE][1]]);
        await createSlot(DisciplineKind.PING_PONG, [template[DisciplineKind.PING_PONG][0]], [template[DisciplineKind.PING_PONG][1]]);
        await createSlot(DisciplineKind.BASKET, [template[DisciplineKind.BASKET][0]], [template[DisciplineKind.BASKET][1]]);
      }

      return {
        turnsPlanned: QUALIFICATION_TEMPLATE.length,
        turnDurationMinutes,
        startAt: base.toISOString(),
      };
    },
    { timeout: 60000 },
  ).catch((e: unknown) => {
    const message = e instanceof Error ? e.message : "Errore pianificazione";
    return { error: message } as const;
  });

  if ("error" in result) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, ...result });
}
