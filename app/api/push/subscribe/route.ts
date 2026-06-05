import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// POST /api/push/subscribe — enregistrer un abonnement push pour l'utilisateur
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const sub = await req.json();
  const endpoint = sub?.endpoint as string | undefined;
  const p256dh = sub?.keys?.p256dh as string | undefined;
  const authKey = sub?.keys?.auth as string | undefined;

  if (!endpoint || !p256dh || !authKey) {
    return NextResponse.json({ error: "Abonnement invalide" }, { status: 400 });
  }

  // Upsert sur l'endpoint (unique) : réassocie au bon user si besoin
  await db.pushSubscription.upsert({
    where: { endpoint },
    create: { endpoint, p256dh, auth: authKey, userId: session.user.id },
    update: { p256dh, auth: authKey, userId: session.user.id },
  });

  // Active la préférence push
  await db.user.update({
    where: { id: session.user.id },
    data: { notifPush: true },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}

// DELETE /api/push/subscribe — supprimer un abonnement (corps : { endpoint })
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { endpoint } = await req.json().catch(() => ({ endpoint: undefined }));

  if (endpoint) {
    await db.pushSubscription.deleteMany({ where: { endpoint, userId: session.user.id } });
  }

  // S'il ne reste aucun abonnement, on coupe la préférence push
  const remaining = await db.pushSubscription.count({ where: { userId: session.user.id } });
  if (remaining === 0) {
    await db.user.update({ where: { id: session.user.id }, data: { notifPush: false } });
  }

  return NextResponse.json({ success: true });
}
