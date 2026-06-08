# Le Rond Point — Guide projet (handoff)

App web mobile-first (PWA) pour un groupe d'amis d'un quartier d'enfance dispersés
dans le monde : chacun note ses **présences** au quartier, organise des **sorties**,
et reste en contact. **CONTEXT.md** / **specs.md** = intentions d'origine ; **ce
fichier = état réel et à jour du projet.**

---

## Stack
- **Next.js 14** (App Router) · **React 18** · **TypeScript** · **Tailwind** (design tokens custom dans `tailwind.config.ts` + `app/globals.css`)
- **Prisma** + **Neon** — **3 environnements à bases séparées** (dev Docker · QA Neon · prod Neon) + **migrations Prisma versionnées**. Voir **docs/ENVIRONMENTS.md**.
- **NextAuth v5** (Google OAuth) — sessions **JWT**
- **Web Push** (web-push + VAPID) · **Vercel Blob** (photos) · **Vercel Cron** (tâche quotidienne)
- **Resend** prévu pour les emails mais **PAS branché** (pas de domaine) — toggle email masqué dans l'UI
- Déploiement **Vercel** : prod = https://le-rond-point.vercel.app (projet `brice-s-projects5/le-rond-point`)
- Repo GitHub privé : `github.com/bmangeat/le-rond-point`

## Setup sur une nouvelle machine
```bash
git clone https://github.com/bmangeat/le-rond-point && cd le-rond-point
npm install
docker compose up -d   # Postgres local (dev) sur localhost:5432
# .env.local ET .env (Prisma CLI lit .env) — voir .env.example :
#   DATABASE_URL=postgresql://lrp:lrp@localhost:5432/le_rond_point?schema=public
#   DIRECT_URL=postgresql://lrp:lrp@localhost:5432/le_rond_point?schema=public
#   AUTH_SECRET, NEXTAUTH_URL=http://localhost:3000
#   AUTH_GOOGLE_ID/SECRET (en DEV : factices, le bypass dev-login les ignore)
#   RESEND_API_KEY/RESEND_FROM (optionnels — sans clé, emails no-op)
#   NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
#   BLOB_READ_WRITE_TOKEN, CRON_SECRET
npm run migrate:deploy # applique les migrations sur le Docker
npm run db:seed        # données de test
npm run dev            # http://localhost:3000 (bypass dev-login : email existant)
```
- **Prisma CLI ne lit pas `.env.local`** → dupliquer `DATABASE_URL`/`DIRECT_URL` dans `.env`, ou les passer inline.
- **Dev local = Postgres Docker** (`docker compose up -d`), plus la prod. Après modif du schéma : `npm run migrate:dev` (crée une migration + applique en local). **Ne plus utiliser `db push`.** Détails : **docs/ENVIRONMENTS.md**.

## Auth (points clés)
- **Sessions JWT partout** (`lib/auth.ts`) — obligatoire car le middleware tourne en Edge Runtime où Prisma est interdit. Le rôle/infos sont chargés dans le token au **login** (callback `jwt`).
- **Bypass dev** : en `NODE_ENV=development`, provider Credentials `dev-login` sur `/login` → se connecter avec juste un email existant (admin : `brice.mangeat@gmail.com`). Invisible en prod.
- **Google** : `allowDangerousEmailAccountLinking` (lie au user seedé/invité par email). Redirect URI prod : `https://le-rond-point.vercel.app/api/auth/callback/google`.
- **Rôle admin périmé dans le token** : ne JAMAIS se fier au rôle du token pour autoriser. Le contrôle admin se fait **en base** côté Node via `getAdminSession()` (`lib/admin.ts`) dans les pages/API `/admin` et `/sorties/[id]` (édition). Le middleware ne contrôle QUE la connexion.

## Multi-tenant ⚠️ EN COURS sur la branche `qa` UNIQUEMENT (pas en prod/`main`)
Transformation mono-groupe → multi-communautés (« Rond Points ») étanches. Phases 1→5 faites sur `qa`.
- **Modèle** : `Group` (id, name) ; `groupId` (nullable) sur `User`/`Event`/`Invitation`. Cloisonnement : présences via `user.groupId`, commentaires/photos via `event.groupId`.
- **Rôles** (`enum Role`) : `SUPER_ADMIN` (global, tous groupes) · `ADMIN` (local, son groupe) · `MEMBER`. (On a gardé `MEMBER`, pas `MEMBRE`.)
- **Routing** : toutes les pages applicatives sous `app/[groupId]/...`. À la racine : `/` = redirecteur (→ `/[groupId]` ou `/orphelin`), `/login`, `/invite`, `/403`, `/orphelin`. Les **API restent plates** (`/api/*`) et filtrent par le `groupId` du user en **session/base** (jamais l'URL).
- **Garde d'accès** : `lib/group.ts` → `getCurrentUser()` (lecture base), `canAccessGroup`/`canAdminGroup`, `requireGroupAccess(groupId)` (page : `/login` · `/orphelin` · `/403`). Chaque page `[groupId]` l'appelle ; chaque route API event vérifie l'appartenance.
- **Liens client** : hook `useGroupId()` (`lib/use-group.ts`) → préfixe tous les `href`/`router.push` par `/[groupId]` sans threader de prop.
- **Auth** : `session.user.groupId` ; à la création (`createUser`), le user est rattaché au `groupId` de l'invitation ; couleur membre unique **par groupe**.
- **QA** : 2 groupes seedés (Le Rond Point `cmq5li5jk0000pn25i8gdb6y3` / Les Voisins `cmq5li5kz0001pn25mkebd2vg`), Brice = SUPER_ADMIN. Création de groupes = manuelle (Studio QA / seed).
- **Reste à faire** : scoper le cron quotidien par groupe ; stratégie de migration prod (rattacher les membres existants à un groupe, rendre `groupId` obligatoire) avant tout merge vers `main`.

## Modèle de données (Prisma — `prisma/schema.prisma`)
- **User** : profil (name, image, city, birthday, phone, instagram/snapchat/tiktok/linkedin), `memberColor` (1-12), `role`, `isActive` (soft delete), prefs notif (`notifPush`, `notifPushOverlap/Birthday/Presence/Photos/Events`).
- **Presence** : userId, startDate/endDate (**minuit UTC**), availability (OPEN/BUSY), note.
- **Invitation** : email (null = lien générique à usage unique), token, expiresAt, usedAt.
- **PushSubscription** : endpoint/p256dh/auth par user.
- **Event** (sorties) : type (BAR/RESTO/SOIREE/SORTIE), name, description, whenAt, placeName/placeAddr, logisticsKind (list|tricount), tricountEnabled, hasPlaylist/playlistUrl, hostId.
  - **EventRsvp** (YES/NO/PENDING) · **EventNeed** (label, claimedById) · **EventExpense** (payerId, amount, forUserIds[]) · **EventComment** · **EventPhoto** (url, uploaderId, max 5/event, TTL 7j après la date de l'event).
- NextAuth : Account, Session, VerificationToken.

## Features implémentées
- **Accueil/calendrier** (`app/page.tsx` + `HomeClient.tsx`) : header logo, bannière push (`PushPrompt`). Sections dans l'ordre : (1) carte « présent aujourd'hui » (`TodayPresenceToggle` + `/api/presences/today`), (2) grille mensuelle (badges présences + pastilles événements par type), (3) timeline « qui est là en {mois} » — **une ligne par membre**, segments multiples sur la même barre, dates toujours visibles (dans la barre si assez large, sinon en pastille au-dessus), (4) strip « prochaines sorties », (5) « tes prochaines présences » + chevauchements.
- **Présences** (`/presences`) : filtre par membre, séparateurs par mois, section « Aujourd'hui », anciennes présences.
- **Profil** (`/profile`) : sections accordéon (infos, réseaux préfixés @, notifications), photo upload (Blob), barre « Enregistrer » dirty, lien Admin, déconnexion. Pages membres en lecture : `/membres/[id]`.
- **Admin** (`/admin`) : invitations (email + lien à usage unique), gestion membres (rôle Membre/Admin via fiche, retrait).
- **Sorties** (`/sorties`, `/sorties/nouveau`, `/sorties/[id]`, `/sorties/[id]/edit`) : liste, création plein écran (type→accent+logistique dynamique), hub 3 onglets (Qui vient + popup Alsace · Besoins/Tricount · Le fil : playlist, photos+ZIP, discussion). Édition réservée hôte/admin.
- **Notifications push** : chevauchement (réservation + rappel jour J co-présence), anniversaire, nouvelle présence, sorties (création + rappel matin J), photos qui expirent (J-1). Centre de notifs dans le profil (toggles par type).
- **Cron quotidien** unique `/api/cron/daily` (Vercel, 7h UTC) → `lib/cron-tasks.ts` : anniversaires, rappels co-présence, avertissement photos J-1, suppression photos >7j, rappels de sortie du jour. Sécurisé par `CRON_SECRET`. Plan Hobby = 1 cron/jour.

## Gotchas / conventions
- **Dates de présence = minuit UTC**. Le `<input type=date>` envoie `YYYY-MM-DD` → `new Date()` = minuit UTC. Côté client on mappe en jours **locaux** (OK pour fuseau France, en avance sur UTC). Helper `dateKeyUTC` côté serveur.
- **iOS inputs date/datetime** : fix CSS dans globals (`appearance:none` + `::-webkit-date-and-time-value`) sinon débordement horizontal.
- **`router.refresh()` réinitialise l'état des composants client** quand la structure RSC change → préférer la **mise à jour optimiste locale** (cf. hub sortie, génération de lien admin).
- **En dev : `npm run build` corrompt le `.next` du serveur de dev** (erreur "Cannot find module './xxx.js'") → après un build, faire `rm -rf .next` et redémarrer `npm run dev`.
- **Commits sous `brice.mangeat@gmail.com`** (pas l'email pro) — `user.email` du repo déjà configuré.
- **next/image** : domaines autorisés = `lh3.googleusercontent.com` + `*.public.blob.vercel-storage.com`.

## Environnements & migrations  (détails : `docs/ENVIRONMENTS.md`)
Trois envs, **bases séparées**, **migrations Prisma versionnées** (fini `db push`).

| Env | Base | Déploiement | Branche |
|-----|------|-------------|---------|
| **dev** | Postgres **Docker** local | `npm run dev` | — |
| **qa** | Projet **Neon QA** séparé | auto au push (build = `vercel-build`) | `qa` |
| **prod** | Projet **Neon prod** | `vercel --prod` (manuel, Git déconnecté côté prod) | `main` |

- **Connexions Prisma** : `DATABASE_URL` (poolée, runtime app) + `DIRECT_URL` (directe, migrations). En local les deux pointent sur le Docker. **Prisma CLI lit `.env`** (pas `.env.local`) → dupliquer les 2 lignes dans `.env` ou les passer inline.
- **Node 18 requis** pour Prisma/sharp/Next : `export PATH="/Users/brice/.nvm/versions/node/v18.20.0/bin:$PATH"` (le `node` par défaut est en 16).
- **Workflow** : modif `schema.prisma` → `npm run migrate:dev` (crée + applique en local) → commit le dossier de migration → push `qa` (déploie QA, `migrate deploy` auto) → merge `qa`→`main` → `vercel --prod`.
- **`vercel-build`** lance `prisma migrate deploy` avant `next build` → chaque déploiement applique les migrations en attente sur la base de l'env. **`DIRECT_URL` doit être défini dans Vercel** (QA + prod), sinon le build casse.
- **Prod baselinée** une fois (`migrate resolve --applied 0_init`) car créée à l'origine via `db push`. Toute nouvelle base (QA, dev) applique `0_init` normalement.
- **Dev local** : `docker compose up -d`, `.env.local` (et `.env`) → `DATABASE_URL`/`DIRECT_URL` = `postgresql://lrp:lrp@localhost:5432/le_rond_point?schema=public`, puis `npm run migrate:deploy` + `npm run db:seed`.
- **Seed** (`prisma/seed.ts`) : admin + membres/présences/sortie de test, idempotent, **garde-fou anti-prod** (base non-locale → exige `SEED_CONFIRM=1`).
- **NextAuth/Vercel** : ne PAS définir `NEXTAUTH_URL` mal formé — sur Vercel l'URL est auto-détectée (trustHost). Une valeur sans `https://` ou avec guillemets → `Invalid URL` / `MIDDLEWARE_INVOCATION_FAILED`. Variables d'env Vercel : bien cocher le scope **Production** (la branche prod du projet QA = `qa` → c'est une « Production » deployment).
- **Login QA/prod** : builds de prod → **bypass dev-login désactivé**, seul Google marche → ajouter le callback `https://<env>.vercel.app/api/auth/callback/google` dans Google Cloud.

## Déploiement
```bash
# PROD (Git déconnecté → CLI uniquement)
vercel --prod --yes      # CLI connectée (compte bmangeat)

# QA (auto) : git push origin qa
```
Variables d'env de chaque env dans le projet Vercel correspondant (Settings → Environment Variables).

## En attente / non fait
- Design **connexion + invitation + onboarding** (fichier `app-auth.jsx` du handoff v2 jamais reçu).
- **Resend** non branché (emails de chevauchement/invitation inactifs).
- Lieu des sorties = texte libre + suggestions (pas d'API Google Places).
- Import auto de l'anniversaire via Google = écarté (friction OAuth).

## Design tokens (rappel)
primary `#3B7BF8` · available `#10B981` · busy `#F59E0B` · destructive `#EF4444` ·
bg `#F8FAFF` · surface `#FFF` · surface-raised `#F1F6FF` · fg `#1E293B` · muted `#64748B` ·
subtle `#94A3B8` · border `#E2E8F0`. Police Inter. Types sorties : bar 🍻 ambre, resto 🍕 rouge,
soirée 🏡 violet, sortie 🏕️ vert.
