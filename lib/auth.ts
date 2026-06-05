import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";

const devProvider =
  process.env.NODE_ENV === "development"
    ? [
        Credentials({
          id: "dev-login",
          name: "Dev Login",
          credentials: { email: { label: "Email", type: "email" } },
          async authorize(credentials) {
            if (!credentials?.email) return null;
            const user = await db.user.findUnique({
              where: { email: credentials.email as string },
            });
            if (!user || !user.isActive) return null;
            return { id: user.id, name: user.name, email: user.email, image: user.image };
          },
        }),
      ]
    : [];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  // Sessions JWT partout : indispensable pour que le middleware tourne en Edge Runtime
  // (Prisma n'y est pas supporté). L'adapter reste utilisé pour persister users/comptes.
  session: { strategy: "jwt" },
  providers: [
    ...devProvider,
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      // Lie automatiquement le compte Google à un user existant ayant le même email
      // (ex: admin seedé, ou membre invité créé avant sa première connexion).
      // Sûr ici car Google vérifie l'email.
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      // Vérifier si l'utilisateur existe déjà (admin seedé ou membre actif)
      const existingUser = await db.user.findUnique({
        where: { email: user.email },
      });

      if (existingUser) {
        // Refuser les comptes désactivés (soft delete)
        if (!existingUser.isActive) return "/login?error=AccountDisabled";
        return true;
      }

      // Sinon, vérifier une invitation valide
      const invitation = await db.invitation.findFirst({
        where: {
          email: user.email,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
      });

      if (!invitation) {
        return "/login?error=NotInvited";
      }

      return true;
    },

    // Mode JWT (dev) : on charge les infos user dans le token AU LOGIN (runtime Node),
    // pour éviter toute requête Prisma dans le middleware (Edge Runtime).
    async jwt({ token, user }) {
      if (user?.id) {
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true, memberColor: true, city: true, notifEmail: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.memberColor = dbUser.memberColor;
          token.city = dbUser.city ?? undefined;
          token.notifEmail = dbUser.notifEmail;
        }
      }
      return token;
    },

    async session({ session, user, token }) {
      if (!session.user) return session;

      // Mode database (prod) : `user` fourni par l'adapter → requête Prisma (runtime Node).
      if (user) {
        session.user.id = user.id;
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true, memberColor: true, city: true, notifEmail: true },
        });
        if (dbUser) {
          session.user.role = dbUser.role;
          session.user.memberColor = dbUser.memberColor;
          session.user.city = dbUser.city ?? undefined;
          session.user.notifEmail = dbUser.notifEmail;
        }
        return session;
      }

      // Mode JWT (dev) : tout vient du token, aucune requête Prisma.
      if (token) {
        session.user.id = token.sub as string;
        session.user.role = token.role as Role;
        session.user.memberColor = token.memberColor as number;
        session.user.city = token.city as string | undefined;
        session.user.notifEmail = token.notifEmail as boolean;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.email || !user.id) return;

      // Attribuer une couleur membre auto (prochaine disponible parmi 1-12)
      const usedColors = await db.user.findMany({
        where: { isActive: true },
        select: { memberColor: true },
      });
      const used = new Set(usedColors.map((u) => u.memberColor));
      let color = 1;
      for (let i = 1; i <= 12; i++) {
        if (!used.has(i)) { color = i; break; }
      }

      await db.user.update({
        where: { id: user.id },
        data: { memberColor: color },
      });

      // Lier l'invitation si elle existe
      const invitation = await db.invitation.findFirst({
        where: {
          email: user.email,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
      });

      if (invitation) {
        await db.invitation.update({
          where: { id: invitation.id },
          data: { usedAt: new Date(), invitedUserId: user.id },
        });
      }
    },
  },
});

// Augmentation des types NextAuth
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
      memberColor: number;
      city?: string;
      notifEmail: boolean;
    };
  }
}
