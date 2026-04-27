import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const turns = await prisma.qualificationTurn.findMany({
    orderBy: { index: 'asc' },
    include: {
      slots: {
        include: { match: true }
      }
    }
  });
  console.log(JSON.stringify(turns, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
