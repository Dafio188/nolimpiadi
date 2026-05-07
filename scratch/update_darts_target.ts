
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Aggiornamento target vittoria per Freccette a 210...');

  // 1. Aggiorna la disciplina
  const discipline = await prisma.discipline.update({
    where: { kind: 'FRECCETTE' },
    data: { targetFixed: 210 },
  });
  console.log('Disciplina aggiornata:', discipline.name, '->', discipline.targetFixed);

  // 2. Aggiorna tutti i match di Freccette (sia qualificazioni che finali)
  const matches = await prisma.match.updateMany({
    where: { disciplineId: discipline.id },
    data: { targetVictory: 210 },
  });
  console.log('Match aggiornati:', matches.count);

  // 3. Aggiorna tutti i QualificationSlot di Freccette
  const slots = await prisma.qualificationSlot.updateMany({
    where: { disciplineId: discipline.id },
    data: { targetVictory: 210 },
  });
  console.log('Slot di qualificazione aggiornati:', slots.count);

  console.log('Operazione completata con successo.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
