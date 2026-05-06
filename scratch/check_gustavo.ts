
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("=== ANALISI FINALI CALCIO BALILLA ===");

  // 1. Prendi la classifica ufficiale della Fase 1 per Calcio Balilla
  const ranking = await prisma.$queryRaw<any[]>`
    SELECT athlete_id, athlete_name, qualification_weighted, letter
    FROM classifica_qualificazione_disciplina
    WHERE kind = 'CALCIO_BALILLA'
    ORDER BY qualification_weighted DESC
    LIMIT 5
  `;

  console.log("\n--- Top 5 Qualificati (Fase 1) ---");
  ranking.forEach((r, i) => console.log(`${i+1}. ${r.athlete_name} (${r.letter}) - Score: ${r.qualification_weighted}`));

  // 2. Prendi i match della Fase 2 per Calcio Balilla
  const matches = await prisma.match.findMany({
    where: {
      disciplineKind: 'CALCIO_BALILLA',
      phase: 2
    },
    include: {
      sides: {
        include: {
          athletes: {
            include: {
              athlete: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  console.log("\n--- Match Fase 2 Registrati ---");
  matches.forEach(m => {
    console.log(`\nMatch ID: ${m.id} | Tipo: ${m.type} | Stato: ${m.status}`);
    m.sides.forEach((s, si) => {
      const names = s.athletes.map(a => a.athlete.name).join(' & ');
      console.log(`  Side ${si + 1}: ${names || 'DA DEFINIRE'} (Score: ${s.score})`);
    });
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
