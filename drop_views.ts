import { prisma } from './src/lib/prisma';

// const prisma = new PrismaClient() non serve più
async function main() {
  console.log("Eliminazione delle viste in corso...");
  
  await prisma.$executeRawUnsafe("DROP VIEW IF EXISTS classifica_qualificazione_disciplina CASCADE;");
  await prisma.$executeRawUnsafe("DROP VIEW IF EXISTS classifica_complessiva CASCADE;");
  await prisma.$executeRawUnsafe("DROP VIEW IF EXISTS v_participations CASCADE;");
  
  console.log("✅ Viste eliminate con successo. Ora puoi eseguire 'npx prisma db push --accept-data-loss'");
}

main()
  .catch((e) => {
    console.error("Errore durante l'eliminazione:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
