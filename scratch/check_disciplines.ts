import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const ds = await prisma.discipline.findMany()
  console.log(JSON.stringify(ds, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
