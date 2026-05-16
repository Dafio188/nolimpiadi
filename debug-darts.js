const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dartsMatches = await prisma.match.findMany({
    where: { discipline: { kind: 'FRECCETTE' }, phase: 'QUALIFICAZIONE' },
    include: {
      sides: {
        include: {
          athletes: { include: { athlete: true } }
        }
      }
    }
  });

  console.log('--- MATCH FRECCETTE FASE 1 ---');
  for (const m of dartsMatches) {
    const s1 = m.sides[0];
    const s2 = m.sides[1];
    const a1 = s1.athletes.map(a => a.athlete.name).join(', ');
    const a2 = s2.athletes.map(a => a.athlete.name).join(', ');
    console.log(`Match ${m.id}: [${a1}] ${s1.points} - ${s2.points} [${a2}] (Target: ${m.targetVictory})`);
  }

  const rankings = await prisma.$queryRaw`
    SELECT 
      a.name, 
      c.qualification_weighted as score,
      c.matches_played
    FROM classifica_qualificazione_disciplina c
    JOIN athletes a ON a.id = c.athlete_id
    WHERE c.kind = 'FRECCETTE'
    ORDER BY c.qualification_weighted DESC
  `;
  console.log('\n--- CLASSIFICA FRECCETTE ---');
  console.table(rankings);
}

main().catch(console.error).finally(() => prisma.$disconnect());
