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
vercel link            # lier au projet le-rond-point (compte bmangeat)
# .env.local : copier celui de l'ancienne machine, OU partir des valeurs Vercel.
# Variables nécessaires (voir .env.example) :
#   DATABASE_URL, AUTH_SECRET, NEXTAUTH_URL=http://localhost:3000
#   AUTH_GOOGLE_ID/SECRET (en DEV : valeurs factices, le bypass dev les ignore)
#   RESEND_API_KEY/RESEND_FROM (factices en dev)
#   NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
#   BLOB_READ_WRITE_TOKEN (récup via `vercel blob` ou env Vercel), CRON_SECRET
npm run dev            # http://localhost:3000
```
- **Prisma CLI ne lit pas `.env.local`** → dupliquer `DATABASE_URL`/`DIRECT_URL` dans `.env`, ou les passer inline.
- **Dev local = Postgres Docker** (`docker compose up -d`), plus la prod. Après modif du schéma : `npm run migrate:dev` (crée une migration + applique en local). **Ne plus utiliser `db push`.** Détails : **docs/ENVIRONMENTS.md**.

## Auth (points clés)
- **Sessions JWT partout** (`lib/auth.ts`) — obligatoire car le middleware tourne en Edge Runtime où Prisma est interdit. Le rôle/infos sont chargés dans le token au **login** (callback `jwt`).
- **Bypass dev** : en `NODE_ENV=development`, provider Credentials `dev-login` sur `/login` → se connecter avec juste un email existant (admin : `brice.mangeat@gmail.com`). Invisible en prod.
- **Google** : `allowDangerousEmailAccountLinking` (lie au user seedé/invité par email). Redirect URI prod : `https://le-rond-point.vercel.app/api/auth/callback/google`.
- **Rôle admin périmé dans le token** : ne JAMAIS se fier au rôle du token pour autoriser. Le contrôle admin se fait **en base** côté Node via `getAdminSession()` (`lib/admin.ts`) dans les pages/API `/admin` et `/sorties/[id]` (édition). Le middleware ne contrôle QUE la connexion.

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

## Déploiement
```bash
git push origin main
vercel --prod --yes      # déploie ; CLI connectée (compte bmangeat)
```
La connexion auto GitHub→Vercel n'est PAS branchée (déploiement via CLI). Les variables
d'env de prod sont dans Vercel (Settings → Environment Variables).

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
