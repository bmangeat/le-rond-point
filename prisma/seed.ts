import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Upsert admin fondateur
  const admin = await prisma.user.upsert({
    where: { email: "brice.mangeat@gmail.com" },
    update: {},
    create: {
      email: "brice.mangeat@gmail.com",
      name: "Brice",
      role: Role.ADMIN,
      memberColor: 1,
      isActive: true,
    },
  });

  console.log(`✅ Admin créé : ${admin.email} (id: ${admin.id})`);
  console.log("🎉 Seed terminé !");
}

main()
  .catch((e) => {
    console.error("❌ Erreur seed :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
