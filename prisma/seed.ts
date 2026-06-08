import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

// Garde-fou : interdit de seeder une base distante (QA/prod) par accident.
// Pour seeder une base non-locale, lancer avec SEED_CONFIRM=1.
const url = process.env.DATABASE_URL ?? "";
const isLocal = url.includes("localhost") || url.includes("127.0.0.1") || url.includes("@db:");
if (!isLocal && process.env.SEED_CONFIRM !== "1") {
  console.error(
    "⛔ DATABASE_URL ne pointe pas sur une base locale.\n" +
      "   Pour seeder QA volontairement : SEED_CONFIRM=1 npm run db:seed"
  );
  process.exit(1);
}

const day = (offset: number) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
};

const TEST_MEMBERS = [
  { email: "alex@example.test", name: "Alex", memberColor: 2, city: "Lyon", isResident: false },
  { email: "thomas@example.test", name: "Thomas", memberColor: 3, city: "Strasbourg", isResident: true },
  { email: "julie@example.test", name: "Julie", memberColor: 9, city: "Berlin", isResident: false },
  { email: "sam@example.test", name: "Sam", memberColor: 6, city: "Strasbourg", isResident: true },
];

async function main() {
  console.log("🌱 Seeding…");

  // Admin fondateur
  const admin = await prisma.user.upsert({
    where: { email: "brice.mangeat@gmail.com" },
    update: {},
    create: { email: "brice.mangeat@gmail.com", name: "Brice", role: Role.ADMIN, memberColor: 1, isActive: true },
  });

  // Membres de test
  const members = [];
  for (const m of TEST_MEMBERS) {
    const u = await prisma.user.upsert({
      where: { email: m.email },
      update: { isResident: m.isResident, city: m.city },
      create: { ...m, role: Role.MEMBER, isActive: true, onboardedAt: new Date() },
    });
    members.push(u);
  }

  // Présences à venir (idempotent : on ne crée que si le membre n'en a aucune future)
  const presencePlan: { user: { id: string }; start: number; end: number; availability: "OPEN" | "BUSY" }[] = [
    { user: members[0], start: 3, end: 6, availability: "OPEN" },
    { user: members[2], start: 5, end: 9, availability: "OPEN" },
    { user: admin, start: 4, end: 7, availability: "BUSY" },
  ];
  for (const p of presencePlan) {
    const existing = await prisma.presence.findFirst({ where: { userId: p.user.id, endDate: { gte: day(0) } } });
    if (!existing) {
      await prisma.presence.create({
        data: { userId: p.user.id, startDate: day(p.start), endDate: day(p.end), availability: p.availability },
      });
    }
  }

  // Une sortie de test (idempotent par nom)
  const evName = "Apéro de test 🍻";
  let event = await prisma.event.findFirst({ where: { name: evName } });
  if (!event) {
    event = await prisma.event.create({
      data: {
        type: "BAR",
        name: evName,
        hostId: admin.id,
        description: "Sortie générée par le seed.",
        whenAt: day(4),
        placeName: "Le Hopper",
        placeAddr: "8 rue Oberkampf, 75011 Paris",
        logisticsKind: "tricount",
        needsEnabled: false,
        tricountEnabled: true,
        rsvps: {
          create: [
            { userId: admin.id, status: "YES" },
            { userId: members[0].id, status: "YES" },
            { userId: members[1].id, status: "PENDING" },
          ],
        },
      },
    });
  }

  console.log(`✅ Admin: ${admin.email}`);
  console.log(`✅ ${members.length} membres de test`);
  console.log(`✅ Sortie: ${event.name}`);
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
