import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function clearGhostMatches() {
  const matches = await prisma.match.findMany({
    where: { phase: "FINALI" },
    include: { sides: true }
  });

  let deleted = 0;
  for (const m of matches) {
    if (m.sides.length > 0 && m.sides[0].points === -1) {
      await prisma.match.delete({ where: { id: m.id } });
      deleted++;
    }
  }
  
  console.log(`Deleted ${deleted} ghost matches.`);
}

clearGhostMatches()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
