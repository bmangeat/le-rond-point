# Le Rond Point

Application web mobile-first pour coordonner les présences d'un groupe d'amis dans leur quartier d'enfance.

## Stack

- **Next.js 14** (App Router)
- **NextAuth v5** — Google OAuth
- **Neon** (PostgreSQL serverless)
- **Prisma** ORM
- **Tailwind CSS** + design system custom
- **Resend** — emails transactionnels
- **Vercel** — déploiement

---

## Setup local

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer les variables d'environnement

```bash
cp .env.example .env.local
```

Remplir `.env.local` avec :

- **DATABASE_URL** : Connection string Neon → [console.neon.tech](https://console.neon.tech)
- **AUTH_SECRET** : `openssl rand -base64 32`
- **AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET** : [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth 2.0 Client ID
  - Authorized redirect URI : `http://localhost:3000/api/auth/callback/google`
- **RESEND_API_KEY** : [resend.com](https://resend.com) → API Keys
- **RESEND_FROM** : En dev, utiliser `onboarding@resend.dev` (emails envoyés uniquement à ton adresse)

### 3. Initialiser la base de données

```bash
npm run db:push      # Crée les tables
npm run db:seed      # Seede l'admin (brice.mangeat@gmail.com)
```

### 4. Lancer en dev

```bash
npm run dev
```

→ [http://localhost:3000](http://localhost:3000)

---

## Déploiement Vercel

1. Push sur GitHub
2. Importer le repo sur [vercel.com](https://vercel.com)
3. Ajouter toutes les variables d'env dans Vercel → Settings → Environment Variables
4. Ajouter `https://ton-app.vercel.app/api/auth/callback/google` dans Google Cloud Console → Authorized redirect URIs
5. Déployer → `npm run db:push` et `npm run db:seed` via Vercel CLI ou la console Neon

---

## Structure du projet

```
app/
  page.tsx                  → Accueil (calendrier + présences)
  login/                    → Connexion Google
  invite/[token]/           → Landing invitation
  presences/                → Liste des présences
  profile/                  → Profil & préférences
  admin/                    → Gestion membres (admin only)
  api/
    auth/[...nextauth]/     → NextAuth handler
    presences/              → CRUD présences + notifs
    profile/                → Mise à jour profil
    admin/                  → Invitation + gestion membres

components/
  calendar/                 → MonthCalendar, DayDetailSheet
  layout/                   → AppShell, BottomTabBar
  presence/                 → PresenceCard, PresenceForm
  shared/                   → Avatar, AvailabilityBadge

lib/
  auth.ts                   → Config NextAuth
  db.ts                     → Prisma client singleton
  email.ts                  → Resend (invitation + overlap notif)
  utils.ts                  → cn, couleurs membres, formatage dates

prisma/
  schema.prisma             → Modèle de données
  seed.ts                   → Admin fondateur
```
