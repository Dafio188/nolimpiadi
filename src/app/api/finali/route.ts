import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DISCIPLINE_ORDER = ["CALCIO_BALILLA", "FRECCETTE", "PING_PONG", "AIR_HOCKEY"];

type Slot = {
  id: string;
  stage: string;
  label: string;
  status: "DONE" | "LIVE" | "UPCOMING";
  s1: { id: string | null; name: string; letter: string | null }[];
  s2: { id: string | null; name: string; letter: string | null }[];
  points1: number | null;
  points2: number | null;
  targetVictory: number;
};

type Athlete = { id: string; name: string; letter: string | null };

export async function GET() {
  try {
    // 1. Rankings Fase 1
    const rawRankings: any[] = await prisma.$queryRaw`
      SELECT c.discipline_id, c.athlete_id, c.kind, a.name as athlete_name, a.letter as athlete_letter
      FROM classifica_qualificazione_disciplina c
      JOIN athletes a ON a.id = c.athlete_id
      ORDER BY c.kind ASC, c.qualification_weighted DESC, a.name ASC
    `;

    const rankingsByKind: Record<string, Athlete[]> = {};
    const discIdByKind: Record<string, string> = {};
    for (const row of rawRankings) {
      if (!rankingsByKind[row.kind]) {
        rankingsByKind[row.kind] = [];
        discIdByKind[row.kind] = row.discipline_id;
      }
      rankingsByKind[row.kind].push({ id: row.athlete_id, name: row.athlete_name, letter: row.athlete_letter });
    }

    // 2. Match FINALI dal DB
    const dbMatches = await prisma.match.findMany({
      where: { phase: "FINALI" },
      include: {
        discipline: true,
        sides: { orderBy: { side: "asc" }, include: { athletes: { include: { athlete: true } } } },
      },
      orderBy: { createdAt: "asc" },
    });

    // --- Helpers ---
    const slotStatus = (m: any): "DONE" | "LIVE" | "UPCOMING" => {
      const s1 = m.sides.find((s: any) => s.side === 1);
      const s2 = m.sides.find((s: any) => s.side === 2);
      const p0 = s1?.points ?? null;
      const p1 = s2?.points ?? null;
      if (p0 !== null && p1 !== null && p0 >= 0 && p1 >= 0) return "DONE";
      if (p0 === -1 || p1 === -1) return "LIVE";
      return "UPCOMING";
    };

    const fromDb = (m: any, stage: string, label: string): Slot => {
      const s1 = m.sides.find((s: any) => s.side === 1);
      const s2 = m.sides.find((s: any) => s.side === 2);
      const p0 = s1?.points ?? null;
      const p1 = s2?.points ?? null;
      return {
        id: m.id, stage, label,
        status: slotStatus(m),
        s1: s1?.athletes.map((a: any) => ({ id: a.athlete.id, name: a.athlete.name, letter: a.athlete.letter })) ?? [],
        s2: s2?.athletes.map((a: any) => ({ id: a.athlete.id, name: a.athlete.name, letter: a.athlete.letter })) ?? [],
        points1: p0 !== null && p0 >= 0 ? p0 : null,
        points2: p1 !== null && p1 >= 0 ? p1 : null,
        targetVictory: m.targetVictory,
      };
    };

    const upcoming = (stage: string, label: string, a1: string | null, a2: string | null, tv = 0, a1Id: string | null = null, a2Id: string | null = null, l1: string | null = null, l2: string | null = null): Slot => ({
      id: `up-${stage}-${label.replace(/\s/g, "_")}-${a1 ?? "?"}-${a2 ?? "?"}`,
      stage, label,
      status: "UPCOMING",
      s1: [{ id: a1Id, name: a1 ?? "????", letter: l1 }],
      s2: [{ id: a2Id, name: a2 ?? "????", letter: l2 }],
      points1: null, points2: null,
      targetVictory: tv,
    });

    const getWinner = (m: any): string | null => {
      if (!m) return null;
      const s1 = m.sides.find((s: any) => s.side === 1);
      const s2 = m.sides.find((s: any) => s.side === 2);
      if (!s1 || !s2 || s1.points < 0 || s2.points < 0) return null;
      if (s1.points > s2.points) return s1.athletes[0]?.athleteId ?? null;
      if (s2.points > s1.points) return s2.athletes[0]?.athleteId ?? null;
      return null;
    };

    const getLoser = (m: any): string | null => {
      if (!m) return null;
      const s1 = m.sides.find((s: any) => s.side === 1);
      const s2 = m.sides.find((s: any) => s.side === 2);
      if (!s1 || !s2 || s1.points < 0 || s2.points < 0) return null;
      if (s1.points < s2.points) return s1.athletes[0]?.athleteId ?? null;
      if (s2.points < s1.points) return s2.athletes[0]?.athleteId ?? null;
      return null;
    };

    const hasAthlete = (m: any, id: string | null) =>
      !!id && m?.sides.some((s: any) => s.athletes.some((a: any) => a.athleteId === id));

    // --- Build disciplines ---
    let totalLive = 0, totalDone = 0, totalUpcoming = 0;
    const disciplines: { kind: string; name: string; matches: Slot[] }[] = [];

    for (const kind of DISCIPLINE_ORDER) {
      const rankings = rankingsByKind[kind] ?? [];
      const discId = discIdByKind[kind];
      if (!discId) continue;

      const dms = dbMatches.filter(m => m.discipline.kind === kind);
      const tv = dms[0]?.targetVictory ?? 0;
      const slots: Slot[] = [];

      if (kind === "CALCIO_BALILLA") {
        const top5 = rankings.slice(0, 5);
        if (top5.length >= 5) {
          const [c1, c2, c3, c4, c5] = top5;
          const schedule = [
            { n: 1, s1: [c1, c2], s2: [c3, c4] },
            { n: 2, s1: [c1, c3], s2: [c2, c5] },
            { n: 3, s1: [c1, c5], s2: [c2, c4] },
            { n: 4, s1: [c1, c4], s2: [c3, c5] },
            { n: 5, s1: [c2, c3], s2: [c4, c5] },
          ];
          const hasExact = (side: any, ids: string[]) =>
            (side?.athletes?.map((a: any) => a.athleteId).sort().join(",") ?? "") === [...ids].sort().join(",");

          for (const m of schedule) {
            const label = `Partita ${m.n}`;
            const dbM = dms.find(dm =>
              (hasExact(dm.sides[0], m.s1.map((x: any) => x.id)) && hasExact(dm.sides[1], m.s2.map((x: any) => x.id))) ||
              (hasExact(dm.sides[0], m.s2.map((x: any) => x.id)) && hasExact(dm.sides[1], m.s1.map((x: any) => x.id)))
            );
            if (dbM) {
              const s = slotStatus(dbM);
              const side0 = dbM.sides.find((s: any) => s.side === 1);
              const side1 = dbM.sides.find((s: any) => s.side === 2);
              const p0 = side0?.points ?? null;
              const p1 = side1?.points ?? null;
              slots.push({
                id: dbM.id, stage: "GIRONE", label, status: s,
                s1: m.s1.map(a => ({ id: a.id, name: a.name, letter: a.letter })), 
                s2: m.s2.map(a => ({ id: a.id, name: a.name, letter: a.letter })),
                points1: p0 !== null && p0 >= 0 ? p0 : null,
                points2: p1 !== null && p1 >= 0 ? p1 : null,
                targetVictory: dbM.targetVictory,
              });
            } else {
              slots.push({ id: `up-cb-${m.n}`, stage: "GIRONE", label, status: "UPCOMING",
                s1: m.s1.map(a => ({ id: a.id, name: a.name, letter: a.letter })), 
                s2: m.s2.map(a => ({ id: a.id, name: a.name, letter: a.letter })),
                points1: null, points2: null, targetVictory: tv });
            }
          }
        }
      } else {
        const quarti = dms.filter(m => m.finalStage === "QUARTI");
        const semi = dms.filter(m => m.finalStage === "SEMIFINALI");
        const finali = dms.filter(m => ["FINALE", "FINALE_34", "FINALE_56"].includes(m.finalStage as any));

        let q1 = quarti.find(m => hasAthlete(m, rankings[2]?.id) || hasAthlete(m, rankings[5]?.id));
        let q2 = quarti.find(m => m.id !== q1?.id && (hasAthlete(m, rankings[3]?.id) || hasAthlete(m, rankings[4]?.id)));
        if (!q1) q1 = quarti.find(m => m.id !== q2?.id);
        if (!q2) q2 = quarti.find(m => m.id !== q1?.id);

        const wQ1 = getWinner(q1);
        const wQ2 = getWinner(q2);
        const lQ1 = getLoser(q1);
        const lQ2 = getLoser(q2);

        let s1 = semi.find(m => hasAthlete(m, rankings[0]?.id));
        let s2 = semi.find(m => m.id !== s1?.id && hasAthlete(m, rankings[1]?.id));
        if (!s1) s1 = semi.find(m => m.id !== s2?.id);
        if (!s2) s2 = semi.find(m => m.id !== s1?.id);

        const wS1 = getWinner(s1);
        const wS2 = getWinner(s2);
        const lS1 = getLoser(s1);
        const lS2 = getLoser(s2);

        // Identificazione Intelligente Finali
        let f1 = finali.find(m => hasAthlete(m, wS1) || hasAthlete(m, wS2));
        if (!f1) f1 = finali.find(m => m.finalStage === "FINALE");

        let f3 = finali.find(m => m.id !== f1?.id && (hasAthlete(m, lS1) || hasAthlete(m, lS2)));
        if (!f3) f3 = finali.find(m => m.id !== f1?.id && m.finalStage === ("FINALE_34" as any));
        if (!f3) f3 = finali.find(m => m.id !== f1?.id && m.id !== finali.find(m => m.id !== f1?.id && (hasAthlete(m, lQ1) || hasAthlete(m, lQ2)))?.id);

        let f5 = finali.find(m => m.id !== f1?.id && m.id !== f3?.id && (hasAthlete(m, lQ1) || hasAthlete(m, lQ2)));
        if (!f5) f5 = finali.find(m => m.id !== f1?.id && m.id !== f3?.id && m.finalStage === ("FINALE_56" as any));
        if (!f5) f5 = finali.find(m => m.id !== f1?.id && m.id !== f3?.id);

        const byId = (id: string | null) => rankings.find(a => a.id === id) ?? null;

        // QUARTI (solo se 6 qualificati)
        if (rankings.length >= 6) {
          const lq1 = "3° vs 6°";
          slots.push(q1 ? fromDb(q1, "QUARTI", lq1) : upcoming("QUARTI", lq1, rankings[2]?.name ?? null, rankings[5]?.name ?? null, tv, rankings[2]?.id ?? null, rankings[5]?.id ?? null, rankings[2]?.letter ?? null, rankings[5]?.letter ?? null));
          const lq2 = "4° vs 5°";
          slots.push(q2 ? fromDb(q2, "QUARTI", lq2) : upcoming("QUARTI", lq2, rankings[3]?.name ?? null, rankings[4]?.name ?? null, tv, rankings[3]?.id ?? null, rankings[4]?.id ?? null, rankings[3]?.letter ?? null, rankings[4]?.letter ?? null));
        }

        // SEMIFINALI
        const ls1 = rankings.length >= 5 ? "1° vs Vinc. Quarti" : "1° vs 4°";
        const aS1_2 = wQ2 ? byId(wQ2)?.name ?? null : null;
        const lS1_2 = wQ2 ? byId(wQ2)?.letter ?? null : null;
        slots.push(s1 ? fromDb(s1, "SEMIFINALI", ls1) : upcoming("SEMIFINALI", ls1, rankings[0]?.name ?? null, aS1_2, tv, rankings[0]?.id ?? null, wQ2, rankings[0]?.letter ?? null, lS1_2));

        const ls2 = rankings.length >= 6 ? "2° vs Vinc. Quarti" : "2° vs 3°";
        const aS2_2 = wQ1 ? byId(wQ1)?.name ?? null : null;
        const lS2_2 = wQ1 ? byId(wQ1)?.letter ?? null : null;
        slots.push(s2 ? fromDb(s2, "SEMIFINALI", ls2) : upcoming("SEMIFINALI", ls2, rankings[1]?.name ?? null, aS2_2, tv, rankings[1]?.id ?? null, wQ1, rankings[1]?.letter ?? null, lS2_2));

        // FINALI
        const wf1_1 = byId(wS1);
        const wf1_2 = byId(wS2);
        slots.push(f1 ? fromDb(f1, "FINALE", "🥇 1° – 2° posto")
          : upcoming("FINALE", "🥇 1° – 2° posto", wf1_1?.name ?? null, wf1_2?.name ?? null, tv, wS1, wS2, wf1_1?.letter ?? null, wf1_2?.letter ?? null));

        const lf3_1 = byId(lS1);
        const lf3_2 = byId(lS2);
        slots.push(f3 ? fromDb(f3, "FINALE_34", "🥉 3° – 4° posto")
          : upcoming("FINALE_34", "🥉 3° – 4° posto", lf3_1?.name ?? null, lf3_2?.name ?? null, tv, lS1, lS2, lf3_1?.letter ?? null, lf3_2?.letter ?? null));

        const lf5_1 = byId(lQ1);
        const lf5_2 = byId(lQ2);
        slots.push(f5 ? fromDb(f5, "FINALE_56", "🎖️ 5° – 6° posto")
          : upcoming("FINALE_56", "🎖️ 5° – 6° posto", lf5_1?.name ?? null, lf5_2?.name ?? null, tv, lQ1, lQ2, lf5_1?.letter ?? null, lf5_2?.letter ?? null));
      }

      for (const s of slots) {
        if (s.status === "DONE") totalDone++;
        else if (s.status === "LIVE") totalLive++;
        else totalUpcoming++;
      }

      disciplines.push({ kind, name: kind.replace(/_/g, " "), matches: slots });
    }

    return NextResponse.json({
      ok: true,
      data: { disciplines, stats: { live: totalLive, done: totalDone, upcoming: totalUpcoming } },
    });
  } catch (error: any) {
    console.error("Finali API Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
