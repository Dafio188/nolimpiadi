import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const matches = await prisma.match.findMany({
    where: { phase: "FINALI" },
    include: {
      sides: {
        include: { athletes: true }
      }
    }
  });

  const inProgress = matches.filter(m => m.sides && m.sides.length > 0 && m.sides[0].points === -1);
  console.dir(inProgress, { depth: null });
}

main().catch(console.error).finally(() => prisma.$disconnect());
