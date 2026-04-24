import { prisma } from "@/lib/prisma";
import { DisciplineKind, MatchPhase } from "@prisma/client";
import { NextResponse } from "next/server";

function pairKey(a: string, b: string) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function matchKeySingles(a: string, b: string) {
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

function defaultTargetVictory(kind: DisciplineKind, targetFixed: number | null, targetMin: number | null, targetMax: number | null) {
  if (targetFixed !== null) return targetFixed;
  if (targetMin !== null && targetMax !== null) return Math.round((targetMin + targetMax) / 2);
  if (kind === DisciplineKind.AIR_HOCKEY) return 4;
  return 1;
}

async function qualificatiIds(kind: DisciplineKind, limit: number) {
  const rows = await prisma.$queryRaw<Array<{ athlete_id: string }>>`
    SELECT
      q.athlete_id
    FROM classifica_qualificazione_disciplina q
    WHERE q.kind = ${kind}
    ORDER BY q.qualification_weighted DESC, q.matches_played DESC, q.athlete_id ASC
    LIMIT ${limit}
  `;
  return rows.map((r) => r.athlete_id);
}

export async function GET() {
  const kinds = [
    DisciplineKind.AIR_HOCKEY,
    DisciplineKind.PING_PONG,
    DisciplineKind.FRECCETTE,
    DisciplineKind.CALCIO_BALILLA,
  ];

  const plannedTurn = await prisma.qualificationTurn.findFirst({
    where: { slots: { some: { match: { is: null } } } },
    orderBy: { index: "asc" },
    include: { slots: { include: { match: { select: { id: true } } } } },
  });

  if (plannedTurn) {
    const athletes = await prisma.athlete.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    const used = new Set<string>();
    for (const s of plannedTurn.slots) {
      for (const id of s.side1AthleteIds) used.add(id);
      for (const id of s.side2AthleteIds) used.add(id);
    }

    const idleAthletes = athletes.filter((a) => !used.has(a.id));
    const matches = Object.fromEntries(
      plannedTurn.slots.map((s) => [
        s.kind,
        {
          kind: s.kind,
          plannedSlotId: s.id,
          side1: s.side1AthleteIds,
          side2: s.side2AthleteIds,
          targetVictory: s.targetVictory,
        },
      ]),
    );

    return NextResponse.json({
      ok: true,
      mode: "planned",
      turn: { index: plannedTurn.index, scheduledAt: plannedTurn.scheduledAt },
      idleAthletes,
      matches,
    });
  }

  const plannedTurnsCount = await prisma.qualificationTurn.count();
  if (plannedTurnsCount > 0) {
    const remainingSlots = await prisma.qualificationSlot.count({ where: { match: { is: null } } });
    if (remainingSlots === 0) {
      const finalsKinds: DisciplineKind[] = [DisciplineKind.AIR_HOCKEY, DisciplineKind.PING_PONG, DisciplineKind.FRECCETTE, DisciplineKind.CALCIO_BALILLA];
      const disciplines = await prisma.discipline.findMany({
        where: { kind: { in: finalsKinds } },
        select: { kind: true, targetFixed: true, targetMin: true, targetMax: true, teamSize: true },
      });
      const disciplineByKind = new Map(disciplines.map((d: any) => [d.kind, d]));

      const finalsMatches = await prisma.match.findMany({
        where: { phase: MatchPhase.FINALI, discipline: { kind: { in: finalsKinds } } },
        select: {
          discipline: { select: { kind: true } },
          finalStage: true,
          sides: { select: { side: true, points: true, athletes: { select: { athleteId: true } } } },
        },
        orderBy: { playedAt: "asc" },
      });

      type StageKey = "QUARTI" | "SEMIFINALI" | "FINALE";
      const winnersByKindStageKey = new Map<string, string>();
      const playedByKindStageKey = new Set<string>();

      for (const m of finalsMatches) {
        const kind = m.discipline.kind;
        const stage = (m.finalStage ?? "QUARTI") as StageKey;
        const orderedSides = [...m.sides].sort((a, b) => a.side - b.side);
        const sideA = orderedSides[0];
        const sideB = orderedSides[1];
        const ids0 = sideA?.athletes.map((a: any) => a.athleteId) ?? [];
        const ids1 = sideB?.athletes.map((a: any) => a.athleteId) ?? [];
        if (ids0.length !== 1 || ids1.length !== 1) continue;
        const key = matchKeySingles(ids0[0], ids1[0]);
        const playedKey = `${kind}:${stage}:${key}`;
        playedByKindStageKey.add(playedKey);
        if (typeof sideA?.points !== "number" || typeof sideB?.points !== "number") continue;
        if (sideA.points === sideB.points) continue;
        const winnerId = sideA.points > sideB.points ? ids0[0] : ids1[0];
        winnersByKindStageKey.set(playedKey, winnerId);
      }

      function nextFinalsForSix(kind: DisciplineKind, seeds: string[]) {
        if (seeds.length < 6) return null;
        const s1 = seeds[0];
        const s2 = seeds[1];
        const s3 = seeds[2];
        const s4 = seeds[3];
        const s5 = seeds[4];
        const s6 = seeds[5];
        const q1Key = matchKeySingles(s3, s6);
        const q2Key = matchKeySingles(s4, s5);
        const q1Played = playedByKindStageKey.has(`${kind}:QUARTI:${q1Key}`);
        const q2Played = playedByKindStageKey.has(`${kind}:QUARTI:${q2Key}`);
        if (!q1Played) return { finalStage: "QUARTI" as const, side1: [s3], side2: [s6], label: "Quarti (3 vs 6)" };
        if (!q2Played) return { finalStage: "QUARTI" as const, side1: [s4], side2: [s5], label: "Quarti (4 vs 5)" };
        const wQ1 = winnersByKindStageKey.get(`${kind}:QUARTI:${q1Key}`) ?? null;
        const wQ2 = winnersByKindStageKey.get(`${kind}:QUARTI:${q2Key}`) ?? null;
        if (!wQ1 || !wQ2) return null;
        const sf1Key = matchKeySingles(s1, wQ2);
        const sf2Key = matchKeySingles(s2, wQ1);
        const sf1Played = playedByKindStageKey.has(`${kind}:SEMIFINALI:${sf1Key}`);
        const sf2Played = playedByKindStageKey.has(`${kind}:SEMIFINALI:${sf2Key}`);
        if (!sf1Played) return { finalStage: "SEMIFINALI" as const, side1: [s1], side2: [wQ2], label: "Semifinale 1" };
        if (!sf2Played) return { finalStage: "SEMIFINALI" as const, side1: [s2], side2: [wQ1], label: "Semifinale 2" };
        const wSF1 = winnersByKindStageKey.get(`${kind}:SEMIFINALI:${sf1Key}`) ?? null;
        const wSF2 = winnersByKindStageKey.get(`${kind}:SEMIFINALI:${sf2Key}`) ?? null;
        if (!wSF1 || !wSF2) return null;
        const fKey = matchKeySingles(wSF1, wSF2);
        const fPlayed = playedByKindStageKey.has(`${kind}:FINALE:${fKey}`);
        if (!fPlayed) return { finalStage: "FINALE" as const, side1: [wSF1], side2: [wSF2], label: "Finale" };
        return null;
      }

      const singlesFinalsKinds: DisciplineKind[] = [DisciplineKind.AIR_HOCKEY, DisciplineKind.PING_PONG, DisciplineKind.FRECCETTE];
      const seedsByKind = new Map<DisciplineKind, string[]>();
      for (const k of singlesFinalsKinds) {
        seedsByKind.set(k, await qualificatiIds(k, 6));
      }

      const matches: Record<string, unknown> = {};
      for (const k of singlesFinalsKinds) {
        const next = nextFinalsForSix(k, seedsByKind.get(k) ?? []);
        if (!next) continue;
        const d: any = disciplineByKind.get(k);
        matches[k] = {
          kind: k,
          phase: MatchPhase.FINALI,
          finalStage: next.finalStage,
          side1: next.side1,
          side2: next.side2,
          targetVictory: defaultTargetVictory(k, d?.targetFixed ?? null, d?.targetMin ?? null, d?.targetMax ?? null),
          label: next.label,
        };
      }

      const calcioSeeds = await qualificatiIds(DisciplineKind.CALCIO_BALILLA, 5);
      const [c1, c2, c3, c4, c5] = calcioSeeds;
      const schedule: Array<{ label: string; teamA: [string, string]; teamB: [string, string] }> =
        c1 && c2 && c3 && c4 && c5
          ? [
              { label: "Partita 1 (C1 C2 vs C3 C4)", teamA: [c1, c2], teamB: [c3, c4] },
              { label: "Partita 2 (C1 C3 vs C2 C5)", teamA: [c1, c3], teamB: [c2, c5] },
              { label: "Partita 3 (C1 C5 vs C2 C4)", teamA: [c1, c5], teamB: [c2, c4] },
              { label: "Partita 4 (C1 C4 vs C3 C5)", teamA: [c1, c4], teamB: [c3, c5] },
              { label: "Partita 5 (C2 C3 vs C4 C5)", teamA: [c2, c3], teamB: [c4, c5] },
            ]
          : [];

      const calcioMatches = await prisma.match.findMany({
        where: { phase: MatchPhase.FINALI, discipline: { kind: DisciplineKind.CALCIO_BALILLA } },
        select: { sides: { select: { athletes: { select: { athleteId: true } } } } },
      });
      const playedMatchups = new Set<string>();
      for (const m of calcioMatches) {
        const sides = m.sides.map((s: any) => s.athletes.map((a: any) => a.athleteId));
        if (!(sides.length === 2 && sides[0].length === 2 && sides[1].length === 2)) continue;
        playedMatchups.add(matchupKey(sides[0], sides[1]));
      }
      const nextMatch = schedule.find((m) => !playedMatchups.has(matchupKey(m.teamA, m.teamB))) ?? null;

      const calcio: any = disciplineByKind.get(DisciplineKind.CALCIO_BALILLA);
      matches[DisciplineKind.CALCIO_BALILLA] = {
        kind: DisciplineKind.CALCIO_BALILLA,
        phase: MatchPhase.FINALI,
        finalStage: "QUARTI",
        side1: nextMatch ? [...nextMatch.teamA] : [],
        side2: nextMatch ? [...nextMatch.teamB] : [],
        targetVictory: defaultTargetVictory(
          DisciplineKind.CALCIO_BALILLA,
          calcio?.targetFixed ?? null,
          calcio?.targetMin ?? null,
          calcio?.targetMax ?? null,
        ),
        label: nextMatch ? `Girone finale (doppio) · ${nextMatch.label}` : "Girone finale (doppio) · Completato",
      };

      return NextResponse.json({
        ok: true,
        mode: "finals",
        message:
          "Qualificazioni completate: caricati automaticamente i prossimi match di Finali. Calcio-balilla: girone finale in doppio (5 partite).",
        matches,
      });
    }
  }

  const [athletes, disciplines, matchesPlayed, matchesPlayedByKind] = await Promise.all([
    prisma.athlete.findMany({ select: { id: true, name: true, categoryScore: true }, orderBy: { name: "asc" } }),
    prisma.discipline.findMany({
      where: { kind: { in: kinds } },
      select: { id: true, kind: true, teamSize: true, targetFixed: true, targetMin: true, targetMax: true },
    }),
    prisma.$queryRaw<Array<{ athlete_id: string; matches_played: number }>>`
      SELECT
        athlete_id,
        COUNT(DISTINCT match_id)::int AS matches_played
      FROM v_participations
      WHERE phase = ${MatchPhase.QUALIFICAZIONE}
      GROUP BY athlete_id
    ` as any,
    prisma.$queryRaw<Array<{ athlete_id: string; kind: DisciplineKind; matches_played: number }>>`
      SELECT
        p.athlete_id,
        d.kind,
        COUNT(DISTINCT p.match_id)::int AS matches_played
      FROM v_participations p
      INNER JOIN disciplines d ON d.id = p.discipline_id
      WHERE p.phase = ${MatchPhase.QUALIFICAZIONE}
        AND d.kind IN (${DisciplineKind.AIR_HOCKEY}, ${DisciplineKind.PING_PONG}, ${DisciplineKind.FRECCETTE}, ${DisciplineKind.CALCIO_BALILLA})
      GROUP BY p.athlete_id, d.kind
    ` as any,
  ]);

  const disciplineByKind = new Map(disciplines.map((d: any) => [d.kind, d]));
  const athleteById = new Map(athletes.map((a: any) => [a.id, a]));
  const matchesByAthleteId = new Map<string, number>(matchesPlayed.map((r: any) => [r.athlete_id, r.matches_played]));
  const matchesByAthleteKind = new Map<string, Map<DisciplineKind, number>>();
  for (const r of matchesPlayedByKind) {
    const byKind = matchesByAthleteKind.get(r.athlete_id) ?? new Map<DisciplineKind, number>();
    byKind.set(r.kind, r.matches_played);
    matchesByAthleteKind.set(r.athlete_id, byKind);
  }

  const playedPairsByKind = new Map<DisciplineKind, Set<string>>();
  const playedTeammates = new Set<string>();
  const playedMatchups = new Set<string>();

  const pastMatches = await prisma.match.findMany({
    where: { phase: MatchPhase.QUALIFICAZIONE, discipline: { kind: { in: kinds } } },
    select: {
      discipline: { select: { kind: true } },
      sides: { select: { athletes: { select: { athleteId: true } } } },
    },
  });

  for (const m of pastMatches) {
    const kind = m.discipline.kind;
    const sideAthletes = m.sides.map((s) => s.athletes.map((a) => a.athleteId));
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

  const athletesSortedForRest = [...athletes].sort((a, b) => {
    const ma = matchesByAthleteId.get(a.id) ?? 0;
    const mb = matchesByAthleteId.get(b.id) ?? 0;
    if (mb !== ma) return mb - ma;
    return a.name.localeCompare(b.name);
  });

  const idle = athletesSortedForRest.slice(0, 2);
  const activeIds = new Set(athletes.map((a) => a.id));
  for (const a of idle) activeIds.delete(a.id);

  const remaining = [...activeIds];

  function pickPair(kind: DisciplineKind, pool: string[]) {
    const played = playedPairsByKind.get(kind) ?? new Set<string>();
    const candidates: Array<{ a: string; b: string; score: number }> = [];
    for (let i = 0; i < pool.length; i++) {
      for (let j = i + 1; j < pool.length; j++) {
        const a = pool[i];
        const b = pool[j];
        const key = pairKey(a, b);
        const ca = athleteById.get(a)!.categoryScore;
        const cb = athleteById.get(b)!.categoryScore;
        const categoryDiff = Math.abs(ca - cb);
        const matchesPenalty = (matchesByAthleteId.get(a) ?? 0) + (matchesByAthleteId.get(b) ?? 0);
        const kindPenalty =
          (matchesByAthleteKind.get(a)?.get(kind) ?? 0) + (matchesByAthleteKind.get(b)?.get(kind) ?? 0);
        const repeatPenalty = played.has(key) ? 1_000_000_000 : 0;
        const score = 1_000_000 - kindPenalty * 10_000 - categoryDiff * 20 - matchesPenalty * 50 - repeatPenalty;
        candidates.push({ a, b, score });
      }
    }

    candidates.sort((x, y) => y.score - x.score);
    const best = candidates[0];
    if (!best) return null;
    return [best.a, best.b] as [string, string];
  }

  const singlesKinds: DisciplineKind[] = [DisciplineKind.AIR_HOCKEY, DisciplineKind.PING_PONG, DisciplineKind.FRECCETTE];
  const picks: Record<string, { side1: string[]; side2: string[]; targetVictory: number }> = {};

  const poolForSingles = [...remaining];
  for (const kind of singlesKinds) {
    const pair = pickPair(kind, poolForSingles) ?? (poolForSingles.length >= 2 ? ([poolForSingles[0], poolForSingles[1]] as [string, string]) : null);
    if (!pair) continue;
    const [a, b] = pair;
    const idxA = poolForSingles.indexOf(a);
    if (idxA >= 0) poolForSingles.splice(idxA, 1);
    const idxB = poolForSingles.indexOf(b);
    if (idxB >= 0) poolForSingles.splice(idxB, 1);
    const d: any = disciplineByKind.get(kind)!;
    picks[kind] = {
      side1: [a],
      side2: [b],
      targetVictory: defaultTargetVictory(kind, d.targetFixed, d.targetMin, d.targetMax),
    };
  }

  const doublesPool = poolForSingles.slice(0, 4);
  if (doublesPool.length === 4) {
    const [a, b, c, d] = doublesPool;
    const partitions: Array<{ teamA: [string, string]; teamB: [string, string] }> = [
      { teamA: [a, b], teamB: [c, d] },
      { teamA: [a, c], teamB: [b, d] },
      { teamA: [a, d], teamB: [b, c] },
    ];

    const scored = partitions.map((p: any) => {
      const sumA = athleteById.get(p.teamA[0])!.categoryScore + athleteById.get(p.teamA[1])!.categoryScore;
      const sumB = athleteById.get(p.teamB[0])!.categoryScore + athleteById.get(p.teamB[1])!.categoryScore;
      const balance = Math.abs(sumA - sumB);
      const teammateA = pairKey(p.teamA[0], p.teamA[1]);
      const teammateB = pairKey(p.teamB[0], p.teamB[1]);
      const matchup = matchupKey(p.teamA, p.teamB);
      const teammateBonus = (playedTeammates.has(teammateA) ? 0 : 1) + (playedTeammates.has(teammateB) ? 0 : 1);
      const matchupBonus = playedMatchups.has(matchup) ? 0 : 1;
      const score = teammateBonus * 1000 + matchupBonus * 200 - balance * 10;
      return { ...p, balance, score };
    });

    scored.sort((x, y) => y.score - x.score);
    const best = scored[0];
    const calcio: any = disciplineByKind.get(DisciplineKind.CALCIO_BALILLA)!;
    picks[DisciplineKind.CALCIO_BALILLA] = {
      side1: [...best.teamA],
      side2: [...best.teamB],
      targetVictory: defaultTargetVictory(
        DisciplineKind.CALCIO_BALILLA,
        calcio.targetFixed,
        calcio.targetMin,
        calcio.targetMax,
      ),
    };
  }

  const response = {
    ok: true,
    mode: "suggested",
    idleAthletes: idle.map((a) => ({ id: a.id, name: a.name })),
    matches: Object.fromEntries(
      kinds
        .filter((k) => picks[k])
        .map((k) => [
          k,
          {
            ...picks[k],
            kind: k,
          },
        ]),
    ),
  };

  return NextResponse.json(response);
}
