import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Routes publiques
  const publicRoutes = ["/login", "/invite"];
  const isPublic = publicRoutes.some((r) => pathname.startsWith(r));

  // Rediriger vers /login si non connecté et route protégée
  if (!isLoggedIn && !isPublic) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Rediriger vers / si déjà connecté et sur /login
  if (isLoggedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Le contrôle du rôle admin se fait dans /admin (page + API) côté Node, à partir
  // de la base — le rôle du token JWT peut être périmé (changement de rôle récent).

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.json).*)"],
};
