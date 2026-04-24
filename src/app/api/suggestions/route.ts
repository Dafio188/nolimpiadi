import { prisma } from "@/lib/prisma";
import { DisciplineKind } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

function parseKind(value: string | null): DisciplineKind | null {
  if (!value) return null;
  const values = Object.values(DisciplineKind) as DisciplineKind[];
  return values.includes(value as DisciplineKind) ? (value as DisciplineKind) : null;
}

function pairKey(a: string, b: string) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function teamKey(ids: string[]) {
  return [...ids].sort().join("-");
}

function matchKey(teamA: string[], teamB: string[]) {
  const a = teamKey(teamA);
  const b = teamKey(teamB);
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const kind = parseKind(url.searchParams.get("kind"));
  if (!kind) {
    return NextResponse.json({ ok: false, error: "Param kind mancante o non valido" }, { status: 400 });
  }

  const discipline = await prisma.discipline.findUnique({ where: { kind } });
  if (!discipline) {
    return NextResponse.json({ ok: false, error: "Disciplina non trovata" }, { status: 404 });
  }

  const athletes = await prisma.athlete.findMany({ orderBy: { name: "asc" } });

  const playedMatches = await prisma.match.findMany({
    where: { disciplineId: discipline.id, phase: "QUALIFICAZIONE" },
    select: {
      sides: { select: { athletes: { select: { athleteId: true } } } },
    },
  });

  if (discipline.teamSize === 1) {
    const playedPairs = new Set<string>();
    for (const m of playedMatches) {
      const ids = m.sides.flatMap((s) => s.athletes.map((a) => a.athleteId));
      if (ids.length === 2) playedPairs.add(pairKey(ids[0], ids[1]));
    }

    const suggestions: Array<{ athleteAId: string; athleteBId: string; score: number }> = [];
    for (let i = 0; i < athletes.length; i++) {
      for (let j = i + 1; j < athletes.length; j++) {
        const a = athletes[i];
        const b = athletes[j];
        const key = pairKey(a.id, b.id);
        if (playedPairs.has(key)) continue;
        const score = Math.abs(a.categoryScore - b.categoryScore);
        suggestions.push({ athleteAId: a.id, athleteBId: b.id, score });
      }
    }

    suggestions.sort((x, y) => x.score - y.score || x.athleteAId.localeCompare(y.athleteAId));

    const byId = new Map(athletes.map((a) => [a.id, a]));
    const rows = suggestions.slice(0, 10).map((s) => ({
      athleteA: { id: byId.get(s.athleteAId)!.id, name: byId.get(s.athleteAId)!.name },
      athleteB: { id: byId.get(s.athleteBId)!.id, name: byId.get(s.athleteBId)!.name },
    }));

    return NextResponse.json({ ok: true, kind, teamSize: 1, rows });
  }

  const played = new Set<string>();
  for (const m of playedMatches) {
    const teamIds = m.sides.map((s) => s.athletes.map((a) => a.athleteId));
    if (teamIds.length === 2 && teamIds[0].length === 2 && teamIds[1].length === 2) {
      played.add(matchKey(teamIds[0], teamIds[1]));
    }
  }

  const categoryById = new Map(athletes.map((a) => [a.id, a.categoryScore]));
  const ids = athletes.map((a) => a.id);

  const teams: Array<{ ids: [string, string]; score: number }> = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i];
      const b = ids[j];
      const score = categoryById.get(a)! + categoryById.get(b)!;
      teams.push({ ids: [a, b], score });
    }
  }
  teams.sort((x, y) => x.score - y.score || teamKey(x.ids).localeCompare(teamKey(y.ids)));

  const suggestions: Array<{ teamA: [string, string]; teamB: [string, string]; balance: number }> = [];
  for (let i = 0; i < teams.length && suggestions.length < 10; i++) {
    for (let j = i + 1; j < teams.length && suggestions.length < 10; j++) {
      const t1 = teams[i];
      const t2 = teams[j];
      const used = new Set([...t1.ids, ...t2.ids]);
      if (used.size !== 4) continue;
      const key = matchKey(t1.ids, t2.ids);
      if (played.has(key)) continue;
      const balance = Math.abs(t1.score - t2.score);
      suggestions.push({ teamA: t1.ids, teamB: t2.ids, balance });
    }
  }

  suggestions.sort((a, b) => a.balance - b.balance);
  const byId = new Map(athletes.map((a) => [a.id, a]));
  const rows = suggestions.map((s) => ({
    teamA: s.teamA.map((id) => ({ id: byId.get(id)!.id, name: byId.get(id)!.name })) as [
      { id: string; name: string },
      { id: string; name: string },
    ],
    teamB: s.teamB.map((id) => ({ id: byId.get(id)!.id, name: byId.get(id)!.name })) as [
      { id: string; name: string },
      { id: string; name: string },
    ],
  }));

  return NextResponse.json({ ok: true, kind, teamSize: 2, rows });
}
