/**
 * dump_db_results.ts
 * Estrae dal DB tutti i risultati (qualificazione + finali) e li salva in JSON.
 * Esegui: npx tsx scripts/dump_db_results.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("📡 Connessione al DB...");

  // Atleti
  const athletes = await prisma.athlete.findMany({ orderBy: { letter: "asc" } });
  const athleteMap = new Map(athletes.map((a) => [a.id, a]));

  // Discipline
  const disciplines = await prisma.discipline.findMany();
  const discMap = new Map(disciplines.map((d) => [d.id, d]));

  // Tutte le partite con lati e atleti
  const matches = await prisma.match.findMany({
    include: {
      sides: {
        include: {
          athletes: { include: { athlete: true } },
        },
      },
      discipline: true,
    },
    orderBy: [{ phase: "asc" }, { playedAt: "asc" }],
  });

  // Struttura output
  const output: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    athletes: athletes.map((a) => ({
      name: a.name,
      letter: a.letter,
      tier: a.tier,
      categoryScore: a.categoryScore,
    })),
    disciplines: disciplines.map((d) => ({
      name: d.name,
      kind: d.kind,
      coefficient: d.coefficient,
      teamSize: d.teamSize,
      targetFixed: d.targetFixed,
      targetOverride: d.targetOverride,
    })),
    matches: matches.map((m) => ({
      id: m.id,
      discipline: m.discipline.name,
      phase: m.phase,
      finalStage: m.finalStage,
      targetVictory: m.targetVictory,
      playedAt: m.playedAt,
      sides: m.sides.map((s) => ({
        side: s.side,
        points: s.points,
        athletes: s.athletes.map((msa) => ({
          name: msa.athlete.name,
          letter: msa.athlete.letter,
        })),
      })),
    })),
  };

  const outPath = path.join("scripts", "db_dump.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");
  
  // Stampa anche un resoconto leggibile
  console.log("\n===== RIEPILOGO DB =====");
  console.log(`Atleti: ${athletes.length}`);
  console.log(`Partite totali: ${matches.length}`);
  
  const byPhase = { QUALIFICAZIONE: 0, FINALI: 0 };
  for (const m of matches) byPhase[m.phase]++;
  console.log(`  - Qualificazione: ${byPhase.QUALIFICAZIONE}`);
  console.log(`  - Finali: ${byPhase.FINALI}`);

  // Classifica per ogni disciplina (fase qualificazione)
  for (const disc of disciplines) {
    const discMatches = matches.filter(
      (m) => m.discipline.kind === disc.kind && m.phase === "QUALIFICAZIONE"
    );
    const winsMap = new Map<string, { wins: number; losses: number; pf: number; ps: number }>();
    
    for (const m of discMatches) {
      if (m.sides.length < 2) continue;
      const s1 = m.sides.find((s) => s.side === 1);
      const s2 = m.sides.find((s) => s.side === 2);
      if (!s1 || !s2) continue;
      
      const process = (side: typeof s1, pts: number, oppPts: number) => {
        for (const msa of side.athletes) {
          const key = `${msa.athlete.letter}-${msa.athlete.name}`;
          const existing = winsMap.get(key) ?? { wins: 0, losses: 0, pf: 0, ps: 0 };
          winsMap.set(key, {
            wins: existing.wins + (pts > oppPts ? 1 : 0),
            losses: existing.losses + (pts < oppPts ? 1 : 0),
            pf: existing.pf + pts,
            ps: existing.ps + oppPts,
          });
        }
      };
      process(s1, s1.points, s2.points);
      process(s2, s2.points, s1.points);
    }
    
    const sorted = Array.from(winsMap.entries())
      .sort((a, b) => b[1].wins - a[1].wins || (b[1].pf - b[1].ps) - (a[1].pf - a[1].ps));
    
    console.log(`\n🏅 ${disc.name.toUpperCase()} (${discMatches.length} partite)`);
    sorted.forEach(([key, v], i) => {
      console.log(
        `  ${i + 1}. ${key.padEnd(20)} V:${v.wins} S:${v.losses} PF:${v.pf} PS:${v.ps} Diff:${v.pf - v.ps >= 0 ? "+" : ""}${v.pf - v.ps}`
      );
    });
  }

  // Finali
  const finali = matches.filter((m) => m.phase === "FINALI");
  if (finali.length > 0) {
    console.log("\n===== RISULTATI FINALI =====");
    for (const m of finali) {
      const s1 = m.sides.find((s) => s.side === 1);
      const s2 = m.sides.find((s) => s.side === 2);
      if (!s1 || !s2) continue;
      const team1 = s1.athletes.map((a) => a.athlete.letter).join("+");
      const team2 = s2.athletes.map((a) => a.athlete.letter).join("+");
      const winner = s1.points > s2.points ? team1 : team2;
      console.log(
        `  [${m.finalStage}] ${m.discipline.name}: ${team1}(${s1.points}) vs ${team2}(${s2.points}) → WIN: ${winner}`
      );
    }
  }

  console.log(`\n✅ Dati completi salvati in: ${outPath}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
