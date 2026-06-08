import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

// Garde-fou : interdit de seeder une base distante (QA/prod) par accident.
// Pour seeder une base non-locale, lancer avec SEED_CONFIRM=1.
const url = process.env.DATABASE_URL ?? "";
const isLocal = url.includes("localhost") || url.includes("127.0.0.1") || url.includes("@db:");
if (!isLocal && process.env.SEED_CONFIRM !== "1") {
  console.error(
    "⛔ DATABASE_URL ne pointe pas sur une base locale.\n" +
      "   Pour seeder QA volontairement : SEED_CONFIRM=1 npm run db:seed (ou npm run seed:qa)"
  );
  process.exit(1);
}

const day = (offset: number) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
};

// Upsert d'un groupe par nom (idempotent — pas de contrainte unique sur name)
async function upsertGroup(name: string) {
  const existing = await prisma.group.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.group.create({ data: { name } });
}

async function main() {
  console.log("🌱 Seeding (multi-tenant)…");

  // ── Deux groupes pour la recette de cloisonnement ──
  const groupA = await upsertGroup("Le Rond Point");
  const groupB = await upsertGroup("Les Voisins");

  // ── Utilisateurs ──
  // Brice : SUPER_ADMIN (plateforme), rattaché au groupe A pour avoir un "chez-soi".
  const admin = await prisma.user.upsert({
    where: { email: "brice.mangeat@gmail.com" },
    update: { role: Role.SUPER_ADMIN, groupId: groupA.id },
    create: { email: "brice.mangeat@gmail.com", name: "Brice", role: Role.SUPER_ADMIN, memberColor: 1, isActive: true, groupId: groupA.id },
  });

  const people = [
    { email: "thomas@example.test", name: "Thomas", memberColor: 3, city: "Strasbourg", isResident: true, role: Role.ADMIN, group: groupA },
    { email: "alex@example.test", name: "Alex", memberColor: 2, city: "Lyon", isResident: false, role: Role.MEMBER, group: groupA },
    { email: "julie@example.test", name: "Julie", memberColor: 9, city: "Berlin", isResident: false, role: Role.ADMIN, group: groupB },
    { email: "sam@example.test", name: "Sam", memberColor: 6, city: "Strasbourg", isResident: true, role: Role.MEMBER, group: groupB },
    { email: "marc@example.test", name: "Marc", memberColor: 7, city: "Nantes", isResident: false, role: Role.MEMBER, group: groupB },
  ];
  const byEmail: Record<string, { id: string }> = {};
  for (const p of people) {
    const u = await prisma.user.upsert({
      where: { email: p.email },
      update: { role: p.role, groupId: p.group.id, isResident: p.isResident, city: p.city },
      create: {
        email: p.email, name: p.name, memberColor: p.memberColor, city: p.city,
        isResident: p.isResident, role: p.role, groupId: p.group.id, isActive: true, onboardedAt: new Date(),
      },
    });
    byEmail[p.email] = u;
  }

  // ── Présences à venir (par groupe) ──
  const presences: { userId: string; start: number; end: number; avail: "OPEN" | "BUSY" }[] = [
    { userId: byEmail["alex@example.test"].id, start: 3, end: 6, avail: "OPEN" },   // groupe A
    { userId: admin.id, start: 4, end: 7, avail: "BUSY" },                          // groupe A
    { userId: byEmail["marc@example.test"].id, start: 2, end: 5, avail: "OPEN" },   // groupe B
  ];
  for (const pr of presences) {
    const exists = await prisma.presence.findFirst({ where: { userId: pr.userId, endDate: { gte: day(0) } } });
    if (!exists) {
      await prisma.presence.create({ data: { userId: pr.userId, startDate: day(pr.start), endDate: day(pr.end), availability: pr.avail } });
    }
  }

  // ── Une sortie par groupe (idempotent par nom, + rattachement groupId) ──
  const events = [
    { name: "Apéro de test 🍻", hostId: admin.id, groupId: groupA.id, type: "BAR" as const },
    { name: "Soirée test (groupe B)", hostId: byEmail["julie@example.test"].id, groupId: groupB.id, type: "SOIREE" as const },
  ];
  for (const ev of events) {
    const existing = await prisma.event.findFirst({ where: { name: ev.name } });
    if (existing) {
      await prisma.event.update({ where: { id: existing.id }, data: { groupId: ev.groupId } });
    } else {
      await prisma.event.create({
        data: {
          type: ev.type, name: ev.name, hostId: ev.hostId, groupId: ev.groupId,
          description: "Sortie générée par le seed.", whenAt: day(4),
          placeName: ev.type === "BAR" ? "Le Hopper" : "Chez Julie",
          logisticsKind: ev.type === "BAR" ? "tricount" : "list",
          needsEnabled: ev.type === "SOIREE", tricountEnabled: ev.type === "BAR",
          rsvps: { create: [{ userId: ev.hostId, status: "YES" }] },
        },
      });
    }
  }

  console.log(`✅ Groupes : ${groupA.name} (${groupA.id}) · ${groupB.name} (${groupB.id})`);
  console.log(`✅ SUPER_ADMIN : ${admin.email}`);
  console.log(`✅ ${people.length} membres répartis sur les 2 groupes`);
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
