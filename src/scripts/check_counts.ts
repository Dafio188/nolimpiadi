import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const counts = await prisma.$queryRaw<any[]>`
    SELECT d.name, COUNT(a.id) as total_athletes
    FROM disciplines d
    CROSS JOIN athletes a
    GROUP BY d.name
  `;
  console.log("=== VERIFICA DATABASE ===");
  console.log("Atleti totali per disciplina:", counts);

  const phase1 = await prisma.$queryRaw<any[]>`
    SELECT d.name, COUNT(c.athlete_id) as ranking_rows
    FROM classifica_qualificazione_disciplina c
    JOIN disciplines d ON d.id = c.discipline_id
    GROUP BY d.name
  `;
  console.log("Righe in classifica Fase 1:", phase1);
}

main().catch(console.error).finally(() => prisma.$disconnect());
