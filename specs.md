# Le Rond Point — Spécifications & User Stories

> Application web pour coordonner les présences d'un groupe d'amis dans leur quartier d'enfance.

---

## 1. Vue d'ensemble

**Problème :** Les membres du groupe vivent éparpillés dans le monde et rentrent ponctuellement au quartier, sans savoir qui d'autre y sera.

**Solution :** Une webapp mobile-first, accessible sur invitation, où chacun publie ses fenêtres de présence. Un calendrier collectif donne immédiatement une vue de qui est là et quand.

**Nom :** Le Rond Point

**Stack proposée :**
- **Framework :** Next.js 14 (App Router)
- **Auth :** NextAuth.js v5 — provider Google
- **BDD :** Neon (PostgreSQL serverless, tier gratuit)
- **ORM :** Prisma
- **UI :** Tailwind CSS + shadcn/ui
- **Notifications :** Resend (emails transactionnels, tier gratuit 3 000 emails/mois)
- **Push PWA :** web-push (optionnel, phase 2)
- **Déploiement :** Vercel (tier gratuit)

---

## 2. Rôles

| Rôle | Description |
|------|-------------|
| **Admin** | Fondateur du groupe. Peut inviter, retirer des membres, gérer les rôles. |
| **Membre** | Peut créer/modifier/supprimer ses propres présences, voir toutes les présences. |

---

## 3. User Stories

### 3.1 Authentification & Accès

**US-01 — Invitation**
> En tant qu'admin, je veux envoyer un lien d'invitation unique par email, afin que seules les personnes invitées puissent rejoindre le groupe.

*Critères d'acceptation :*
- L'admin saisit l'email du futur membre
- Un lien unique (token à usage unique, expire après 7 jours) est envoyé
- Le lien redirige vers la page de connexion Google
- Après connexion, le compte est lié à l'invitation et le membre est actif
- Un lien utilisé ne peut pas être réutilisé

---

**US-02 — Connexion**
> En tant que membre invité, je veux me connecter avec mon compte Google, afin de ne pas gérer un mot de passe supplémentaire.

*Critères d'acceptation :*
- Page d'accueil non connecté : bouton "Se connecter avec Google"
- Si l'email Google ne correspond à aucune invitation valide → message d'erreur clair ("Ce compte n'est pas encore invité. Demande un lien à [admin].")
- Après connexion réussie → redirection vers le calendrier

---

**US-03 — Déconnexion**
> En tant que membre, je veux pouvoir me déconnecter facilement.

---

### 3.2 Gestion des présences

**US-04 — Ajouter une présence**
> En tant que membre, je veux indiquer mes dates de présence dans le quartier, afin que les autres sachent quand je serai là.

*Champs :*
- **Date de début** (obligatoire)
- **Date de fin** (obligatoire, ≥ date de début)
- **Note** (optionnel, max 200 caractères) — ex. "Retour pour les fêtes, dispo le soir"
- **Disponibilité** (obligatoire) : `Ouvert aux retrouvailles` / `Passage rapide, peu dispo`

*Critères d'acceptation :*
- Formulaire accessible depuis le calendrier (tap sur une date) et depuis un bouton "+" flottant
- Validation : dates cohérentes, pas de doublon exact pour le même utilisateur
- Après ajout → mise à jour instantanée du calendrier

---

**US-05 — Modifier une présence**
> En tant que membre, je veux modifier une présence que j'ai créée.

*Critères d'acceptation :*
- Accès via un tap sur sa propre présence dans le calendrier ou la liste
- Les champs pré-remplis avec les valeurs actuelles
- Un membre ne peut modifier que ses propres présences (un admin peut modifier toutes)

---

**US-06 — Supprimer une présence**
> En tant que membre, je veux supprimer une présence pour corriger une erreur ou un changement de plan.

*Critères d'acceptation :*
- Confirmation demandée avant suppression
- Suppression instantanée dans la vue calendrier et la liste

---

### 3.3 Consultation

**US-07 — Calendrier collectif**
> En tant que membre, je veux voir un calendrier qui montre les jours où des membres sont présents, afin d'identifier rapidement les chevauchements.

*Comportement :*
- Vue mensuelle par défaut, navigation mois précédent/suivant
- Chaque jour avec au moins une présence affiche un badge avec le nombre de personnes présentes (`1`, `3`…)
- Tap sur un jour → bottom sheet listant le détail de chaque présence : avatar, prénom, dates exactes, note, badge dispo
- Les jours où **je suis présent** sont mis en valeur (fond coloré distinct sur la case)
- Jours passés légèrement grisés, restent consultables

---

**US-08 — Vue "Qui est là en même temps que moi ?"**
> En tant que membre, je veux savoir immédiatement si quelqu'un est présent pendant ma/mes fenêtres de présence.

*Critères d'acceptation :*
- Section dédiée sur la page d'accueil : "Tes prochaines présences" avec pour chacune la liste des personnes qui chevauchent
- Si personne → "Personne d'autre pour l'instant — ça peut changer !"

---

**US-09 — Liste des présences à venir**
> En tant que membre, je veux voir la liste chronologique des présences à venir de tous les membres.

*Critères d'acceptation :*
- Triée par date de début croissante
- Affiche : avatar, prénom, dates, note courte, badge dispo
- Les présences passées masquées par défaut (bouton "Voir les anciennes")
- Badge de disponibilité visible sur chaque présence (`Ouvert` / `Peu dispo`)

---

### 3.4 Notifications

**US-10 — Notification de chevauchement**
> En tant que membre, je veux recevoir un email quand quelqu'un ajoute une présence qui chevauche la mienne, afin d'être prévenu sans revenir vérifier l'app.

*Critères d'acceptation :*
- Email envoyé à tous les membres dont une présence chevauche la nouvelle
- Contenu : "Bonjour [prénom], [X] sera au quartier du [date] au [date]. Vous serez là en même temps !"
- CTA : "Voir le calendrier"
- Pas de notification envoyée à l'auteur de la nouvelle présence

---

**US-11 — Préférences de notification**
> En tant que membre, je veux pouvoir activer/désactiver les emails de notification.

*Critères d'acceptation :*
- Toggle dans les paramètres du profil
- Désactivé par défaut ? Non — activé par défaut, l'intérêt de l'app repose sur ça

---

### 3.5 Profil & Paramètres

**US-12 — Profil**
> En tant que membre, je veux voir et modifier mon profil affiché aux autres membres.

*Champs :*
- Prénom (pré-rempli depuis Google)
- Photo de profil (importée depuis Google, modifiable)
- Ville de résidence actuelle (optionnel, affiché dans la liste)
- Préférences de notification

---

### 3.6 Administration

**US-13 — Gestion des membres**
> En tant qu'admin, je veux voir la liste des membres actifs et invitations en cours, et pouvoir retirer un membre.

*Critères d'acceptation :*
- Page `/admin` accessible seulement aux admins
- Liste : avatar, nom, email, date d'inscription, statut
- Action "Retirer" : désactive le compte, les présences passées restent (anonymisées)

---

## 4. Architecture des pages

```
/                     → Page d'accueil (calendrier + liste présences) — requiert auth
/login                → Page de connexion (publique)
/invite/[token]       → Landing page invitation → redirige vers /login
/profile              → Paramètres profil + notifs
/admin                → Gestion membres + invitations (admin only)
```

---

## 5. Modèle de données (Prisma)

```prisma
model User {
  id            String     @id @default(cuid())
  email         String     @unique
  name          String
  image         String?
  city          String?
  notifEmail    Boolean    @default(true)
  role          Role       @default(MEMBER)
  createdAt     DateTime   @default(now())
  presences     Presence[]
  invitedBy     Invitation? @relation("InvitedUser")
}

model Presence {
  id          String           @id @default(cuid())
  userId      String
  user        User             @relation(fields: [userId], references: [id])
  startDate   DateTime
  endDate     DateTime
  note        String?          @db.VarChar(200)
  availability Availability    @default(OPEN)
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
}

model Invitation {
  id          String    @id @default(cuid())
  email       String
  token       String    @unique @default(cuid())
  expiresAt   DateTime
  usedAt      DateTime?
  invitedUserId String? @unique
  invitedUser  User?    @relation("InvitedUser", fields: [invitedUserId], references: [id])
  createdAt   DateTime  @default(now())
}

enum Role {
  ADMIN
  MEMBER
}

enum Availability {
  OPEN         // Ouvert aux retrouvailles
  BUSY         // Passage rapide, peu dispo
}
```

---

## 6. UX — Points d'attention

### Mobile-first
- Navigation principale : barre en bas (Bottom Tab Bar) avec 3 onglets : Calendrier / Présences / Profil
- Le bouton "+" d'ajout flottant (FAB) visible depuis le calendrier et la liste
- Formulaire d'ajout en **bottom sheet** (demi-écran) pour rester dans le contexte

### Calendrier
- Utiliser `react-day-picker` ou `@fullcalendar/react` en vue mensuelle
- Les avatars sur les cases sont limités à 3 affiché + "+N" si plus
- Swipe gauche/droite pour changer de mois (gesture mobile)

### Onboarding
- Première connexion : micro-onboarding en 2 étapes (compléter son profil + ajouter sa première présence)
- Message vide state sympa si personne n'a encore de présence

### Couleurs par membre
- Attribuer automatiquement une couleur parmi une palette de 12 à chaque membre à l'inscription
- Persistée en BDD, utilisée dans le calendrier pour identifier visuellement sans avoir à lire le nom

---

## 7. Ce qui est hors périmètre v1

- Chat / messagerie entre membres
- Suggestions d'activités / événements
- Intégration Google Calendar (peut être ajoutée en v2 : export .ics)
- Notifications push PWA (phase 2)
- Carte du quartier

---

## 8. Contraintes techniques & coûts

| Service | Tier gratuit | Limite |
|---------|-------------|--------|
| Vercel | Hobby | 100 GB bande passante/mois |
| Neon | Free | 0.5 GB stockage, 190h compute/mois |
| Resend | Free | 3 000 emails/mois, 100/jour |
| NextAuth | Open source | — |

Pour un groupe de 20-30 personnes, le tier gratuit de chaque service est largement suffisant.

---

## 9. Décisions actées

| # | Question | Décision |
|---|----------|----------|
| 1 | Premier admin | `brice.mangeat@gmail.com` — seedé directement en BDD au déploiement initial |
| 2 | Suppression de compte | Soft delete — le compte est désactivé, les présences passées sont conservées mais le nom remplacé par "Ancien membre" |
| 3 | Indicateur calendrier | Badge numérique uniquement (`n`), tap sur le jour → bottom sheet avec le détail complet |
| 4 | Nom de l'app | **Le Rond Point** |
