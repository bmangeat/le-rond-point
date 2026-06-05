# Le Rond Point — Contexte Projet

> Fichier de démarrage rapide. À uploader dans un Projet Claude.ai avec specs.md et les fichiers du dossier design/.

---

## C'est quoi

Application web mobile-first pour un groupe d'amis d'un quartier d'enfance éparpillés dans le monde. Chacun renseigne ses fenêtres de présence dans le quartier pour savoir qui sera là en même temps.

**Nom :** Le Rond Point  
**Admin fondateur :** brice.mangeat@gmail.com (seedé en BDD au déploiement)

---

## Stack décidée

| Couche | Choix |
|--------|-------|
| Framework | Next.js 14 (App Router) |
| Auth | NextAuth.js v5 — Google OAuth uniquement |
| BDD | Neon (PostgreSQL serverless, tier gratuit) |
| ORM | Prisma |
| UI | Tailwind CSS + shadcn/ui |
| Emails | Resend (tier gratuit, 3 000 emails/mois) |
| Déploiement | Vercel (tier gratuit) |

Tout est sur tier gratuit. Le groupe fait 20-30 personnes max.

---

## Accès & rôles

- **Groupe fermé** — inscription sur invitation uniquement (lien unique par email, expire 7 jours)
- **Admin** : invite/retire des membres, accès à `/admin`
- **Membre** : gère ses propres présences, voit tout le monde

---

## Ce qu'est une "présence"

Champs :
- Date de début + date de fin (obligatoires)
- Note texte libre (optionnel, max 200 caractères)
- Disponibilité : `OPEN` (Ouvert aux retrouvailles) ou `BUSY` (Passage rapide, peu dispo)

Pas de mode privé — si tu ne veux pas le dire, tu ne renseignes pas.

---

## Pages

```
/                → Calendrier + liste présences (auth requise)
/login           → Connexion Google
/invite/[token]  → Landing invitation → redirige /login
/profile         → Profil + préférences notifs
/admin           → Gestion membres (admin only)
```

---

## Modèle de données (Prisma)

```prisma
model User {
  id           String      @id @default(cuid())
  email        String      @unique
  name         String
  image        String?
  city         String?
  notifEmail   Boolean     @default(true)
  memberColor  Int         @default(1)   // 1-12, assigné auto à l'inscription
  role         Role        @default(MEMBER)
  createdAt    DateTime    @default(now())
  presences    Presence[]
}

model Presence {
  id           String       @id @default(cuid())
  userId       String
  user         User         @relation(fields: [userId], references: [id])
  startDate    DateTime
  endDate      DateTime
  note         String?      @db.VarChar(200)
  availability Availability @default(OPEN)
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
}

model Invitation {
  id            String    @id @default(cuid())
  email         String
  token         String    @unique @default(cuid())
  expiresAt     DateTime
  usedAt        DateTime?
  invitedUserId String?   @unique
  createdAt     DateTime  @default(now())
}

enum Role         { ADMIN MEMBER }
enum Availability { OPEN BUSY }
```

Suppression de compte = soft delete : compte désactivé, présences passées conservées avec nom → "Ancien membre".

---

## Notifications

- Email via Resend quand quelqu'un ajoute une présence qui chevauche la tienne
- Activé par défaut, toggle dans les préférences profil
- Pas de notif envoyée à l'auteur de la présence

---

## Design System

**Ambiance :** Frais & moderne — bleu vif, mint, blanc légèrement bleuté  
**Style :** Rounded & friendly (coins très arrondis, cartes douces, feel mobile natif)  
**Police :** Inter

### Couleurs principales
| Token | Hex | Usage |
|-------|-----|-------|
| `--primary` | `#3B7BF8` | Actions, liens, sélection |
| `--primary-light` | `#EFF6FF` | Fonds, jours "mine" calendrier |
| `--available` | `#10B981` | Badge "Ouvert aux retrouvailles" |
| `--busy` | `#F59E0B` | Badge "Passage rapide" |
| `--background` | `#F8FAFF` | Fond de page |
| `--surface` | `#FFFFFF` | Cards, sheets |
| `--foreground` | `#1E293B` | Texte principal |
| `--muted-fg` | `#64748B` | Texte secondaire |
| `--border` | `#E2E8F0` | Bordures |

### 12 couleurs membres (assignées auto)
`#3B7BF8` `#10B981` `#8B5CF6` `#F43F5E` `#F59E0B` `#06B6D4`
`#F97316` `#14B8A6` `#EC4899` `#6366F1` `#84CC16` `#0EA5E9`

### Border radius
`sm=8px` · `md=12px` · `lg=16px` · `xl=20px` · `2xl=24px` · `full=9999px`

### Fichiers design dans `/design/`
- `tailwind.config.ts` — tokens Tailwind complets, à copier à la racine Next.js
- `globals.css` — CSS variables + classes utilitaires, à copier dans `app/`
- `design-reference.html` — référence visuelle complète (ouvrir dans un navigateur)

---

## UX clés

- **Navigation :** Bottom Tab Bar (Calendrier / Présences / Profil)
- **Ajout présence :** FAB "+" flottant → bottom sheet
- **Calendrier :** vue mensuelle, badge numérique par jour (nombre de présences), tap → bottom sheet détail
- **Jours "mine" :** fond `primary-light` + bordure `primary`
- **Onboarding :** 2 étapes à la 1ère connexion (profil + 1ère présence)

---

## Ce qui est hors périmètre v1

Chat, intégration Google Calendar, carte du quartier, push notifications PWA, suggestions d'activités.

---

## Prochaine étape au moment de la pause

Les maquettes Claude Design sont en cours. Dès réception → initialisation du projet Next.js et construction page par page.
