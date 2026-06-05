import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { INVITE_COOKIE } from "@/lib/auth";

// GET /invite/[token]
// Valide le lien d'invitation, dépose un cookie httpOnly avec le token, puis
// redirige vers /login. Le cookie est relu pendant le flow OAuth Google
// (signIn/createUser) pour autoriser et consommer l'invitation.
export async function GET(req: Request, { params }: { params: { token: string } }) {
  const { token } = params;

  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, req.url));

  const invitation = await db.invitation.findUnique({ where: { token } });

  if (!invitation) return redirectTo("/login?error=InvalidToken");
  if (invitation.usedAt) return redirectTo("/login?error=TokenUsed");
  if (invitation.expiresAt < new Date()) return redirectTo("/login?error=TokenExpired");

  const res = redirectTo("/login");
  res.cookies.set(INVITE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 30, // 30 min : le temps de finir la connexion Google
  });
  return res;
}
