# Environnements & migrations

Trois environnements, **bases séparées**, et un historique de migrations Prisma versionné.

| Env | Base | Hébergement | Comment migrer |
|-----|------|-------------|----------------|
| **dev** | Postgres local (Docker) | `npm run dev` | `npm run migrate:dev` |
| **qa** | Projet Neon dédié « QA » | Projet Vercel QA | auto au déploiement (`vercel-build`) |
| **prod** | Projet Neon « prod » (existant) | Projet Vercel prod | auto au déploiement (`vercel-build`) |

Connexions Prisma : `DATABASE_URL` (poolée, runtime app) + `DIRECT_URL` (directe, migrations).
En local, les deux pointent sur le Postgres Docker.

---

## 1. Développement local (Docker)

```bash
docker compose up -d            # lance Postgres sur localhost:5432
# .env.local :
#   DATABASE_URL="postgresql://lrp:lrp@localhost:5432/le_rond_point?schema=public"
#   DIRECT_URL="postgresql://lrp:lrp@localhost:5432/le_rond_point?schema=public"
npm run migrate:deploy          # applique les migrations existantes (0_init, …)
npm run db:seed                 # données de test (admin + membres + sortie)
npm run dev
```

> Prisma CLI lit `.env` (pas `.env.local`). Soit on duplique les 2 lignes DB dans `.env`,
> soit on préfixe : `DATABASE_URL=... DIRECT_URL=... npm run migrate:deploy`.

Remettre à zéro la base locale : `npm run db:reset` (drop + rejoue les migrations + seed).
Tout effacer (volume) : `docker compose down -v`.

---

## 2. Créer une migration (workflow quotidien)

1. Modifier `prisma/schema.prisma`
2. `npm run migrate:dev` → Prisma crée `prisma/migrations/<timestamp>_<nom>/` et l'applique en local
3. Commit le dossier de migration **avec** le changement de schéma
4. Au déploiement QA puis prod, `prisma migrate deploy` applique automatiquement les migrations en attente

⚠️ On n'utilise plus `prisma db push` (plus de modif de schéma à la volée en prod).

---

## 3. Baseliner les bases existantes (à faire UNE fois)

La prod (et toute base déjà créée via `db push`) contient déjà le schéma mais pas
l'historique. On marque `0_init` comme **déjà appliquée** sans la rejouer :

```bash
# PROD — avec les identifiants Neon prod (endpoint DIRECT, non -pooler) :
DATABASE_URL="<prod-pooler>" DIRECT_URL="<prod-direct>" npx prisma migrate resolve --applied 0_init

# Vérifier :
DATABASE_URL="<prod-pooler>" DIRECT_URL="<prod-direct>" npx prisma migrate status
```

`migrate resolve --applied` n'exécute **aucun** SQL : il insère juste la ligne dans
`_prisma_migrations`. Aucune donnée touchée.

---

## 4. Mettre en place la QA

1. Neon → créer un **nouveau projet** « le-rond-point-qa » → récupérer les 2 URLs (pooler + direct)
2. Appliquer le schéma à cette base neuve :
   ```bash
   DATABASE_URL="<qa-pooler>" DIRECT_URL="<qa-direct>" npx prisma migrate deploy
   DATABASE_URL="<qa-pooler>" DIRECT_URL="<qa-direct>" SEED_CONFIRM=1 npm run db:seed
   ```
3. Vercel → nouveau projet QA lié au repo (branche `qa` ou preview) avec les variables :
   `DATABASE_URL`, `DIRECT_URL` (QA), `AUTH_SECRET`, `NEXTAUTH_URL` (URL QA),
   `AUTH_GOOGLE_ID/SECRET`, VAPID, `BLOB_READ_WRITE_TOKEN`, `CRON_SECRET`.

---

## 5. Variables d'environnement Vercel (QA & prod)

À ajouter sur **chaque** projet Vercel (en plus de l'existant) :

- `DIRECT_URL` → endpoint Neon **direct** (non -pooler) du projet correspondant

`vercel-build` lance `prisma migrate deploy` avant le build : chaque déploiement
applique les migrations en attente sur la base de l'environnement.
