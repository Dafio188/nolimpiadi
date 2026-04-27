import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("nolimpiadi2026", 10);
  const user = await prisma.admin.upsert({
    where: { username: "Davide" },
    update: { password: hashedPassword },
    create: {
      username: "Davide",
      password: hashedPassword,
    },
  });
  console.log("Admin Davide creato/aggiornato:", user.username);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
