import { prisma } from "@/lib/prisma";
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

function pairKey(a: string, b: string) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function teamKey(ids: string[]) {
  return [...ids].sort().join("-");
}

function matchupKey(teamA: string[], teamB: string[]) {
  const a = teamKey(teamA);
  const b = teamKey(teamB);
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

type Athlete = { id: string; name: string; categoryScore: number };

type PlannedSeries = {
  idleAthleteIds: [string, string];
  basket: [string, string];
  pingPong: [string, string];
  freccette: [string, string];
  calcioBalilla: { teamA: [string, string]; teamB: [string, string] };
};

function bestDoubles(
  athletesById: Map<string, Athlete>,
  ids: string[],
  playedTeammates: Set<string>,
  playedMatchups: Set<string>,
) {
  if (ids.length !== 4) throw new Error("Pool doppio non valido");
  const [a, b, c, d] = ids;
  const partitions: Array<{ teamA: [string, string]; teamB: [string, string] }> = [
    { teamA: [a, b], teamB: [c, d] },
    { teamA: [a, c], teamB: [b, d] },
    { teamA: [a, d], teamB: [b, c] },
  ];
  const scored = partitions.map((p) => {
    const sumA = athletesById.get(p.teamA[0])!.categoryScore + athletesById.get(p.teamA[1])!.categoryScore;
    const sumB = athletesById.get(p.teamB[0])!.categoryScore + athletesById.get(p.teamB[1])!.categoryScore;
    const balance = Math.abs(sumA - sumB);
    const teammateA = pairKey(p.teamA[0], p.teamA[1]);
    const teammateB = pairKey(p.teamB[0], p.teamB[1]);
    const matchup = matchupKey(p.teamA, p.teamB);
    const repeatPenalty =
      (playedTeammates.has(teammateA) ? 500 : 0) +
      (playedTeammates.has(teammateB) ? 500 : 0) +
      (playedMatchups.has(matchup) ? 200 : 0);
    const score = balance * 10 + repeatPenalty;
    return { ...p, score };
  });
  scored.sort((x, y) => x.score - y.score);
  return scored[0];
}

function planQualificationSeries(args: {
  seriesCount: number;
  athletes: Athlete[];
  playedPairsByKind: Map<DisciplineKind, Set<string>>;
  playedTeammates: Set<string>;
  playedMatchups: Set<string>;
}) {
  const { seriesCount, athletes, playedPairsByKind, playedTeammates, playedMatchups } = args;
  const athletesById = new Map(athletes.map((a) => [a.id, a]));
  const basePlayedPairsByKind = new Map<DisciplineKind, Set<string>>([
    [DisciplineKind.AIR_HOCKEY, new Set(playedPairsByKind.get(DisciplineKind.AIR_HOCKEY) ?? [])],
    [DisciplineKind.PING_PONG, new Set(playedPairsByKind.get(DisciplineKind.PING_PONG) ?? [])],
    [DisciplineKind.FRECCETTE, new Set(playedPairsByKind.get(DisciplineKind.FRECCETTE) ?? [])],
  ]);
  const basePlayedTeammates = new Set(playedTeammates);
  const basePlayedMatchups = new Set(playedMatchups);

  const idsAll = athletes.map((a) => a.id);

  function computeScoreSpread(values: Iterable<number>) {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (const v of values) {
      min = Math.min(min, v);
      max = Math.max(max, v);
    }
    if (!Number.isFinite(min) || !Number.isFinite(max)) return 0;
    return max - min;
  }

  function incCount(map: Map<string, number>, id: string, delta = 1) {
    map.set(id, (map.get(id) ?? 0) + delta);
  }

  function getSinglesCount(
    singlesByKind: Map<string, Map<DisciplineKind, number>>,
    id: string,
    kind: DisciplineKind,
  ) {
    return singlesByKind.get(id)?.get(kind) ?? 0;
  }

  function getTotalMatches(
    singlesByKind: Map<string, Map<DisciplineKind, number>>,
    doublesCount: Map<string, number>,
    id: string,
  ) {
    const singles =
      getSinglesCount(singlesByKind, id, DisciplineKind.AIR_HOCKEY) +
      getSinglesCount(singlesByKind, id, DisciplineKind.PING_PONG) +
      getSinglesCount(singlesByKind, id, DisciplineKind.FRECCETTE);
    return singles + (doublesCount.get(id) ?? 0);
  }

  function pickIdle2(args: {
    idleCount: Map<string, number>;
    singlesByKind: Map<string, Map<DisciplineKind, number>>;
    doublesCount: Map<string, number>;
    randomRank: Map<string, number>;
    used: Set<string>;
  }) {
    const { idleCount, singlesByKind, doublesCount, randomRank, used } = args;
    const ranked = athletes
      .filter((a) => !used.has(a.id))
      .map((a) => {
        const idle = idleCount.get(a.id) ?? 0;
        const total = getTotalMatches(singlesByKind, doublesCount, a.id);
        const rand = randomRank.get(a.id) ?? 0;
        return { id: a.id, idle, total, rand };
      })
      .sort((x, y) => {
        if (x.idle !== y.idle) return x.idle - y.idle;
        if (y.total !== x.total) return y.total - x.total;
        return x.rand - y.rand;
      });
    if (ranked.length < 2) throw new Error("Atleti insufficienti per scegliere i riposi");
    return [ranked[0].id, ranked[1].id] as [string, string];
  }

  function pickSinglesPair(args: {
    kind: DisciplineKind;
    pool: string[];
    singlesByKind: Map<string, Map<DisciplineKind, number>>;
    doublesCount: Map<string, number>;
    randomRank: Map<string, number>;
    playedPairsTry: Map<DisciplineKind, Set<string>>;
  }) {
    const { kind, pool, singlesByKind, doublesCount, randomRank, playedPairsTry } = args;
    const played = playedPairsTry.get(kind) ?? new Set<string>();
    let best: { a: string; b: string; score: number } | null = null;
    for (let i = 0; i < pool.length; i++) {
      for (let j = i + 1; j < pool.length; j++) {
        const a = pool[i];
        const b = pool[j];
        const repeatPenalty = played.has(pairKey(a, b)) ? 5_000_000 : 0;
        const countPenalty = (getSinglesCount(singlesByKind, a, kind) + getSinglesCount(singlesByKind, b, kind)) * 50_000;
        const totalPenalty = (getTotalMatches(singlesByKind, doublesCount, a) + getTotalMatches(singlesByKind, doublesCount, b)) * 2_000;
        const diff = Math.abs(athletesById.get(a)!.categoryScore - athletesById.get(b)!.categoryScore);
        const rand = ((randomRank.get(a) ?? 0) + (randomRank.get(b) ?? 0)) % 1000;
        const score = repeatPenalty + countPenalty + totalPenalty + diff * 10 + rand;
        if (!best || score < best.score) best = { a, b, score };
      }
    }
    if (!best) throw new Error(`Impossibile creare match per ${kind}`);
    return [best.a, best.b] as [string, string];
  }

  function pickCalcio4(args: {
    available: string[];
    singlesByKind: Map<string, Map<DisciplineKind, number>>;
    doublesCount: Map<string, number>;
    randomRank: Map<string, number>;
    playedTeammatesTry: Set<string>;
    playedMatchupsTry: Set<string>;
  }) {
    const { available, singlesByKind, doublesCount, randomRank, playedTeammatesTry, playedMatchupsTry } = args;
    const ranked = [...available].sort((a, b) => {
      const da = doublesCount.get(a) ?? 0;
      const db = doublesCount.get(b) ?? 0;
      if (da !== db) return da - db;
      const ta = getTotalMatches(singlesByKind, doublesCount, a);
      const tb = getTotalMatches(singlesByKind, doublesCount, b);
      if (ta !== tb) return ta - tb;
      return (randomRank.get(a) ?? 0) - (randomRank.get(b) ?? 0);
    });

    const pool = ranked.slice(0, Math.min(8, ranked.length));
    let bestPick:
      | { ids: [string, string, string, string]; teams: { teamA: [string, string]; teamB: [string, string] }; score: number }
      | null = null;
    for (let a = 0; a < pool.length; a++) {
      for (let b = a + 1; b < pool.length; b++) {
        for (let c = b + 1; c < pool.length; c++) {
          for (let d = c + 1; d < pool.length; d++) {
            const ids4 = [pool[a], pool[b], pool[c], pool[d]] as [string, string, string, string];
            const teams = bestDoubles(athletesById, ids4, playedTeammatesTry, playedMatchupsTry);
            const doublesPenalty = ids4.reduce((sum, id) => sum + (doublesCount.get(id) ?? 0), 0) * 100_000;
            const totalPenalty = ids4.reduce((sum, id) => sum + getTotalMatches(singlesByKind, doublesCount, id), 0) * 10_000;
            const score = teams.score + doublesPenalty + totalPenalty;
            if (!bestPick || score < bestPick.score) bestPick = { ids: ids4, teams, score };
          }
        }
      }
    }

    if (!bestPick) {
      const ids4 = available.slice(0, 4) as [string, string, string, string];
      const teams = bestDoubles(athletesById, ids4, playedTeammatesTry, playedMatchupsTry);
      return { ids4, teams };
    }
    return { ids4: bestPick.ids, teams: bestPick.teams };
  }

  let bestPlan: PlannedSeries[] | null = null;
  let bestObjective = Number.POSITIVE_INFINITY;

  for (let attempt = 0; attempt < 60; attempt++) {
    const playedPairsTry = new Map<DisciplineKind, Set<string>>([
      [DisciplineKind.AIR_HOCKEY, new Set(basePlayedPairsByKind.get(DisciplineKind.AIR_HOCKEY) ?? [])],
      [DisciplineKind.PING_PONG, new Set(basePlayedPairsByKind.get(DisciplineKind.PING_PONG) ?? [])],
      [DisciplineKind.FRECCETTE, new Set(basePlayedPairsByKind.get(DisciplineKind.FRECCETTE) ?? [])],
    ]);
    const playedTeammatesTry = new Set(basePlayedTeammates);
    const playedMatchupsTry = new Set(basePlayedMatchups);

    const idleCount = new Map<string, number>(idsAll.map((id) => [id, 0]));
    const doublesCount = new Map<string, number>(idsAll.map((id) => [id, 0]));
    const singlesByKind = new Map<string, Map<DisciplineKind, number>>(
      idsAll.map((id) => [
        id,
        new Map<DisciplineKind, number>([
          [DisciplineKind.AIR_HOCKEY, 0],
          [DisciplineKind.PING_PONG, 0],
          [DisciplineKind.FRECCETTE, 0],
        ]),
      ]),
    );

    const randomRank = new Map<string, number>();
    for (let i = 0; i < idsAll.length; i++) randomRank.set(idsAll[i], Math.floor(Math.random() * 1_000_000));

    const plan: PlannedSeries[] = [];
    for (let i = 0; i < seriesCount; i++) {
      const used = new Set<string>();
      const markUsed = (id: string) => used.add(id);

      const idle = pickIdle2({ idleCount, singlesByKind, doublesCount, randomRank, used });
      markUsed(idle[0]);
      markUsed(idle[1]);
      incCount(idleCount, idle[0]);
      incCount(idleCount, idle[1]);

      const availableAfterIdle = idsAll.filter((id) => !used.has(id));
      if (availableAfterIdle.length !== 10) throw new Error("Errore pianificazione: atleti attivi non validi");

      const { ids4: calcioIds, teams: calcioTeams } = pickCalcio4({
        available: availableAfterIdle,
        singlesByKind,
        doublesCount,
        randomRank,
        playedTeammatesTry,
        playedMatchupsTry,
      });
      for (const id of calcioIds) {
        markUsed(id);
        incCount(doublesCount, id);
      }
      playedTeammatesTry.add(pairKey(calcioTeams.teamA[0], calcioTeams.teamA[1]));
      playedTeammatesTry.add(pairKey(calcioTeams.teamB[0], calcioTeams.teamB[1]));
      playedMatchupsTry.add(matchupKey(calcioTeams.teamA, calcioTeams.teamB));

      const singlesPool = idsAll.filter((id) => !used.has(id));
      if (singlesPool.length !== 6) throw new Error("Errore pianificazione: pool singoli non valido");

      const basket = pickSinglesPair({
        kind: DisciplineKind.AIR_HOCKEY,
        pool: singlesPool,
        singlesByKind,
        doublesCount,
        randomRank,
        playedPairsTry,
      });
      let remaining = singlesPool.filter((id) => id !== basket[0] && id !== basket[1]);
      singlesByKind.get(basket[0])!.set(DisciplineKind.AIR_HOCKEY, getSinglesCount(singlesByKind, basket[0], DisciplineKind.AIR_HOCKEY) + 1);
      singlesByKind.get(basket[1])!.set(DisciplineKind.AIR_HOCKEY, getSinglesCount(singlesByKind, basket[1], DisciplineKind.AIR_HOCKEY) + 1);
      playedPairsTry.get(DisciplineKind.AIR_HOCKEY)!.add(pairKey(basket[0], basket[1]));

      const pingPong = pickSinglesPair({
        kind: DisciplineKind.PING_PONG,
        pool: remaining,
        singlesByKind,
        doublesCount,
        randomRank,
        playedPairsTry,
      });
      remaining = remaining.filter((id) => id !== pingPong[0] && id !== pingPong[1]);
      singlesByKind.get(pingPong[0])!.set(
        DisciplineKind.PING_PONG,
        getSinglesCount(singlesByKind, pingPong[0], DisciplineKind.PING_PONG) + 1,
      );
      singlesByKind.get(pingPong[1])!.set(
        DisciplineKind.PING_PONG,
        getSinglesCount(singlesByKind, pingPong[1], DisciplineKind.PING_PONG) + 1,
      );
      playedPairsTry.get(DisciplineKind.PING_PONG)!.add(pairKey(pingPong[0], pingPong[1]));

      const freccette = pickSinglesPair({
        kind: DisciplineKind.FRECCETTE,
        pool: remaining,
        singlesByKind,
        doublesCount,
        randomRank,
        playedPairsTry,
      });
      singlesByKind.get(freccette[0])!.set(
        DisciplineKind.FRECCETTE,
        getSinglesCount(singlesByKind, freccette[0], DisciplineKind.FRECCETTE) + 1,
      );
      singlesByKind.get(freccette[1])!.set(
        DisciplineKind.FRECCETTE,
        getSinglesCount(singlesByKind, freccette[1], DisciplineKind.FRECCETTE) + 1,
      );
      playedPairsTry.get(DisciplineKind.FRECCETTE)!.add(pairKey(freccette[0], freccette[1]));

      plan.push({ idleAthleteIds: idle, basket, pingPong, freccette, calcioBalilla: { teamA: calcioTeams.teamA, teamB: calcioTeams.teamB } });
    }

    const idleSpread = computeScoreSpread(idleCount.values());
    const doublesSpread = computeScoreSpread(doublesCount.values());
    const basketSpread = computeScoreSpread(idsAll.map((id) => getSinglesCount(singlesByKind, id, DisciplineKind.AIR_HOCKEY)));
    const pingSpread = computeScoreSpread(idsAll.map((id) => getSinglesCount(singlesByKind, id, DisciplineKind.PING_PONG)));
    const frecSpread = computeScoreSpread(idsAll.map((id) => getSinglesCount(singlesByKind, id, DisciplineKind.FRECCETTE)));
    const objective = idleSpread * 1_000_000 + doublesSpread * 200_000 + basketSpread * 50_000 + pingSpread * 50_000 + frecSpread * 50_000;
    if (!bestPlan || objective < bestObjective) {
      bestPlan = plan;
      bestObjective = objective;
      if (bestObjective === 0) break;
    }
  }

  if (!bestPlan) throw new Error("Impossibile pianificare la fase 1");
  return bestPlan;
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
  const turns = isRecord(body) ? parseIntOrNull(body.turns) : null;
  const duration = isRecord(body) ? parseIntOrNull(body.turnDurationMinutes) : null;
  const overwrite = isRecord(body) ? parseBoolean(body.overwrite) : null;
  const startAt = isRecord(body) ? parseDateOrNull(body.startAt) : null;

  const seriesCount = turns ?? 24;
  const turnDurationMinutes = duration ?? 10;
  const allowOverwrite = overwrite ?? false;

  if (seriesCount < 1 || seriesCount > 120) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Il numero di serie deve essere tra 1 e 120. Ogni serie contiene sempre 4 discipline in parallelo e 2 atleti a riposo.",
      },
      { status: 400 },
    );
  }
  if (turnDurationMinutes < 1 || turnDurationMinutes > 120) {
    return NextResponse.json({ ok: false, error: "turnDurationMinutes deve essere tra 1 e 120" }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx: any) => {
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
      orderBy: { name: "asc" },
      select: { id: true, name: true, categoryScore: true },
    });
    if (athletes.length !== 12) throw new Error("Servono 12 atleti per pianificare la fase 1");

    const disciplines = await tx.discipline.findMany({
      where: {
        kind: { in: [DisciplineKind.AIR_HOCKEY, DisciplineKind.PING_PONG, DisciplineKind.FRECCETTE, DisciplineKind.CALCIO_BALILLA] },
      },
      select: { id: true, kind: true, targetFixed: true, targetMin: true, targetMax: true },
    });
    const disciplineByKind = new Map(disciplines.map((d) => [d.kind, d]));
    for (const k of [DisciplineKind.AIR_HOCKEY, DisciplineKind.PING_PONG, DisciplineKind.FRECCETTE, DisciplineKind.CALCIO_BALILLA]) {
      if (!disciplineByKind.get(k)) throw new Error(`Disciplina mancante: ${k}`);
    }

    const playedPairsByKind = new Map<DisciplineKind, Set<string>>();
    const playedTeammates = new Set<string>();
    const playedMatchups = new Set<string>();

    const pastMatches = await tx.match.findMany({
      where: { phase: MatchPhase.QUALIFICAZIONE, discipline: { kind: { in: [DisciplineKind.AIR_HOCKEY, DisciplineKind.PING_PONG, DisciplineKind.FRECCETTE, DisciplineKind.CALCIO_BALILLA] } } },
      select: { discipline: { select: { kind: true } }, sides: { select: { athletes: { select: { athleteId: true } } } } },
    }) as any[];

    for (const m of pastMatches) {
      const kind = m.discipline.kind as DisciplineKind;
      const sideAthletes = m.sides.map((s: any) => s.athletes.map((a: any) => a.athleteId));
      if (kind !== DisciplineKind.CALCIO_BALILLA) {
        const ids = sideAthletes.flat();
        if (ids.length === 2) {
          const set = playedPairsByKind.get(kind) ?? new Set<string>();
          set.add(pairKey(ids[0], ids[1]));
          playedPairsByKind.set(kind, set);
        }
        continue;
      }
      if (sideAthletes.length === 2 && sideAthletes[0].length === 2 && sideAthletes[1].length === 2) {
        playedTeammates.add(pairKey(sideAthletes[0][0], sideAthletes[0][1]));
        playedTeammates.add(pairKey(sideAthletes[1][0], sideAthletes[1][1]));
        playedMatchups.add(matchupKey(sideAthletes[0], sideAthletes[1]));
      }
    }

    const planned = planQualificationSeries({
      seriesCount,
      athletes,
      playedPairsByKind,
      playedTeammates,
      playedMatchups,
    });
    const base = startAt ?? new Date();

    for (let idx = 0; idx < planned.length; idx++) {
      const t = await tx.qualificationTurn.create({
        data: {
          index: idx + 1,
          scheduledAt: new Date(base.getTime() + idx * turnDurationMinutes * 60_000),
        },
        select: { id: true },
      });

      const slot = (turnId: string, kind: DisciplineKind, side1: string[], side2: string[]) => {
        const d = disciplineByKind.get(kind)!;
        const targetVictory =
          d.targetFixed !== null
            ? d.targetFixed
            : d.targetMin !== null && d.targetMax !== null
              ? Math.round((d.targetMin + d.targetMax) / 2)
              : 1;
        return tx.qualificationSlot.create({
          data: {
            turnId,
            disciplineId: d.id,
            kind,
            targetVictory,
            side1AthleteIds: side1,
            side2AthleteIds: side2,
          },
        });
      };

      const s = planned[idx];
      await slot(t.id, DisciplineKind.AIR_HOCKEY, [s.basket[0]], [s.basket[1]]);
      await slot(t.id, DisciplineKind.PING_PONG, [s.pingPong[0]], [s.pingPong[1]]);
      await slot(t.id, DisciplineKind.FRECCETTE, [s.freccette[0]], [s.freccette[1]]);
      await slot(t.id, DisciplineKind.CALCIO_BALILLA, [...s.calcioBalilla.teamA], [...s.calcioBalilla.teamB]);
    }

    return {
      turnsPlanned: planned.length,
      turnDurationMinutes,
      startAt: base.toISOString(),
    };
  }).catch((e: unknown) => {
    const message = e instanceof Error ? e.message : "Errore pianificazione";
    return { error: message } as const;
  });

  if ("error" in result) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, ...result });
}
