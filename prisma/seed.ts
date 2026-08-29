import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  max: 1,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const username = process.env.FOUNDER_USERNAME;
  const password = process.env.FOUNDER_PASSWORD;
  const displayName = process.env.FOUNDER_DISPLAY_NAME || username;

  if (username && password) {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (!existing) {
      const founder = await prisma.user.create({
        data: {
          username,
          passwordHash: bcrypt.hashSync(password, 12),
          displayName: displayName || username,
          role: "FOUNDER",
        },
      });
      console.log(`✓ Fundador creado: ${founder.username} (FOUNDER)`);
    } else {
      console.log(`· El fundador ${username} ya existe.`);
    }
  } else {
    console.warn("FOUNDER_USERNAME / FOUNDER_PASSWORD no definidos. No se creó fundador.");
  }

  const catCount = await prisma.channelCategory.count();
  if (catCount === 0) {
    const general = await prisma.channelCategory.create({ data: { name: "General", position: 0 } });
    await prisma.channelCategory.create({ data: { name: "Staff", position: 1 } });
    await prisma.channel.create({
      data: { name: "anuncios", description: "Avisos importantes del staff", categoryId: general.id },
    });
    await prisma.channel.create({
      data: { name: "sala-general", description: "Charlas entre staff", categoryId: general.id },
    });
    console.log("✓ Canales por defecto creados.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());